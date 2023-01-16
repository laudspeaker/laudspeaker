import { Input } from "components/Elements";
import React, { FC } from "react";
import { DatabaseStepProps } from "../Database";

const DatabaseStep1: FC<DatabaseStepProps> = ({ formData, setFormData }) => {
  return (
    <div>
      <div>
        <b>Name</b>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          name="name"
          placeholder="Name your import"
        />
      </div>
      <div>
        <b>Description</b>
        <Input
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          name="description"
          placeholder="Describe your import"
        />
      </div>
    </div>
  );
};

export default DatabaseStep1;
