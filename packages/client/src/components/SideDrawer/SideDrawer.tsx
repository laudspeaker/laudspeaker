import * as React from "react";
import { dataSubArray } from "./SideDrawer.fixtures";
import { useLocation } from "react-router-dom";
import ApiService from "services/api.service";
import Tooltip from "components/Elements/Tooltip";
import { ForwardedRef, ReactNode } from "react";
import { Input } from "components/Elements";
import EditIcon from "@mui/icons-material/Edit";

interface IMenuItem {
  type: string;
  text: string;
  children?: IMenuItemChildren[];
}

interface IMenuItemChildren {
  id: string;
  text: string;
  link: string;
  imgIcon: ReactNode;
  alwaysDisabled?: boolean;
  canBeDisabled?: boolean;
  requiredOnboarding?: string;
  disabledToolTip?: string | ReactNode;
  enabledToolTip?: string | ReactNode;
}

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  selectedNode: string;
  onClick: (id: string) => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>, itemId: string) => void;
  onDragEnd?: () => void;
  onMouseUp?: (action: string) => void;
  onMouseDown?: () => void;
  afterMenuContent?: React.ReactNode;
  flowName: string;
  handleFlowName: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResponsiveDrawer(props: Props) {
  const {
    selectedNode,
    onClick,
    onDragStart,
    onDragEnd,
    onMouseUp,
    onMouseDown,
    handleFlowName,
    flowName,
  } = props;
  const location = useLocation();
  const [expectedOnboarding, setExpectedOnboarding] = React.useState<string[]>(
    []
  );

  const [titleEdit, setTitleEdit] = React.useState(false);

  const handleTitleEdit = () => {
    setTitleEdit(!titleEdit);
  };

  const handleTitleEnter = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      handleTitleEdit();
    }
  };

  React.useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { slackTeamId } = data.workspace;
      if (slackTeamId)
        setExpectedOnboarding((expectedOnboardingArr) => [
          "Slack",
          ...expectedOnboardingArr,
        ]);
    })();
  }, []);

  React.useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { emailProvider } = data.workspace;
      if (emailProvider)
        setExpectedOnboarding((expectedOnboardingArr) => [
          "Email",
          ...expectedOnboardingArr,
        ]);
    })();
  }, []);

  React.useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { smsAccountSid } = data.workspace;
      if (smsAccountSid)
        setExpectedOnboarding((expectedOnboardingArr) => [
          "Sms",
          ...expectedOnboardingArr,
        ]);
    })();
  }, []);

  React.useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { firebaseCredentials } = data.workspace;
      if (firebaseCredentials)
        setExpectedOnboarding((expectedOnboardingArr) => [
          "Firebase",
          ...expectedOnboardingArr,
        ]);
    })();
  }, []);

  const handleMenuItemClick = (id: string) => {
    onClick(id);
  };

  interface MenuItemProps {
    item: { id: string; link: string; text: string; imgIcon: ReactNode };
    isDisabled: boolean;
  }

  const MenuItem = React.forwardRef(
    (
      { item, isDisabled, ...itemProps }: MenuItemProps,
      ref: ForwardedRef<HTMLDivElement>
    ) => (
      <div
        id={item.id}
        onClick={isDisabled ? undefined : () => handleMenuItemClick(item.id)}
        onDragStart={
          isDisabled || !onDragStart
            ? undefined
            : (e) => onDragStart(e, item.id)
        }
        onDragEnd={onDragEnd}
        onMouseUp={isDisabled ? undefined : () => onMouseUp?.(item.id)}
        onMouseDown={onMouseDown}
        draggable={!isDisabled && !!onDragStart}
        style={
          location.pathname.includes(item.link)
            ? {
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.1) , rgba(255,255,255,0))",
                borderLeft: "5px solid #FAFAFA",
                display: "flex",
                textDecoration: "none",
              }
            : {
                textDecoration: "none",
              }
        }
        {...itemProps}
        ref={ref}
      >
        <div className="p-0" key={item.text}>
          <button
            className={`flex justify-between items-center cursor-grab relative w-full hover:bg-gray-200 disabled:opacity-50`}
            disabled={isDisabled}
          >
            <div className="w-[50px] h-[50px] flex justify-center items-center">
              {item.imgIcon}
            </div>
            <div className="text-[#28282E] font-medium leading-[1] text-left w-full">
              {item.text}
            </div>
          </button>
        </div>
      </div>
    )
  );

  const generateMenuItem = (item: IMenuItemChildren) => {
    const isDisabled = Boolean(
      item.alwaysDisabled ||
        (item.canBeDisabled && !selectedNode) ||
        (item.requiredOnboarding &&
          !expectedOnboarding?.includes(item.requiredOnboarding))
    );

    return (
      <>
        <Tooltip
          content={
            (isDisabled && item.disabledToolTip) ||
            (!isDisabled && item.enabledToolTip) ||
            ""
          }
          placement="right"
        >
          <MenuItem item={item} isDisabled={isDisabled} />
        </Tooltip>
      </>
    );
  };

  const generateMenu = (arr: IMenuItem[]) => {
    return (
      <>
        {arr.map((item) => {
          return (
            <React.Fragment key={item.text}>
              <div className="text-left font-medium mt-[26px] ml-[18px] text-[14px] font-[Inter]">
                {item.text}
              </div>
              {item?.children?.map((menuItem) => (
                <React.Fragment key={menuItem.id}>
                  {generateMenuItem(menuItem)}
                </React.Fragment>
              ))}
            </React.Fragment>
          );
        })}
      </>
    );
  };
  const drawer = (): React.ReactNode => {
    return (
      <>
        <div className="text-[16px] bg-cyan-700 w-full min-h-[50px] text-white text-ellipsis overflow-hidden px-5 py-[15px]">
          {!titleEdit ? (
            <h3 className="flex justify-between items-center">
              {flowName}
              <EditIcon
                sx={{ fontSize: "25px", cursor: "pointer" }}
                onClick={handleTitleEdit}
              />
            </h3>
          ) : (
            <Input
              value={flowName}
              placeholder={"Enter segment title"}
              name="title"
              id="title"
              onChange={handleFlowName}
              onKeyDown={handleTitleEnter}
              autoFocus
              className="p-0 bg-white font-[Inter] font-[600] text-[25px] text-[#28282E]"
            />
          )}
        </div>
        <div className="min-h-screen flex-col justify-between px-5 py-[15px] z-50">
          {generateMenu(dataSubArray)}
          {props.afterMenuContent}
        </div>
      </>
    );
  };

  return <div className="h-full">{drawer()}</div>;
}
