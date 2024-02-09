import HelpIcon from "assets/icons/HelpIcon";
import TrashIcon from "assets/icons/TrashIcon";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { capitalize } from "lodash";
import {
  DataSourceMapping,
  DataSourceMappingType,
  DataSourceType,
  UserAttributeMapping,
} from "pages/DataTransferTable/DataTransferTable";
import { Attribute } from "pages/PeopleSettings/PeopleSettings";
import React, { FC, useEffect, useMemo, useState } from "react";
import { StatementValueType } from "reducers/flow-builder.reducer";

interface UserAttributeDataMappingCardProps {
  mapping: UserAttributeMapping;
  existingAttributes: { key: string; type: StatementValueType }[];
  attributes: Attribute[];
  dataSourceType: DataSourceType;
  onChange: (mapping: UserAttributeMapping) => void;
  onChangeType: (type: DataSourceMappingType) => void;
  onDelete: () => void;
}

const UserAttributeDataMappingCard: FC<UserAttributeDataMappingCardProps> = ({
  mapping,
  existingAttributes,
  attributes,
  dataSourceType,
  onChange,
  onChangeType,
  onDelete,
}) => {
  const currentMappingAttribute = useMemo(
    () =>
      attributes.find(
        (attribute) =>
          attribute.key === mapping.attributeKey &&
          attribute.type === mapping.attributeType
      ),
    [attributes, mapping]
  );

  return (
    <div className="p-2.5 bg-[#F3F4F6] rounded flex gap-5 justify-between items-center">
      <div className="flex flex-col gap-2.5 w-full">
        <div className="w-full flex gap-2.5 items-center">
          {dataSourceType === DataSourceType.CREATE_EVENT ? (
            <Select
              className="!max-w-[140px] !w-full !h-[32px]"
              buttonInnerWrapperClassName="!max-w-[140px] !w-full !h-[32px]"
              value={DataSourceMappingType.USER_ATTRIBUTE}
              onChange={onChangeType}
              options={Object.values(DataSourceMappingType).map(
                (dataSourceMappingType) => ({
                  key: dataSourceMappingType,
                  title: capitalize(dataSourceMappingType.split("-").join(" ")),
                })
              )}
              disabled={currentMappingAttribute?.isPrimary}
            />
          ) : (
            <div className="whitespace-nowrap">User attribute</div>
          )}

          <Input
            className="!max-w-[200px] !w-full !h-[32px]"
            wrapperClassName="!max-w-[200px] !w-full !h-[32px]"
            value={mapping.importedValue}
            placeholder="imported attribute"
            onChange={(value) => onChange({ ...mapping, importedValue: value })}
          />
          <div className="whitespace-nowrap">maps to</div>
          {currentMappingAttribute?.isPrimary ? (
            <div className="relative max-w-[220px] w-full">
              <Input
                className="!max-w-[220px] !w-full !h-[32px] bg-[#E5E7EB]"
                wrapperClassName="!max-w-[220px] !w-full !h-[32px]"
                value={`${currentMappingAttribute.key} (${
                  currentMappingAttribute.type
                })  ${
                  currentMappingAttribute.dateFormat
                    ? ` [${currentMappingAttribute.dateFormat}]`
                    : ""
                }`}
                onChange={() => {}}
                disabled
              />
              <div className="absolute right-[10px] top-1/2 -translate-y-1/2">
                <HelpIcon />
              </div>
            </div>
          ) : (
            <Select
              className="!max-w-[220px] !w-full !h-[32px]"
              buttonInnerWrapperClassName="!max-w-[220px] !w-full !h-[32px]"
              value={currentMappingAttribute}
              onChange={(attribute) => {
                if (!attribute) return;

                onChange({
                  ...mapping,
                  attributeKey: attribute.key,
                  attributeType: attribute.type,
                });
              }}
              placeholder="select system attribute"
              options={attributes
                .filter(
                  (attribute) =>
                    (attribute.key === currentMappingAttribute?.key &&
                      attribute.type === currentMappingAttribute?.type) ||
                    existingAttributes.every(
                      (existingAttribute) =>
                        existingAttribute.key !== attribute.key ||
                        existingAttribute.type !== attribute.type
                    )
                )
                .map((attribute) => ({
                  key: attribute,
                  title: `${attribute.key} (${attribute.type})  ${
                    attribute.dateFormat ? ` [${attribute.dateFormat}]` : ""
                  }`,
                }))}
            />
          )}
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="checkbox"
            checked={mapping.updateSystemAttribute}
            onChange={() =>
              onChange({
                ...mapping,
                updateSystemAttribute: !mapping.updateSystemAttribute,
              })
            }
          />
          <div className="font-roboto text-[#000000D9]">
            Update system attribute
          </div>
        </div>
      </div>

      {!currentMappingAttribute?.isPrimary && (
        <div onClick={onDelete} className="cursor-pointer">
          <TrashIcon />
        </div>
      )}
    </div>
  );
};

export default UserAttributeDataMappingCard;
