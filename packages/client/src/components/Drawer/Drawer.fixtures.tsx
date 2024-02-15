import homeIcon from "./DrawerIcons/home.svg";
import messagingIcon from "./DrawerIcons/messaging.svg";
import journeyBuilderIcon from "./DrawerIcons/journeyBuilder.svg";
import templateBuilderIcon from "./DrawerIcons/templateBuilder.svg";
import audienceIcon from "./DrawerIcons/audience.svg";
import dataIcon from "./DrawerIcons/data.svg";
import settingsIcon from "./DrawerIcons/settings.svg";
import { NavigationItem } from "./Drawer";
import billingPlanIcon from "./DrawerIcons/billing-plan.svg";
import organizationIcon from "./DrawerIcons/organization.svg";
import manageWorkspaceIcon from "./DrawerIcons/manage-workspace.svg";

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
    text: "Journeys",
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
        text: "Message templates",
        type: "menu",
        link: "/templates",
      },
      {
        id: "tracker-template",
        imgIcon: templateBuilderIcon,
        text: "Component templates",
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
    id: "data",
    imgIcon: audienceIcon,
    text: "Data",
    type: "group",
    children: [
      {
        id: "data-transfer",
        imgIcon: audienceIcon,
        text: "Data transfer",
        type: "menu",
        link: "/data-transfer",
      },
    ],
  },
  // Removed for version 1 release
  // {
  //   id: "integrations",
  //   imgIcon: dataIcon,
  //   text: "Data",
  //   type: "group",
  //   children: [
  //     {
  //       id: "integrations",
  //       imgIcon: dataIcon,
  //       text: "Database import",
  //       type: "menu",
  //       link: "/integrations",
  //     },
  //     // {
  //     //   id: "analysis",
  //     //   imgIcon: Analysis(),
  //     //   text: "Analysis",
  //     //   type: "menu",
  //     //   link: "/analysis",
  //     // },
  //   ],
  // },
  {
    id: "settings",
    imgIcon: settingsIcon,
    text: "Settings",
    type: "menu",
    link: "/settings",
  },
];

export const workspaceDrawerItems: NavigationItem[] = [
  {
    id: "workspace-account",
    imgIcon: settingsIcon,
    text: "Account",
    type: "menu",
    link: "/settings/workspace/account",
  },
  // {
  //   id: "billing-plan",
  //   imgIcon: billingPlanIcon,
  //   text: "Billing and plan",
  //   type: "menu",
  //   link: "/settings/workspace/billing-plan",
  // },
  {
    id: "organization",
    imgIcon: organizationIcon,
    text: "Organization",
    type: "menu",
    link: "/settings/workspace/organization",
  },
  {
    id: "manage-workspace",
    imgIcon: manageWorkspaceIcon,
    text: "Manage workspace",
    type: "menu",
    link: "/settings/workspace/manage",
  },
];
