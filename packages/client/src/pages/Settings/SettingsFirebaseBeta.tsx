import { RadioGroup } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { Input } from "components/Elements";
import SaveSettings from "components/SaveSettings";
import { ChangeEvent, FocusEvent, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useDebounce } from "react-use";
import ApiService from "services/api.service";

const memoryOptions: Record<
  string,
  { id: string; name: string; inStock: boolean }
> = {
  twilio: { id: "twilio", name: "Twilio", inStock: true },
  vonage: { id: "vonage", name: "Vonage", inStock: false },
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

export default function SettingsFirebaseBeta() {
  const [firebaseCredentialsPretty, setFirebaseCredentialsPretty] =
    useState("");

  const [formData, setFormData] = useState({
    firebaseCredentials: "",
  });

  const [showErrors, setShowErrors] = useState({
    firebaseCredentials: false,
  });

  const [firebaseErrors, setFirebaseErrors] = useState<{
    [key: string]: string[];
  }>({
    firebaseCredentials: [],
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await ApiService.get({ url: "/accounts" });
        const { firebaseCredentials } = data.workspace;
        setFormData({
          firebaseCredentials: firebaseCredentials || "",
        });
      } catch (e) {
        toast.error("Error while loading data");
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const newFirebaseErrors: { [key: string]: string[] } = {
      firebaseCredentials: [],
    };

    if (!formData.firebaseCredentials) {
      newFirebaseErrors.firebaseCredentials.push(
        "Firebase credentials must be defined"
      );
      setFirebaseCredentialsPretty("");
    } else {
      try {
        const parsedCredentials = JSON.parse(formData.firebaseCredentials);
        setFirebaseCredentialsPretty(
          JSON.stringify(parsedCredentials, undefined, 2)
        );

        if (!parsedCredentials.private_key) {
          newFirebaseErrors.firebaseCredentials.push(
            "Firebase credentials must contain private_key_id"
          );
        } else if (
          !parsedCredentials.private_key.startsWith(
            "-----BEGIN PRIVATE KEY-----\n"
          )
        ) {
          newFirebaseErrors.firebaseCredentials.push(
            "The private key is not formatted correctly. Please copy the private key from the Firebase console and paste it here. Contact support with questions."
          );
        }
      } catch (e) {
        newFirebaseErrors.firebaseCredentials.push(
          "Firebase credentials must be valid JSON"
        );
        setFirebaseCredentialsPretty(formData.firebaseCredentials);
      }
    }

    setFirebaseErrors(newFirebaseErrors);
  }, [formData]);

  const handleFormDataChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    // if (e.target.value.includes(" ")) {
    //   e.target.value = e.target.value.replaceAll(" ", "");
    //   toast.error("Value should not contain spaces!", {
    //     position: "bottom-center",
    //     autoClose: 5000,
    //     hideProgressBar: false,
    //     closeOnClick: true,
    //     pauseOnHover: true,
    //     draggable: true,
    //     progress: undefined,
    //     theme: "colored",
    //   });
    // }

    if (e.target.name === "firebaseCredentials") {
      try {
        const firebaseJson = JSON.parse(e.target.value.replace(/\n/g, "\\n"));
        e.target.value = JSON.stringify(firebaseJson);
      } catch (_) {
        // setFirebaseCredentialsPretty(e.target.value);
        // do nothing
      }
    }

    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBlur = (
    e: FocusEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setShowErrors({ ...showErrors, [e.target.name]: true });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await ApiService.patch({
        url: "/accounts",
        options: { ...formData },
      });
      setIsLoading(false);
    } catch (e) {
      toast.error("Unexpected error");
    }
  };

  const isError = Object.values(firebaseErrors).some((item) => item.length > 0);

  return (
    <>
      <div className="mt-10 divide-y divide-gray-200">
        <div className="mt-6">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5">
              <dt className="text-sm font-medium text-gray-500">
                Firebase Service Account (json)
              </dt>
              <dd>
                <div className="relative rounded-md min-w-[260px]">
                  <textarea
                    value={firebaseCredentialsPretty}
                    onChange={handleFormDataChange}
                    name="firebaseCredentials"
                    id="firebaseCredentials"
                    rows={20}
                    cols={50}
                    className={`rounded-md shadow-sm sm:text-sm  ${
                      showErrors.firebaseCredentials &&
                      firebaseErrors.firebaseCredentials.length > 0
                        ? "focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500"
                        : "border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                    }`}
                    onBlur={handleBlur}
                  />
                  {showErrors.firebaseCredentials &&
                    firebaseErrors.firebaseCredentials.length > 0 && (
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                        <ExclamationCircleIcon
                          className="h-5 w-5 text-red-500"
                          aria-hidden="true"
                        />
                      </div>
                    )}
                </div>
                {showErrors.firebaseCredentials &&
                  firebaseErrors.firebaseCredentials.map((item) => (
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
