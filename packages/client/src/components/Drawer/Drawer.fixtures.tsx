import {
  Home,
  Journeys,
  Campaigns,
  Segments,
  Users,
  Integrations,
  Analysis,
  Settings,
  Messaging,
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
    imgIcon: Messaging("black"),
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
        link: "/templates",
      },
    ],
  },
  {
    id: "audience",
    imgIcon: Users("black"),
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
    imgIcon: Integrations("black"),
    text: "Data",
    type: "group",
    children: [
      {
        id: "integrations",
        imgIcon: Integrations("black"),
        text: "Integrations",
        type: "menu",
        link: "/settings/integrations",
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
    imgIcon: Settings("black"),
    text: "Settings",
    type: "menu",
    link: "/settings/profile",
  },
];
