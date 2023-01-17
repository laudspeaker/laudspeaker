import { GenericButton } from "components/Elements";
import Stepper from "components/Elements/Stepper";
import Header from "components/Header";
import React, { Dispatch, useState } from "react";
import DatabaseStep1 from "./DatabaseSteps/DatabaseStep1";
import DatabaseStep2 from "./DatabaseSteps/DatabaseStep2";
import DatabaseStep3 from "./DatabaseSteps/DatabaseStep3";
import DatabaseStep4 from "./DatabaseSteps/DatabaseStep4";

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
  dbType: string;
  query: string;
}

export interface DatabaseStepProps {
  formData: DatabaseFormData;
  setFormData: Dispatch<React.SetStateAction<DatabaseFormData>>;
}

const Database = () => {
  const [formData, setFormData] = useState<DatabaseFormData>({
    name: "",
    description: "",
    frequencyNumber: 1,
    frequencyUnit: FrequencyUnit.HOUR,
    peopleIdentification: PeopleIdentification.BY_ID,
    syncToASegment: false,
    connectionString: "",
    query: "",
    dbType: "",
  });

  const steps = [
    <DatabaseStep1 formData={formData} setFormData={setFormData} />,
    <DatabaseStep2 formData={formData} setFormData={setFormData} />,
    <DatabaseStep3 formData={formData} setFormData={setFormData} />,
    <DatabaseStep4 formData={formData} setFormData={setFormData} />,
  ];

  const [stepperIndex, setStepperIndex] = useState(0);

  return (
    <div>
      <div className="">
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
                    >
                      Back
                    </GenericButton>
                    <GenericButton
                      disabled={stepperIndex === steps.length - 1}
                      onClick={() => setStepperIndex((index) => index + 1)}
                    >
                      Next
                    </GenericButton>
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
