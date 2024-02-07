import TrashIcon from "assets/icons/TrashIcon";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import React, { FC, useEffect, useState } from "react";

interface DataMappingCardProps {
  mapping: Record<string | "event::String", string>;
  mappingKey: string | "event::String";
  attributes: Attribute[];
  onChange: (value: { field: string; attribute: string }) => void;
  handleDelete: () => void;
}

const DataMappingCard: FC<DataMappingCardProps> = ({
  mapping,
  mappingKey,
  attributes,
  onChange,
  handleDelete,
}) => {
  const [currentMappingAttribute, setCurrentMappingAttribute] =
    useState<Attribute>();

  useEffect(() => {
    setCurrentMappingAttribute(
      attributes.find((attribute) => {
        const [key, type] = mappingKey.split("::");
        return attribute.key === key && attribute.type === type;
      })
    );
  }, [attributes, mappingKey]);

  return (
    <div className="bg-[#F3F4F6] rounded flex gap-2.5 justify-between items-center p-2.5">
      <div className="flex items-center gap-2.5">
        <Input
          value={mapping[mappingKey]}
          onChange={(value) =>
            onChange({ field: value, attribute: mappingKey })
          }
          placeholder="imported field"
        />
        <div className="whitespace-nowrap">maps to</div>
        {mappingKey === "event::String" ? (
          <Input
            value={`event (String)`}
            onChange={(value) =>
              onChange({ field: value, attribute: "event::String" })
            }
            disabled
            className="bg-[#F3F4F6] !w-[200px] !h-[32px]"
            wrapperClassName="bg-[#F3F4F6] !w-[200px] !h-[32px]"
          />
        ) : (
          <Select
            className="!w-[200px] !h-[32px]"
            buttonInnerWrapperClassName="!w-[200px] !h-[32px]"
            value={currentMappingAttribute}
            onChange={(value) =>
              onChange({
                field: mapping[mappingKey],
                attribute: `${value?.key}::${value?.type}`,
              })
            }
            options={attributes
              .filter(
                (attribute) =>
                  mappingKey === `${attribute.key}::${attribute.type}` ||
                  !Object.keys(mapping).includes(
                    `${attribute.key}::${attribute.type}`
                  )
              )
              .map((attribute) => {
                return {
                  key: attribute,
                  title: `${attribute.key} (${attribute.type})${
                    attribute.dateFormat ? ` [${attribute.dateFormat}]` : ""
                  }`,
                };
              })}
            disabled={currentMappingAttribute?.isPrimary}
          />
        )}
      </div>
      {!currentMappingAttribute?.isPrimary &&
        mappingKey !== "event::String" && (
          <div className="cursor-pointer" onClick={handleDelete}>
            <TrashIcon />
          </div>
        )}
    </div>
  );
};

export default DataMappingCard;
