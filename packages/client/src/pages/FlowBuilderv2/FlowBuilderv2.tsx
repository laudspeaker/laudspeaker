export default {};

// import { CheckIcon, PlusCircleIcon } from "@heroicons/react/24/outline";
// import { Grid } from "@mui/material";
// import { SmartStepEdge } from "@tisoap/react-flow-smart-edge";
// import { GenericButton, Select } from "components/Elements";
// import Modal from "components/Elements/Modal";
// import SideModal from "components/Elements/SideModal";
// import ToggleSwitch from "components/Elements/ToggleSwitch";
// import Tooltip from "components/Elements/Tooltip";
// import Header from "components/Header";
// import SideDrawer from "components/SideDrawer";
// import { ApiConfig } from "../../constants";
// import CancelDropZone from "pages/FlowBuilder/CancelDropZone";
// import { getFlow } from "pages/FlowBuilder/FlowHelpers";
// import React, {
//   DragEvent,
//   MouseEvent,
//   useCallback,
//   useEffect,
//   useLayoutEffect,
//   useMemo,
//   useRef,
//   useState,
// } from "react";
// import { Helmet } from "react-helmet";
// import { useParams } from "react-router-dom";
// import { useNavigate } from "react-router-dom";
// import ReactFlow, {
//   addEdge,
//   applyEdgeChanges,
//   applyNodeChanges,
//   Connection,
//   ConnectionLineType,
//   Edge,
//   EdgeChange,
//   MarkerType,
//   Node,
//   NodeChange,
//   ReactFlowProvider,
//   useReactFlow,
//   useViewport,
// } from "reactflow";
// import {
//   attachTrigger,
//   deleteSelectedTrigger,
//   NodeData,
//   selectNode,
//   selectTrigger,
//   setEdges,
//   setFilterId,
//   setIsMessagesDragging,
//   setIsTriggerDragging,
//   setNodes,
//   setTriggers,
//   updateSelectedTrigger,
// } from "reducers/flow-builder.reducer";
// import ApiService from "services/api.service";
// import { useAppDispatch, useAppSelector } from "store/hooks";
// import Template, { TemplateType } from "types/Template";
// import {
//   MessagesTypes,
//   ProviderTypes,
//   Trigger,
//   TriggerType,
//   Workflow,
// } from "types/Workflow";
// import { v4 as uuid } from "uuid";
// import { toast } from "react-toastify";
// import InfoIcon from "assets/images/info.svg";
// import ExitIcon from "../../assets/images/ExitIcon.svg";
// import TriggerDrag from "../../assets/images/TriggerDrag.svg";
// import { AxiosError } from "axios";
// import NameSegment, { INameSegmentForm } from "pages/Segment/NameSegment";
// import TextUpdaterNode from "pages/FlowBuilder/TextUpdater";
// import * as _ from "lodash";
// import Progress from "components/Progress";
// import FilterModal from "pages/FlowBuilder/FilterModal";
// import TriggerModal from "pages/FlowBuilder/TriggerModal";
// import ChooseTemplateModal from "pages/FlowBuilder/ChooseTemplateModal";
// import { useDebounce } from "react-use";

// const triggerDragImage = new Image();
// triggerDragImage.src = TriggerDrag;

// const segmentTypeStyle =
//   "border-[1px] border-[#D1D5DB] rouded-[6px] shadow-[0px_1px_2px_rgba(0,0,0,0.05)] w-full mt-[20px] p-[15px]";

// const Flowv2 = () => {
//   const navigate = useNavigate();

//   const { id } = useParams();
//   const [flowId, setFlowId] = useState<string>("");
//   const [flowName, setFlowName] = useState("");

//   const {
//     nodes,
//     edges,
//     triggers,
//     selectedTriggerId,
//     selectedNodeId,
//     filterId,
//     isMessagesDragging,
//     isTriggerDragging,
//   } = useAppSelector((state) => state.flowBuilder);
//   const dispatch = useAppDispatch();

//   const [templateModalOpen, setTemplateModalOpen] = useState<boolean>(false);
//   const [audienceModalOpen, setAudienceModalOpen] = useState<boolean>(false);
//   const [triggerModalOpen, settriggerModalOpen] = useState<boolean>(false);
//   const [selectedMessageType, setSelectedMessageType] = useState(""); // in redux
//   const [tutorialOpen, setTutorialOpen] = useState(false);
//   const [isDynamic, setIsDynamic] = useState(true);
//   const [segmentModalOpen, setSegmentModalOpen] = useState(false);
//   const [isFlowLoading, setIsFlowLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isConnecting, setIsConnecting] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [stepsCompletion, setStepsCompletion] = useState([false, false, false]);
//   const [triggerToOpenNextRender, setTriggerToOpenNextRender] =
//     useState<TriggerType>();
//   const [journeyTypeModalOpen, setJourneyTypeModalOpen] = useState(false);
//   const [needsUpdate, setNeedsUpdate] = useState(false);
//   const [moveEvent, setMoveEvent] = useState<MouseEvent<HTMLDivElement>>();

