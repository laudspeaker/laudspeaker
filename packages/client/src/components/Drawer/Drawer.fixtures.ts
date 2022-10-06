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
  { id: "home", imgIcon: Home(), text: "Home" },
  { id: "journeys", imgIcon: Journeys(), text: "Journeys" },
  { id: "campaigns", imgIcon: Campaigns(), text: "Campaigns" },
  { id: "alltemplates", imgIcon: Campaigns(), text: "Templates" },
  { id: "segments", imgIcon: Segments(), text: "Segments" },
  { id: "users", imgIcon: Users(), text: "Users" },
  { id: "integrations", imgIcon: Integrations(), text: "Integrations" },
  { id: "settings", imgIcon: Settings(), text: "Settings" },
  //{ id: "analysis", imgIcon: Analysis(), text: "Analysis" },
];

export const dataSubArray = [
  {
    id: "home",
    imgIcon: Home(),
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
        imgIcon: Journeys(),
        text: "Journey Builder",
        type: "menu",
        link: "/flow",
      },
      {
        id: "campaigns",
        imgIcon: Campaigns(),
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
        imgIcon: Segments(),
        text: "Segments",
        type: "menu",
        link: "/mysegment",
      },
      {
        id: "users",
        imgIcon: Users(),
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
        imgIcon: Integrations(),
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
    imgIcon: Settings(),
    text: "Settings",
    type: "menu",
    link: "/settings/profile",
  },
];
