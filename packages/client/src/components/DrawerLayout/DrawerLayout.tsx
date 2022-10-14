import React, { FC, ReactNode } from "react";
import ResponsiveDrawer from "../Drawer";

interface DrawerLayoutProps {
  children: ReactNode;
}

const DrawerLayout: FC<DrawerLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-full w-full">
      <ResponsiveDrawer />
      {children}
    </div>
  );
};

export default DrawerLayout;
