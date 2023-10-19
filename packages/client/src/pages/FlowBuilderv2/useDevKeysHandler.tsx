import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import useKeyboardJs from "react-use/lib/useKeyboardJs";
import { applyNodeChanges, getIncomers, getOutgoers, Node } from "reactflow";
import {
  ConnectionStatus,
  handleDevModeState,
  setNodes,
} from "reducers/flow-builder.reducer";
import { useAppSelector } from "store/hooks";
import { NodeType } from "./FlowEditor";
import { JumpToNodeData, NodeData, WaitUntilNodeData } from "./Nodes/NodeData";
import { getOutgoersCustom } from "./search.helper";
import { useDevSocket } from "./useDevSocketConnection";

const useDevKeysHandler = () => {
  const { nodes, edges, devModeState } = useAppSelector(
    (state) => state.flowBuilder
  );
  const dispatch = useDispatch();
  const socket = useDevSocket();
  const [currentNode, setCurrentNode] = useState<Node<NodeData> | undefined>(
    undefined
  );
  const [outNodes, setOutNodes] = useState<Node<NodeData>[]>([]);
  const [inNodes, setInNodes] = useState<Node<NodeData>[]>([]);
  const [isKeysBlocked, setIsKeysBlocked] = useState(false);
  const isUpKeyPressed = useKeyboardJs("up");
  const isDownKeyPressed = useKeyboardJs("down");
  const isLeftKeyPressed = useKeyboardJs("left");
  const isRightKeyPressed = useKeyboardJs("right");
  const isEnterKeyPressed = useKeyboardJs("enter");

  const handleKeysClickHandler = () => {
    if (isUpKeyPressed[0]) {
      if (inNodes[0] && !devModeState.arrowPreSelectNode) {
        socket?.emit("moveToNode", inNodes[0].id);
      } else if (inNodes[0] && devModeState.arrowPreSelectNode)
        dispatch(
          handleDevModeState({
            arrowPreSelectNode: undefined,
          })
        );
    } else if (isDownKeyPressed[0]) {
      if (outNodes.length === 1) {
        socket?.emit("moveToNode", outNodes[0].id);
      } else if (outNodes.length > 1) {
        if (devModeState.arrowPreSelectNode) {
          socket?.emit("moveToNode", devModeState.arrowPreSelectNode);
        } else {
          dispatch(
            handleDevModeState({
              arrowPreSelectNode: outNodes[0].id,
            })
          );
        }
      }
    } else if (
      (isLeftKeyPressed[0] || isRightKeyPressed[0]) &&
      devModeState.arrowPreSelectNode
    ) {
      const nodeIndex = outNodes.findIndex(
        (el) => el.id === devModeState.arrowPreSelectNode
      );

      if (isLeftKeyPressed[0] && nodeIndex !== -1 && nodeIndex - 1 >= 0) {
        dispatch(
          handleDevModeState({
            arrowPreSelectNode: outNodes[nodeIndex - 1].id,
          })
        );
      } else if (
        isRightKeyPressed[0] &&
        nodeIndex !== -1 &&
        outNodes.length > nodeIndex + 1
      ) {
        dispatch(
          handleDevModeState({
            arrowPreSelectNode: outNodes[nodeIndex + 1].id,
          })
        );
      }
    } else if (
      isEnterKeyPressed[0] &&
      currentNode &&
      currentNode.type !== NodeType.START &&
      currentNode.type !== NodeType.EMPTY
    ) {
      dispatch(
        setNodes(
          applyNodeChanges(
            [
              {
                id: currentNode.id,
                selected: true,
                type: "select",
              },
            ],
            nodes
          )
        )
      );
    }
  };

  useEffect(() => {
    if (
      devModeState.status !== ConnectionStatus.Connected ||
      !devModeState.customerInNode ||
      isKeysBlocked ||
      !socket
    )
      return;

    handleKeysClickHandler();
  }, [
    isUpKeyPressed,
    isDownKeyPressed,
    isLeftKeyPressed,
    isRightKeyPressed,
    isEnterKeyPressed,
  ]);

  useEffect(() => {
    setIsKeysBlocked(nodes.some((el) => el.selected === true));
  }, [nodes]);

  useEffect(() => {
    const node = nodes.find((el) => el.id === devModeState.customerInNode);
    if (!node) return;

    setCurrentNode(node);

    const start = nodes.find((el) => el.type === NodeType.START);

    setOutNodes([
      ...getOutgoersCustom(node, nodes, edges).filter(
        (el) => el.type !== NodeType.EMPTY
      ),
      ...(node.type === NodeType.EXIT && start ? [start] : []),
    ]);
    setInNodes(
      getIncomers(node, nodes, edges).filter((el) => el.type !== NodeType.EMPTY)
    );
  }, [devModeState.customerInNode, edges, nodes]);

  return;
};

export default useDevKeysHandler;
