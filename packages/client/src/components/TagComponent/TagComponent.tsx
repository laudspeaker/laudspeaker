import TagsInput from "react-tagsinput";
import CloseIcon from "@heroicons/react/20/solid/XMarkIcon";
import "./TagComponent.css";
import { useEffect, useRef, useState } from "react";
import { useClickAway } from "react-use";

import {
  TagComponentBase,
  TagComponentBaseCommonProps,
} from "../common/TagComponentBase";

export default function TagComponent(props: TagComponentBaseCommonProps) {
  return TagComponentBase({
    ...props,
    inputPlaceholder: "Please select or enter keywords to create a new tag",
    noMatchingMessage: "No matching tags",
    serverListEmptyMessage: "No tags, enter to create a new tag",
  });
}
