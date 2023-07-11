import React from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import confettiAnimation from "./confetti-animation.json";

const Confetti = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-25 z-[10]">
      <div className="relative">
        <Player
          className="max-h-full"
          src={confettiAnimation}
          autoplay
          loop={false}
          keepLastFrame
        />
      </div>
    </div>
  );
};

export default Confetti;
