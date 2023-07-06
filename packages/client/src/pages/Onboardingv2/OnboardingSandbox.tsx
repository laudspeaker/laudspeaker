import FlowBuilderDrawer, {
  FlowBuilderDrawerFixture,
} from "pages/FlowBuilderv2/Drawer/FlowBuilderDrawer";
import FlowEditor, { EdgeType, NodeType } from "pages/FlowBuilderv2/FlowEditor";
import {
  CustomModalIcon,
  EmailIcon,
  ExitIcon,
  JumpToIcon,
  PushIcon,
  SlackIcon,
  SMSIcon,
  TimeDelayIcon,
  TimeWindowIcon,
  UserAttributeIcon,
  WaitUntilIcon,
  WebhookIcon,
} from "pages/FlowBuilderv2/Icons";
import {
  Branch,
  BranchType,
  LogicRelation,
  TimeType,
} from "pages/FlowBuilderv2/Nodes/NodeData";
import React, { FC, useEffect } from "react";
import {
  setEdges,
  setIsOnboarding,
  setNodes,
} from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import { MessageType, ProviderType } from "types/Workflow";
import OnboardingStepper from "./Stepper/OnboardingStepper";

export enum OnboardingAction {
  NOTHING = "nothing",
  EMAIL = "email",
}

const drawerFixtures: FlowBuilderDrawerFixture[] = [
  {
    groupName: "Messages & Step",
    children: [
      {
        id: OnboardingAction.EMAIL,
        icon: EmailIcon(),
        text: "Email",
        targetId: "emptyLeft",
      },
      {
        id: OnboardingAction.NOTHING,
        icon: SMSIcon(),
        text: "SMS",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: SlackIcon(),
        text: "Slack",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: PushIcon(),
        text: "Push Notification",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: WebhookIcon(),
        text: "Webhook",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: CustomModalIcon(),
        text: "Custom Modal",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: JumpToIcon(),
        text: "Jump To",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: ExitIcon(),
        text: "Exit",
        disabled: true,
      },
    ],
  },
  {
    groupName: "Trigger",
    children: [
      {
        id: OnboardingAction.NOTHING,
        icon: WaitUntilIcon(),
        text: "Wait Until",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: TimeDelayIcon(),
        text: "Time Delay",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: TimeWindowIcon(),
        text: "Time Window",
        disabled: true,
      },
      {
        id: OnboardingAction.NOTHING,
        icon: UserAttributeIcon(),
        text: "User Attribute",
        disabled: true,
      },
    ],
  },
];

const OnboardingSandbox = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(setIsOnboarding(true));

    const branch1: Branch = {
      id: "brach1",
      type: BranchType.EVENT,
      conditions: [
        {
          name: "event",
          providerType: ProviderType.Custom,
          statements: [],
          relationToNext: LogicRelation.AND,
        },
      ],
    };

    const branch2: Branch = {
      id: "brach2",
      type: BranchType.MAX_TIME,
      timeType: TimeType.TIME_DELAY,
      delay: { days: 1, hours: 0, minutes: 0 },
    };

    dispatch(
      setEdges([
        {
          id: "start->waitUntil",
          source: "start",
          target: "waitUntil",
          type: EdgeType.PRIMARY,
        },
        {
          id: "waitUntil->emptyLeft",
          source: "waitUntil",
          target: "emptyLeft",
          type: EdgeType.BRANCH,
          data: {
            type: EdgeType.BRANCH,
            branch: branch1,
          },
        },
        {
          id: "waitUntil->emailRight",
          source: "waitUntil",
          target: "emailRight",
          type: EdgeType.BRANCH,
          data: {
            type: EdgeType.BRANCH,
            branch: branch2,
          },
        },
        {
          id: "emailRight->emptyRight",
          source: "emailRight",
          target: "emptyRight",
          type: EdgeType.PRIMARY,
        },
      ])
    );

    dispatch(
      setNodes([
        {
          id: "start",
          type: NodeType.START,
          data: {},
          position: { x: 0, y: 0 },
        },
        {
          id: "waitUntil",
          type: NodeType.WAIT_UNTIL,
          data: {
            type: NodeType.WAIT_UNTIL,
            branches: [branch1, branch2],
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "emptyLeft",
          type: NodeType.EMPTY,
          data: {},
          position: { x: 0, y: 0 },
        },
        {
          id: "emailRight",
          type: NodeType.MESSAGE,
          data: {
            type: NodeType.MESSAGE,
            template: {
              type: MessageType.EMAIL,
              selected: { id: -1, name: "Remind email" },
            },
          },
          position: { x: 0, y: 0 },
        },
        {
          id: "emptyRight",
          type: NodeType.EMPTY,
          data: {},
          position: { x: 0, y: 0 },
        },
      ])
    );

    return () => {
      setIsOnboarding(false);
    };
  }, []);

  return (
    <div className="bg-[#F3F4F6] rounded-[25px] h-full overflow-hidden p-[20px] flex">
      <FlowBuilderDrawer fixtures={drawerFixtures} />
      <FlowEditor />
    </div>
  );
};

export default OnboardingSandbox;
