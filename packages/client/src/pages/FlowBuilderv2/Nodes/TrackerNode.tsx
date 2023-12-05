import React, { FC, Fragment, useEffect, useRef, useState } from "react";
import {
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
  getIncomers,
  useViewport,
} from "reactflow";
import { useAppSelector } from "store/hooks";
import {
  CustomModalIcon,
  TrackerVisibilityHideIcon,
  TrackerVisibilityShowIcon,
} from "../Icons";
import {
  JumpToNodeData,
  NodeData,
  Stats,
  TrackerNodeData,
  TrackerVisibility,
} from "./NodeData";
import { NodeType } from "../FlowEditor";
import { Transition } from "@headlessui/react";
import { createPortal } from "react-dom";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

interface ChangesObject {
  field: string;
  value: string;
}

const compatNumberFormatter = Intl.NumberFormat("en", { notation: "compact" });

export const trackerStatsToShow: {
  key: keyof Stats;
  name: string;
  renderLabel: (value: number) => string;
}[] = [
  {
    key: "delivered",
    name: "Shown",
    renderLabel: (value) => compatNumberFormatter.format(value),
  },
];

export const findFirstTrackerAbove = (
  node: Node,
  data: TrackerNodeData,
  nodes: Node<NodeData>[],
  edges: Edge[]
): Node<TrackerNodeData> | undefined => {
  const parents = getIncomers(node, nodes, edges);
  for (const parent of parents) {
    if (
      parent.type === NodeType.TRACKER &&
      parent.data.type === NodeType.TRACKER &&
      parent.data.tracker?.trackerId &&
      parent.data.tracker.trackerId === data.tracker?.trackerId
    ) {
      return parent as Node<TrackerNodeData>;
    }

    return findFirstTrackerAbove(parent, data, nodes, edges);
  }

  return undefined;
};

