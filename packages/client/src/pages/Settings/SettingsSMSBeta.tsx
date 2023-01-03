import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Input } from "components/Elements";
import SaveSettings from "components/SaveSettings";
import { ChangeEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";

export default function SettingsSMSBeta() {
  const [formData, setFormData] = useState({
    smsAccountSid: "",
    smsAuthToken: "",
    smsFrom: "",
  });

  const [showErrors, setShowErrors] = useState({
    smsAccountSid: false,
    smsAuthToken: false,
    smsFrom: false,
  });

  const [smsErrors, setSmsErrors] = useState<{
    [key: string]: string[];
  }>({
    smsAccountSid: [],
    smsAuthToken: [],
    smsFrom: [],
  });

  const [possibleNumbers, setPossibleNumbers] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.get({ url: "/accounts" });
        const { smsAccountSid, smsAuthToken, smsFrom } = data;
        setFormData({
          smsAccountSid: smsAccountSid || "",
          smsAuthToken: smsAuthToken || "",
          smsFrom: smsFrom || "",
        });
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const newSmsErrors: { [key: string]: string[] } = {
      smsAccountSid: [],
      smsAuthToken: [],
      smsFrom: [],
    };

    if (!formData.smsAccountSid) {
      newSmsErrors.smsAccountSid.push("Account sid must be defined");
    }

    if (!formData.smsAuthToken) {
      newSmsErrors.smsAuthToken.push("Auth token must be defined");
    }

    if (!formData.smsFrom) {
      newSmsErrors.smsFrom.push("Sms from must be defined");
    }
    setSmsErrors(newSmsErrors);
  }, [formData]);

  const loadPossibleNumbers = async (
    smsAccountSid: string,
    smsAuthToken: string
  ) => {
    const { data } = await ApiService.get({
      url: `/sms/possible-phone-numbers?smsAccountSid=${smsAccountSid}&smsAuthToken=${smsAuthToken}`,
    });

    setPossibleNumbers(data || []);
  };

  useDebounce(
    () => {
      if (formData.smsAccountSid && formData.smsAuthToken)
        loadPossibleNumbers(formData.smsAccountSid, formData.smsAuthToken);
    },
    1000,
    [formData]
  );

  const handleFormDataChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (e.target.value.includes(" ")) {
      e.target.value = e.target.value.replaceAll(" ", "");
      toast.error("Value should not contain spaces!", {
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (e: any) => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: { ...formData },
      });
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Unexpected error");
    } finally {
      setIsLoading(false);
    }
  };

  const isError = Object.values(smsErrors).some((item) => item.length > 0);

  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Twillio account sid
              </dt>
              <dd>
                <div className="relative rounded-md min-w-[260px]">
                  <Input
                    type="text"
                    value={formData.smsAccountSid}
                    onChange={handleFormDataChange}
                    name="smsAccountSid"
                    id="smsAccountSid"
                    className={`rounded-md shadow-sm sm:text-sm ${
                      showErrors.smsAccountSid &&
                      smsErrors.smsAccountSid.length > 0
                        ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                        : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                    }`}
                    onBlur={handleBlur}
                  />
                  {showErrors.smsAccountSid &&
                    smsErrors.smsAccountSid.length > 0 && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                </div>
                {showErrors.smsAccountSid &&
                  smsErrors.smsAccountSid.map((item) => (
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
                Twillio auth token
              </dt>
              <dd>
                <div className="relative rounded-md min-w-[260px]">
                  <Input
                    type="text"
                    value={formData.smsAuthToken}
                    onChange={handleFormDataChange}
                    name="smsAuthToken"
                    id="smsAuthToken"
                    className={`rounded-md shadow-sm sm:text-sm ${
                      showErrors.smsAuthToken &&
                      smsErrors.smsAuthToken.length > 0
                        ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                        : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                    }`}
                    onBlur={handleBlur}
                  />
                  {showErrors.smsAuthToken &&
                    smsErrors.smsAuthToken.length > 0 && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                </div>
                {showErrors.smsAuthToken &&
                  smsErrors.smsAuthToken.map((item) => (
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
              <dt className="text-sm font-medium text-gray-500">Sms From</dt>
              <dd>
                <div className="relative rounded-md min-w-[260px]">
                  <select
                    id="smsFrom"
                    name="smsFrom"
                    disabled={
                      !formData.smsAccountSid ||
                      !formData.smsAuthToken ||
                      possibleNumbers.length === 0
                    }
                    value={formData.smsFrom}
                    onChange={handleFormDataChange}
                    className={`mt-1 block w-full rounded-md py-2 pl-3 pr-10 text-base focus:outline-none sm:text-sm ${
                      smsErrors.smsFrom.length > 0 && showErrors.smsFrom
                        ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                        : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                    }`}
                    onBlur={handleBlur}
                  >
                    <option value={formData.smsFrom}>{formData.smsFrom}</option>
                    {possibleNumbers.map((item) => (
                      <option value={item}>{item}</option>
                    ))}
                  </select>
                  {showErrors.smsFrom && smsErrors.smsFrom.length > 0 && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                      <ExclamationCircleIcon
                        className="h-5 w-5 text-red-500"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </div>
                {showErrors.smsFrom &&
                  smsErrors.smsFrom.map((item) => (
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
              disabled={isError || isLoading}
              onClick={handleSubmit}
            />
          </dl>
        </div>
      </div>
    </>
  );
}
