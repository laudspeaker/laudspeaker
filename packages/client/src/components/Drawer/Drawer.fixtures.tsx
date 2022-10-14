import {
  Home,
  Journeys,
  Campaigns,
  Segments,
  Users,
  Integrations,
  Analysis,
  Settings,
} from "../Icons/Icons";

export default [
  { id: "home", imgIcon: Home("black"), text: "Home" },
  { id: "journeys", imgIcon: Journeys("black"), text: "Journeys" },
  { id: "campaigns", imgIcon: Campaigns("black"), text: "Campaigns" },
  { id: "alltemplates", imgIcon: Campaigns("black"), text: "Templates" },
  { id: "segments", imgIcon: Segments("black"), text: "Segments" },
  { id: "users", imgIcon: Users("black"), text: "Users" },
  { id: "integrations", imgIcon: Integrations("black"), text: "Integrations" },
  { id: "settings", imgIcon: Settings("black"), text: "Settings" },
  //{ id: "analysis", imgIcon: Analysis(), text: "Analysis" },
];

export const dataSubArray = [
  {
    id: "home",
    imgIcon: Home("black"),
    text: "Home",
    type: "menu",
    link: "/dashboard",
  },
  {
    id: "messaging",
    text: "Messaging",
    type: "group",
    children: [
      {
        id: "journeys",
        imgIcon: Journeys("black"),
        text: "Journey Builder",
        type: "menu",
        link: "/flow",
      },
      {
        id: "campaigns",
        imgIcon: Campaigns("black"),
        text: "Template Builder",
        type: "menu",
        link: "/all-templates",
      },

      // {
      //   id: "alltemplates",
      //   imgIcon: Analysis(),
      //   text: "Templates",
      //   type: "menu",
      //   link: "/all-templates",
      // },
    ],
  },
  {
    id: "audience",
    text: "Audience",
    type: "group",
    children: [
      {
        id: "segments",
        imgIcon: Segments("black"),
        text: "Segments",
        type: "menu",
        link: "/mysegment",
      },
      {
        id: "users",
        imgIcon: Users("black"),
        text: "People",
        type: "menu",
        link: "/people",
      },
    ],
  },
  {
    id: "data",
    text: "Data",
    type: "group",
    children: [
      {
        id: "integrations",
        imgIcon: Integrations("black"),
        text: "Integrations",
        type: "menu",
        link: "/settings/channel",
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
    id: "home",
    imgIcon: Settings("black"),
    text: "Settings",
    type: "menu",
    link: "/settings/profile",
  },
];
