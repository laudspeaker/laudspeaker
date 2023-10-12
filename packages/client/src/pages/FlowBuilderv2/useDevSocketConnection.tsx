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
import { handleDevModeState } from "reducers/flow-builder.reducer";

const SocketContext = createContext<Socket | null>(null);

const MAX_RETRIES = 5;

export const SocketProvider = ({ children }: { children: ReactElement }) => {
  const { userData, loading } = useAppSelector((state) => state.auth);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [retries, setRetries] = useState(0);

  useEffect(() => {
    if (!constants.WS_BASE_URL || loading || !userData || socket) return;

    const newSocket = io(constants.WS_BASE_URL, {
      auth: {
        userId: userData.uId,
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
      }
    };

    socket.on("connect_error", handleError);
    socket.on("connect_timeout", handleError);

    return () => {
      socket.off("connect_error", handleError);
      socket.off("connect_timeout", handleError);
    };
  }, [socket, retries]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
};

export const useDevSocket = () => {
  return useContext(SocketContext);
};

export const useDevSocketConnection = () => {
  const socket = useDevSocket();

  const handleConnect = () => {
    console.log(socket);
    if (!socket) return;
    socket.connect();
  };

  return { socket, handleConnect };
};
