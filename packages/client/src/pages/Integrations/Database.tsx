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
  BY_NAME = "byName",
}

export interface DatabaseFormData {
  name: string;
  description: string;
  frequencyNumber: number;
  frequencyUnit: FrequencyUnit;
  peopleIdentification: PeopleIdentification;
  syncToASegment: boolean;
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
}

const Database = () => {
  const { id } = useParams();

  const [formData, setFormData] = useState<DatabaseFormData>({
    name: "",
    description: "",
    frequencyNumber: 1,
    frequencyUnit: FrequencyUnit.HOUR,
    peopleIdentification: PeopleIdentification.BY_ID,
    syncToASegment: false,
    connectionString: "",
    query: "",
    dbType: DBType.DATABRICKS,
    databricksData: {},
  });

  const [isLoading, setIsLoading] = useState(false);

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
    />,
    <DatabaseStep2
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />,
    <DatabaseStep3
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />,
    <DatabaseStep4
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />,
    <DatabaseStep5
      formData={formData}
      setFormData={setFormData}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
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

  return (
    <div>
      <div>
        <div className="mx-auto flex flex-col">
          <Header />
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
                      disabled={stepperIndex === 0}
                      onClick={() => setStepperIndex((index) => index - 1)}
                      loading={isLoading}
                    >
                      Back
                    </GenericButton>
                    {stepperIndex === steps.length - 1 ? (
                      <GenericButton onClick={handleSave} loading={isLoading}>
                        Save
                      </GenericButton>
                    ) : (
                      <GenericButton
                        onClick={() => setStepperIndex((index) => index + 1)}
                        loading={isLoading}
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
