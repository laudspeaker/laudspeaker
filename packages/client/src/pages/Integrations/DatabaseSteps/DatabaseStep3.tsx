import { Input } from "components/Elements";
import React, { FC } from "react";
import { DatabaseStepProps } from "../Database";

const DatabaseStep3: FC<DatabaseStepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <b>Connection string</b>
      <Input
        value={formData.connectionString}
        onChange={(e) =>
          setFormData({ ...formData, connectionString: e.target.value })
        }
        name="connectionString"
      />
    </div>
  );
};

export default DatabaseStep3;
