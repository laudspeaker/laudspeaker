import { ChangeEvent, FocusEvent, useEffect, useState } from "react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { RadioGroup } from "@headlessui/react";
import ApiService from "services/api.service";
import { GenericButton, Input } from "components/Elements";
import { startPosthogImport } from "reducers/settings";
import { toast } from "react-toastify";

const memoryOptions = [
  { name: "Posthog", inStock: true },
  { name: "Segment", inStock: false },
  { name: "Rudderstack", inStock: false },
  { name: "Mixpanel", inStock: false },
  { name: "Amplitude", inStock: false },
  { name: "GA", inStock: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsEventsBeta() {
  const [mem, setMem] = useState(memoryOptions[0]);

  const [formData, setFormData] = useState<Record<string, string>>({
    posthogApiKey: "",
    posthogProjectId: "",
    posthogHostUrl: "app.posthog.com",
    posthogSmsKey: "",
    posthogEmailKey: "",
    posthogFirebaseDeviceTokenKey: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string[] }>({
    posthogApiKey: [],
    posthogProjectId: [],
    posthogHostUrl: [],
  });

  const [showErrors, setShowErrors] = useState({
    posthogApiKey: false,
    posthogProjectId: false,
    posthogHostUrl: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const newErrors: { [key: string]: string[] } = {
      posthogApiKey: [],
      posthogProjectId: [],
      posthogHostUrl: [],
    };

    if (!formData.posthogApiKey)
      newErrors.posthogApiKey.push("Should be provided");

    if (!formData.posthogProjectId)
      newErrors.posthogProjectId.push("Should be provided");

    if (!formData.posthogHostUrl)
      newErrors.posthogHostUrl.push("Should be provided");

    setErrors(newErrors);
  }, [formData]);

  useEffect(() => {
    (async () => {
      const { data } = await ApiService.get({ url: "/accounts" });
      const {
        posthogApiKey,
        posthogProjectId,
        posthogHostUrl,
        posthogSmsKey,
        posthogEmailKey,
        posthogFirebaseDeviceTokenKey,
      } = data;
      const newData = {
        posthogApiKey: posthogApiKey || "",
        posthogProjectId: posthogProjectId || "",
        posthogHostUrl: posthogHostUrl || "",
        posthogSmsKey: posthogSmsKey || "",
        posthogEmailKey: posthogEmailKey || "",
        posthogFirebaseDeviceTokenKey: posthogFirebaseDeviceTokenKey || "",
      };
      setFormData(newData);
    })();
  }, []);

  const isError = Object.values(errors).some((arr) => arr.length > 0);

  const handleFormDataChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: FocusEvent<HTMLInputElement>) => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: {
          posthogApiKey: formData.posthogApiKey || "",
          posthogProjectId: formData.posthogProjectId || "",
          posthogHostUrl: formData.posthogHostUrl || "",
        },
      });
      await startPosthogImport();
    } catch (e) {
      toast.error("Error while syncing");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    const options: Record<string, string[]> = {};
    for (const key of Object.keys(formData)) {
      options[key] = [formData[key]];
    }
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options,
      });
    } catch (e) {
      toast.error("Unexpected error!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="mt-10">
        <div className="space-y-1">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Select Your Events Provider
          </h3>
          <p className="max-w-2xl text-sm text-gray-500">
            For instructions on where to find these values, please see our
            documentation.
          </p>
        </div>
        <div className="space-y-10">
          <div className="flex items-center justify-between"></div>

          <RadioGroup value={mem} onChange={setMem} className="mt-2">
            <RadioGroup.Label className="sr-only">
              Choose a memory option{" "}
            </RadioGroup.Label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {memoryOptions.map((option) => (
                <RadioGroup.Option
                  key={option.name}
                  value={option}
                  className={({ active, checked }) =>
                    classNames(
                      option.inStock
                        ? "cursor-pointer focus:outline-none"
                        : "opacity-25 cursor-not-allowed",
                      active ? "ring-2 ring-offset-2 ring-cyan-500" : "",
                      checked
                        ? "bg-cyan-600 border-transparent text-white hover:bg-cyan-700"
                        : "bg-white border-gray-200 text-gray-900 hover:bg-gray-50",
                      "border rounded-md py-3 px-3 flex items-center justify-center text-sm font-medium sm:flex-1"
                    )
                  }
                  disabled={!option.inStock}
                >
                  <RadioGroup.Label as="span">{option.name}</RadioGroup.Label>
                </RadioGroup.Option>
              ))}
            </div>
          </RadioGroup>
        </div>
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Posthog API Key
              </dt>
              <dd>
                <div className="relative rounded-md ">
                  <Input
                    type="password"
                    value={formData.posthogApiKey}
                    onChange={handleFormDataChange}
                    name="posthogApiKey"
                    id="posthogApiKey"
                    className={classNames(
                      showErrors.posthogApiKey &&
                        errors.posthogApiKey.length > 0
                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                    )}
                    aria-invalid="true"
                    aria-describedby="password-error"
                    onBlur={handleBlur}
                  />
                  {showErrors.posthogApiKey && errors.posthogApiKey.length > 0 && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                {showErrors.posthogApiKey &&
                  errors.posthogApiKey.map((item) => (
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
                Posthog Project ID
              </dt>
              <dd>
                <div className="relative">
                  <Input
                    type="text"
                    value={formData.posthogProjectId}
                    onChange={handleFormDataChange}
                    name="posthogProjectId"
                    id="posthogProjectId"
                    className={classNames(
                      showErrors.posthogProjectId &&
                        errors.posthogProjectId.length > 0
                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
                    )}
                    placeholder="1"
                    onBlur={handleBlur}
                  />
                  {showErrors.posthogProjectId &&
                    errors.posthogProjectId.length > 0 && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                </div>
                {showErrors.posthogProjectId &&
                  errors.posthogProjectId.map((item) => (
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
              <dt className="text-sm font-medium text-gray-500">Posthog URL</dt>
              <div className="mt-1 rounded-md shadow-sm">
                <div className="relative flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <Input
                    type="text"
                    value={formData.posthogHostUrl}
                    onChange={handleFormDataChange}
                    name="posthogHostUrl"
                    id="posthogHostUrl"
                    className={classNames(
                      showErrors.posthogHostUrl &&
                        errors.posthogHostUrl.length > 0
                        ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                        : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 ",
                      "!m-0"
                    )}
                    onBlur={handleBlur}
                  />
                  {showErrors.posthogHostUrl &&
                    errors.posthogHostUrl.length > 0 && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                </div>
                {showErrors.posthogHostUrl &&
                  errors.posthogHostUrl.map((item) => (
                    <p
                      className="mt-2 text-sm text-red-600"
                      id="email-error"
                      key={item}
                    >
                      {item}
                    </p>
                  ))}
              </div>
            </div>
            <GenericButton
              onClick={() =>
                toast.promise(handleSync, {
                  pending: { render: "Sync in progress!", type: "info" },
                  success: { render: "Sync success!", type: "success" },
                  error: { render: "Sync failed!", type: "error" },
                })
              }
              disabled={isError || isLoading}
              customClasses={`inline-flex mb-[10px] items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 ${
                isError ? "grayscale" : ""
              }`}
              loading={isLoading}
            >
              Sync
            </GenericButton>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Name of SMS/Phone number field on your Posthog person
              </dt>
              <dd>
                <Input
                  type="text"
                  value={formData.posthogSmsKey}
                  onChange={handleFormDataChange}
                  name="posthogSmsKey"
                  id="posthogSmsKey"
                  className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="$phoneNumber"
                />
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Name of Email address field on your Posthog person
              </dt>
              <dd>
                <Input
                  type="text"
                  value={formData.posthogEmailKey}
                  onChange={handleFormDataChange}
                  name="posthogEmailKey"
                  id="posthogEmailKey"
                  className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="$email"
                />
              </dd>
            </div>

            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Name of Firebase Device Token field on your Posthog person
              </dt>
              <dd>
                <Input
                  type="text"
                  value={formData.posthogFirebaseDeviceTokenKey}
                  onChange={handleFormDataChange}
                  name="posthogFirebaseDeviceTokenKey"
                  id="posthogFirebaseDeviceTokenKey"
                  className="rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="deviceToken"
                />
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-10 sm:py-5 sm:pt-5">
              <span className="flex-grow">
                <GenericButton
                  onClick={handleSubmit}
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Save
                </GenericButton>
              </span>
            </div>
          </dl>
        </div>
      </div>
    </>
  );
}
