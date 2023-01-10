import { CircularProgress } from "@mui/material";
import DotProgress from "components/DotProgress/DotProgress";
import React from "react";

const Progress = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center !text-cyan-600 text-[20px]">
      <CircularProgress color="primary" />
      <p style={{ textAlign: "center" }}>
        Loading
        <DotProgress />
      </p>
    </div>
  );
};

export default Progress;
