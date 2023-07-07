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
import React, { ReactNode, useEffect, useState } from "react";
import {
  refreshFlowBuilder,
  setEdges,
  setIsOnboarding,
  setNodes,
} from "reducers/flow-builder.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { MessageType, ProviderType } from "types/Workflow";
import OnboardingDialog from "./OnbordingDialog/OnboardingDialog";
import createJourneyColorfulHeaderImage from "./svg/create-journey-colorful-header.svg";
import onboardingCursorImage from "./svg/onboarding-cursor.svg";

export enum OnboardingAction {
  NOTHING = "nothing",
  EMAIL = "email",
}

export interface SandboxStepFixture {
  header?: ReactNode;
  dialog?: {
    position: { top: number; left: number };
    content: ReactNode;
  };
  cursor?: {
    position: {
      top: number;
      left: number;
    };
  };
  tooltip?: {
    position: {
      top: number;
      left: number;
    };
    content: ReactNode;
  };
  checkStepFinished: () => boolean;
}

export enum SandboxStep {
  MESSAGE_AND_STEP,
  DRAG_EMAIL,
  SETTING_PANEL,
  SELECT_TEMPLATE,
  SAVE_SETTINGS,
  TRIGGER,
  MODIFY_TRIGGER,
  CHANGE_TIME,
  SAVE_TRIGGER,
  FINISH,
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
  const flowBuilderState = useAppSelector((state) => state.flowBuilder);
  const dispatch = useAppDispatch();

  const emptyLeftNode = flowBuilderState.nodes.find(
    (node) => node.id === "emptyLeft"
  );

  const sanboxStepToFixtureMap: Record<SandboxStep, SandboxStepFixture> = {
    [SandboxStep.MESSAGE_AND_STEP]: {
      header: (
        <div className="flex flex-col items-center gap-[20px]">
          <div>
            <img src={createJourneyColorfulHeaderImage} />
          </div>

          <div className="max-w-[830px] text-center">
            Scenario: New users sign up for your platform and receive a
            verification email. Verify within 1 day to receive a welcome email,
            otherwise, get a reminder email.
          </div>
        </div>
      ),
      dialog: {
        position: { top: 307, left: 276 },
        content: (
          <>
            <div className="font-inter text-[20px] font-medium">
              Message & Step
            </div>
            <p className="text-[#4B5563]">
              <span className="text-[#111827] font-semibold">Message:</span>{" "}
              Send personalized emails, SMS, and Slack to customers.
              <br />
              <span className="text-[#111827] font-semibold">Step:</span> Design
              the journey flow using Loop, Exit, and Conditional steps.
            </p>
          </>
        ),
      },
      checkStepFinished: () => false,
    },
    [SandboxStep.DRAG_EMAIL]: {
      header: (
        <div className="flex justify-center py-[20px]">
          <div className="text-center max-w-[830px]">
            Scenario: New users sign up for your platform and receive a
            verification email. Verify within 1 day to receive a welcome email,
            otherwise, get a reminder email.
          </div>
        </div>
      ),
      cursor: {
        position: {
          top: 330,
          left: 217,
        },
      },
      tooltip: {
        content: (
          <div className="p-[10px] bg-black text-white font-medium">
            Drag an email to the next step
          </div>
        ),
        position: {
          top: 32,
          left: 213,
        },
      },
      checkStepFinished: () =>
        emptyLeftNode?.type === NodeType.MESSAGE &&
        emptyLeftNode.data.type === NodeType.MESSAGE &&
        emptyLeftNode.data.template.type === MessageType.EMAIL,
    },
    [SandboxStep.SETTING_PANEL]: { checkStepFinished: () => false },
    [SandboxStep.SELECT_TEMPLATE]: { checkStepFinished: () => false },
    [SandboxStep.SAVE_SETTINGS]: { checkStepFinished: () => false },
    [SandboxStep.TRIGGER]: { checkStepFinished: () => false },
    [SandboxStep.MODIFY_TRIGGER]: { checkStepFinished: () => false },
    [SandboxStep.CHANGE_TIME]: { checkStepFinished: () => false },
    [SandboxStep.SAVE_TRIGGER]: { checkStepFinished: () => false },
    [SandboxStep.FINISH]: { checkStepFinished: () => false },
  };

  const [currentStep, setCurrentStep] = useState(SandboxStep.MESSAGE_AND_STEP);

  const currentSandboxFixture = sanboxStepToFixtureMap[currentStep];

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
      dispatch(refreshFlowBuilder());
    };
  }, []);

  useEffect(() => {
    if (!currentSandboxFixture.checkStepFinished()) return;

    if (currentStep === SandboxStep.FINISH) return;

    setCurrentStep(currentStep + 1);
  }, [flowBuilderState]);

  return (
    <>
      {currentSandboxFixture.header}
      <div className="bg-[#F3F4F6] rounded-[25px] h-full overflow-hidden p-[20px] flex relative">
        <FlowBuilderDrawer fixtures={drawerFixtures} />
        <FlowEditor />
        {currentSandboxFixture.cursor && (
          <div
            className="fixed"
            style={{
              top: currentSandboxFixture.cursor.position.top,
              left: currentSandboxFixture.cursor.position.left,
            }}
          >
            <img src={onboardingCursorImage} />
          </div>
        )}
        {currentSandboxFixture.tooltip && (
          <div
            className="absolute"
            style={{
              top: currentSandboxFixture.tooltip.position.top,
              left: currentSandboxFixture.tooltip.position.left,
            }}
          >
            {currentSandboxFixture.tooltip.content}
          </div>
        )}
        {currentSandboxFixture.dialog && (
          <OnboardingDialog
            onNextClick={() => {
              if (currentStep === SandboxStep.FINISH) return;

              setCurrentStep(currentStep + 1);
            }}
            position={currentSandboxFixture.dialog.position}
          >
            {currentSandboxFixture.dialog.content}
          </OnboardingDialog>
        )}
      </div>
    </>
  );
};

export default OnboardingSandbox;
