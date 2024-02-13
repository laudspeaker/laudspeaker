import ResponsiveDrawer from "components/Drawer/Drawer";
import Header from "components/Header";
import React, { FC, ReactNode } from "react";

interface WorkspaceDrawerLayoutProps {
  children: ReactNode;
}

const WorkspaceDrawerLayout: FC<WorkspaceDrawerLayoutProps> = ({
  children,
}) => {
  return (
    <div className="flex w-full max-h-screen h-screen">
      <ResponsiveDrawer expandable={false} isWorkspace={true} />
      <div className={`w-full max-h-screen h-screen bg-[#F3F4F6]`}>
        <Header crumbs={[]} />
        <div className="h-[calc(100%-46px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export default WorkspaceDrawerLayout;
