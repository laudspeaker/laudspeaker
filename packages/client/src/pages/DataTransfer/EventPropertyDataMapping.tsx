import TrashIcon from "assets/icons/TrashIcon";
import Input from "components/Elements/Inputv2";
import Select from "components/Elements/Selectv2";
import { capitalize } from "lodash";
import {
  DataSourceMappingType,
  DataSourceType,
  EventPropertyMapping,
} from "pages/DataTransferTable/DataTransferTable";
import React, { FC } from "react";

interface EventPropertyDataMappingCardProps {
  mapping: EventPropertyMapping;
  dataSourceType: DataSourceType;
  onChange: (mapping: EventPropertyMapping) => void;
  onChangeType: (type: DataSourceMappingType) => void;
  onDelete: () => void;
}

const EventPropertyDataMapping: FC<EventPropertyDataMappingCardProps> = ({
  mapping,
  dataSourceType,
  onChange,
  onChangeType,
  onDelete,
}) => {
  return (
    <div className="p-2.5 bg-[#F3F4F6] rounded flex gap-5 justify-between items-center">
      <div className="w-full flex gap-2.5 items-center">
        {dataSourceType === DataSourceType.CREATE_EVENT ? (
          <Select
            className="!max-w-[140px] !w-full !h-[32px]"
            buttonInnerWrapperClassName="!max-w-[140px] !w-full !h-[32px]"
            value={DataSourceMappingType.EVENT_PROPERTY}
            onChange={onChangeType}
            options={Object.values(DataSourceMappingType).map(
              (dataSourceMappingType) => ({
                key: dataSourceMappingType,
                title: capitalize(dataSourceMappingType.split("-").join(" ")),
              })
            )}
          />
        ) : (
          <div className="whitespace-nowrap">User attribute</div>
        )}

        <Input
          className="!max-w-[200px] !w-full !h-[32px]"
          wrapperClassName="!max-w-[200px] !w-full !h-[32px]"
          value={mapping.importedProperty}
          placeholder="imported property"
          onChange={(value) =>
            onChange({ ...mapping, importedProperty: value })
          }
        />
        <div className="whitespace-nowrap">maps to</div>
        <div className="relative">
          <Input
            className="!max-w-[220px] !w-full !h-[32px] !pl-[65px]"
            wrapperClassName="!max-w-[220px] !w-full !h-[32px]"
            value={mapping.propertyName}
            placeholder="your_property_name"
            onChange={(value) => onChange({ ...mapping, propertyName: value })}
          />
          <div className="absolute font-roboto top-1/2 -translate-y-1/2 left-[12px]">
            payload.
          </div>
        </div>
      </div>
      <div onClick={onDelete} className="cursor-pointer">
        <TrashIcon />
      </div>
    </div>
  );
};

export default EventPropertyDataMapping;
