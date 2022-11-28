import {
  Users,
  Integrations,
  Analysis,
  Audience,
  WaitUntil,
  Clock,
  TrueFalse,
  MultiSplit,
  Email,
  SlackMsg,
  Mobile,
  SMS,
  ManualSegment,
  BackButtonIcon,
} from "../Icons/Icons";

export default [
  { id: "audience", imgIcon: Audience(), text: "Audience states" },
  { id: "waitUntil", imgIcon: WaitUntil(), text: "Wait Until" },
  { id: "timeDelay", imgIcon: Clock(), text: "Time Delay" },
  { id: "email", imgIcon: Email(), text: "Email" },
  { id: "users", imgIcon: Users(), text: "Users" },
  { id: "integrations", imgIcon: Integrations(), text: "Integrations" },
  { id: "analysis", imgIcon: Analysis(), text: "Analysis" },
];

export const dataSubArray = [
  {
    id: "audienceStates",
    text: "Steps",
    type: "group",
    children: [
      {
        id: "audience",
        imgIcon: Audience(),
        text: "New Step",
        type: "menu",
        link: "/audience",
      },
      {
        id: "exit",
        imgIcon: BackButtonIcon(),
        text: "Exit",
        type: "menu",
        link: "/exit",
      },
    ],
  },
  {
    id: "triggers",
    text: "Triggers",
    type: "group",
    children: [
      {
        id: "eventBased",
        imgIcon: MultiSplit(),
        text: "Event Based",
        type: "menu",
        link: "/eventBased",
        canBeDisabled: true,
        disabledToolTip: "Add step first or select if added",
      },
      {
        id: "timeDelay",
        imgIcon: Clock(),
        text: "Time Delay",
        type: "menu",
        link: "/timeDelay",
        canBeDisabled: true,
        disabledToolTip: "Add step first or select if added",
        enabledToolTip:
          "This trigger moves a user from one step to another some time after an action",
      },
      {
        id: "timeWindow",
        imgIcon: Clock(),
        text: "Time Window",
        type: "menu",
        link: "/timeWindow",
        canBeDisabled: true,
        disabledToolTip: "Add step first or select if added",
      },
    ],
  },
  {
    id: "messages",
    text: "Messages",
    type: "group",
    children: [
      {
        id: "email",
        imgIcon: Email(),
        text: "Email",
        type: "menu",
        link: "/email",
        canBeDisabled: true,
        requiredOnboarding: "Email",
        disabledToolTip:
          "Make sure there are steps and configure email in settings and step selected",
      },
      {
        id: "push",
        imgIcon: Mobile(),
        text: "Push Notification",
        type: "menu",
        link: "/push",
        canBeDisabled: true,
        alwaysDisabled: true,
        disabledToolTip:
          "Make sure there are steps and configure push notification in settings and step selected",
      },
      {
        id: "sms",
        imgIcon: SMS(),
        text: "Sms",
        type: "menu",
        link: "/twilio",
        canBeDisabled: true,
        alwaysDisabled: true,
        disabledToolTip:
          "Make sure there are steps and configure sms in settings and step selected",
      },
      {
        id: "slack",
        imgIcon: SlackMsg(),
        text: "Slack Message",
        type: "menu",
        link: "/slack",
        canBeDisabled: true,
        requiredOnboarding: "Slack",
        disabledToolTip:
          "Make sure there are steps and configure slack in settings and step selected",
        //alwaysDisabled: true,
      },
    ],
  },
];
