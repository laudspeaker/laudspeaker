import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { klona } from 'klona/full';
import { RemoteSocket, Socket } from 'socket.io';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Customer } from '../customers/schemas/customer.schema';
import { Journey } from '../journeys/entities/journey.entity';
import { NodeType } from '../journeys/types/visual-layout.interface';
import { Step } from '../steps/entities/step.entity';
import {
  AnalyticsProviderTypes,
  CustomComponentAction,
  StepType,
} from '../steps/types/step.interface';
import { Template } from '../templates/entities/template.entity';
import { DevMode, DevModeState } from './entities/dev-mode.entity';

@Injectable()
export class DevModeService {
  constructor(
    @InjectRepository(Journey)
    public journeysRepository: Repository<Journey>,
    @InjectRepository(DevMode)
    public devModeRepository: Repository<DevMode>,
    @InjectRepository(Step)
    public stepRepository: Repository<Step>,
    @InjectRepository(Template)
    public templateRepository: Repository<Template>
  ) {}

  public async upsertDevMode(
    account: Account,
    journey: Journey,
    state: DevModeState
  ) {
    try {
      await this.devModeRepository.upsert(
        {
          journeyId: journey.id,
          ownerId: account.id,
          devModeState: state,
        },
        {
          conflictPaths: {
            journeyId: true,
            ownerId: true,
          },
          upsertType: 'on-conflict-do-update',
        }
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async resetDevMode(account: Account, journeyId: string) {
    try {
      const journey = await this.journeysRepository.findOne({
        where: {
          id: journeyId,
        },
      });

      if (!journey) {
        throw new Error('No such journey found.');
      }

      const startNode = journey.visualLayout?.nodes?.find(
        (el) => el.type === NodeType.START
      );

      const customer = new Customer();
      customer.email = 'devmode@email.com';
      customer.firstName = 'dev';
      customer.lastName = 'mode';
      customer.ownerId = account.id;
      customer.journeys = [journey.id];
      customer.customComponents = {};

      await this.devModeRepository.upsert(
        {
          journeyId: journey.id,
          ownerId: account.id,
          devModeState: {
            customerIn: {
              nodeId: startNode.id,
              stepId: startNode.data.stepId,
            },
            customerData: customer,
            customerStory: {
              [startNode.id]: customer,
            },
          },
        },
        {
          conflictPaths: {
            journeyId: true,
            ownerId: true,
          },
          upsertType: 'on-conflict-do-update',
        }
      );

      const devMode = await this.devModeRepository.findOneBy({
        journeyId: journey.id,
        ownerId: account.id,
      });
      return devMode;
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async moveToNode(
    account: Account,
    journeyId: string,
    toNodeId: string
  ) {
    try {
      const devMode = await this.devModeRepository.findOneBy({
        journeyId,
        ownerId: account.id,
      });

      const journey = await this.journeysRepository.findOneBy({
        id: journeyId,
      });

      if (!devMode)
        throw new Error("Dev mode not found can't be moved to step");
      if (!journey)
        throw new Error("Journey not found, can't be moved to step");

      const node = journey.visualLayout.nodes.find(
        (el) => el.id === toNodeId && el.type !== NodeType.EMPTY
      );

      if (!node)
        throw new Error(
          "Current node don't have stepId, try again or recreate step"
        );

      // handle moving to Custom component(Tracker)
      if (node.type === NodeType.TRACKER) {
        const stepFromDB = await this.stepRepository.findOne({
          where: {
            id: node.data.stepId,
          },
        });

        const { action, humanReadableName, pushedValues, template } =
          stepFromDB.metadata;

        const templateFromDB = await this.templateRepository.findOne({
          where: {
            id: template,
          },
        });

        if (
          !devMode.devModeState.customerData.customComponents[humanReadableName]
        )
          devMode.devModeState.customerData.customComponents[
            humanReadableName
          ] = {
            hidden: true,
            ...templateFromDB.customFields,
            delivered: false,
          };

        devMode.devModeState.customerData.customComponents[
          humanReadableName
        ].hidden = action === CustomComponentAction.HIDE ? true : false;
        devMode.devModeState.customerData.customComponents[
          humanReadableName
        ].step = stepFromDB.id;
        devMode.devModeState.customerData.customComponents[
          humanReadableName
        ].template = String(templateFromDB.id);
        devMode.devModeState.customerData.customComponents[humanReadableName] =
          {
            ...devMode.devModeState.customerData.customComponents[
              humanReadableName
            ],
            ...pushedValues,
          };

        devMode.devModeState.customerStory[toNodeId] =
          devMode.devModeState.customerData;
        // handle moving to one of previous nodes
      } else if (devMode.devModeState.customerStory[toNodeId]) {
        // get keys from node that should be next
        const futureKeys = Object.keys(
          devMode.devModeState.customerData.customComponents
        );

        // get current keys
        const toNodeKeys = Object.keys(
          devMode.devModeState.customerStory[toNodeId].customComponents
        );

        // those keys that not exist in node should be set to null and let client side know that state is undefined as if it wasn't set yet
        const keysToNull = futureKeys.filter((el) => !toNodeKeys.includes(el));
        keysToNull.forEach((key) => {
          devMode.devModeState.customerStory[toNodeId].customComponents[key] =
            null;
        });

        devMode.devModeState.customerData =
          devMode.devModeState.customerStory[toNodeId];
      } else {
        devMode.devModeState.customerStory[toNodeId] =
          devMode.devModeState.customerData;
      }

      await this.devModeRepository.update(
        {
          ownerId: account.id,
          journeyId: journeyId,
        },
        {
          devModeState: {
            ...devMode.devModeState,
            customerIn: {
              nodeId: toNodeId,
              stepId: node.data.stepId,
            },
          },
        }
      );
    } catch (error: any) {
      throw new Error(error);
    }
  }

  public async reactOnCustom(
    socketClient: RemoteSocket<DefaultEventsMap, any>,
    socketLocal: Socket,
    event: { [key: string]: unknown }
  ) {
    try {
      const devMode = await this.devModeRepository.findOneBy({
        journeyId: socketClient.handshake.auth.journeyId,
        ownerId: socketLocal.data.account.id,
      });

      const step = await this.stepRepository.findOne({
        where: {
          id: devMode.devModeState.customerIn.stepId,
          type: StepType.WAIT_UNTIL_BRANCH,
        },
      });
      const journey = await this.journeysRepository.findOne({
        where: {
          id: devMode.journeyId,
        },
      });

      if (!journey) {
        throw new Error('No such journey found.');
      }

      if (!step) return;
      let stepsToQueue: Step[] = [],
        branch: number;

      for (
        let branchIndex = 0;
        branchIndex < step.metadata.branches.length;
        branchIndex++
      ) {
        const eventEvaluation: boolean[] = [];
        event_loop: for (
          let eventIndex = 0;
          eventIndex < step.metadata.branches[branchIndex].events.length;
          eventIndex++
        ) {
          eventEvaluation.push(
            event.event ===
              step.metadata.branches[branchIndex].events[eventIndex].event &&
              event.trackerId ==
                step.metadata.branches[branchIndex].events[eventIndex].trackerID
          );
        }
        if (step.metadata.branches[branchIndex].relation === 'or') {
          if (
            eventEvaluation.some((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(step);
            branch = branchIndex;
            // break step_loop;
          }
        } else {
          if (
            eventEvaluation.every((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(step);
            branch = branchIndex;
            // break step_loop;
          }
        }
      }
      if (!step.metadata.branches[branch])
        throw new Error('No branch to move found');

      const node = journey.visualLayout.nodes.find(
        (el) => el.data.stepId === step.metadata.branches[branch].destination
      );

      if (!node) throw new Error("Can't find node");

      await this.moveToNode(socketLocal.data.account, journey.id, node.id);

      const devModeUpdated = await this.devModeRepository.findOneBy({
        journeyId: socketClient.handshake.auth.journeyId,
        ownerId: socketLocal.data.account.id,
      });

      for (const key in devModeUpdated.devModeState.customerData
        .customComponents) {
        socketLocal.emit('custom', {
          trackerId: key,
          ...devModeUpdated.devModeState.customerData.customComponents[key],
        });
      }

      socketClient.emit('nodeMovedTo', node.id);
    } catch (error) {
      console.log(error);
    }
  }

  public async getDevModeState(accountId: string, journeyId: string) {
    return await this.devModeRepository.findOne({
      where: {
        ownerId: accountId,
        journeyId: journeyId,
      },
    });
  }
}