//   const reactFlowRef = useRef<HTMLDivElement>(null);

//   const nodeTypes = useMemo(() => ({ special: TextUpdaterNode }), []);
//   const { setViewport } = useReactFlow();
//   const { x: viewX, y: viewY, zoom } = useViewport();
//   const [zoomState, setZoomState] = useState(1);
//   const possibleViewZoomValues = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

//   useDebounce(
//     () => {
//       dispatch(
//         setNodes(
//           nodes.map((node) => {
//             const { height, width, position } = node;
//             if (!height || !width || !moveEvent || !reactFlowRef.current)
//               return node;

//             const maskLeftTopCornerX = position.x - 60;
//             const maskLeftTopCornerY = position.y - 60;

//             const maskRightBottomCornerX = position.x + width + 60;
//             const maskRightBottomCornerY = position.y + height + 60;

//             const boudingClientRect =
//               reactFlowRef.current.getBoundingClientRect();

//             const canvasMouseX =
//               moveEvent.clientX - viewX - boudingClientRect.left;
//             const canvasMouseY =
//               moveEvent.clientY - viewY - boudingClientRect.top;

//             const isNearToCursor =
//               canvasMouseX > maskLeftTopCornerX * zoom &&
//               canvasMouseX < maskRightBottomCornerX * zoom &&
//               canvasMouseY > maskLeftTopCornerY * zoom &&
//               canvasMouseY < maskRightBottomCornerY * zoom;

//             return { ...node, data: { ...node.data, isNearToCursor } };
//           })
//         )
//       );
//     },
//     10,
//     [moveEvent]
//   );

//   useEffect(() => {
//     if (selectedTriggerId) settriggerModalOpen(true);
//   }, [selectedTriggerId]);

//   const populateFlowBuilder = async () => {
//     try {
//       const { data }: { data: Workflow } = await getFlow(id);
//       if (data.isActive) {
//         return navigate(`/flow/${data.id}/view`);
//       }
//       setIsDynamic(data.isDynamic ?? true);

//       dispatch(setFilterId(data.filter?.id));
//       setFlowId(data.id);
//       setFlowName(data.name);
//       if (data.visualLayout) {
//         const updatedNodes = data.visualLayout.nodes.map((item) => {
//           return {
//             ...item,
//             data: {
//               ...item.data,
//               flowId,
//             },
//           };
//         });
//         dispatch(setNodes(updatedNodes));
//         dispatch(setEdges(data.visualLayout.edges));
//         setCurrentStep(
//           !!filterId &&
//             updatedNodes.length > 0 &&
//             updatedNodes.some((node) => node.data.messages.length > 0)
//             ? 2
//             : updatedNodes.length > 0 &&
//               updatedNodes.some((node) => node.data.messages.length > 0)
//             ? 1
//             : 0
//         );
//       }
//     } catch (e) {
//       toast.error("Error while loading workflow");
//     } finally {
//       setIsFlowLoading(false);
//     }
//   };

//   useLayoutEffect(() => {
//     populateFlowBuilder();
//   }, [flowId]);

//   const generateNode = (
//     node: Node<
//       | {
//           [key: string]: string | boolean;
//         }
//       | undefined
//     > & {
//       audienceId: string;
//       triggers: string[];
//       messages: { type: string; templateId: number }[];
//     }
//   ): Node<NodeData> => {
//     const {
//       position,
//       id: nodeId,
//       audienceId,
//       triggers: nodeTriggers,
//       messages,
//       data,
//     } = node;
//     return {
//       id: nodeId,
//       position,
//       type: "special",
//       data: {
//         primary: !nodes.some((item) => item.data.primary),
//         audienceId,
//         triggers: nodeTriggers,
//         messages,
//         ...data,
//       },
//     };
//   };

//   const performAction = (actionId: string, e?: DragEvent) => {
//     switch (actionId) {
//       case "audience": {
//         const mockId = uuid();
//         const position = { x: 0, y: 0 };

//         if (reactFlowRef.current && e) {
//           const boudingClientRect =
//             reactFlowRef.current.getBoundingClientRect();

//           position.x = e.clientX - viewX - boudingClientRect.left - 175;
//           position.y = e.clientY - viewY - boudingClientRect.top;
//           console.log(position);
//         }

//         const newNode = generateNode({
//           id: mockId,
//           triggers: [],
//           messages: [],
//           position: position,
//           audienceId: "-1",
//           data: {
//             primary: false,
//             mock: true,
//           },
//         });

//         dispatch(setNodes([...nodes, newNode]));
//         dispatch(selectNode(newNode.id));

