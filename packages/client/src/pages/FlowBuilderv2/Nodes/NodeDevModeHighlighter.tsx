import { useEffect, useRef, useState } from "react";
import { useMouse } from "react-use";
import { getIncomers, Node } from "reactflow";
import { useAppSelector } from "store/hooks";
import { NodeType } from "../FlowEditor";
import { NodeData } from "./NodeData";

interface NodeDevModeHighlighterProps {
  id: string;
}

const NodeDevModeHighlighter = ({ id }: NodeDevModeHighlighterProps) => {
  const {
    devModeState: {
      customerInNode,
      enabled,
      availableNodeToJump,
      arrowPreSelectNode,
    },
    nodes,
    edges,
  } = useAppSelector((store) => store.flowBuilder);
  const [isHovered, setIsHovered] = useState(false);
  const [isCustomerInNode, setIsCustomerInNode] = useState(false);
  const [currentSelectedNode, setCurrentSelectedNode] = useState<
    Node<NodeData> | undefined
  >(undefined);
  const [isFromMultipleBranches, setIsFromMultipleBranches] = useState(false);
  const [isAvailableForJump, setIsAvailableForJump] = useState(false);
  const [isArrowPreSelected, setIsArrowPreSelected] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const mouse = useMouse(ref);

  useEffect(() => {
    if (!ref?.current || !enabled) return;
    const rect = ref.current?.getBoundingClientRect();
    if (
      mouse.docX >= rect.x &&
      mouse.docY >= rect.y &&
      mouse.docX <= rect.x + rect.width &&
      mouse.docY <= rect.y + rect.height
    ) {
      setIsHovered(true);
    } else {
      setIsHovered(false);
    }
  }, [mouse]);

  useEffect(() => {
    if (!enabled) return;

    setIsCustomerInNode(customerInNode === id);
    if (availableNodeToJump) {
      setIsAvailableForJump(availableNodeToJump.includes(id));
    }
    const node = nodes.find((el) => el.id === id);
    if (node) {
      setIsFromMultipleBranches(
        !!getIncomers(node, nodes, edges).find(
          // @ts-ignore
          (el) => el.data?.branches?.length > 1
        )
      );
    }
  }, [customerInNode]);

  useEffect(() => {
    if (!enabled) return;

    setIsArrowPreSelected(id === arrowPreSelectNode);
    const node = nodes.find((el) => el.id === id);
    setCurrentSelectedNode(node);
  }, [arrowPreSelectNode]);

  if (!enabled) return <></>;

  return (
    <div
      ref={ref}
      className={`absolute w-full h-full bottom-[-10px] left-[-10px] transition-all rounded box-content z-[-5] p-[10px] border-[1px]
      ${
        isCustomerInNode
          ? "pt-[28px] bg-[#F0FDF4] border-[#22C55E]"
          : (isHovered || isArrowPreSelected) && isAvailableForJump
          ? "opacity-1 bg-[#F0FDF4] border-[#86EFAC]"
          : "opacity-0"
      } ${
        isFromMultipleBranches &&
        !isCustomerInNode &&
        `pt-[60px] bg-opacity-30 ${
          (currentSelectedNode?.type === NodeType.JUMP_TO ||
            currentSelectedNode?.type === NodeType.EXIT) &&
          "px-[66px] !left-[-68px]"
        }`
      }`}
    >
      {isCustomerInNode && (
        <div className="absolute w-[9px] h-[9px] rounded-full top-[10px] left-[10px] bg-[#22C55E]" />
      )}
    </div>
  );
};

export { NodeDevModeHighlighter };
