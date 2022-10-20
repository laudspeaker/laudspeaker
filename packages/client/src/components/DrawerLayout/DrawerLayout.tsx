import React, { FC, ReactNode } from "react";
import ResponsiveDrawer from "../Drawer";

interface DrawerLayoutProps {
  children: ReactNode;
}

const DrawerLayout: FC<DrawerLayoutProps> = ({ children }) => {
  return (
    <div className="flex w-full max-h-screen h-screen">
      <ResponsiveDrawer />
      <div className="w-full max-h-screen overflow-y-scroll">{children}</div>
    </div>
  );
};

export default DrawerLayout;
