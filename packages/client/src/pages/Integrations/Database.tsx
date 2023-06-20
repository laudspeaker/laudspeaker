import { GenericButton } from "components/Elements";
import Stepper from "components/Elements/Stepper";
import Header from "components/Header";
import React, { Dispatch, useState, useEffect } from "react";
import DatabaseStep1 from "./DatabaseSteps/DatabaseStep1";
import DatabaseStep2 from "./DatabaseSteps/DatabaseStep2";
import DatabaseStep3, { DBType } from "./DatabaseSteps/DatabaseStep3";
import DatabaseStep4 from "./DatabaseSteps/DatabaseStep4";
import DatabaseStep5 from "./DatabaseSteps/DatabaseStep5";
import { toast } from "react-toastify";
import ApiService from "services/api.service";
import { useNavigate, useParams } from "react-router-dom";

export enum FrequencyUnit {
  HOUR = "hour",
  DAY = "day",
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export enum PeopleIdentification {
  BY_ID = "byId",
}

export interface DatabaseFormData {
  name: string;
  description: string;
  frequencyNumber: number;
  frequencyUnit: FrequencyUnit;
  peopleIdentification: PeopleIdentification;
  connectionString: string;
  databricksData: { host?: string; path?: string; token?: string };
  dbType: DBType;
  query: string;
}

export interface DatabaseStepProps {
  formData: DatabaseFormData;
  setFormData: Dispatch<React.SetStateAction<DatabaseFormData>>;
  isLoading: boolean;
  setIsLoading: Dispatch<React.SetStateAction<boolean>>;
  errors: Record<keyof DatabaseFormData, string[]>;
  showErrors: Record<keyof DatabaseFormData, boolean>;
  handleShowErrors: (key: keyof DatabaseFormData) => void;
}

const expectedRequiredDataSteps: (keyof DatabaseFormData)[][] = [
  ["name", "description"],
  ["frequencyNumber", "frequencyUnit", "peopleIdentification"],
  ["dbType", "connectionString", "databricksData"],
  ["query"],
  [],
];

const Database = () => {
  const { id } = useParams();

  const [formData, setFormData] = useState<DatabaseFormData>({
    name: "",
    description: "",
    frequencyNumber: 1,
    frequencyUnit: FrequencyUnit.HOUR,
    peopleIdentification: PeopleIdentification.BY_ID,
    connectionString: "",
    query: "",
    dbType: DBType.POSTGRESQL,
    databricksData: {},
  });

  const [errors, setErrors] = useState<
    Record<keyof DatabaseFormData, string[]>
  >({
    name: [],
    description: [],
    frequencyNumber: [],
    frequencyUnit: [],
    peopleIdentification: [],
    connectionString: [],
    query: [],
    dbType: [],
    databricksData: [],
  });

  useEffect(() => {
    const newErrors: Record<keyof DatabaseFormData, string[]> = {
      name: [],
      description: [],
      frequencyNumber: [],
      frequencyUnit: [],
      peopleIdentification: [],
      connectionString: [],
      query: [],
      dbType: [],
      databricksData: [],
    };

    if (!formData.name) newErrors.name.push("Name must be defined");
    if (
      !formData.frequencyNumber ||
      formData.frequencyNumber <= 0 ||
      formData.frequencyNumber > 1000
    )
      newErrors.frequencyNumber.push(
        "Frequncy number should be in range (0;1000]"
      );
    if (!formData.query) newErrors.query.push("Query must be defined");

    if (formData.name.length > 100)
      newErrors.name.push("Name must shorter than 100 characters");
    if (formData.description && formData.description.length > 255)
      newErrors.description.push("Name must shorter than 255 characters");

    if (formData.dbType === DBType.DATABRICKS) {
      if (Object.values(formData.databricksData).some((item) => !item)) {
        newErrors.databricksData.push("All data must be defined");
      }

      if (
        Object.values(formData.databricksData).some(
          (item) => item.length > 2048
        )
      ) {
        newErrors.databricksData.push(
          "Data length must be shorter than 2048 characters"
        );
      }
    }

    setErrors(newErrors);
  }, [formData]);

  const [showErrors, setShowErrors] = useState<
    Record<keyof DatabaseFormData, boolean>
  >({
    name: false,
    description: false,
    frequencyNumber: false,
    frequencyUnit: false,
    peopleIdentification: false,
    connectionString: false,
    query: false,
    dbType: false,
    databricksData: false,
  });

  const handleShowErrors = (key: keyof DatabaseFormData) => {
    setShowErrors({ ...showErrors, [key]: true });
  };

  const [isLoading, setIsLoading] = useState(false);
  const [isSucess, setIsSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      if (id) {
        const { data } = await ApiService.get<
          DatabaseFormData & {
            databricksHost?: string;
            databricksPath?: string;
            databricksToken?: string;
            id: string;
          }
        >({
          url: "/integrations/db/" + id,
        });
        setFormData({
          ...data,
          databricksData: {
            host: data.databricksHost,
            path: data.databricksPath,
            token: data.databricksToken,
          },
        });
      }
    })();
  }, [id]);

  const steps = [
    <DatabaseStep1
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      errors={errors}
      showErrors={showErrors}
      handleShowErrors={handleShowErrors}
    />,
    <DatabaseStep2
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      errors={errors}
      showErrors={showErrors}
      handleShowErrors={handleShowErrors}
    />,
    <DatabaseStep3
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      errors={errors}
      showErrors={showErrors}
      handleShowErrors={handleShowErrors}
    />,
    <DatabaseStep4
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      errors={errors}
      showErrors={showErrors}
      handleShowErrors={handleShowErrors}
    />,
    <DatabaseStep5
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
      errors={errors}
      showErrors={showErrors}
      handleShowErrors={handleShowErrors}
      setIsSuccess={setIsSuccess}
    />,
  ];

  const [stepperIndex, setStepperIndex] = useState(0);

  const navigate = useNavigate();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (id) {
        await ApiService.patch({
          url: "/integrations/db/" + id,
          options: formData,
        });
      } else {
        await ApiService.post({ url: "/integrations/db", options: formData });
      }

      navigate("/integrations");
    } catch (e) {
      toast.error("Error while saving");
    } finally {
      setIsLoading(false);
    }
  };

  const isError = expectedRequiredDataSteps[stepperIndex].some(
    (key) => errors[key].length > 0
  );

  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col">
          <main>
            <div className="relative mx-auto max-w-4xl md:px-8 xl:px-0">
              <div className="pt-10 pb-16">
                <div className="px-4 sm:px-6 md:px-0">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    Integrations
                  </h1>
                  <div className="py-6">
                    <div className="flex items-center justify-center select-none">
                      <Stepper
                        activeStep={stepperIndex}
                        steps={[
                          "Sync",
                          "Settings",
                          "Database",
                          "Query",
                          "Review",
                        ]}
                      />
                    </div>
                    <div className="py-6">{steps[stepperIndex]}</div>
                  </div>
                  <div className="flex gap-[10px]">
                    <GenericButton
                      onClick={() =>
                        stepperIndex === 0
                          ? navigate("/integrations")
                          : setStepperIndex((index) => index - 1)
                      }
                      loading={isLoading}
                    >
                      Back
                    </GenericButton>
                    {stepperIndex === steps.length - 1 ? (
                      <GenericButton
                        onClick={handleSave}
                        loading={isLoading}
                        disabled={!isSucess}
                      >
                        Save
                      </GenericButton>
                    ) : (
                      <GenericButton
                        onClick={() => setStepperIndex((index) => index + 1)}
                        loading={isLoading}
                        disabled={isError}
                      >
                        Next
                      </GenericButton>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Database;
