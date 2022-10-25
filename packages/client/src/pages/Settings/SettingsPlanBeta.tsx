import { useState } from "react";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import Header from "components/Header";
import { useNavigate } from "react-router-dom";

const tabs = [
  { name: "Account", href: "/settings", current: false },
  { name: "API", href: "/settings/api", current: false },
  { name: "Email", href: "/settings/email", current: false },
  { name: "SMS", href: "/settings/sms", current: false },
  { name: "Slack", href: "/settings/slack", current: false },
  { name: "Events", href: "/settings/events", current: false },
  { name: "Plan", href: "", current: true },
  { name: "Billing", href: "/settings/billing", current: false },
  { name: "Team Members", href: "/settings/team", current: false },
];

const mailingLists = [
  {
    id: 1,
    title: "Free/Self Hosted",
    description: "Free forever, with community support",
    users: "1000 Messages/Month",
  },
  {
    id: 2,
    title: "Cloud",
    description: "24/7 Support, No Maintenance",
    users: " $2 per 1000 Messages/Month",
  },
  {
    id: 3,
    title: "Enterprise",
    description: "Dedicated Premium Support, Advanced Permissions",
    users: "Contact Us for Pricing",
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsPlanBeta() {
  const [selectedMailingLists, setSelectedMailingLists] = useState(
    mailingLists[0]
  );
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
                          defaultValue={tabs.find((tab) => tab.current)?.name}
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
                      <div className="space-y-10 mt-10">
                        <RadioGroup
                          value={selectedMailingLists}
                          onChange={setSelectedMailingLists}
                        >
                          <RadioGroup.Label className="text-base font-medium text-gray-900">
                            Select a Plan
                          </RadioGroup.Label>

                          <div className="mt-4 grid grid-cols-1 gap-y-6 sm:grid-cols-3 sm:gap-x-4">
                            {mailingLists.map((mailingList) => (
                              <RadioGroup.Option
                                key={mailingList.id}
                                value={mailingList}
                                className={({ checked, active }) =>
                                  classNames(
                                    checked
                                      ? "border-transparent"
                                      : "border-gray-300",
                                    active
                                      ? "border-cyan-500 ring-2 ring-cyan-500"
                                      : "",
                                    "relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none"
                                  )
                                }
                              >
                                {({ checked, active }) => (
                                  <>
                                    <span className="flex flex-1">
                                      <span className="flex flex-col">
                                        <RadioGroup.Label
                                          as="span"
                                          className="block text-sm font-medium text-gray-900"
                                        >
                                          {mailingList.title}
                                        </RadioGroup.Label>
                                        <RadioGroup.Description
                                          as="span"
                                          className="mt-1 flex items-center text-sm text-gray-500"
                                        >
                                          {mailingList.description}
                                        </RadioGroup.Description>
                                        <RadioGroup.Description
                                          as="span"
                                          className="mt-6 text-sm font-medium text-gray-900"
                                        >
                                          {mailingList.users}
                                        </RadioGroup.Description>
                                      </span>
                                    </span>
                                    <CheckCircleIcon
                                      className={classNames(
                                        !checked ? "invisible" : "",
                                        "h-5 w-5 text-cyan-600"
                                      )}
                                      aria-hidden="true"
                                    />
                                    <span
                                      className={classNames(
                                        active ? "border" : "border-2",
                                        checked
                                          ? "border-cyan-500"
                                          : "border-transparent",
                                        "pointer-events-none absolute -inset-px rounded-lg"
                                      )}
                                      aria-hidden="true"
                                    />
                                  </>
                                )}
                              </RadioGroup.Option>
                            ))}
                          </div>
                        </RadioGroup>
                        <div className="space-y-10">
                          <fieldset>
                            <legend className="space-y-10 block text-sm font-medium text-gray-700">
                              Card Details
                            </legend>
                            <div className="mt-1 -space-y-px rounded-md bg-white shadow-sm">
                              <div>
                                <label
                                  htmlFor="card-number"
                                  className="sr-only"
                                >
                                  Card number
                                </label>
                                <input
                                  type="text"
                                  name="card-number"
                                  id="card-number"
                                  className="relative block w-full rounded-none rounded-t-md border-gray-300 bg-transparent focus:z-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                  placeholder="Card number"
                                />
                              </div>
                              <div className="flex -space-x-px">
                                <div className="w-1/2 min-w-0 flex-1">
                                  <label
                                    htmlFor="card-expiration-date"
                                    className="sr-only"
                                  >
                                    Expiration date
                                  </label>
                                  <input
                                    type="text"
                                    name="card-expiration-date"
                                    id="card-expiration-date"
                                    className="relative block w-full rounded-none rounded-bl-md border-gray-300 bg-transparent focus:z-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="MM / YY"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <label htmlFor="card-cvc" className="sr-only">
                                    CVC
                                  </label>
                                  <input
                                    type="text"
                                    name="card-cvc"
                                    id="card-cvc"
                                    className="relative block w-full rounded-none rounded-br-md border-gray-300 bg-transparent focus:z-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="CVC"
                                  />
                                </div>
                              </div>
                            </div>
                          </fieldset>
                          <fieldset className="mt-6 bg-white">
                            <legend className="block text-sm font-medium text-gray-700">
                              Billing address
                            </legend>
                            <div className="mt-1 -space-y-px rounded-md shadow-sm">
                              <div>
                                <label htmlFor="country" className="sr-only">
                                  Country
                                </label>
                                <select
                                  id="country"
                                  name="country"
                                  autoComplete="country-name"
                                  className="relative block w-full rounded-none rounded-t-md border-gray-300 bg-transparent focus:z-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                >
                                  <option>United States</option>
                                  <option>Canada</option>
                                  <option>Mexico</option>
                                </select>
                              </div>
                              <div>
                                <label
                                  htmlFor="postal-code"
                                  className="sr-only"
                                >
                                  ZIP / Postal code
                                </label>
                                <input
                                  type="text"
                                  name="postal-code"
                                  id="postal-code"
                                  autoComplete="postal-code"
                                  className="relative block w-full rounded-none rounded-b-md border-gray-300 bg-transparent focus:z-10 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                  placeholder="ZIP / Postal code"
                                />
                              </div>
                            </div>
                          </fieldset>
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
