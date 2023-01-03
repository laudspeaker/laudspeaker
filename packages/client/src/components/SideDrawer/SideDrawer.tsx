import * as React from "react";
import { dataSubArray } from "./SideDrawer.fixtures";
import { useLocation } from "react-router-dom";
import { useParams } from "react-router-dom";
import ApiService from "services/api.service";
import Tooltip from "components/Elements/Tooltip";

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  selectedNode: string;
  onClick: (id: string) => void;
  afterMenuContent?: React.ReactNode;
}

export default function ResponsiveDrawer(props: Props) {
  const { selectedNode, onClick } = props;
  const location = useLocation();
  const { name } = useParams();
  const [expectedOnboarding, setExpectedOnboarding] = React.useState<string[]>(
    []
  );

  React.useLayoutEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { slackTeamId } = data;
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
      const { emailProvider } = data;
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
      const { smsAccountSid } = data;
      if (smsAccountSid)
        setExpectedOnboarding((expectedOnboardingArr) => [
          "Sms",
          ...expectedOnboardingArr,
        ]);
    })();
  }, []);

  const handleMenuItemClick = (id: string) => {
    onClick(id);
  };

  const MenuItem = React.forwardRef(
    ({ item, isDisabled, ...itemProps }: any, ref: any) => (
      <div
        id={item.id}
        onClick={isDisabled ? undefined : () => handleMenuItemClick(item.id)}
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
            className={`flex justify-between items-center cursor-pointer relative w-full hover:bg-gray-200 disabled:opacity-50`}
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

  const generateMenuItem = (item: any) => {
    const isDisabled =
      item.alwaysDisabled ||
      (item.canBeDisabled && !selectedNode) ||
      (item.requiredOnboarding &&
        !expectedOnboarding?.includes(item.requiredOnboarding));

    return (
      <>
        <Tooltip
          title={
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

  const generateMenu = (arr: any) => {
    return (
      <>
        {arr.map((item: any) => {
          return (
            <>
              {item.type === "group" ? (
                <>
                  <div className="text-left font-medium mt-[26px] ml-[18px] text-[14px] font-[Inter]">
                    {item.text}
                  </div>
                  {item?.children?.map((menuItem: any) => (
                    <>{generateMenuItem(menuItem)}</>
                  ))}
                </>
              ) : (
                <>{generateMenuItem(item)}</>
              )}
            </>
          );
        })}
      </>
    );
  };
  const drawer = (): React.ReactNode => {
    return (
      <>
        <div className="text-[16px] bg-cyan-700 w-full min-h-[50px] text-white text-ellipsis overflow-hidden px-[20px] py-[15px]">
          {name}
        </div>
        <div className="min-h-screen flex-col justify-between px-[20px] py-[15px]">
          {generateMenu(dataSubArray)}
          {props.afterMenuContent}
        </div>
      </>
    );
  };

  return <div className="h-full">{drawer()}</div>;
}