export const TrackerNode: FC<NodeProps<TrackerNodeData>> = ({
  isConnectable,
  data: { stats, needsCheck, tracker, showErrors, disabled },
  selected,
  id,
}) => {
  const { nodes, edges, isViewMode } = useAppSelector(
    (state) => state.flowBuilder
  );
  const [isPopperShowing, setIsPopperShowing] = useState(false);

  const [changes, setChanges] = useState<ChangesObject[]>([]);
  const [firstTrackerNodeAbove, setFirstTrackerNodeAbove] =
    useState<Node<TrackerNodeData>>();

  const thisNode = nodes.find((node) => node.id === id);

  const elementRef = useRef<HTMLDivElement>(null);

  const { zoom } = useViewport();

  useEffect(() => {
    setFirstTrackerNodeAbove(
      thisNode
        ? findFirstTrackerAbove(
            thisNode as Node<TrackerNodeData>,
            thisNode.data as TrackerNodeData,
            nodes,
            edges
          )
        : undefined
    );
  }, [thisNode, nodes, edges]);

  useEffect(() => {
    if (!tracker?.fields || !firstTrackerNodeAbove) return;

    const newChanges: ChangesObject[] = [];

    for (const field1 of tracker.fields) {
      const field2 = firstTrackerNodeAbove.data.tracker?.fields.find(
        (f) => f.name === field1.name
      );

      if (field1.value !== field2?.value) {
        newChanges.push({
          field: field2?.name || "",
          value: field2?.value || "",
        });
      }
    }

    setChanges(newChanges);
  }, [tracker?.fields, firstTrackerNodeAbove]);

  return (
    <div
      ref={elementRef}
      className={`${isViewMode ? "w-[300px]" : "w-[260px]"} ${
        isViewMode && stats ? "h-[140px]" : "h-[80px]"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""} rounded bg-white ${
        selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"
      } relative`}
      onDragOver={(e) => {
        e.stopPropagation();
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[-1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <div
        className="p-[16px] flex flex-col gap-[2px]"
        onDragOver={(e) => {
          e.stopPropagation();
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          console.log(e.dataTransfer.getData("jumpTo"));
        }}
      >
        <div className="flex gap-[6px]">
          <div className="text-[#6366F1]">
            <CustomModalIcon />
          </div>
          <div
            className={`font-inter font-semibold text-[16px] leading-[24px] flex justify-between items-center w-full`}
          >
            <div className="whitespace-nowrap">Component</div>
            {tracker && (
              <div
                className="flex items-center gap-[6px]"
                onMouseEnter={() => setIsPopperShowing(true)}
                onMouseLeave={() => setIsPopperShowing(false)}
              >
                {Boolean(changes.length) && elementRef?.current && (
                  <>
                    <div className="px-1 py-[2px] rounded-sm bg-[#FEF9C3] text-[#A16207] font-inter font-normal leading-normal text-[10px] h-[18px]">
                      {compatNumberFormatter.format(changes.length)} changes
                    </div>
                    {createPortal(
                      <Transition
                        as={Fragment}
                        show={isPopperShowing}
                        enter="transition ease-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in duration-150"
                        leaveFrom="opacity-100 translate-y-0"
                        leaveTo="opacity-0 translate-y-1"
                      >
                        <div
                          style={{
                            top: elementRef.current.getBoundingClientRect().top,
                            left:
                              elementRef.current.getBoundingClientRect().left +
                              4,
                            transformOrigin: "0 0",
                            transform: `scale(${zoom}) translateX(100%)`,
                          }}
                          className={`fixed px-[10px] py-[12px] w-[260px] bg-white z-[999999999] rounded flex flex-col gap-[10px]`}
                        >
                          <span className="font-[Inter] text-[14px] leading-[22px] font-semibold">
                            Changed Fields:{" "}
                            {compatNumberFormatter.format(changes.length)}
                          </span>
                          {changes.map((el, i) => (
                            <div
                              key={i}
                              className="flex flex-col p-[10px] gap-[5px] rounded bg-[#F3F4F6] w-full"
                            >
                              <span className="font-[Inter] text-[14px] leading-[22px] font-semibold text-[#18181B]">
                                {el.field}
                              </span>
                              <span className="font-[Inter] text-[12px] leading-5 text-[#18181B]">
                                {el.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </Transition>,
                      document.body
                    )}
                  </>
                )}
                <div>
                  {tracker?.visibility === TrackerVisibility.SHOW ? (
                    <TrackerVisibilityShowIcon />
                  ) : (
                    <TrackerVisibilityHideIcon />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="font-inter font-normal text-[14px] leading-[22px] whitespace-nowrap text-ellipsis max-w-full overflow-hidden">
          {needsCheck ? (
            <div className="text-[#F43F5E]">Template changed, please check</div>
          ) : tracker ? (
            <div className="w-fit px-[5px] bg-[#E0E7FF] text-[#4338CA] rounded">
              {tracker.trackerId}
            </div>
          ) : (
            <span className={showErrors ? "text-[#F43F5E]" : ""}>
              Set a tracker
            </span>
          )}
        </div>
      </div>
      {isViewMode && stats && (
        <div className="px-[16px] py-[6px] flex justify-between gap-[10px] border-t-[1px] border-[#E5E7EB]">
          {trackerStatsToShow.map((stat, i) => (
            <div
              key={i}
              className={`h-[46px] w-full flex flex-col gap-[4px] ${
                i !== (trackerStatsToShow?.length || 1) - 1
                  ? "border-r-[1px] border-[#E5E7EB]"
                  : ""
              }`}
            >
              <div className="text-[12px] leading-5 text-[#4B5563]">
                {stat.name}
              </div>
              <div className="font-semibold text-[14px] leading-[22px]">
                {stat.renderLabel(stats?.[stat.key] || 0)}
              </div>
            </div>
          ))}
        </div>
      )}

      <Handle
        position={Position.Bottom}
        type="source"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !bottom-[1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <NodeDevModeHighlighter id={id} />
    </div>
  );
};