//         setAudienceModalOpen(true);
//         break;
//       }
//       case "trueFalse": {
//         // const tempNodes = [];
//         // for (let i = 0; i < 2; i++) {
//         //   const nodeId = uuid();
//         //   const newNode = {
//         //     id: nodeId,
//         //     audienceId: "",
//         //     triggers: [],
//         //     messages: [],
//         //     position: {
//         //       x: (selectedNode?.position?.x || 0) - (i === 0 ? -100 : 100),
//         //       y: (selectedNode?.position?.y || 0) + 200,
//         //     },
//         //     data: {
//         //       isNew: true,
//         //       hidden: true,
//         //     },
//         //   };
//         //   tempNodes.push(generateNode(newNode, triggers));
//         // }
//         // dispatch(setNodes([...nodes, ...tempNodes]));
//         break;
//       }
//       case "exit": {
//         // const nodeId = uuid();
//         // const newNode = {
//         //   id: nodeId,
//         //   audienceId: "",
//         //   triggers: [],
//         //   messages: [],
//         //   position: {
//         //     x: (selectedNode?.position?.x || 0) + 100,
//         //     y: (selectedNode?.position?.y || 0) + 200,
//         //   },
//         //   data: {
//         //     isNew: true,
//         //     isExit: true,
//         //     preIcon: ExitIcon,
//         //     name: "Exit",
//         //     description: "",
//         //     width: "fit-content",
//         //   },
//         // };
//         // dispatch(setNodes([...nodes, generateNode(newNode, triggers)]));
//         break;
//       }
//       case TriggerType.TIME_DELAY:
//       case TriggerType.TIME_WINDOW:
//       case TriggerType.EVENT: {
//         dispatch(attachTrigger(actionId));
//         settriggerModalOpen(true);
//         break;
//       }
//       case TemplateType.EMAIL:
//       case "push":
//       case TemplateType.SMS:
//       case TemplateType.FIREBASE:
//       case TemplateType.SLACK:
//       case TemplateType.WEBHOOK:
//       case TemplateType.MODAL: {
//         if (!nodes.find((node) => node.id === selectedNodeId)) return;

//         setSelectedMessageType(actionId);
//         setTemplateModalOpen(true);
//         break;
//       }
//       default:
//         break;
//     }
//   };

//   useEffect(() => {
//     if (!triggerToOpenNextRender) return;

//     performAction(triggerToOpenNextRender);
//     setTriggerToOpenNextRender(undefined);
//   }, [triggerToOpenNextRender]);

//   useEffect(() => {
//     setStepsCompletion([
//       nodes.length > 0 && nodes.some((node) => node.data.messages.length > 0),
//       !!filterId,
//       nodes.length > 0 &&
//         nodes.some((node) => node.data.messages.length > 0) &&
//         !!filterId &&
//         currentStep === 2,
//     ]);
//   }, [nodes, filterId, currentStep]);

//   const stepsAvailability = [true, stepsCompletion[0], stepsCompletion[1]];

//   useEffect(() => {
//     switch (currentStep) {
//       case 0:
//         setSegmentModalOpen(false);
//         setJourneyTypeModalOpen(false);
//         break;
//       case 1:
//         setSegmentModalOpen(true);
//         setJourneyTypeModalOpen(false);
//         break;
//       case 2:
//         setSegmentModalOpen(false);
//         setJourneyTypeModalOpen(true);
//         break;
//       default:
//         break;
//     }
//   }, [currentStep]);

//   useEffect(() => {
//     dispatch(
//       setNodes(
//         nodes.map((node) => ({ ...node, data: { ...node.data, isConnecting } }))
//       )
//     );
//   }, [isConnecting]);

//   const onNodeDragStart = useCallback(
//     (event: React.MouseEvent, node: Node) => {
//       dispatch(selectNode(node.id));
//     },
//     [nodes, triggers]
//   );
//   const onEdgesChange = useCallback(
//     (changes: EdgeChange[]) =>
//       dispatch(setEdges(applyEdgeChanges(changes, edges))),
//     [setEdges, triggers]
//   );
//   const onConnect = useCallback(
//     (connection: Connection | Edge) => {
//       const edge: Edge | Connection = {
//         ...connection,
//         id: uuid(),
//         markerEnd: {
//           type: MarkerType.Arrow,
//           strokeWidth: 2,
//           height: 20,
//           width: 20,
//         },
//         type: "custom",
//       };
//       dispatch(setEdges(addEdge(edge, edges)));
//     },

//     [setEdges, triggers]
//   );

//   const onClickConnectionStart = useCallback(
//     (event: React.MouseEvent | React.TouchEvent, arg2: unknown) => {
//       console.log(event, arg2);
//     },
//     [triggers]
//   );

//   const onNodeClick = useCallback(
//     (event: React.MouseEvent, node: Node) => {
//       dispatch(selectNode(node.id));
//     },
//     [selectNode, triggers]
//   );

//   const onPaneClick = useCallback(() => {
//     dispatch(selectNode(undefined));
//   }, []);

//   const onNodesChange = useCallback(
//     (changes: NodeChange[]) =>
//       dispatch(setNodes(applyNodeChanges(changes, nodes))),
//     [setNodes, triggers, nodes]
//   );

//   const handleTutorialOpen = () => {
//     setTutorialOpen(true);
//   };

//   const onSaveTrigger = (data: Trigger) => {
//     settriggerModalOpen(false);

//     dispatch(updateSelectedTrigger(data));
//     dispatch(selectTrigger(""));
//   };

