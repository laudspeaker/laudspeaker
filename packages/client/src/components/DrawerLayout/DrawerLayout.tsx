import React, { FC, ReactNode } from "react";
import ResponsiveDrawer from "../Drawer";

interface DrawerLayoutProps {
  children: ReactNode;
}

const DrawerLayout: FC<DrawerLayoutProps> = ({ children }) => {
  return (
    <div className="flex w-full max-h-screen h-screen">
      <ResponsiveDrawer />
      {children}
    </div>
  );
};

export default DrawerLayout;
