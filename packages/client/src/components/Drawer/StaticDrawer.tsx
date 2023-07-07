import React, {
  FC,
  Fragment,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { dataSubArray } from "./Drawer.fixtures";
import { AuthState } from "../../reducers/auth.reducer";
import { useLocation, useNavigate } from "react-router-dom";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import LaudspeakerIcon from "../../assets/images/icon_cyan_cyan.svg";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useDispatch } from "react-redux";
import { toggleNavbar } from "reducers/settings.reducer";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { refreshFlowBuilder } from "reducers/flow-builder.reducer";
import laudspeakerIcon from "../../assets/images/laudspeakerHeaderIcon.svg";
import useTimedHover from "hooks/useTimedHover";
import useHover from "hooks/useHover";
import RenderWhenOn from "components/splitFeature/RenderWhenOn";
import { useTreatments } from "@splitsoftware/splitio-react";

const navigation = dataSubArray;

const StaticDrawer = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const treatments = useTreatments(["website_name"]);

  const websiteConfig = JSON.parse(treatments.website_name.config as string);

  return (
    <div
      className={`block !min-w-[200px] !w-[200px] px-[10px] text-[14px] text-[#111827] leading-[22px] font-normal z-[9999999999] bg-[#F3F4F6] border-r-[1px] border-[#E5E7EB] h-screen font-roboto`}
    >
      <div className="flex flex-col gap-[8px] ">
        <div className={`w-full h-[50px] flex items-center gap-[20px]`}>
          <div className="min-w-[30px] min-h-[30px] flex items-center justify-center">
            <img
              className="min-w-[15px] min-h-[20px] max-w-[50px] max-h-[50px]"
              src={websiteConfig?.logo || laudspeakerIcon}
            />
          </div>
          <h1>{websiteConfig?.name || "Website"}</h1>
        </div>
        <div className="w-full flex flex-col gap-[8px] ">
          {navigation.map((navigationItem) => (
            <RenderWhenOn
              featureName={navigationItem.id}
              key={navigationItem.id}
            >
              <div
                className="w-full flex justify-center items-center"
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
                        <div className="flex flex-col gap-[8px]">
                          <Disclosure.Button className="w-full">
                            <div
                              className={`relative w-full h-[40px] flex items-center gap-[16px] select-none cursor-pointer`}
                            >
                              <div className="flex items-center justify-center min-w-[30px] min-h-[30px]  max-w-[30px] max-h-[30px]  rounded-[4px]">
                                <img src={navigationItem.imgIcon} />
                              </div>
                              <span className={`whitespace-nowrap`}>
                                {navigationItem.text}
                              </span>
                              <div
                                className={`absolute top-1/2 -translate-y-1/2 right-[5px] ${
                                  open ? "" : "rotate-180"
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
                            <div className="flex flex-col gap-[8px]">
                              {navigationItem.children.map((child) => (
                                <RenderWhenOn
                                  featureName={child.id}
                                  key={child.id}
                                >
                                  <div
                                    className={`w-full h-[40px] flex items-center select-none cursor-pointer pl-[22px]`}
                                    onClick={() => navigate(child.link)}
                                    key={child.id}
                                  >
                                    <div
                                      className={`rounded-[4px] flex items-center w-full gap-[16px] ${
                                        location.pathname.includes(child.link)
                                          ? "bg-[#6366F1] text-white"
                                          : ""
                                      }`}
                                    >
                                      <div
                                        className={`flex items-center justify-center min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded-[4px]`}
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
                                      <span className={`whitespace-nowrap`}>
                                        {child.text}
                                      </span>
                                    </div>
                                  </div>
                                </RenderWhenOn>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </div>
                      )}
                    </Disclosure>
                  </div>
                ) : (
                  <div
                    className={`w-full h-[40px] flex items-center select-none cursor-pointer `}
                    onClick={() => navigate(navigationItem.link)}
                  >
                    <div
                      className={`rounded-[4px] flex items-center w-full gap-[16px] ${
                        location.pathname.includes(navigationItem.link)
                          ? "bg-[#6366F1] text-white"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded-[4px]`}
                      >
                        <img
                          className={`${
                            location.pathname.includes(navigationItem.link) &&
                            "invert"
                          }`}
                          src={navigationItem.imgIcon}
                        />
                      </div>
                      <span className={`whitespace-nowrap`}>
                        {navigationItem.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </RenderWhenOn>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StaticDrawer;
