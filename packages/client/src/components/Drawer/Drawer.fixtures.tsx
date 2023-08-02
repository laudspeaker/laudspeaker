import homeIcon from "./DrawerIcons/home.svg";
import messagingIcon from "./DrawerIcons/messaging.svg";
import journeyBuilderIcon from "./DrawerIcons/journeyBuilder.svg";
import templateBuilderIcon from "./DrawerIcons/templateBuilder.svg";
import audienceIcon from "./DrawerIcons/audience.svg";
import dataIcon from "./DrawerIcons/data.svg";
import settingsIcon from "./DrawerIcons/settings.svg";

// export default [
//   { id: "home", imgIcon: Home(), text: "Home" },
//   { id: "journeys", imgIcon: Journeys(), text: "Journeys" },
//   { id: "campaigns", imgIcon: Campaigns(), text: "Campaigns" },
//   { id: "alltemplates", imgIcon: Campaigns(), text: "Templates" },
//   { id: "segments", imgIcon: Segments(), text: "Segments" },
//   { id: "users", imgIcon: Users(), text: "Users" },
//   // {
//   //   id: "integrations",
//   //   imgIcon: Integrations(),
//   //   text: "Integrations",
//   // },
//   { id: "settings", imgIcon: Settings(), text: "Settings" },
//   //{ id: "analysis", imgIcon: Analysis(), text: "Analysis" },
// ];

export const dataSubArray = [
  {
    id: "home",
    imgIcon: homeIcon,
    text: "Home",
    type: "menu",
    link: "/home",
  },
  {
    id: "messaging",
    imgIcon: messagingIcon,
    text: "Messaging",
    type: "group",
    children: [
      {
        id: "journeys",
        imgIcon: journeyBuilderIcon,
        text: "Journey Builder",
        type: "menu",
        link: "/flow",
      },
      {
        id: "campaigns",
        imgIcon: templateBuilderIcon,
        text: "Template Builder",
        type: "menu",
        link: "/templates",
      },
      {
        id: "tracker-template",
        imgIcon: templateBuilderIcon,
        text: "Tracker template",
        type: "menu",
        link: "/tracker-template",
      },
      {
        id: "event-tracker",
        imgIcon: templateBuilderIcon,
        text: "Event Tracker",
        type: "menu",
        link: "/event-tracker",
      },
    ],
  },
  {
    id: "audience",
    imgIcon: audienceIcon,
    text: "Audience",
    type: "group",
    children: [
      {
        id: "users",
        imgIcon: audienceIcon,
        text: "People",
        type: "menu",
        link: "/people",
      },
      {
        id: "segments",
        imgIcon: audienceIcon,
        text: "Segments",
        type: "menu",
        link: "/segment",
      },
    ],
  },
  {
    id: "integrations",
    imgIcon: dataIcon,
    text: "Data",
    type: "group",
    children: [
      {
        id: "integrations",
        imgIcon: dataIcon,
        text: "Database import",
        type: "menu",
        link: "/integrations",
      },
      // {
      //   id: "analysis",
      //   imgIcon: Analysis(),
      //   text: "Analysis",
      //   type: "menu",
      //   link: "/analysis",
      // },
    ],
  },
  {
    id: "settings",
    imgIcon: settingsIcon,
    text: "Settings",
    type: "menu",
    link: "/settings",
  },
];
