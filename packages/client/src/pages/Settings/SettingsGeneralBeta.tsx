import Header from "components/Header";
import { ChangeEvent, Fragment, useEffect, useState } from "react";
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
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { Input } from "components/Elements";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const tabs = [
  { name: "Account", href: "", current: true },
  { name: "API", href: "/settings/api", current: false },
  { name: "Email", href: "/settings/email", current: false },
  { name: "SMS", href: "/settings/sms", current: false },
  { name: "Slack", href: "/settings/slack", current: false },
  { name: "Events", href: "/settings/events", current: false },
  { name: "Plan", href: "/settings/plan", current: false },
  { name: "Billing", href: "/settings/billing", current: false },
  { name: "Team Members", href: "/settings/team", current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsGeneralBeta() {
  const [initialData, setInitialData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    verifyNewPassword: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    verifyNewPassword: "",
  });
  const navigate = useNavigate();

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({
    firstName: [],
    lastName: [],
    email: [],
    currentPassword: [],
    newPassword: [],
    verifyNewPassword: [],
  });

  useEffect(() => {
    const newErrors: { [key: string]: string[] } = {
      firstName: [],
      lastName: [],
      email: [],
      currentPassword: [],
      newPassword: [],
      verifyNewPassword: [],
    };

    if (
      formData.firstName !== initialData.firstName &&
      formData.firstName.length === 0
    )
      newErrors.firstName.push("First name should be defined");

    if (
      (formData.lastName !== initialData.lastName &&
        formData.lastName.length) === 0
    )
      newErrors.lastName.push("Last name should be defined");

    if (formData.email !== initialData.email) {
      if (formData.email.length === 0)
        newErrors.email.push("Email should be defined");

      if (
        !formData.email.match(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/)
      )
        newErrors.email.push("Email should be valid");
    }

    if (formData.newPassword !== initialData.newPassword) {
      if (formData.newPassword !== formData.verifyNewPassword)
        newErrors.verifyNewPassword.push("Passwords should match");

      if (formData.newPassword && !formData.currentPassword)
        newErrors.currentPassword.push("Passwords should be provided");

      if (formData.newPassword.length < 8)
        newErrors.newPassword.push(
          "Passwords should have at least 8 characters"
        );
    }

    setErrors(newErrors);
  }, [formData]);

  const isError = Object.values(errors).some((arr) => arr.length > 0);

  const handleFormDataChange = (e: any) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const { firstName, lastName, email } = data;
      setFormData({ ...formData, firstName, lastName, email });
      setInitialData({ ...formData, firstName, lastName, email });
    })();
  }, []);

  const handleSubmit = async () => {
    try {
      await ApiService.patch({
        url: "/accounts",
        options: {
          ...formData,
          currentPassword: formData.currentPassword || undefined,
          newPassword: formData.newPassword || undefined,
          verifyNewPassword: formData.verifyNewPassword || undefined,
        },
      });
    } catch (e: any) {
      toast.error(e.response.data.message || "Unexpected error!", {
        position: "bottom-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

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
                        <div className="space-y-1">
                          <h3 className="text-lg font-medium leading-6 text-gray-900">
                            Profile and Security
                          </h3>
                          <p className="max-w-2xl text-sm text-gray-500">
                            Keep your information up to date.
                          </p>
                        </div>
                        <div className="mt-6">
                          <dl className="divide-y divide-gray-200">
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                First Name
                              </dt>
                              <dd className="relative">
                                <Input
                                  type="text"
                                  value={formData.firstName}
                                  onChange={handleFormDataChange}
                                  name="firstName"
                                  id="firstName"
                                  placeholder="Mahamad"
                                  className={classNames(
                                    errors.firstName.length > 0
                                      ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                      : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                  )}
                                />
                                {errors.firstName.length > 0 && (
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                    <ExclamationCircleIcon
                                      className="h-5 w-5 text-red-500"
                                      aria-hidden="true"
                                    />
                                  </div>
                                )}
                              </dd>
                              {errors.firstName.map((item) => (
                                <p
                                  className="mt-2 text-sm text-red-600"
                                  id="email-error"
                                  key={item}
                                >
                                  {item}
                                </p>
                              ))}
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                Last Name
                              </dt>
                              <dd className="relative">
                                <Input
                                  type="text"
                                  value={formData.lastName}
                                  onChange={handleFormDataChange}
                                  name="lastName"
                                  id="lastName"
                                  placeholder="Charawi"
                                  className={classNames(
                                    errors.lastName.length > 0
                                      ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                      : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                  )}
                                />
                                {errors.lastName.length > 0 && (
                                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                    <ExclamationCircleIcon
                                      className="h-5 w-5 text-red-500"
                                      aria-hidden="true"
                                    />
                                  </div>
                                )}
                              </dd>
                              {errors.lastName.map((item) => (
                                <p
                                  className="mt-2 text-sm text-red-600"
                                  id="email-error"
                                  key={item}
                                >
                                  {item}
                                </p>
                              ))}
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                Email
                              </dt>
                              <dd>
                                <div className="relative">
                                  {" "}
                                  <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={handleFormDataChange}
                                    name="email"
                                    id="email"
                                    placeholder="you@example.com"
                                    className={classNames(
                                      errors.email.length > 0
                                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                    )}
                                  />
                                  {errors.email.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>
                                {errors.email.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                              </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                Current Password
                              </dt>
                              <dd>
                                <div className="relative rounded-md ">
                                  <Input
                                    type="password"
                                    value={formData.currentPassword}
                                    onChange={handleFormDataChange}
                                    name="currentPassword"
                                    id="currentPassword"
                                    className={classNames(
                                      errors.currentPassword.length > 0
                                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                    )}
                                    aria-invalid="true"
                                    aria-describedby="password-error"
                                  />
                                  {errors.currentPassword.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>
                                {errors.currentPassword.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                              </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                New Password
                              </dt>
                              <dd>
                                <div className="relative rounded-md ">
                                  <Input
                                    type="password"
                                    value={formData.newPassword}
                                    onChange={handleFormDataChange}
                                    name="newPassword"
                                    id="newPassword"
                                    className={classNames(
                                      errors.newPassword.length > 0
                                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                    )}
                                    aria-invalid="true"
                                    aria-describedby="password-error"
                                  />
                                  {errors.newPassword.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>
                                {errors.newPassword.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                              </dd>
                            </div>
                            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
                              <dt className="text-sm font-medium text-gray-500">
                                Verify New Password
                              </dt>
                              <dd>
                                <div className="relative rounded-md ">
                                  <Input
                                    type="password"
                                    value={formData.verifyNewPassword}
                                    onChange={handleFormDataChange}
                                    name="verifyNewPassword"
                                    id="verifyNewPassword"
                                    className={classNames(
                                      errors.verifyNewPassword.length > 0
                                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                                    )}
                                    aria-invalid="true"
                                    aria-describedby="password-error"
                                  />
                                  {errors.verifyNewPassword.length > 0 && (
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                                      <ExclamationCircleIcon
                                        className="h-5 w-5 text-red-500"
                                        aria-hidden="true"
                                      />
                                    </div>
                                  )}
                                </div>
                                {errors.verifyNewPassword.map((item) => (
                                  <p
                                    className="mt-2 text-sm text-red-600"
                                    id="email-error"
                                    key={item}
                                  >
                                    {item}
                                  </p>
                                ))}
                              </dd>
                            </div>
                            <SaveSettings
                              disabled={isError}
                              onClick={handleSubmit}
                            />
                          </dl>
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
