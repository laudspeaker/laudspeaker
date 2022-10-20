import { FormControl, FormGroup } from "@mui/material";
import { useEffect, useState } from "react";
import { ISignUpForm } from "reducers/auth";
import { GenericButton } from "components/Elements";
import ApiService from "services/api.service";
import { toast } from "react-toastify";

const fetchValues = async () => {
  const response = await ApiService.get({ url: "/accounts/settings" });
  const { data, status } = response;
  if (status !== 200) console.error(data);
  return data;
};

const updateApiKey = async () => {
  const response = await ApiService.patch({
    url: "/accounts/keygen",
    options: {
      fakeAPI: false,
    },
  });

  const { data, status } = response;
  if (status !== 200) console.error(data);
  return data;
};

const updateValues = async (values: Omit<ISignUpForm, "email">) => {
  const { password, confirmPassword, ...rest } = values;
  const response = await ApiService.patch({
    url: "/accounts",
    options: {
      ...rest,
      password: password || undefined,
      fakeAPI: false,
    },
  });

  const { data, status } = response;
  if (status !== 200) console.error(data);
  return data;
};

const ProfileForm = () => {
  const [values, setValues] = useState<Omit<ISignUpForm, "email">>({
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [storedValues, setStoredValues] = useState<
    Omit<ISignUpForm, "email" | "password" | "confirmPassword">
  >({
    firstName: "",
    lastName: "",
  });

  const [privateAPIKey, setPrivateAPIKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);

  useEffect(() => {
    setIsLoading(true);
    fetchValues()
      .then((data) => {
        const { apiKey, ...newValues } = data;
        setPrivateAPIKey(apiKey);
        setValues({ ...values, ...newValues });
        setStoredValues({ ...values, ...newValues });
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (isCopied) {
      toast.success("Copied to clipboard", {
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
        progress: undefined,
        theme: "colored",
        className: "!bg-emerald-500",
        onClose: () => setIsCopied(false),
      });
    }

    if (isError) {
      toast.error(errorMessages[0], {
        position: "bottom-center",
        hideProgressBar: true,
        closeOnClick: false,
        onClose: () => setIsError(false),
        closeButton: false,
        pauseOnHover: true,
        draggable: false,
        progress: undefined,
        theme: "colored",
      });
    }
  }, [isError, isCopied]);

  const handleSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (values.password != values.confirmPassword) return;
    setIsLoading(true);
    updateValues(values)
      .then((data) => {
        const { apiKey, ...updatedValues } = data;
        setValues({ ...values, ...updatedValues });
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleChangeApiKey = () => {
    setIsLoading(true);
    updateApiKey()
      .then((apiKey) => {
        setPrivateAPIKey(apiKey);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setIsLoading(false);
      });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = {
      ...values,
      [e.target.name]: e.target.value,
    };

    setValues(newValues);

    const newErrors: string[] = [];

    if (newValues.password !== newValues.confirmPassword)
      newErrors.push("Passwords must match");
    if (newValues.password.length > 0 && newValues.password.length < 8)
      newErrors.push("Password length must be at least 8 ");

    setErrorMessages(newErrors);
    setIsError(newErrors.length > 0);
  };

  return (
    <FormGroup onSubmit={handleSubmit}>
      <div className="mb-2">
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700"
        >
          First Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="firstName"
            id="firstName"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            placeholder="Enter your first name"
            required
            value={values.firstName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="mb-2">
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700"
        >
          Last Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="lastName"
            id="lastName"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            placeholder="Enter your last name"
            required
            value={values.lastName}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="mb-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <div className="mt-1">
          <input
            type="password"
            name="password"
            id="password"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            placeholder="Enter new password"
            required
            value={values.password}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <div className="mb-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Password Confirmation
        </label>
        <div className="mt-1">
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm"
            placeholder="Enter new password"
            required
            value={values.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
          />
        </div>
      </div>
      <FormControl
        variant="standard"
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div className="flex flex-col w-[65%]">
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Private API key
            </label>
            <div className="mt-1">
              <div
                style={{
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => {
                  navigator.clipboard.writeText(privateAPIKey);
                  setIsCopied(true);
                }}
              >
                {privateAPIKey}
              </div>
            </div>
          </div>
        </div>
        <GenericButton
          style={{ width: "30%", height: "46px" }}
          onClick={handleChangeApiKey}
          disabled={isLoading}
        >
          Refresh
        </GenericButton>
      </FormControl>
      <FormControl variant="standard" sx={{ marginBottom: "27px" }}>
        <GenericButton
          style={{
            width: "277px",

            marginTop: "27px",
            background:
              "linear-gradient(90deg, #6BCDB5 21.76%, #307179 49.69%, #122F5C 84.12%)",
          }}
          onClick={handleSubmit}
          disabled={
            isLoading ||
            (storedValues.firstName === values.firstName &&
              storedValues.lastName === values.lastName &&
              !values.password &&
              !values.confirmPassword) ||
            values.password !== values.confirmPassword ||
            (values.password.length > 0 && values.password.length < 8)
          }
        >
          Save
        </GenericButton>
      </FormControl>
    </FormGroup>
  );
};

export default ProfileForm;
