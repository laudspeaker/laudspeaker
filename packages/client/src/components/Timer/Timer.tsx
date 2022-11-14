import React, { FC, useEffect, useState } from "react";

interface TimerProps {
  s: number;
  onFinish: () => void;
}

const Timer: FC<TimerProps> = ({ s, onFinish }) => {
  const [seconds, setSeconds] = useState(s);

  useEffect(() => {
    setSeconds(s);
  }, [s]);

  useEffect(() => {
    if (seconds > 0) {
      setTimeout(() => {
        setSeconds(seconds - 1);
      }, 1000);
    } else {
      onFinish();
    }
  }, [seconds]);

  const minutesView = Math.floor(seconds / 60);

  const secondsView = seconds - minutesView * 60;

  return (
    <>
      {minutesView < 10 ? `0${minutesView}` : minutesView}:
      {secondsView < 10 ? `0${secondsView}` : secondsView}
    </>
  );
};

export default Timer;
