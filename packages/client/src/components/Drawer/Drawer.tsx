import React, { FC, useEffect, useRef, useState } from "react";
import { dataSubArray, workspaceDrawerItems } from "./Drawer.fixtures";
import { useLocation } from "react-router-dom";
import { Disclosure } from "@headlessui/react";
import { useAppDispatch } from "store/hooks";
import { refreshFlowBuilder } from "reducers/flow-builder.reducer";
import laudspeakerIcon from "../../assets/images/laudspeakerHeaderIcon.svg";
import useHover from "hooks/useHover";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const classNames = (...classes: string[]) => classes.filter(Boolean).join(" ");

export interface NavigationItem {
  id: string;
  imgIcon: string;
  text: string;
  type: string;
  link?: string;
  children?: NavigationItem[];
}

export interface ResponsiveDrawerProps {
  expandable?: boolean;
  isWorkspace?: boolean;
}

const ResponsiveDrawer: FC<ResponsiveDrawerProps> = ({
  expandable,
  isWorkspace,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const drawerRef = useRef<HTMLDivElement>(null);

  const isHovered = useHover(drawerRef);

  const [navigation, setNavigation] = useState<NavigationItem[]>(
    isWorkspace ? workspaceDrawerItems : dataSubArray
  );
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setNavigation(isWorkspace ? workspaceDrawerItems : dataSubArray);
  }, [isWorkspace]);

  useEffect(() => {
    if (!expandable) {
      setIsExpanded(true);
      return;
    }

    setIsExpanded(isHovered);
  }, [isHovered, location.pathname]);

  useEffect(() => {
    dispatch(refreshFlowBuilder());
  }, [location.pathname]);

  return (
    <div
      className={`${
        expandable
          ? "absolute transition-[width] [&_.notexapndable]:hover:!scale-100 w-[50px] hover:!w-[230px]"
          : "block min-w-[230px]"
      } top-0 left-0 px-[10px] text-[14px] text-[#111827] leading-[22px] font-normal font-roboto z-[999999999999] border-collapse bg-[#F3F4F6] border border-[#E5E7EB] h-screen`}
      ref={drawerRef}
    >
      <div className="flex flex-col gap-2">
        <div
          className={`w-full h-[50px] flex justify-center items-center gap-5`}
        >
          {isWorkspace ? (
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => navigate("/home")}
            >
              <div>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="0.5"
                    y="0.5"
                    width="17"
                    height="17"
                    rx="1.98276"
                    stroke="#4B5563"
                  />
                  <path
                    d="M8.36207 12.724L5 9.36198M5 9.36198L8.36207 6M5 9.36198H13.069"
                    stroke="#4B5563"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="font-semibold font-inter text-[#111827] text-[16px] leading-[24px]">
                Workspace name
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-[30px] min-h-[30px] flex items-center justify-center">
                <img
                  className="min-w-[15px] min-h-[20px] max-w-[15px] max-h-[20px]"
                  src={laudspeakerIcon}
                />
              </div>

              <svg
                className={`${
                  expandable
                    ? "notexapndable scale-0 transition-[width] delay-1000"
                    : ""
                } whitespace-nowrap ${!isExpanded && "hidden"}`}
                width="102"
                height="16"
                viewBox="0 0 102 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.77849 0V11.7928H0.546875V0H2.77849ZM4.40948 7.34661C4.40948 6.45418 4.58483 5.66268 4.93551 4.97211C5.29682 4.28154 5.78033 3.75033 6.38606 3.37849C7.00241 3.00664 7.68784 2.82072 8.44233 2.82072C9.10119 2.82072 9.67503 2.95352 10.1639 3.21912C10.6633 3.48473 11.0618 3.81939 11.3594 4.22311V2.96414H13.6069V11.7928H11.3594V10.502C11.0725 10.9163 10.6739 11.2616 10.1639 11.5378C9.66441 11.8035 9.08525 11.9363 8.42639 11.9363C7.68252 11.9363 7.00241 11.745 6.38606 11.3626C5.78033 10.9801 5.29682 10.4436 4.93551 9.75299C4.58483 9.05179 4.40948 8.24967 4.40948 7.34661ZM11.3594 7.37849C11.3594 6.83665 11.2531 6.3745 11.0406 5.99203C10.828 5.59894 10.5411 5.30146 10.1798 5.0996C9.81849 4.88712 9.43062 4.78088 9.01618 4.78088C8.60173 4.78088 8.21917 4.88181 7.86849 5.08367C7.5178 5.28552 7.23089 5.583 7.00772 5.9761C6.79519 6.35857 6.68892 6.8154 6.68892 7.34661C6.68892 7.87782 6.79519 8.34529 7.00772 8.749C7.23089 9.1421 7.5178 9.44489 7.86849 9.65737C8.2298 9.86985 8.61236 9.97609 9.01618 9.97609C9.43062 9.97609 9.81849 9.87517 10.1798 9.67331C10.5411 9.46082 10.828 9.16335 11.0406 8.78088C11.2531 8.38778 11.3594 7.92032 11.3594 7.37849ZM24.1232 2.96414V11.7928H21.8756V10.6773C21.5887 11.0598 21.2114 11.3625 20.7439 11.5857C20.2869 11.7981 19.7874 11.9044 19.2455 11.9044C18.5547 11.9044 17.9437 11.761 17.4124 11.4741C16.881 11.1766 16.4613 10.7463 16.1531 10.1833C15.8556 9.60956 15.7068 8.92961 15.7068 8.14342V2.96414H17.9384V7.8247C17.9384 8.5259 18.1137 9.06773 18.4644 9.4502C18.8151 9.82204 19.2933 10.008 19.899 10.008C20.5154 10.008 20.9989 9.82204 21.3496 9.4502C21.7003 9.06773 21.8756 8.5259 21.8756 7.8247V2.96414H24.1232ZM25.7512 7.34661C25.7512 6.45418 25.9265 5.66268 26.2772 4.97211C26.6385 4.28154 27.1273 3.75033 27.7437 3.37849C28.36 3.00664 29.0455 2.82072 29.8 2.82072C30.3738 2.82072 30.9211 2.94821 31.4418 3.20319C31.9625 3.44754 32.377 3.77689 32.6851 4.19123V0H34.9486V11.7928H32.6851V10.4861C32.4088 10.9216 32.021 11.2722 31.5215 11.5378C31.022 11.8035 30.4429 11.9363 29.784 11.9363C29.0402 11.9363 28.36 11.745 27.7437 11.3626C27.1273 10.9801 26.6385 10.4436 26.2772 9.75299C25.9265 9.05179 25.7512 8.24967 25.7512 7.34661ZM32.7011 7.37849C32.7011 6.83665 32.5948 6.3745 32.3823 5.99203C32.1697 5.59894 31.8828 5.30146 31.5215 5.0996C31.1602 4.88712 30.7723 4.78088 30.3579 4.78088C29.9434 4.78088 29.5609 4.88181 29.2102 5.08367C28.8595 5.28552 28.5726 5.583 28.3494 5.9761C28.1369 6.35857 28.0306 6.8154 28.0306 7.34661C28.0306 7.87782 28.1369 8.34529 28.3494 8.749C28.5726 9.1421 28.8595 9.44489 29.2102 9.65737C29.5715 9.86985 29.9541 9.97609 30.3579 9.97609C30.7723 9.97609 31.1602 9.87517 31.5215 9.67331C31.8828 9.46082 32.1697 9.16335 32.3823 8.78088C32.5948 8.38778 32.7011 7.92032 32.7011 7.37849ZM40.5075 11.9363C39.7849 11.9363 39.1366 11.8088 38.5628 11.5538C37.9889 11.2882 37.532 10.9323 37.1919 10.4861C36.8625 10.0398 36.6818 9.54582 36.65 9.00398H38.8975C38.94 9.34396 39.1047 9.6255 39.3917 9.84861C39.6892 10.0717 40.0558 10.1833 40.4915 10.1833C40.9166 10.1833 41.246 10.0983 41.4798 9.92829C41.7242 9.7583 41.8464 9.5405 41.8464 9.2749C41.8464 8.98805 41.6977 8.77556 41.4001 8.63745C41.1132 8.48871 40.6509 8.32935 40.0133 8.15936C39.3545 8 38.8125 7.83532 38.3874 7.66534C37.973 7.49535 37.6117 7.23506 37.3035 6.88446C37.006 6.53386 36.8572 6.06109 36.8572 5.46614C36.8572 4.97742 36.9953 4.53121 37.2716 4.12749C37.5585 3.72377 37.9624 3.40505 38.4831 3.17132C39.0144 2.93758 39.6361 2.82072 40.3481 2.82072C41.4001 2.82072 42.2396 3.08632 42.8666 3.61753C43.4936 4.13811 43.839 4.84462 43.9027 5.73705H41.7667C41.7349 5.38645 41.5861 5.11023 41.3204 4.90837C41.0654 4.69588 40.72 4.58964 40.2843 4.58964C39.8805 4.58964 39.567 4.66401 39.3438 4.81275C39.1313 4.96149 39.025 5.16866 39.025 5.43426C39.025 5.73174 39.1738 5.96016 39.4714 6.11952C39.7689 6.26826 40.2312 6.42231 40.8582 6.58167C41.4958 6.74104 42.0218 6.90571 42.4362 7.0757C42.8507 7.24568 43.2067 7.51129 43.5042 7.87251C43.8124 8.22311 43.9718 8.69057 43.9824 9.2749C43.9824 9.78486 43.839 10.2417 43.552 10.6454C43.2757 11.0491 42.8719 11.3679 42.3406 11.6016C41.8199 11.8247 41.2088 11.9363 40.5075 11.9363ZM48.0459 4.23904C48.3328 3.83532 48.726 3.50066 49.2254 3.23506C49.7355 2.95883 50.3147 2.82072 50.9629 2.82072C51.7174 2.82072 52.3975 3.00664 53.0033 3.37849C53.6196 3.75033 54.1031 4.28154 54.4538 4.97211C54.8151 5.65206 54.9958 6.44356 54.9958 7.34661C54.9958 8.24967 54.8151 9.05179 54.4538 9.75299C54.1031 10.4436 53.6196 10.9801 53.0033 11.3626C52.3975 11.745 51.7174 11.9363 50.9629 11.9363C50.3147 11.9363 49.7408 11.8035 49.2414 11.5378C48.7525 11.2722 48.354 10.9376 48.0459 10.5339V16H45.8143V2.96414H48.0459V4.23904ZM52.7163 7.34661C52.7163 6.8154 52.6047 6.35857 52.3816 5.9761C52.169 5.583 51.8821 5.28552 51.5208 5.08367C51.1701 4.88181 50.7876 4.78088 50.3731 4.78088C49.9693 4.78088 49.5868 4.88712 49.2254 5.0996C48.8748 5.30146 48.5878 5.59894 48.3647 5.99203C48.1521 6.38513 48.0459 6.84728 48.0459 7.37849C48.0459 7.90969 48.1521 8.37185 48.3647 8.76494C48.5878 9.15803 48.8748 9.46082 49.2254 9.67331C49.5868 9.87517 49.9693 9.97609 50.3731 9.97609C50.7876 9.97609 51.1701 9.86985 51.5208 9.65737C51.8821 9.44489 52.169 9.1421 52.3816 8.749C52.6047 8.35591 52.7163 7.88845 52.7163 7.34661ZM64.8266 7.18725C64.8266 7.50598 64.8053 7.79283 64.7628 8.04781H58.3071C58.3602 8.68526 58.5833 9.1846 58.9765 9.54582C59.3697 9.90704 59.8532 10.0876 60.4271 10.0876C61.256 10.0876 61.8458 9.73174 62.1964 9.01992H64.6034C64.3484 9.86985 63.8595 10.571 63.1369 11.1235C62.4143 11.6653 61.527 11.9363 60.4749 11.9363C59.6248 11.9363 58.8596 11.7503 58.1795 11.3785C57.51 10.996 56.984 10.4595 56.6015 9.76892C56.2295 9.07835 56.0436 8.28154 56.0436 7.37849C56.0436 6.46481 56.2295 5.66268 56.6015 4.97211C56.9734 4.28154 57.4941 3.75033 58.1636 3.37849C58.8331 3.00664 59.6035 2.82072 60.4749 2.82072C61.3144 2.82072 62.0636 3.00133 62.7225 3.36255C63.3919 3.72377 63.9073 4.23904 64.2687 4.90837C64.6406 5.56706 64.8266 6.32669 64.8266 7.18725ZM62.5152 6.5498C62.5046 5.97609 62.2974 5.51926 61.8936 5.17928C61.4898 4.82869 60.9956 4.65339 60.4111 4.65339C59.8586 4.65339 59.391 4.82337 59.0084 5.16335C58.6365 5.4927 58.408 5.95485 58.323 6.5498H62.5152ZM65.8816 7.34661C65.8816 6.45418 66.0569 5.66268 66.4076 4.97211C66.7689 4.28154 67.2524 3.75033 67.8582 3.37849C68.4745 3.00664 69.1599 2.82072 69.9144 2.82072C70.5733 2.82072 71.1471 2.95352 71.636 3.21912C72.1354 3.48473 72.5339 3.81939 72.8315 4.22311V2.96414H75.079V11.7928H72.8315V10.502C72.5446 10.9163 72.146 11.2616 71.636 11.5378C71.1365 11.8035 70.5574 11.9363 69.8985 11.9363C69.1546 11.9363 68.4745 11.745 67.8582 11.3626C67.2524 10.9801 66.7689 10.4436 66.4076 9.75299C66.0569 9.05179 65.8816 8.24967 65.8816 7.34661ZM72.8315 7.37849C72.8315 6.83665 72.7252 6.3745 72.5127 5.99203C72.3001 5.59894 72.0132 5.30146 71.6519 5.0996C71.2906 4.88712 70.9027 4.78088 70.4883 4.78088C70.0738 4.78088 69.6913 4.88181 69.3406 5.08367C68.9899 5.28552 68.703 5.583 68.4798 5.9761C68.2673 6.35857 68.161 6.8154 68.161 7.34661C68.161 7.87782 68.2673 8.34529 68.4798 8.749C68.703 9.1421 68.9899 9.44489 69.3406 9.65737C69.7019 9.86985 70.0845 9.97609 70.4883 9.97609C70.9027 9.97609 71.2906 9.87517 71.6519 9.67331C72.0132 9.46082 72.3001 9.16335 72.5127 8.78088C72.7252 8.38778 72.8315 7.92032 72.8315 7.37849ZM82.4872 11.7928L79.4904 8.03187V11.7928H77.2588V0H79.4904V6.70916L82.4553 2.96414H85.3564L81.467 7.39442L85.3883 11.7928H82.4872ZM94.7766 7.18725C94.7766 7.50598 94.7553 7.79283 94.7128 8.04781H88.2571C88.3102 8.68526 88.5333 9.1846 88.9265 9.54582C89.3197 9.90704 89.8032 10.0876 90.3771 10.0876C91.206 10.0876 91.7958 9.73174 92.1464 9.01992H94.5534C94.2984 9.86985 93.8095 10.571 93.0869 11.1235C92.3643 11.6653 91.477 11.9363 90.4249 11.9363C89.5748 11.9363 88.8096 11.7503 88.1295 11.3785C87.46 10.996 86.934 10.4595 86.5515 9.76892C86.1795 9.07835 85.9936 8.28154 85.9936 7.37849C85.9936 6.46481 86.1795 5.66268 86.5515 4.97211C86.9234 4.28154 87.4441 3.75033 88.1136 3.37849C88.7831 3.00664 89.5535 2.82072 90.4249 2.82072C91.2644 2.82072 92.0136 3.00133 92.6725 3.36255C93.3419 3.72377 93.8573 4.23904 94.2187 4.90837C94.5906 5.56706 94.7766 6.32669 94.7766 7.18725ZM92.4652 6.5498C92.4546 5.97609 92.2474 5.51926 91.8436 5.17928C91.4398 4.82869 90.9456 4.65339 90.3611 4.65339C89.8086 4.65339 89.341 4.82337 88.9584 5.16335C88.5865 5.4927 88.358 5.95485 88.273 6.5498H92.4652ZM98.637 4.33466C98.924 3.8672 99.2959 3.50066 99.7529 3.23506C100.22 2.96946 100.752 2.83665 101.347 2.83665V5.17928H100.757C100.056 5.17928 99.5244 5.34396 99.1631 5.67331C98.8124 6.00266 98.637 6.57636 98.637 7.39442V11.7928H96.4054V2.96414H98.637V4.33466Z"
                  fill="#111827"
                />
              </svg>
            </>
          )}
        </div>
        <div className="w-full flex flex-col gap-2 ">
          {navigation.map((navigationItem) => (
            <div
              className="w-full flex justify-center items-center"
              id={navigationItem.id}
              key={navigationItem.id}
            >
              {navigationItem.children ? (
                <div className="w-full">
                  <Disclosure
                    defaultOpen={navigationItem.children.some((child) =>
                      location.pathname.includes(child.link)
                    )}
                  >
                    {({ open }) => (
                      <div className="flex flex-col gap-2">
                        <Disclosure.Button className="w-full">
                          <div
                            className={`relative w-full h-[40px] flex items-center gap-2 select-none cursor-pointer`}
                          >
                            <div className="flex items-center justify-center min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded">
                              <img src={navigationItem.imgIcon} />
                            </div>
                            <span
                              className={`${
                                expandable
                                  ? "notexapndable scale-0 transition-[width] delay-150"
                                  : ""
                              } whitespace-nowrap ${
                                expandable && !isExpanded && "hidden"
                              }`}
                            >
                              {navigationItem.text}
                            </span>
                            <div
                              className={`${
                                expandable
                                  ? "notexapndable scale-0 transition-[width] delay-150 absolute top-1/2 -translate-y-1/2 right-[5px]"
                                  : ""
                              } ${open ? "" : "rotate-180"} ${
                                expandable && isExpanded && "!delay-0"
                              }`}
                            >
                              <svg
                                width="10"
                                height="10"
                                viewBox="0 0 10 10"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M7.58573 6.94449C7.97626 7.33501 8.53028 7.41416 8.82317 7.12127C9.11606 6.82837 9.03692 6.27435 8.64639 5.88383L5.81797 3.0554C5.57464 2.81208 5.26784 2.68964 5.00029 2.70275C4.73263 2.68949 4.42564 2.81193 4.18218 3.05538L1.35376 5.88381C0.963233 6.27433 0.884088 6.82835 1.17698 7.12125C1.46987 7.41414 2.02389 7.33499 2.41442 6.94447L5.00007 4.35882L7.58573 6.94449Z"
                                  fill="#4B5563"
                                />
                              </svg>
                            </div>
                          </div>
                        </Disclosure.Button>
                        <Disclosure.Panel>
                          <div className="flex flex-col gap-2">
                            {navigationItem.children?.map((child) => (
                              <Link
                                className={`w-full h-[40px] flex items-center select-none cursor-pointer ${
                                  !expandable || isExpanded
                                    ? "pl-[22px]"
                                    : "justify-center"
                                }`}
                                id={child.id}
                                to={child.link}
                                key={child.id}
                              >
                                <div
                                  className={`rounded flex items-center w-full gap-2 ${
                                    isExpanded &&
                                    location.pathname.includes(child.link)
                                      ? "bg-[#6366F1] text-white"
                                      : ""
                                  }`}
                                >
                                  <div
                                    className={`flex items-center justify-center min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded ${
                                      !isExpanded &&
                                      location.pathname.includes(child.link)
                                        ? "bg-[#6366F1]"
                                        : ""
                                    }`}
                                  >
                                    <img
                                      className={`${
                                        location.pathname.includes(
                                          child.link
                                        ) && "invert"
                                      }`}
                                      src={child.imgIcon}
                                    />
                                  </div>
                                  <span
                                    className={`${
                                      expandable
                                        ? "notexapndable scale-0 transition-[width] delay-1000"
                                        : ""
                                    } whitespace-nowrap inline-block overflow-hidden ${
                                      !isExpanded && "hidden"
                                    }`}
                                  >
                                    {child.text}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </Disclosure.Panel>
                      </div>
                    )}
                  </Disclosure>
                </div>
              ) : (
                <Link
                  className={`w-full h-[40px] flex items-center select-none cursor-pointer ${
                    expandable && isExpanded ? "" : "justify-center"
                  }`}
                  to={navigationItem.link}
                  id={navigationItem.id}
                >
                  <div
                    className={`rounded flex items-center w-full gap-2 ${
                      isExpanded &&
                      location.pathname.includes(navigationItem.link)
                        ? "bg-[#6366F1] text-white"
                        : ""
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center min-w-[30px] min-h-[30px]  max-w-[30px] max-h-[30px] rounded ${
                        !isExpanded &&
                        location.pathname.includes(navigationItem.link)
                          ? "bg-[#6366F1]"
                          : ""
                      }`}
                    >
                      <img
                        className={`${
                          location.pathname.includes(navigationItem.link) &&
                          "invert"
                        }`}
                        src={navigationItem.imgIcon}
                      />
                    </div>
                    <span
                      className={`${
                        expandable
                          ? "notexapndable scale-0 transition-[width] delay-1000"
                          : ""
                      } whitespace-nowrap ${
                        expandable && !isExpanded && "hidden"
                      }`}
                    >
                      {navigationItem.text}
                    </span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
export default ResponsiveDrawer;
