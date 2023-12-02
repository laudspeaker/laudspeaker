import { useEffect, useRef, useState } from "react";
import { useMouse } from "react-use";
import { getIncomers, Node } from "reactflow";
import { ConnectionStatus } from "reducers/flow-builder.reducer";
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
      status,
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
    if (!ref?.current || status !== ConnectionStatus.Connected) return;
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
    if (status !== ConnectionStatus.Connected) return;

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
    if (status !== ConnectionStatus.Connected) return;

    setIsArrowPreSelected(id === arrowPreSelectNode);
    const node = nodes.find((el) => el.id === id);
    setCurrentSelectedNode(node);
  }, [arrowPreSelectNode]);

  if (status !== ConnectionStatus.Connected) return <></>;

  return (
    <div
      ref={ref}
      className={`absolute pt-[28px] w-full h-full bottom-[-10px] left-[-10px] transition-all rounded box-content z-[-5] p-[10px] border
      ${
        isCustomerInNode
          ? "bg-[#F0FDF4] border-[#22C55E]"
          : (isHovered || isArrowPreSelected) && isAvailableForJump
          ? "opacity-1 bg-transparent border-[#22C55E] border-dashed"
          : "opacity-0"
      }
      ${
        isArrowPreSelected &&
        isAvailableForJump &&
        "shadow-[0px_0px_0px_4px_rgba(42,208,98,0.25)]"
      }
      ${
        isFromMultipleBranches &&
        !isCustomerInNode &&
        `pt-[60px] bg-opacity-30 ${
          (currentSelectedNode?.type === NodeType.JUMP_TO ||
            currentSelectedNode?.type === NodeType.EXIT) &&
          "px-[66px] !left-[-68px]"
        }`
      }`}
    >
      <div
        className={`absolute border w-[9px] h-[9px] rounded-full top-[10px] left-[10px] transition-all ${
          isCustomerInNode ? "bg-[#22C55E]" : "border-[#22C55E]"
        }`}
      />
    </div>
  );
};

export { NodeDevModeHighlighter };
