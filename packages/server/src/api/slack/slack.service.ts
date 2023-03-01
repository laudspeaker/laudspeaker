import { Injectable, Inject, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Installation } from './entities/installation.entity';
import { Account } from '../accounts/entities/accounts.entity';
import {
  InstallProvider,
  InstallURLOptions,
  InvalidStateError,
} from '@slack/oauth';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Request, Response } from 'express';
import { onboardingBlock } from './blocks/onboarding.block';
import { syncBlock } from './blocks/sync.block';
import { syncPartial } from './blocks/syncPartial.block';
import { WebClient } from '@slack/web-api';
import { CustomersService } from '../customers/customers.service';
import { CreateCustomerDto } from '../customers/dto/create-customer.dto';
import { State } from './entities/state.entity';
import { platform, release } from 'os';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

interface ResponseError extends Error {
  status?: number;
}

type ResponseHandler = (
  res: Response,
  err?: ResponseError,
  responseOptions?: {
    failWithNoRetry?: boolean;
    redirectLocation?: boolean;
    content?: any;
  }
) => void;

@Injectable()
export class SlackService {
  installer: InstallProvider;
  client: WebClient;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Installation)
    private installationRepository: Repository<Installation>,
    @InjectRepository(State)
    private stateRepository: Repository<State>,
    @InjectRepository(Account)
    private readonly accountsRepository: Repository<Account>,
    @InjectQueue('slack') private readonly slackQueue: Queue,
    @InjectQueue('message') private readonly messageQueue: Queue,
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {
    this.client = new WebClient();
    this.installer = new InstallProvider({
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      legacyStateVerification: true,
      stateStore: {
        // generateStateParam's first argument is the entire InstallUrlOptions object which was passed into generateInstallUrl method
        // the second argument is a date object
        // the method is expected to return a string representing the state
        generateStateParam: async (
          installUrlOptions: InstallURLOptions,
          date: Date
        ) => {
          // generate a random string to use as state in the URL
          const state = new State();
          state.installUrlOptions = installUrlOptions;
          state.now = date;
          // save installOptions to cache/db
          let ret;
          try {
            ret = await this.stateRepository.save(state);
          } catch (e) {
            this.logger.error('Error: ' + e);
            ret = { id: null };
          }
          // return a state string that references saved options in DB
          return ret.id;
        },
        // verifyStateParam's first argument is a date object and the second argument is a string representing the state
        // verifyStateParam is expected to return an object representing installUrlOptions
        verifyStateParam: async (date: Date, state: string) => {
          // fetch saved installOptions from DB using state reference
          let decoded;
          try {
            decoded = await this.stateRepository.findOneBy({ id: state });
          } catch (e) {
            this.logger.error('Error: ' + e);
          }
          const generatedAt = new Date(decoded.now);
          const passedSeconds = Math.floor(
            (date.getTime() - generatedAt.getTime()) / 1000
          );
          if (passedSeconds > 600) {
            throw new InvalidStateError('The state value is already expired');
          }
          return decoded.installUrlOptions;
        },
      },
      installationStore: {
        storeInstallation: async (installation) => {
          if (
            installation.isEnterpriseInstall &&
            installation.enterprise !== undefined
          ) {
            const install = new Installation();
            install.id = installation.enterprise.id;
            install.installation = installation;
            try {
              await this.installationRepository.save(install);
            } catch (e) {
              this.logger.error('Error: ' + e);
            }
            return;
          }
          if (installation.team !== undefined) {
            const install = new Installation();
            install.id = installation.team.id;
            install.installation = installation;
            try {
              await this.installationRepository.save(install);
            } catch (e) {
              this.logger.error('Error: ' + e);
            }
            return;
          }
          throw new Error(
            'Failed saving installation data to installationStore'
          );
        },
        fetchInstallation: async (installQuery) => {
          // change the line below so it fetches from your database
          if (
            installQuery.isEnterpriseInstall &&
            installQuery.enterpriseId !== undefined
          ) {
            const installation = (
              await this.installationRepository.findOneBy({
                id: installQuery.enterpriseId,
              })
            ).installation;
            return installation;
          }
          if (installQuery.teamId !== undefined) {
            const installation = (
              await this.installationRepository.findOneBy({
                id: installQuery.teamId,
              })
            ).installation;
            return installation;
          }
          throw new Error('Failed fetching installation');
        },
        deleteInstallation: async (installQuery) => {
          // change the line below so it deletes from your database
          if (
            installQuery.isEnterpriseInstall &&
            installQuery.enterpriseId !== undefined
          ) {
            // org wide app installation deletion
            await this.installationRepository.delete(installQuery.enterpriseId);
            return;
          }
          if (installQuery.teamId !== undefined) {
            // single team app installation deletion
            await this.installationRepository.delete(installQuery.teamId);
            return;
          }
          throw new Error('Failed to delete installation');
        },
      },
    });
  }

  async handleInstallPath(): Promise<string> {
    try {
      const url = await this.installer.generateInstallUrl({
        scopes: [
          'app_mentions:read',
          'channels:history',
          'chat:write',
          'commands',
          'calls:read',
          'calls:write',
          'channels:history',
          'channels:read',
          'commands',
          'dnd:read',
          'emoji:read',
          'files:read',
          'groups:history',
          'groups:read',
          'groups:write',
          'im:history',
          'im:read',
          'im:write',
          'incoming-webhook',
          'links:read',
          'links:write',
          'mpim:history',
          'mpim:read',
          'mpim:write',
          'pins:read',
          'pins:write',
          'reactions:read',
          'reactions:write',
          'reminders:read',
          'reminders:write',
          'remote_files:read',
          'remote_files:share',
          'team:read',
          'usergroups:read',
          'usergroups:write',
          'users.profile:read',
          'users:read',
          'users:read.email',
          'users:write',
        ],
      });
      return url;
    } catch (e) {
      this.logger.error('Error: ' + e);
      return;
    }
  }

  handleOAuthRedirect(req: Request, res: Response) {
    this.installer.handleCallback(req, res, {
      success: async (installation, installOptions, req, res) => {
        let tok;
        if (installation.tokenType === 'bot') {
          tok = installation.bot.token;
        } else if (installation.tokenType === 'user') {
          tok = installation.user.token;
        }
        const convo = await this.client.conversations.open({
          token: tok,
          users: installation.user.id,
        });
        const userResponse = await this.client.users.info({
          token: tok,
          user: installation.user.id,
        });
        await this.enqueueMessage({
          method: 'chat.postMessage',
          token: tok,
          args: {
            channel: convo.channel.id,
            blocks: onboardingBlock(userResponse.user.real_name),
          },
        });
        res.end();
      },
    });
  }

  //need to test what happens if user is not there
  async handleCorrelation(teamid: string, user: Account) {
    const found: Account = await this.accountsRepository.findOneBy({
      id: (<Account>user).id,
    });
    //to do
    // null, undefined
    if (found.slackTeamId == null) {
      found.slackTeamId = [teamid];
    }
    // empty array
    else if (
      Array.isArray(found.slackTeamId) &&
      found.slackTeamId.length == 0
    ) {
      found.slackTeamId.push(teamid);
    }
    //if there are already team ids, make sur we dont add the same one twice
    else if (found.slackTeamId.length > 0) {
      let duplicate = false;
      for (const team of found.slackTeamId) {
        if (team == teamid) {
          duplicate = true;
        }
      }
      if (!duplicate) {
        found.slackTeamId.push(teamid);
      }
    }
    //do we need this case?
    //other arrays
    else {
      found.slackTeamId.push(teamid);
    }

    found.currentOnboarding.push('Slack');
    found.onboarded =
      found.currentOnboarding.length === found.expectedOnboarding.length;

    await this.accountsRepository.save(found);
    const newfound: Account = await this.accountsRepository.findOneBy({
      id: (<Account>user).id,
    });

    let wasFound = false;
    if (found != null) {
      wasFound = true;
      //to do need code for enterprise id too
      try {
        const installz = await this.installationRepository.findOneBy({
          id: teamid,
        });
        const installation = (
          await this.installationRepository.findOneBy({ id: teamid })
        ).installation;
        try {
          await this.sendSyncBlock(
            installation.user.id,
            installation.user.id,
            installation
          );
        } catch (e) {
          this.logger.error('Error: ' + e);
        }
      } catch (e) {
        this.logger.error('Error: ' + e);
      }
    }
    return wasFound;
  }

  async sendMagicEmail(install_id: string, toEmail: string) {
    const textLink = 'https://app.laudspeaker.com/slack/cor/' + install_id;

    await this.messageQueue.add('email', {
      key: process.env.MAGIC_EMAIL_KEY,
      from: 'Laudspeaker Team',
      domain: process.env.MAGIC_EMAIL_DOMAIN,
      email: 'noreply',
      to: toEmail,
      subject: 'Sync Your laudspeaker Account with Slack!',
      text: `Hi! 
            
            To link your laudspeaker account with slack, please click this link: ${textLink}
            
            -Team laudspeaker`,
    });
  }

  validateEmail(email: any) {
    return String(email)
      .toLowerCase()
      .match(/[^@]+@[^@]+\.[^@]+/);
  }

  async connectAction(body: any) {
    const emailAddress = body.state.values.email_id.email_input_action.value;
    let tok = null;
    let teamOrEnterpriseId = null;
    let install_id = null;

    //to do this needs to be tested
    if (body.is_enterprise_install) {
      teamOrEnterpriseId = body.enterprise.enterprise_id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      //need to check this
      install_id = install.team.id;
    } else {
      teamOrEnterpriseId = body.team.id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      install_id = install.team.id;
    }
    if (this.validateEmail(emailAddress)) {
      // to do
      //send email code
      await this.sendMagicEmail(install_id, emailAddress);
      await this.enqueueMessage({
        method: 'chat.postMessage',
        token: tok,
        args: {
          channel: body.user.id,
          text: "Please check your email for a valid code \n We'll message you after you login to continue the Onboarding :rocket:",
        },
      });
    } else {
      await this.enqueueMessage({
        method: 'chat.postMessage',
        token: tok,
        args: {
          channel: body.user.id,
          text: 'Please provide a valid email!',
        },
      });
    }
  }

  async sendSyncBlock(channelId: string, name: string, install: any) {
    const tok = install.bot.token;
    await this.enqueueMessage({
      method: 'chat.postMessage',
      token: tok,
      args: {
        channel: channelId,
        blocks: syncBlock(name),
      },
    });
  }

  async syncAction(body: any) {
    let tok = null;
    let teamOrEnterpriseId = null;
    let install_id = null;

    //to do this needs to be tested
    if (body.is_enterprise_install) {
      teamOrEnterpriseId = body.enterprise.enterprise_id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      //need to check this
      install_id = install.team.id;
    } else {
      teamOrEnterpriseId = body.team.id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      install_id = install.team.id;
    }

    tok = (
      await this.installationRepository.findOneBy({
        id: teamOrEnterpriseId.trim(),
      })
    ).installation.bot.token;
    const listOfPeople = await this.client.users.list({
      //method: 'users.list',
      token: tok,

      //try empty args
    });

    //remove bots from list
    const members = listOfPeople.members.filter((obj) => {
      return !obj.is_bot;
    });

    //create customers
    for (const member of members) {
      const sanitizedMember = new CreateCustomerDto();
      sanitizedMember.slackName = member.name;
      sanitizedMember.slackId = member.id;

      if (member.real_name != null) {
        sanitizedMember.slackRealName = member.real_name;
      }
      sanitizedMember.slackTeamId = [member.team_id];

      if (member.profile?.first_name) {
        sanitizedMember.firstName = member.profile.first_name;
      }

      if (member.profile?.last_name) {
        sanitizedMember.lastName = member.profile.last_name;
      }
      if (member.tz_offset != null) {
        sanitizedMember.slackTimeZone = member.tz_offset;
      }
      if (member.profile?.email) {
        sanitizedMember.slackEmail = member.profile.email;
      }
      sanitizedMember.slackDeleted = member.deleted;
      sanitizedMember.slackAdmin = member.is_admin;
      //false until specified by user
      if (!member.is_admin) {
        sanitizedMember.slackTeamMember = false;
      } else {
        sanitizedMember.slackTeamMember = true;
      }
      const account: Account = await this.accountsRepository.findOneBy({
        slackTeamId: teamOrEnterpriseId,
      });
      //to do check if user is already there and only create if not
      const data = await this.customersService.findBySlackId(
        account,
        sanitizedMember.slackId
      );
      if (!data) {
        this.customersService.create(account, sanitizedMember);
      } else {
        //the old data is what is already in the database
        this.customersService.mergeCustomers(account, data, sanitizedMember);
      }
    }
  }

  async syncPartialAction(body: any, triggerId: string) {
    let tok = null;
    let teamOrEnterpriseId = null;
    let install_id = null;

    //const {triggerId } = (body.payload);

    //to do this needs to be tested
    if (body.is_enterprise_install) {
      teamOrEnterpriseId = body.enterprise.enterprise_id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      //need to check this
      install_id = install.team.id;
    } else {
      teamOrEnterpriseId = body.team.id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      install_id = install.team.id;
    }
    await this.enqueueMessage({
      method: 'views.open',
      token: tok,
      args: {
        trigger_id: triggerId,
        //view: JSON.stringify(syncPartial()),
        //view: { 	"title": { 		"type": "plain_text", 		"text": "My App", 		"emoji": true 	}, 	"submit": { 		"type": "plain_text", 		"text": "Submit", 		"emoji": true 	}, 	"type": "modal", 	"close": { 		"type": "plain_text", 		"text": "Cancel", 		"emoji": true 	}, 	"blocks": [] }
        view: syncPartial(),
      },
    });
  }

  async sanitizeMembers(members: any, tok: string, teamOrEnterpriseId: string) {
    try {
      const newMembers = [];
      for (let index = 0; index < members.length; index++) {
        const { user } = await this.client.users.info({
          //method: 'users.list',
          token: tok,
          user: members[index],

          //try empty args
        });
        newMembers.push(user);
      }
      const filteredNewMembers = newMembers.filter((obj) => {
        return !obj.is_bot;
      });
      let i = 0;
      for (const member of filteredNewMembers) {
        const sanitizedMember = new CreateCustomerDto();
        sanitizedMember.slackName = member.name;
        sanitizedMember.slackId = member.id;

        if (member.real_name != null) {
          sanitizedMember.slackRealName = member.real_name;
        }
        if (member.team_id) sanitizedMember.slackTeamId = [member.team_id];

        if (member.profile.first_name != null) {
          sanitizedMember.firstName = member.profile.first_name;
        }

        if (member.profile.last_name != null) {
          sanitizedMember.lastName = member.profile.last_name;
        }
        if (member.tz_offset != null) {
          sanitizedMember.slackTimeZone = member.tz_offset;
        }
        if (member.profile.email != null) {
          sanitizedMember.slackEmail = member.profile.email;
        }
        sanitizedMember.slackDeleted = member.deleted;
        sanitizedMember.slackAdmin = member.is_admin;
        //false until specified by user
        if (!member.is_admin) {
          sanitizedMember.slackTeamMember = false;
        } else {
          sanitizedMember.slackTeamMember = true;
        }
        const account: Account = await this.accountsRepository.findOneBy({
          slackTeamId: teamOrEnterpriseId,
        });
        //to do check if user is there
        const data = await this.customersService.findBySlackId(
          account,
          sanitizedMember.slackId
        );
        if (!data) {
          await this.customersService.create(account, sanitizedMember);
        } else {
          await this.customersService.mergeCustomers(
            account,
            data,
            sanitizedMember
          );
        }
        i = i + 1;
      }
    } catch (err) {
      this.logger.error('Error adding slack member: ' + err);
    }
  }

  async syncChannels(channels: any, body: any) {
    let tok = null;
    let teamOrEnterpriseId = null;
    let install_id = null;

    //to do this needs to be tested
    if (body.is_enterprise_install) {
      teamOrEnterpriseId = body.enterprise.enterprise_id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      //need to check this
      install_id = install.team.id;
    } else {
      teamOrEnterpriseId = body.team.id;
      const install = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation;
      tok = install.bot.token;
      install_id = install.team.id;
    }

    tok = (
      await this.installationRepository.findOneBy({
        id: teamOrEnterpriseId.trim(),
      })
    ).installation.bot.token;
    //for each channel call conversations.members
    for (let index = 0; index < channels.cs.length; index++) {
      try {
        const { members } = await this.client.conversations.members({
          //method: 'users.list',
          token: tok,
          channel: channels.cs[index],

          //try empty args
        });
        this.sanitizeMembers(members, tok, teamOrEnterpriseId);
      } catch (e: any) {
        this.logger.error('Error: ' + e);
      }
    }
  }

  /*
   * this was written as a test function
   */

  async appMentionAction(body: any) {
    let teamOrEnterpriseId = null;
    if ('authorizations' in body) {
      const enterprise_id = body.authorizations[0].enterprise_id;
      const team_id = body.authorizations[0].team_id;
      if (enterprise_id == null) {
        teamOrEnterpriseId = team_id;
      } else {
        teamOrEnterpriseId = enterprise_id;
      }

      const tok = (
        await this.installationRepository.findOneBy({
          id: teamOrEnterpriseId.trim(),
        })
      ).installation.bot.token;
    }
  }

  async handleEvent(res: Response, body: any) {
    const ack = this.generateAck();
    if (body.type == 'url_verification') {
      ack(res, undefined, { content: body.challenge });
    } else {
      if ('event' in body) {
        if (body.event.type == 'app_mention') {
          await this.appMentionAction(body);
        }
      }
      if ('payload' in body) {
        //connect
        if (typeof body.payload == 'string') {
          const json = JSON.parse(body.payload);
          const { type, user, view } = json;

          if (type === 'view_submission') {
            //res.send(''); // Make sure to respond to the server to avoid an error
            const data = {
              cs: view.state.values.cs.ab.selected_conversations,
            };
            await this.syncChannels(data, json);
            //displayHome(user.id, data);
          }

          if (json.actions?.length && json.actions[0].action_id == 'Log_In') {
            await this.connectAction(json);
          }
          if (
            json.actions?.length &&
            json.actions[0].action_id == 'Sync_Slack_Contacts'
          ) {
            await this.syncAction(json);
          }
          if (
            json.actions?.length &&
            json.actions[0].action_id == 'Sync_Partial'
          ) {
            const { trigger_id } = JSON.parse(body.payload);
            await this.syncPartialAction(json, trigger_id);
          }
        } else {
          const { type, user, view } = body.payload;
          if (type === 'view_submission') {
            //res.send(''); // Make sure to respond to the server to avoid an error
            // const data = {
            //   note: view.state.values.note01.content.value,
            //   color: view.state.values.note02.color.selected_option.value
            // }
            //displayHome(user.id, data);
          }

          if (
            body.payload.actions?.length &&
            body.payload.actions[0].action_id == 'Log_In'
          ) {
            await this.connectAction(body);
          }
          //sync contacts
          if (
            body.payload.actions?.length &&
            body.payload.actions[0].action_id == 'Sync_Slack_Contacts'
          ) {
            await this.syncAction(body);
          }

          if (
            body.payload.actions?.length &&
            body.payload.actions[0].action_id == 'Sync_Partial'
          ) {
            const { trigger_id } = body.payload;
            await this.syncPartialAction(body.payload, trigger_id);
          }
        }
      }
      ack(res);
    }
  }

  async enqueueMessage(job: any) {
    await this.slackQueue.add('send', {
      methodName: job.method,
      token: job.token,
      args: job.args,
    });
  }

  packageIdentifier(): string {
    return (
      `${'laudspeaker-api'.replace(
        '/',
        ':'
      )}/${'0.1.0'} ${platform()}/${release()} ` +
      `node/${process.version.replace('v', '')}`
    );
  }

  generateAck(): ResponseHandler {
    return (res: Response, err, responseOptions) => {
      try {
        res.setHeader('X-Slack-Powered-By', this.packageIdentifier());
        res.setHeader('X-Slack-No-Retry', '1');
        if (responseOptions) {
          if (responseOptions.content) {
            res.send(responseOptions.content);
          }
        }
        res.end();
      } catch (e: any) {
        this.logger.error('Error: ' + e);
      }
    };
  }

  async getInstallation(customer: CustomerDocument): Promise<Installation> {
    return await this.installationRepository.findOneBy({
      id: customer?.slackTeamId[0]?.trim(),
    });
  }
}
