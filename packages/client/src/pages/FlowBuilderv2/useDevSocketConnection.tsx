import {
  createContext,
  ReactElement,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { useAppSelector } from "store/hooks";
import constants from "constants/app";
import { useDispatch } from "react-redux";
import {
  ConnectionStatus,
  handleDevModeState,
} from "reducers/flow-builder.reducer";
import { toast } from "react-toastify";
import { useParams } from "react-router-dom";

const SocketContext = createContext<Socket | null>(null);

const MAX_RETRIES = 5;

export const SocketProvider = ({ children }: { children: ReactElement }) => {
  const { userData, loading } = useAppSelector((state) => state.auth);
  const { devModeState } = useAppSelector((state) => state.flowBuilder);
  const { id } = useParams();
  const dispatch = useDispatch();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!constants.WS_BASE_URL || loading || !userData || socket || !id) return;

    const newSocket = io(constants.WS_BASE_URL, {
      auth: {
        userId: userData.uId,
        journeyId: id,
        development: true,
      },
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 500,
    });

    setSocket(newSocket);
  }, [userData, loading]);

  const handleConnect = () => {
    if (!socket) return;
    socket.close();
    socket.connect();
  };

  useEffect(() => {
    if (!socket) return;

    const handleError = (error: any) => {
      console.error("Socket error:", error);
      if (retries < MAX_RETRIES) {
        setTimeout(() => {
          console.log(`Retrying connection (${retries + 1})...`);
          handleConnect();
          setRetries((prev) => prev + 1);
        }, 1000);
      } else {
        console.error("Max retries reached. Giving up.");
        socket.disconnect();
        dispatch(
          handleDevModeState({
            status: ConnectionStatus.Error,
          })
        );
        setRetries(0);
      }
    };

    socket.on("connect_error", handleError);
    socket.on("connect_timeout", handleError);

    return () => {
      socket.off("connect_error", handleError);
      socket.off("connect_timeout", handleError);
    };
  }, [socket, retries]);

  useEffect(() => {
    if (!socket) return;
    let retry: NodeJS.Timeout | undefined = undefined;
    socket.on("log", (data) => {
      console.log("log:", data);
    });
    socket
      .on("devModeConnected", (nodeId) => {
        dispatch(
          handleDevModeState({
            status: ConnectionStatus.Connected,
            customerInNode: nodeId,
          })
        );
      })
      .on("devModeNeedReconnection", () => {
        dispatch(
          handleDevModeState({
            status: ConnectionStatus.Reconnection,
          })
        );
        retry = setTimeout(() => {
          dispatch(
            handleDevModeState({
              status: ConnectionStatus.Disabled,
            })
          );
          toast.error("Looks like your local environment was disconnected.");
          socket.disconnect();
        }, 5000);
      })
      .on("devModeReconnected", () => {
        if (!retry) return;

        clearTimeout(retry);
        dispatch(
          handleDevModeState({
            status: ConnectionStatus.Connected,
          })
        );
      })
      .on("nodeMovedTo", (nodeId) => {
        dispatch(
          handleDevModeState({
            customerInNode: nodeId,
            requireMovementToStart: undefined,
          })
        );
      })
      .on("moveError", (error) => {
        toast.error(error);
      });
  }, [socket]);

  useEffect(() => {
    if (!socket || !devModeState.requireMovementToStart) return;

    socket.emit("moveToNode", devModeState.requireMovementToStart);
  }, [devModeState.requireMovementToStart]);

  useEffect(() => {
    if (!socket) return;

    return () => {
      socket.disconnect();
      setSocket(null);
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useDevSocket = () => {
  return useContext(SocketContext);
};

export const useDevSocketConnection = () => {
  const socket = useDevSocket();
  const dispatch = useDispatch();

  const handleConnect = () => {
    if (!socket) return;
    socket.connect();
    dispatch(
      handleDevModeState({
        status: ConnectionStatus.Connecting,
      })
    );
  };

  const handleDisconnect = () => {
    if (!socket) return;
    socket.disconnect();
    dispatch(
      handleDevModeState({
        status: ConnectionStatus.Disabled,
      })
    );
  };

  return { socket, handleConnect, handleDisconnect };
};
