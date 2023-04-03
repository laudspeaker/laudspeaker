import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Input, Select } from "components/Elements";
import React, { FC } from "react";
import {
  DatabaseStepProps,
  FrequencyUnit,
  PeopleIdentification,
} from "../Database";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

const DatabaseStep2: FC<DatabaseStepProps> = ({
  formData,
  setFormData,
  errors,
  showErrors,
  handleShowErrors,
}) => {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-3">
        <dt className="text-sm font-medium text-gray-500">Sync data every</dt>
        <div className="flex justify-end items-center gap-[10px]">
          <dd className="relative max-w-[70px]">
            <Input
              type="number"
              value={formData.frequencyNumber}
              onChange={(e) => {
                setFormData({ ...formData, frequencyNumber: +e.target.value });
                handleShowErrors("frequencyNumber");
              }}
              onBlur={() => handleShowErrors("frequencyNumber")}
              name="frequencyNumber"
              id="frequencyNumber"
              className={classNames(
                errors.frequencyNumber.length > 0 && showErrors.frequencyNumber
                  ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                  : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
              )}
            />
            {errors.frequencyNumber.length > 0 &&
              showErrors.frequencyNumber && (
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <ExclamationCircleIcon
                    className="h-5 w-5 text-red-500"
                    aria-hidden="true"
                  />
                </div>
              )}
          </dd>
          <dd className="relative">
            <Select
              options={[
                { value: FrequencyUnit.HOUR },
                { value: FrequencyUnit.DAY },
                { value: FrequencyUnit.WEEK },
                { value: FrequencyUnit.MONTH },
                { value: FrequencyUnit.YEAR },
              ]}
              onChange={(val) =>
                setFormData({ ...formData, frequencyUnit: val })
              }
              value={formData.frequencyUnit}
            />
          </dd>
        </div>
        {showErrors.frequencyNumber &&
          errors.frequencyNumber.map((item) => (
            <p
              className="mt-2 text-sm text-red-600"
              id="email-error"
              key={item}
            >
              {item}
            </p>
          ))}
      </div>
      <div className="py-2 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-3">
        <dt className="text-sm font-medium text-gray-500">
          How do you want to identify people?
        </dt>
        <dd className="relative">
          <Select
            options={[{ value: PeopleIdentification.BY_ID, title: "By id" }]}
            onChange={(val) => {
              setFormData({ ...formData, peopleIdentification: val });
              handleShowErrors("peopleIdentification");
            }}
            value={formData.peopleIdentification}
            wrapperClassnames={classNames(
              errors.peopleIdentification.length > 0 &&
                showErrors.peopleIdentification
                ? "rounded-md sm:text-sm focus:!border-red-500 !border-red-300 shadow-sm focus:!ring-red-500 "
                : "rounded-md sm:text-sm focus:border-cyan-500 border-gray-300 shadow-sm focus:ring-cyan-500 "
            )}
          />
          {errors.peopleIdentification.length > 0 &&
            showErrors.peopleIdentification && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                <ExclamationCircleIcon
                  className="h-5 w-5 text-red-500"
                  aria-hidden="true"
                />
              </div>
            )}
        </dd>
        {showErrors.peopleIdentification &&
          errors.peopleIdentification.map((item) => (
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
  );
};

export default DatabaseStep2;
