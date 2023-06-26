import Header from "components/Header";
import React, { FC, ReactNode } from "react";
import ResponsiveDrawer from "../Drawer";

interface DrawerLayoutProps {
  children: ReactNode;
  crumbs?: { text: string; link?: string }[];
  expandable?: boolean;
}

const DrawerLayout: FC<DrawerLayoutProps> = ({
  children,
  crumbs,
  expandable,
}) => {
  return (
    <div className="flex w-full max-h-screen h-screen">
      <ResponsiveDrawer expandable={expandable} />
      <div
        className={`w-full max-h-screen bg-gray-100 ${
          expandable ? "pl-[50px]" : ""
        }`}
      >
        <Header crumbs={crumbs || []} />
        {children}
      </div>
    </div>
  );
};

export default DrawerLayout;