//   const forceRerenderSelectedNode = () => {
//     setNeedsUpdate(!needsUpdate);
//   };

//   const onDeleteTrigger = () => {
//     dispatch(deleteSelectedTrigger());

//     settriggerModalOpen(false);
//   };

//   const handleTemplateModalOpen = async (data?: {
//     activeTemplate?: number;
//     selectedMessageType: string;
//   }) => {
//     if (!data) return;
//     const { activeTemplate } = data;

//     if (!activeTemplate) {
//       setTemplateModalOpen(!templateModalOpen);
//       return;
//     }
//     const messages = nodes.find((node) => node.id === selectedNodeId)?.data
//       .messages;
//     const foundMessage =
//       !!messages &&
//       messages.find(
//         (message) =>
//           message.type === selectedMessageType &&
//           message.templateId === activeTemplate
//       );
//     if (!foundMessage) {
//       messages?.push({
//         type: selectedMessageType,
//         templateId: activeTemplate,
//       });
//       forceRerenderSelectedNode();
//     } else {
//       toast.warn("Can't connect same template twice to one node!", {
//         position: "bottom-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "light",
//       });
//     }

//     dispatch(setNodes([...nodes]));
//     setTemplateModalOpen(!templateModalOpen);
//   };

//   const onDragOver = useCallback((e: DragEvent) => {
//     e.preventDefault();
//     e.dataTransfer.dropEffect = "move";
//   }, []);

//   const onDrop = (e: DragEvent) => {
//     e.preventDefault();

//     dispatch(setIsTriggerDragging(false));
//     dispatch(setIsMessagesDragging(false));

//     const type = e.dataTransfer.getData("application/reactflow");

//     // check if the dropped element is valid
//     if (typeof type === "undefined" || !type) {
//       return;
//     }

//     switch (type) {
//       case "audience":
//         performAction(type, e);
//         break;
//       case TriggerType.EVENT:
//       case TriggerType.TIME_DELAY:
//       case TriggerType.TIME_WINDOW:
//         const newSelectedNodeWithTrigger = nodes.find((node) => {
//           const { height, width, position } = node;
//           if (!height || !width || !reactFlowRef.current) return node;

//           const maskLeftTopCornerX = position.x;
//           const maskLeftTopCornerY = position.y;

//           const maskRightBottomCornerX = position.x + width;
//           const maskRightBottomCornerY = position.y + height + 20;

//           const boudingClientRect =
//             reactFlowRef.current.getBoundingClientRect();

//           const canvasMouseX = e.clientX - viewX - boudingClientRect.left;
//           const canvasMouseY = e.clientY - viewY - boudingClientRect.top;

//           const isDroppedOver =
//             canvasMouseX > maskLeftTopCornerX * zoom &&
//             canvasMouseX < maskRightBottomCornerX * zoom &&
//             canvasMouseY > maskLeftTopCornerY * zoom &&
//             canvasMouseY < maskRightBottomCornerY * zoom;

//           return isDroppedOver;
//         });

//         if (!newSelectedNodeWithTrigger) return;

//         dispatch(selectNode(newSelectedNodeWithTrigger.id));
//         setTriggerToOpenNextRender(type);
//         break;
//       case TemplateType.EMAIL:
//       case "push":
//       case TemplateType.SMS:
//       case TemplateType.FIREBASE:
//       case TemplateType.SLACK:
//       case TemplateType.WEBHOOK:
//       case TemplateType.MODAL:
//         const newSelectedNodeWithMessage = nodes.find((node) => {
//           const { height, width, position } = node;
//           if (!height || !width || !reactFlowRef.current) return node;

//           const maskLeftTopCornerX = position.x;
//           const maskLeftTopCornerY = position.y;

//           const maskRightBottomCornerX = position.x + width;
//           const maskRightBottomCornerY = position.y + height;

//           const boudingClientRect =
//             reactFlowRef.current.getBoundingClientRect();

//           const canvasMouseX = e.clientX - viewX - boudingClientRect.left;
//           const canvasMouseY = e.clientY - viewY - boudingClientRect.top;

//           const isDroppedOver =
//             canvasMouseX > maskLeftTopCornerX * zoom &&
//             canvasMouseX < maskRightBottomCornerX * zoom &&
//             canvasMouseY > maskLeftTopCornerY * zoom &&
//             canvasMouseY < maskRightBottomCornerY * zoom;

//           return isDroppedOver;
//         });

//         if (!newSelectedNodeWithMessage) return;
//         dispatch(selectNode(newSelectedNodeWithMessage.id));
//         performAction(type);
//         break;
//       default:
//         break;
//     }
//   };

//   const handleSaveJourney = async () => {
//     setIsSaving(true);
//     try {
//       await ApiService.patch({
//         url: `${ApiConfig.flow}`,
//         options: {
//           name: flowName,
//           nodes,
//           edges,
//           triggers,
//           isDynamic,
//           filterId,
//           id: flowId,
//         },
//       });

