import React, { useEffect, useState } from "react";

const DotProgress = () => {
  const [dots, setDots] = useState("...");

  useEffect(() => {
    setTimeout(() => {
      setDots(dots.length === 3 ? "." : dots + ".");
    }, 1000);
  }, [dots]);

  return <>{dots}</>;
};

export default DotProgress;
