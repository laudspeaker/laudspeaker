import { Input, Select } from "components/Elements";
import ToggleSwitch from "components/Elements/ToggleSwitch";
import React, { FC } from "react";
import {
  DatabaseStepProps,
  FrequencyUnit,
  PeopleIdentification,
} from "../Database";

const DatabaseStep2: FC<DatabaseStepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <div>
        <b>How often should this import sync?</b>
        <div className="flex justify-start items-center gap-[10px]">
          <span>Add and update people every</span>
          <Input
            value={formData.frequencyNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                frequencyNumber: +e.target.value,
              })
            }
            name="number"
            type="number"
            wrapperClasses="!max-w-[50px]"
          />
          <Select
            options={[
              { value: FrequencyUnit.HOUR },
              { value: FrequencyUnit.DAY },
              { value: FrequencyUnit.WEEK },
              { value: FrequencyUnit.MONTH },
              { value: FrequencyUnit.YEAR },
            ]}
            onChange={(val) => setFormData({ ...formData, frequencyUnit: val })}
            value={formData.frequencyUnit}
          />
        </div>
      </div>
      <div>
        <b>How do you want to identify people?</b>
        <Select
          options={[
            { value: PeopleIdentification.BY_ID, title: "By id" },
            { value: PeopleIdentification.BY_NAME, title: "By name" },
          ]}
          onChange={(val) =>
            setFormData({ ...formData, peopleIdentification: val })
          }
          value={formData.peopleIdentification}
        />
      </div>
      <div className="flex justify-between">
        <div>
          <b>Sync this people to a segment?</b>
          <span>(optional)</span>
        </div>
        <ToggleSwitch
          checked={formData.syncToASegment}
          onChange={() =>
            setFormData({
              ...formData,
              syncToASegment: !formData.syncToASegment,
            })
          }
        />
      </div>
    </div>
  );
};

export default DatabaseStep2;
