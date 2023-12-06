import {
  Users,
  Integrations,
  Analysis,
  Audience,
  WaitUntil,
  Clock,
  MultiSplit,
  Email,
  SlackMsg,
  Mobile,
  Webhook,
  SMS,
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
        canBeDisabled: false,
        disabledToolTip: "Add step first or select if added",
      },
      {
        id: "timeDelay",
        imgIcon: Clock(),
        text: "Time Delay",
        type: "menu",
        link: "/timeDelay",
        canBeDisabled: false,
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
        canBeDisabled: false,
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
        canBeDisabled: false,
        requiredOnboarding: "Email",
        // enabledToolTip: (
        //   <div className="p-5 flex flex-col justify-between gap-5 items-center">
        //     <img
        //       className="w-[200px]"
        //       src="https://thumbs.dreamstime.com/b/glass-clean-drinking-water-44066082.jpg"
        //       alt=""
        //     />
        //     Some text
        //   </div>
        // ),
        disabledToolTip:
          "Make sure there are steps and configure email in settings and step selected",
      },
      {
        id: "firebase",
        imgIcon: Mobile(),
        text: "Firebase Messaging",
        type: "menu",
        link: "/firebase",
        canBeDisabled: false,
        requiredOnboarding: "Firebase",
        disabledToolTip:
          "Make sure there are steps and configure firebase in settings and step selected",
      },
      {
        id: "push",
        imgIcon: Mobile(),
        text: "Push Notification",
        type: "menu",
        link: "/push",
        canBeDisabled: false,
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
        canBeDisabled: false,
        requiredOnboarding: "Sms",
        disabledToolTip:
          "Make sure there are steps and configure sms in settings and step selected",
      },
      {
        id: "slack",
        imgIcon: SlackMsg(),
        text: "Slack Message",
        type: "menu",
        link: "/slack",
        canBeDisabled: false,
        requiredOnboarding: "Slack",
        disabledToolTip:
          "Make sure there are steps and configure slack in settings and step selected",
        //alwaysDisabled: true,
      },
      {
        id: "webhook",
        imgIcon: (
          <div className="max-w-[30px] max-h-[30px] w-full h-full">
            {Webhook()}
          </div>
        ),
        text: "Webhook Message",
        type: "menu",
        link: "/webhook",
        canBeDisabled: false,
        disabledToolTip:
          "Make sure there are steps and configure webhook in settings and step selected",
      },
      {
        id: "modal",
        imgIcon: (
          <div className="max-w-[30px] max-h-[30px] w-full h-full">
            {Webhook()}
          </div>
        ),
        text: "Modal Popup",
        type: "menu",
        link: "/modal",
        canBeDisabled: false,
        disabledToolTip:
          "Make sure there are steps and configure modal in settings and step selected",
      },
    ],
  },
];
