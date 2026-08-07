import TagsInput from "react-tagsinput";
import CloseIcon from "@heroicons/react/20/solid/XMarkIcon";
import "./EventListComponent.css";
import { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";

import {
  TagComponentBase,
  TagComponentBaseCommonProps,
} from "../common/TagComponentBase";

export default function EventListComponent(props: TagComponentBaseCommonProps) {
  return TagComponentBase({
    ...props,
    inputPlaceholder: "Add events to track",
    noMatchingMessage: "Press enter to add event",
    serverListEmptyMessage: "Press enter to add event",
  });
}
