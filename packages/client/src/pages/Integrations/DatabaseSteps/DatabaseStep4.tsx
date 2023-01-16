import { Input } from "components/Elements";
import React, { FC } from "react";
import { DatabaseStepProps } from "../Database";

const DatabaseStep4: FC<DatabaseStepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <b>Query</b>
      <Input
        value={formData.query}
        onChange={(e) => setFormData({ ...formData, query: e.target.value })}
        name="query"
      />
    </div>
  );
};

export default DatabaseStep4;
