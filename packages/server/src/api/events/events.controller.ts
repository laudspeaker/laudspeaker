import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Controller,
  Post,
  LoggerService,
  Inject,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Headers,
  HttpException,
} from '@nestjs/common';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Correlation, CustomersService } from '../customers/customers.service';
import * as _ from 'lodash';
import { WorkflowsService } from '../workflows/workflows.service';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { StatusJobDto } from './dto/status-event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { PostHogEventDto } from './dto/posthog-event.dto';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { EventDto } from './dto/event.dto';
import { Stats } from '../audiences/entities/stats.entity';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue,
    @InjectRepository(Stats) private statsRepository: Repository<Stats>,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {}

  @Post('job-status/email')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobEmailStatus(@Body() body: StatusJobDto): Promise<string> {
    const emailJob = await this.emailQueue.getJob(body.jobId);
    return await emailJob.getState();
  }

  @Post('job-status/slack')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobSlackStatus(@Body() body: StatusJobDto): Promise<string> {
    try {
      const slackJob = await this.slackQueue.getJob(body.jobId);
      const state = await slackJob.getState();
      return state;
    } catch (error) {
      console.log(error);
      throw new HttpException('Error getting job status', 503);
    }
  }

  @Post('/posthog/')
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostHogPayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: PosthogBatchEventDto
  ) {
    console.log('yo in posthog endpoint');
    console.log(body);

    let account: Account; // Account associated with the caller
    // Step 1: Find corresponding account
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      console.log('account is');
      console.log(account);
    } catch (e) {
      console.log('api key is', apiKey);
      console.log(e);
      return new HttpException(e, 500);
    }
    console.log('here 1');

    const jobArray: Job<any>[] = []; // created jobId

    let chronologicalEvents: PostHogEventDto[];

    try {
      //console.log("body batch");
      console.log(body.batch);
      console.log(body.batch[0].originalTimestamp);
      //console.log("time is");
      //console.log(new Date(body.batch[0].originalTimestamp).getTime());
      chronologicalEvents = body.batch.sort(
        (a, b) =>
          new Date(a.originalTimestamp).getTime() -
          new Date(b.originalTimestamp).getTime()
      );
    } catch (e) {
      //console.log("error is", e);
    }

    console.log('chron events are');
    console.log(chronologicalEvents);

    try {
      for (
        let numEvent = 0;
        numEvent < chronologicalEvents.length;
        numEvent++
      ) {
        const currentEvent = chronologicalEvents[numEvent];
        let jobId: Job<any>; // created jobId
        let job: Job<any>;
        let cust: CustomerDocument, // Customer document created/found on this API call
          // wfs: Workflow[], // List of all workflows associated with this account
          // aud: Audience, // Used for multiple calls to audience service
          // destAud: Audience, // Used for multiple calls to audience service
          // primary: Audience, // Tracking primary audience of workflow
          found: boolean; // If the customer document was previously created
        // template: Template; // Template for sending
        //Step 2: Create/Correlate customer for each event
        try {
          function postHogEventMapping(event: any) {
            const cust = {};
            cust['posthogId'] = event.userId;
            if (event?.phPhoneNumber) {
              cust['phPhoneNumber'] = event.phPhoneNumber;
            }
            if (event?.phEmail) {
              cust['phEmail'] = event.phEmail;
            }
            if (event?.phCustom) {
              cust['phCustom'] = event.phCustom;
            }
            return cust;
          }
          const correlation = await this.customersService.findBySpecifiedEvent(
            account,
            'posthogId',
            currentEvent.userId,
            currentEvent,
            postHogEventMapping
          );
          cust = correlation.cust;
          found = correlation.found;
          console.log('cust is', cust);
          console.log('found is', found);

          if (!correlation.found) {
            try {
              this.workflowsService.enrollCustomer(account, correlation.cust);
            } catch (err) {
              this.logger.error('Error: ' + err);
              return new HttpException(err, 500);
            }
          }
          //need to change posthogeventdto to eventdo
          const convertedEventDto: EventDto = {
            correlationKey: 'posthogId',
            correlationValue: currentEvent.userId,
            event: currentEvent.event,
          };

          //currentEvent
          try {
            job = await this.workflowsService.tick(account, convertedEventDto);
            this.logger.debug('Queued messages with jobID ' + job);
            // return {
            //   jobId: job.id as string,
            // };
          } catch (err) {
            this.logger.error('Error: ' + err);
            return new HttpException(err, 500);
          }

          //skip to next in for loop if there is no way to message user
          /*
          let early = (cust["slackEmail"] ? false : (cust["slackId"] ? false : cust["phEmail"] ? false : (cust["phPhoneNumber"] ? false : cust["email"] ? false : true)))
          if(early){
            console.log("skipping");
            continue;
          }
          */
        } catch (e) {
          console.log(e);
          return new HttpException(e, 500);
        }
        // // Step 3: Get all active workflows associated with this account
        // console.log("step 3");
        // try {
        //   wfs = await this.workflowsService.findAllActive(account);
        // } catch (e) {
        //   console.log(e);
        //   return new HttpException(e, 500);
        // }
        // console.log("step 4");
        // //Step 4: Find primary audience for every workflow
        // for (let wfsIndex = 0; wfsIndex < wfs.length; wfsIndex++) {
        //   // Making sure audiences is not empty
        //   if (wfs[wfsIndex].audiences?.length) {
        //     // Setting primary audience
        //     for (
        //       let audsIndex = 0;
        //       audsIndex < wfs[wfsIndex].audiences.length;
        //       audsIndex++
        //     ) {
        //       try {
        //         aud = await this.audiencesService.findOne(
        //           account,
        //           wfs[wfsIndex].audiences[audsIndex]
        //         );
        //       } catch (e) {
        //         console.log(e);
        //         return new HttpException(e, 500);
        //       }
        //       if (aud.isPrimary) primary = aud;
        //     }
        //     //Step 5: If primary is static, and customer is new, return;
        //     if (!primary.isDynamic && !found) return;

        //     //Step 6: If primary is static and customer is found, move to secondary audience
        //     if (found) {
        //       console.log("found");
        //       // Check if customer is in any of the audiences in the workflow
        //       for (
        //         let audsIndex = 0;
        //         audsIndex < wfs[wfsIndex].audiences.length;
        //         audsIndex++
        //       ) {
        //         try {
        //           aud = await this.audiencesService.findOne(
        //             account,
        //             wfs[wfsIndex].audiences[audsIndex]
        //           );
        //         } catch (e) {
        //           console.log(e);
        //           return new HttpException(e, 500);
        //         }
        //         // If we find customer, move them to next audience and remove them from this audience
        //         if (aud?.customers?.indexOf(cust.id) >= 0) {
        //           if (wfs[wfsIndex].rules?.length) {
        //             for (
        //               let rulesIndex = 0;
        //               rulesIndex < wfs[wfsIndex].rules?.length;
        //               rulesIndex++
        //             ) {
        //               const rule: Trigger = JSON.parse(
        //                 Buffer.from(
        //                   wfs[wfsIndex].rules[rulesIndex],
        //                   "base64"
        //                 ).toString("ascii")
        //               );
        //               if (
        //                 rule.source == aud.id &&
        //                 currentEvent.event == rule.properties.event
        //               ) {
        //                 try {
        //                   destAud = await this.audiencesService.findOne(
        //                     account,
        //                     rule.dest.toString()
        //                   );
        //                 } catch (e) {
        //                   console.log(e);
        //                   return new HttpException(e, 500);
        //                 }
        //                 // Destination audience needs to be in audiences array of workflow
        //                 if (wfs[wfsIndex].audiences.indexOf(destAud.id) < 0) {
        //                   return new HttpException(
        //                     "Destination audience not found in workflow",
        //                     500
        //                   );
        //                 }
        //                 for (
        //                   let index = 0;
        //                   index < destAud.templates.length;
        //                   index++
        //                 ) {
        //                   console.log("making it ehre");
        //                   try {
        //                     template = await this.templatesService.findOneById(
        //                       account,
        //                       destAud.templates[index]
        //                     );
        //                   } catch (e) {
        //                     console.log(e);
        //                     return new HttpException(e, 500);
        //                   }
        //                   switch (template.type) {
        //                     case "email":
        //                       jobId = await this.emailQueue.add("send", {
        //                         key: account.mailgunAPIKey,
        //                         from: account.sendingName,
        //                         domain: account.sendingDomain,
        //                         email: account.sendingEmail,
        //                         to: cust.email,
        //                         subject: template.subject,
        //                         text: template.text,
        //                       });
        //                     case "slack":
        //                       var tok = null;
        //                       var install = (
        //                         await this.installationRepository.findOneBy({
        //                           id: cust.slackTeamId[0].trim(),
        //                         })
        //                       ).installation;
        //                       tok = install.bot.token;
        //                       jobId = await this.slackQueue.add("send", {
        //                         methodName: "chat.postMessage",
        //                         token: tok,
        //                         args: {
        //                           channel: cust.slackId,
        //                           text: template.slackMessage,
        //                         },
        //                       });
        //                     case "sms":
        //                   }
        //                 }
        //               }
        //             }
        //           }
        //           //Move customer to the correct audience
        //           try {
        //             await this.audiencesService.moveCustomer(
        //               aud,
        //               destAud,
        //               cust.id
        //             );
        //           } catch (e) {
        //             console.log(e);
        //             return new HttpException(e, 500);
        //           }
        //           // We've moved the customer to the correct audience, need to break
        //           break;
        //         }
        //       }
        //     }

        //     if (primary.isDynamic && !found) {
        //       console.log("second case");
        //       if (checkInclusion(cust, primary.inclusionCriteria)) {
        //         await this.audiencesService.moveCustomer(null, primary, cust.id);
        //       }
        //       // Check if customer is in any of the audiences in the workflow
        //       for (
        //         let audsIndex = 0;
        //         audsIndex < wfs[wfsIndex].audiences.length;
        //         audsIndex++
        //       ) {
        //         try {
        //           aud = await this.audiencesService.findOne(
        //             account,
        //             wfs[wfsIndex].audiences[audsIndex]
        //           );
        //         } catch (e) {
        //           console.log(e);
        //           return new HttpException(e, 500);
        //         }
        //         // If we find customer, move them to next audience and remove them from this audience
        //         if (aud.customers.indexOf(cust.id) >= 0) {
        //           if (wfs[wfsIndex].rules?.length) {
        //             for (
        //               let rulesIndex = 0;
        //               rulesIndex < wfs[wfsIndex].rules?.length;
        //               rulesIndex++
        //             ) {
        //               const rule: Trigger = JSON.parse(
        //                 Buffer.from(
        //                   wfs[wfsIndex].rules[rulesIndex],
        //                   "base64"
        //                 ).toString("ascii")
        //               );
        //               if (
        //                 rule.source == aud.id &&
        //                 currentEvent.event == rule.properties.event
        //               ) {
        //                 try {
        //                   destAud = await this.audiencesService.findOne(
        //                     account,
        //                     rule.dest.toString()
        //                   );
        //                 } catch (e) {
        //                   console.log(e);
        //                   return new HttpException(e, 500);
        //                 }
        //                 // Destination audience needs to be in audiences array of workflow
        //                 if (wfs[wfsIndex].audiences.indexOf(destAud.id) < 0) {
        //                   return new HttpException(
        //                     "Destination audience not found in workflow",
        //                     500
        //                   );
        //                 }
        //                 for (
        //                   let index = 0;
        //                   index < destAud.templates.length;
        //                   index++
        //                 ) {
        //                   try {
        //                     template = await this.templatesService.findOneById(
        //                       account,
        //                       destAud.templates[index]
        //                     );
        //                   } catch (e) {
        //                     console.log(e);
        //                     return new HttpException(e, 500);
        //                   }
        //                   switch (template.type) {
        //                     case "email":
        //                       jobId = await this.emailQueue.add("send", {
        //                         key: account.mailgunAPIKey,
        //                         from: account.sendingName,
        //                         domain: account.sendingDomain,
        //                         email: account.sendingEmail,
        //                         to: cust.email,
        //                         subject: template.subject,
        //                         text: template.text,
        //                       });
        //                     case "slack":
        //                       var tok = null;
        //                       var install = (
        //                         await this.installationRepository.findOneBy({
        //                           id: cust.slackTeamId[0].trim(),
        //                         })
        //                       ).installation;
        //                       tok = install.bot.token;
        //                       jobId = await this.slackQueue.add("send", {
        //                         methodName: "chat.postMessage",
        //                         token: tok,
        //                         args: {
        //                           channel: cust.slackId,
        //                           text: template.slackMessage,
        //                         },
        //                       });
        //                     case "sms":
        //                   }
        //                 }
        //               }
        //             }
        //           }
        //           //Move customer to the correct audience
        //           try {
        //             await this.audiencesService.moveCustomer(
        //               aud,
        //               destAud,
        //               cust.id
        //             );
        //           } catch (e) {
        //             console.log(e);
        //             return new HttpException(e, 500);
        //           }
        //           // We've moved the customer to the correct audience, need to break
        //           break;
        //         }
        //       }
        //     }
        //   }
        // }
        jobArray.push(job);
      }

      /*

      */
    } catch (e) {
      console.log(e);
    }

    return {
      //jobId: jobId?.id,
      jobArray,
    };
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async enginePayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: EventDto
  ): Promise<Job | { jobId: string } | HttpException> {
    console.log('here in engine');
    let account: Account, correlation: Correlation, job: Job<any>;
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    try {
      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        body
      );
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    if (!correlation.found) {
      try {
        this.workflowsService.enrollCustomer(account, correlation.cust);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return new HttpException(err, 500);
      }
    }
    try {
      job = await this.workflowsService.tick(account, body);
      this.logger.debug('Queued messages with jobID ' + job);
      return job;
      // {
      //   jobId: job.id as string,
      // };
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
  }
}
