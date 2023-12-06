import React, { FC, useEffect } from "react";
import { Handle, NodeProps, Position } from "reactflow";
import { changeNodeData } from "reducers/flow-builder.reducer";
import { useAppDispatch } from "store/hooks";
import JumpToLine from "../Edges/components/JumpToLine";
import { NodeType } from "../FlowEditor";
import { JumpToNodeData } from "./NodeData";
import { NodeDevModeHighlighter } from "./NodeDevModeHighlighter";

export const JumpToNode: FC<NodeProps<JumpToNodeData>> = ({
  isConnectable,
  selected,
  data,
  id,
}) => {
  const dispatch = useAppDispatch();

  const setTargetId = (targetId?: string) => {
    if (targetId === data.targetId) return;

    dispatch(
      changeNodeData({
        id,
        data: { ...data, type: NodeType.JUMP_TO, targetId },
      })
    );
  };

  useEffect(() => {
    if (!data.targetId)
      dispatch(
        changeNodeData({
          id,
          data: { ...data, type: NodeType.JUMP_TO, targetId: undefined },
        })
      );
  }, [data.targetId]);

  return (
    <div
      className={`relative w-[120px] h-[60px] rounded bg-white ${
        data.disabled ? "opacity-50 cursor-not-allowed" : ""
      } ${selected ? "border-2 border-[#6366F1]" : "border border-[#E5E7EB]"}`}
    >
      <Handle
        position={Position.Top}
        type="target"
        isConnectable={isConnectable}
        className="!min-h-[1px] !h-[1px] !top-[-1px] !opacity-0 !border-0 !pointer-events-none !cursor-default"
      />
      <div className="relative px-[15px] py-[18px] flex flex-col gap-[2px]">
        <div className="flex gap-[5px] items-center">
          <div>
            <svg
              width="18"
              height="19"
              viewBox="0 0 18 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g clipPath="url(#clip0_3175_78276)">
                <path
                  d="M6.5264 6.32715L6.5264 16.651C6.5264 16.8278 6.67105 16.9725 6.84783 16.9725H10.263V18.3546C10.263 18.4751 10.4036 18.5434 10.4981 18.4691L13.0614 16.4441C13.0788 16.4307 13.0928 16.4135 13.1025 16.3938C13.1122 16.3742 13.1172 16.3525 13.1172 16.3306C13.1172 16.3087 13.1122 16.2871 13.1025 16.2674C13.0928 16.2477 13.0788 16.2305 13.0614 16.2171L10.5001 14.1921C10.4056 14.1178 10.265 14.1841 10.265 14.3066V15.6867H7.97484L7.97484 6.32715C8.86279 6.02581 9.50163 5.18407 9.50163 4.19567C9.50163 2.95415 8.49314 1.94567 7.25163 1.94567C6.01011 1.94567 5.00163 2.95415 5.00163 4.19567C4.99962 5.18407 5.63846 6.0238 6.5264 6.32715ZM7.24962 3.23139C7.50195 3.23654 7.74222 3.3404 7.91885 3.52067C8.09549 3.70095 8.19442 3.94328 8.19442 4.19567C8.19442 4.44806 8.09549 4.6904 7.91885 4.87067C7.74222 5.05095 7.50195 5.15481 7.24962 5.15996C6.99728 5.15481 6.75702 5.05095 6.58038 4.87067C6.40375 4.6904 6.30482 4.44806 6.30482 4.19567C6.30482 3.94328 6.40375 3.70095 6.58038 3.52067C6.75702 3.3404 6.99728 3.23654 7.24962 3.23139Z"
                  fill="#6366F1"
                />
              </g>
              <defs>
                <clipPath id="clip0_3175_78276">
                  <rect
                    width="18"
                    height="18"
                    fill="white"
                    transform="translate(0 0.5)"
                  />
                </clipPath>
              </defs>
            </svg>
          </div>
          <div className={`font-inter font-semibold text-base`}>Jump to</div>
        </div>

        <JumpToLine
          jumpToNodeId={id}
          targetId={data.targetId}
          setTargetId={setTargetId}
        />
        <NodeDevModeHighlighter id={id} />
      </div>
    </div>
  );
};
