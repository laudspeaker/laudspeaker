import DotProgress from "components/DotProgress/DotProgress";
import { TailSpin } from "react-loader-spinner";
import React from "react";

const Progress = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center !text-[#6366F1] text-[20px]">
      <TailSpin
        height="40"
        width="40"
        color="#6366F1"
        ariaLabel="tail-spin-loading"
        radius="1"
        wrapperStyle={{}}
        wrapperClass=""
        visible={true}
      />
      <p style={{ textAlign: "center" }}>
        Loading
        <DotProgress />
      </p>
    </div>
  );
};

export default Progress;
