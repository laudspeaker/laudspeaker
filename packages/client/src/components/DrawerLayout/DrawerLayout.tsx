import Header from "components/Header";
import React, { FC, ReactNode } from "react";
import ResponsiveDrawer from "../Drawer";

interface DrawerLayoutProps {
  children: ReactNode;
  crumbs?: { text: string; link?: string }[];
}

const DrawerLayout: FC<DrawerLayoutProps> = ({ children, crumbs }) => {
  return (
    <div className="flex w-full max-h-screen h-screen">
      <ResponsiveDrawer />
      <div className="w-full max-h-screen bg-gray-100 pl-[50px]">
        <Header crumbs={crumbs || []} />
        {children}
      </div>
    </div>
  );
};

export default DrawerLayout;