//       setJourneyTypeModalOpen(false);
//       setSegmentModalOpen(false);
//     } catch (e) {
//       toast.error("Error while saving");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleStartJourney = async () => {
//     await handleSaveJourney();
//     setIsSaving(true);
//     try {
//       await ApiService.get({
//         url: `${ApiConfig.startFlow}/${flowId}`,
//       });
//       window.location.reload();
//     } catch (e) {
//       let message = "Unexpected error";
//       if (e instanceof AxiosError) {
//         message = e.response?.data.message;
//       }

//       toast.error(message, {
//         position: "bottom-center",
//         autoClose: 5000,
//         hideProgressBar: false,
//         closeOnClick: true,
//         pauseOnHover: true,
//         draggable: true,
//         progress: undefined,
//         theme: "colored",
//       });
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const handleAudienceSubmit = async (segment: INameSegmentForm) => {
//     setIsSaving(true);
//     try {
//       const { data } = await ApiService.post<{
//         id: string;
//         templates: Template[];
//       }>({
//         url: `${ApiConfig.createSegment}`,
//         options: {
//           ...segment,
//         },
//       });
//       setAudienceModalOpen(true);
//       const mockNode = nodes.find((n) => n.data.mock);
//       const newNode = {
//         id: uuid(),
//         triggers: [],
//         messages: data.templates.map((template) => ({
//           type: template.type,
//           templateId: template.id,
//         })),
//         position: mockNode?.position || { x: 0, y: 0 },
//         audienceId: data.id,
//         data: {},
//       };

//       if (!nodes.find((node) => node.data.primary))
//         setViewport({ x: 0, y: 0, zoom: zoomState });

//       const node = generateNode(newNode);

//       dispatch(setNodes([...nodes, node].filter((n) => !n.data.mock)));
//       setAudienceModalOpen(false);
//       dispatch(selectNode(node.id));

//       if (segment.triggerType) setTriggerToOpenNextRender(segment.triggerType);

//       if (segment.messageType) performAction(segment.messageType);
//     } catch (error) {
//       toast.error("Error, saving segment");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const [isGrabbing, setIsGrabbing] = useState(false);

//   const rfStyle = {
//     backgroundColor: "rgba(112,112,112, 0.06)",
//     cursor: isGrabbing ? "grabbing" : "grab",
//   };

//   const onToggleChange = async () => {
//     await ApiService.patch({
//       url: "/workflows/" + name,
//       options: {
//         id: flowId,
//         isDynamic: !isDynamic,
//         isActive: false,
//       },
//     });
//     setIsDynamic(!isDynamic);
//   };

//   const onDragStart = (e: DragEvent<HTMLDivElement>, itemId: string) => {
//     if (
//       itemId === TriggerType.EVENT ||
//       itemId === TriggerType.TIME_DELAY ||
//       itemId === TriggerType.TIME_WINDOW
//     ) {
//       setTimeout(() => {
//         dispatch(setIsTriggerDragging(true));
//       }, 0);
//       e.dataTransfer.setDragImage(
//         triggerDragImage,
//         triggerDragImage.width / 2,
//         triggerDragImage.height / 2
//       );
//     } else if (
//       (
//         [
//           MessagesTypes.SMS,
//           MessagesTypes.EMAIL,
//           MessagesTypes.SLACK,
//           MessagesTypes.PUSH,
//           MessagesTypes.FIREBASE,
//           MessagesTypes.WEBHOOK,
//           MessagesTypes.MODAL,
//         ] as string[]
//       ).includes(itemId)
//     ) {
//       setTimeout(() => {
//         dispatch(setIsMessagesDragging(true));
//       }, 0);
//     }

//     e.dataTransfer.setData("application/reactflow", itemId);
//     e.dataTransfer.effectAllowed = "move";
//   };

//   const onConnectEnd = () => {
//     setIsConnecting(false);
//     dispatch(
//       setNodes(
//         nodes.map((node) => ({
//           ...node,
//           data: { ...node.data, isNearToCursor: false },
//         }))
//       )
//     );
//   };

//   let startDisabledReason = "";

//   if (!nodes.some((node) => node.data.primary))
//     startDisabledReason = "Your journey is empty";
//   else if (!nodes.some((node) => node.data.messages.length > 0))
//     startDisabledReason =
//       "Add a message to a step to be able to start a journey";
//   else if (!filterId)
//     startDisabledReason = "You have to define filter for journey";

//   const steps = [
//     { label: "01", name: "Design journey" },
//     { label: "02", name: "Define filters or segments" },
//     { label: "03", name: "Review" },
//   ];

//   const handleNextStep = () => {
//     setCurrentStep(currentStep + 1);
//   };

//   if (isFlowLoading) return <Progress />;

//   return (
//     <div>
//       {(isMessagesDragging || isTriggerDragging) && (
//         <CancelDropZone
//           countRef={reactFlowRef}
//           onDrop={() => {
//             dispatch(setIsMessagesDragging(false));
//             dispatch(setIsTriggerDragging(false));
//           }}
//         />
//       )}
//       <div
//         className="h-[calc(100vh-64px)] flex w-full relative"
//         id="flow-builder"
//       >
//         <Helmet>
//           <script>
//             {`
//             (function (d, t) {
//               var BASE_URL = "https://app.chatwoot.com";
//               var g = d.createElement(t), s = d.getElementsByTagName(t)[0];
//               g.src = BASE_URL + "/packs/js/sdk.js";
//               g.defer = true;
//               g.async = true;
//               s.parentNode.insertBefore(g, s);
//               g.onload = function () {
//                 window.chatwootSDK.run({
//                   websiteToken: 'SzjbgmVdjTexxW1nEFLHHBGM',
//                   baseUrl: BASE_URL
//                 })
//               }
//             })(document, "script");`}
//           </script>
//         </Helmet>
//         <div className="max-h-[calc(100vh-64px)] h-full lg:overflow-y-auto overflow-y-scroll overflow-x-hidden">
//           <div className="flex flex-col">
//             <SideDrawer
//               onClick={(action) => {
//                 if (action === "audience") performAction(action);
//               }}
//               onDragStart={onDragStart}
//               onDragEnd={() => {
//                 dispatch(setIsTriggerDragging(false));
//                 dispatch(setIsMessagesDragging(false));
//               }}
//               onMouseUp={(action) => {
//                 if (
//                   [
//                     "email",
//                     "sms",
//                     "slack",
//                     "firebase",
//                     "webhook",
//                     "modal",
//                   ].includes(action)
//                 )
//                   dispatch(setIsMessagesDragging(true));

//                 if (
//                   [
//                     TriggerType.EVENT,
//                     TriggerType.TIME_DELAY,
//                     TriggerType.TIME_WINDOW,
//                   ].includes(action as TriggerType)
//                 )
//                   dispatch(setIsTriggerDragging(true));
//               }}
//               onMouseDown={() => {
//                 dispatch(setIsTriggerDragging(false));
//                 dispatch(setIsMessagesDragging(false));
//               }}
//               flowName={flowName}
//               handleFlowName={(e) => setFlowName(e.target.value)}
//             />
//           </div>
//         </div>
//         <div className="w-full h-full">
//           <nav aria-label="Progress">
//             <ol
//               role="list"
//               className="divide-y divide-gray-300 rounded-md border border-gray-300 md:flex md:divide-y-0"
//             >
//               {steps.map((step, stepIdx) => (
//                 <li key={step.name} className="relative md:flex md:flex-1">
//                   {stepsCompletion[stepIdx] ? (
//                     <div
//                       className="group flex w-full items-center cursor-pointer"
//                       onClick={() => setCurrentStep(stepIdx)}
//                     >
//                       <span className="flex items-center px-6 py-4 text-sm font-medium">
//                         <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
//                           <CheckIcon
//                             className="h-6 w-6 text-white"
//                             aria-hidden="true"
//                           />
//                         </span>
//                         <span className="ml-4 text-sm font-medium text-gray-900">
//                           {step.name}
//                         </span>
//                       </span>
//                     </div>
//                   ) : stepIdx === currentStep || stepsAvailability[stepIdx] ? (
//                     <div
//                       className="flex items-center px-6 py-4 text-sm font-medium cursor-pointer"
//                       aria-current="step"
//                       onClick={() => setCurrentStep(stepIdx)}
//                     >
//                       <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-600">
//                         <span className="text-indigo-600">{step.label}</span>
//                       </span>
//                       <span className="ml-4 text-sm font-medium text-indigo-600">
//                         {step.name}
//                       </span>
//                     </div>
//                   ) : (
//                     <div className="group flex items-center">
//                       <span className="flex items-center px-6 py-4 text-sm font-medium">
//                         <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-gray-300 group-hover:border-gray-400">
//                           <span className="text-gray-500 group-hover:text-gray-900">
//                             {step.label}
//                           </span>
//                         </span>
//                         <span className="ml-4 text-sm font-medium text-gray-500 group-hover:text-gray-900">
//                           {step.name}
//                         </span>
//                       </span>
//                     </div>
//                   )}

//                   {stepIdx !== steps.length - 1 ? (
//                     <>
//                       <div
//                         className="absolute top-0 right-0 hidden h-full w-5 md:block"
//                         aria-hidden="true"
//                       >
//                         <svg
//                           className="h-full w-full text-gray-300"
//                           viewBox="0 0 22 80"
//                           fill="none"
//                           preserveAspectRatio="none"
//                         >
//                           <path
//                             d="M0 -2L20 40L0 82"
//                             vectorEffect="non-scaling-stroke"
//                             stroke="currentcolor"
//                             strokeLinejoin="round"
//                           />
//                         </svg>
//                       </div>
//                     </>
//                   ) : null}
//                 </li>
//               ))}
//             </ol>
//           </nav>
//           <div
//             className={`relative ${
//               !filterId ? "h-[calc(100%-80px)]" : "h-full"
//             }`}
//           >
//             {nodes.length === 0 && !audienceModalOpen && (
//               <div className="w-[75%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[999]">
//                 <button
//                   type="button"
//                   className="relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
//                   onClick={() => setAudienceModalOpen(true)}
//                   onDragOver={onDragOver}
//                   onDrop={onDrop}
//                 >
//                   <PlusCircleIcon
//                     className="mx-auto h-12 w-12 text-gray-400"
//                     strokeWidth="1"
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     aria-hidden="true"
//                     fill="none"
//                   />
//                   <span className="mt-2 block text-sm font-medium text-gray-900">
//                     Add first step by dragging or clicking
//                   </span>
//                 </button>
//               </div>
//             )}

//             <ReactFlow
//               ref={reactFlowRef}
//               nodes={nodes}
//               edges={edges}
//               edgeTypes={{
//                 custom: SmartStepEdge,
//               }}
//               onNodeClick={onNodeClick}
//               onNodesChange={onNodesChange}
//               onEdgesChange={onEdgesChange}
//               onPaneClick={onPaneClick}
//               onNodeDragStart={onNodeDragStart}
//               onClickConnectStart={onClickConnectionStart}
//               connectionLineType={ConnectionLineType.SmoothStep}
//               onConnect={onConnect}
//               style={rfStyle}
//               nodeTypes={nodeTypes}
//               zoomOnScroll={false}
//               zoomOnPinch={false}
//               minZoom={0.25}
//               maxZoom={2}
//               zoomOnDoubleClick={false}
//               onMoveStart={() => setIsGrabbing(true)}
//               onMoveEnd={() => setIsGrabbing(false)}
//               onDragOver={onDragOver}
//               onDrop={onDrop}
//               onConnectStart={() => setIsConnecting(true)}
//               onConnectEnd={onConnectEnd}
//               onMouseMove={(e) => {
//                 if (!isConnecting || !reactFlowRef.current) return;

//                 setMoveEvent(e);
//               }}
//             >
//               <div
//                 style={{
//                   position: "absolute",
//                   zIndex: "10",
//                   display: "flex",
//                   right: "15px",
//                   inset: "20px 20px auto auto",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <div className="m-[0_7.5px]" data-saveflowbutton>
//                   <button
//                     className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
//                     onClick={handleTutorialOpen}
//                     style={{
//                       maxWidth: "158px",
//                       maxHeight: "48px",
//                       padding: "13px 25px",
//                     }}
//                   >
//                     Tutorial
//                   </button>
//                 </div>

//                 <div className="m-[0_7.5px]" data-saveflowbutton>
//                   <GenericButton
//                     customClasses="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
//                     onClick={handleSaveJourney}
//                     style={{
//                       maxWidth: "158px",
//                       maxHeight: "48px",
//                       padding: "13px 25px",
//                     }}
//                     disabled={isSaving}
//                     loading={isSaving}
//                   >
//                     Save
//                   </GenericButton>
//                 </div>
//                 {currentStep === 2 ? (
//                   <div className="m-[0_7.5px]" data-startflowbutton>
//                     <Tooltip
//                       content={
//                         startDisabledReason ||
//                         "Once you start a journey users can be messaged"
//                       }
//                       placement="bottom"
//                     >
//                       <GenericButton
//                         customClasses={`inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
//                           !!startDisabledReason ? "grayscale" : ""
//                         }`}
//                         onClick={handleStartJourney}
//                         style={{
//                           maxWidth: "158px",
//                           maxHeight: "48px",
//                           padding: "13px 25px",
//                         }}
//                         disabled={!!startDisabledReason || isSaving}
//                         loading={isSaving}
//                       >
//                         Start
//                       </GenericButton>
//                     </Tooltip>
//                   </div>
//                 ) : (
//                   <div className="m-[0_7.5px]" data-nextstep>
//                     <Tooltip
//                       content={
//                         stepsCompletion[currentStep] ? "" : startDisabledReason
//                       }
//                       placement="bottom"
//                     >
//                       <GenericButton
//                         customClasses={`inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
//                           stepsCompletion[currentStep] ? "" : "grayscale"
//                         }`}
//                         onClick={handleNextStep}
//                         style={{
//                           maxWidth: "158px",
//                           maxHeight: "48px",
//                           padding: "13px 25px",
//                         }}
//                         disabled={isSaving || !stepsCompletion[currentStep]}
//                         loading={isSaving}
//                       >
//                         Next
//                       </GenericButton>
//                     </Tooltip>
//                   </div>
//                 )}

//                 <Select
//                   id="zoomSelect"
//                   value={zoomState}
//                   options={possibleViewZoomValues.map((item) => ({
//                     value: item,
//                     title: item * 100 + "%",
//                   }))}
//                   renderValue={(item) => item * 100 + "%"}
//                   onChange={(value) => {
//                     setZoomState(+value);
//                     setViewport({ x: viewX, y: viewY, zoom: +value });
//                   }}
//                   sx={{ margin: "0 7.5px" }}
//                 />
//               </div>
//             </ReactFlow>
//           </div>
//         </div>
//         <ChooseTemplateModal
//           templateModalOpen={templateModalOpen}
//           handleTemplateModalOpen={handleTemplateModalOpen}
//           selectedMessageType={selectedMessageType}
//           isCollapsible={true}
//           onClose={() => setTemplateModalOpen(false)}
//         />
//         <SideModal
//           isOpen={audienceModalOpen}
//           onClose={() => {
//             dispatch(setNodes(nodes.filter((n) => !n.data.mock)));
//             setAudienceModalOpen(false);
//           }}
//         >
//           <NameSegment
//             onSubmit={handleAudienceSubmit}
//             isPrimary={!nodes.some((item) => item.data.primary)}
//             isCollapsible={true}
//             isSaving={isSaving}
//             workflowId={flowId}
//           />
//         </SideModal>
//         <TriggerModal
//           onSaveTrigger={onSaveTrigger}
//           onDeleteTrigger={onDeleteTrigger}
//           isCollapsible={true}
//           isOpen={triggerModalOpen}
//           onClose={() => {
//             settriggerModalOpen(false);
//             dispatch(selectTrigger(""));
//           }}
//         />
//         <FilterModal
//           isOpen={segmentModalOpen}
//           onClose={() => {
//             setSegmentModalOpen(false);
//             setCurrentStep(0);
//           }}
//           onSubmit={(fId) => {
//             dispatch(setFilterId(fId));
//             setSegmentModalOpen(false);
//             setCurrentStep(2);
//           }}
//           filterId={filterId}
//           workflowId={flowId}
//           afterContent={
//             <>
//               <div className="flex justify-end m-[10px_0]" data-nextstep>
//                 <Tooltip
//                   content={
//                     stepsCompletion[currentStep] ? "" : startDisabledReason
//                   }
//                   placement="bottom"
//                 >
//                   <GenericButton
//                     customClasses={`inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 ${
//                       stepsCompletion[currentStep] ? "" : "grayscale"
//                     }`}
//                     onClick={handleNextStep}
//                     style={{
//                       maxWidth: "158px",
//                       maxHeight: "48px",
//                       padding: "13px 25px",
//                     }}
//                     disabled={isSaving || !stepsCompletion[currentStep]}
//                     loading={isSaving}
//                   >
//                     Next
//                   </GenericButton>
//                 </Tooltip>
//               </div>
//             </>
//           }
//         />
//         <SideModal
//           isOpen={journeyTypeModalOpen}
//           onClose={() => {
//             setJourneyTypeModalOpen(false);
//             setCurrentStep(0);
//           }}
//         >
//           <div>
//             <h3 className="pt-[20px] font-bold">Journey type</h3>
//             <Tooltip
//               className="max-w-[300px]"
//               content="Dynamic journeys will enroll new customers that satisfy the conditions of the Journey. Static journeys will only enroll customers that satisfy the conditions of the journey when it is started."
//               placement="bottom"
//             >
//               <div className="flex items-center cursor-default mt-[8px]">
//                 <img src={InfoIcon} width="20px" />
//                 <p className="text-[#4FA198] text-[12px] pl-[5px] break-all">
//                   What is a dynamic segment?
//                 </p>
//               </div>
//             </Tooltip>
//             <div className={segmentTypeStyle}>
//               <Grid
//                 sx={{
//                   width: "100%",
//                   display: "flex",
//                   justifyContent: "space-between",
//                   alignItems: "center",
//                 }}
//               >
//                 <p className="font-semibold text-[#111827]">Dynamic</p>
//                 <ToggleSwitch checked={isDynamic} onChange={onToggleChange} />
//               </Grid>
//               {/* <IconButton> */}
//             </div>

//             <div className="m-[10px_0] flex justify-end" data-saveflowbutton>
//               <GenericButton
//                 customClasses="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
//                 onClick={handleSaveJourney}
//                 style={{
//                   maxWidth: "158px",
//                   maxHeight: "48px",
//                   padding: "13px 25px",
//                 }}
//                 disabled={isSaving}
//                 loading={isSaving}
//               >
//                 Save
//               </GenericButton>
//             </div>
//           </div>
//         </SideModal>
//         <Modal
//           isOpen={tutorialOpen}
//           onClose={() => {
//             setTutorialOpen(false);
//           }}
//         >
//           <div className="relative pb-[100%] h-0">
//             <div style={{ padding: "56.25% 0 0 0", position: "relative" }}>
//               <iframe
//                 src="https://player.vimeo.com/video/772141536?h=a682c166c0&amp;badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
//                 frameBorder="0"
//                 allow="autoplay; fullscreen; picture-in-picture"
//                 allowFullScreen
//                 style={{
//                   position: "absolute",
//                   top: "0",
//                   left: "0",
//                   width: "100%",
//                   height: "100%",
//                 }}
//                 title="Journey-Tutorial"
//               ></iframe>
//             </div>
//             <script src="https://player.vimeo.com/api/player.js"></script>
//           </div>
//         </Modal>
//       </div>
//     </div>
//   );
// };

// const FlowBuilderv2 = () => (
//   <>
//     <ReactFlowProvider>
//       <Flowv2 />
//     </ReactFlowProvider>
//   </>
// );

// export default FlowBuilderv2;
