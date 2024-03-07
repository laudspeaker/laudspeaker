import { FC } from "react";

interface DotProps {
  color: string;
  width?: number;
  height?: number;
}

const Dot: FC<DotProps> = ({ color, width = 10, height = 10 }) => {
  return (
    <div
      className="rounded-full inline-block"
      style={{ backgroundColor: color, height: height, width: width }}
    />
  );
};

export default Dot;
