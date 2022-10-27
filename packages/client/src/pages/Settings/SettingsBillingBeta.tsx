import { Fragment, useState } from "react";
import { Dialog, Switch, Transition } from "@headlessui/react";
import {
  ArrowLeftOnRectangleIcon,
  Bars3BottomLeftIcon,
  BellIcon,
  BriefcaseIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  CogIcon,
  DocumentMagnifyingGlassIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  UsersIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import LaudspeakerIcon from "../../assets/images/laudspeakerIcon.svg";
import SaveSettings from "components/SaveSettings";
import { ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import Header from "components/Header";
import { useNavigate } from "react-router-dom";

const tabs = [
  { name: "Account", href: "/settings", current: false },
  { name: "API", href: "/settings/api", current: false },
  { name: "Email", href: "/settings/email", current: false },
  { name: "SMS", href: "/settings/sms", current: false },
  { name: "Slack", href: "/settings/slack", current: false },
  { name: "Events", href: "/settings/events", current: false },
  { name: "Plan", href: "/settings/plan", current: false },
  { name: "Billing", href: "", current: true },
  { name: "Team Members", href: "/settings/team", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsBillingBeta() {
  const [automaticTimezoneEnabled, setAutomaticTimezoneEnabled] =
    useState(true);
  const [autoUpdateApplicantDataEnabled, setAutoUpdateApplicantDataEnabled] =
    useState(false);
  const navigate = useNavigate();

  return (
    <>
      <div>
        {/* Content area */}
        <div className="">
          <div className="mx-auto flex flex-col">
            <Header />
            <main className="flex-1">
              <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
                <div className="pt-10 pb-16">
                  <div className="px-4 sm:px-6 md:px-0">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                      Settings
                    </h1>
                  </div>
                  <div className="px-4 sm:px-6 md:px-0">
                    <div className="py-6">
                      {/* Tabs */}
                      <div className="lg:hidden">
                        <label htmlFor="selected-tab" className="sr-only">
                          Select a tab
                        </label>
                        <select
                          id="selected-tab"
                          name="selected-tab"
                          className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm"
                          defaultValue={tabs.find((tab) => tab.current)?.href}
                          onChange={(ev) => navigate(ev.currentTarget.value)}
                        >
                          {tabs.map((tab) => (
                            <option key={tab.name} value={tab.href}>
                              {tab.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="hidden lg:block">
                        <div className="border-b border-gray-200">
                          <nav className="-mb-px flex space-x-8">
                            {tabs.map((tab) => (
                              <a
                                key={tab.name}
                                href={tab.href}
                                className={classNames(
                                  tab.current
                                    ? "border-cyan-500 text-cyan-600"
                                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700",
                                  "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                                )}
                              >
                                {tab.name}
                              </a>
                            ))}
                          </nav>
                        </div>
                      </div>

                      {/* Description list with inline editing */}
                      <div className="mt-10 divide-y divide-gray-200">
                        <div className="rounded-md bg-yellow-50 p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <ExclamationTriangleIcon
                                className="h-5 w-5 text-yellow-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                No Payment Methods
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>
                                  You are currently using a free version of
                                  Laudspeaker, which comes with 1000 free
                                  messages per month. To get more, add a payment
                                  method or upgrade to one of our paid plans.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
