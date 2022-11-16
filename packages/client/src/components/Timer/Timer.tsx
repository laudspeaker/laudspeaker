import React, { FC } from "react";
import { useInterval } from "react-use";

interface TimerProps {
  seconds?: number;
  setSeconds: (s: number) => void;
  onFinish?: () => void;
}

const Timer: FC<TimerProps> = ({ seconds, setSeconds, onFinish }) => {
  useInterval(() => {
    if (seconds && seconds > 0) {
      setSeconds(seconds - 1);
    } else {
      if (onFinish) onFinish();
    }
  }, 1000);

  const minutesView = seconds ? Math.floor(seconds / 60) : 0;

  const secondsView = seconds ? seconds - minutesView * 60 : 0;

  return (
    <>
      {minutesView < 10 ? `0${minutesView}` : minutesView}:
      {secondsView < 10 ? `0${secondsView}` : secondsView}
    </>
  );
};

export default Timer;
