import Button, { ButtonType } from "components/Elements/Buttonv2";
import Input from "components/Elements/Inputv2";
import Table from "components/Tablev2";
import React, { useEffect, useState } from "react";
import searchIconImage from "./svg/search-icon.svg";

enum FilterOption {
  ALL,
  ACTIVE,
  DRAFT,
  PAUSED,
  STOPPED,
}

const filterOptionToTextMap: Record<FilterOption, string> = {
  [FilterOption.ALL]: "All",
  [FilterOption.ACTIVE]: "Active",
  [FilterOption.DRAFT]: "Draft",
  [FilterOption.PAUSED]: "Paused",
  [FilterOption.STOPPED]: "Stopped",
};

const filterOptionsToRender: FilterOption[] = [
  FilterOption.ALL,
  FilterOption.ACTIVE,
  FilterOption.DRAFT,
  FilterOption.PAUSED,
  FilterOption.STOPPED,
];

export type ChosenFilter =
  | FilterOption.ALL
  | Exclude<FilterOption, FilterOption.ALL>[];

const JourneyTablev2 = () => {
  const [chosenFilter, setChosenFilter] = useState<ChosenFilter>(
    FilterOption.ALL
  );
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const loadData = async () => {};

  useEffect(() => {
    loadData();
  }, [chosenFilter]);

  const handleChangeChosenFilter = (filterOption: FilterOption) => {
    if (filterOption === FilterOption.ALL) {
      setChosenFilter(FilterOption.ALL);
      return;
    }

    if (chosenFilter === FilterOption.ALL) {
      setChosenFilter([filterOption]);
      return;
    }

    const newChosenFilter = [...chosenFilter];
    if (chosenFilter.includes(filterOption)) {
      newChosenFilter.splice(newChosenFilter.indexOf(filterOption), 1);

      setChosenFilter(
        newChosenFilter.length > 0 ? newChosenFilter : FilterOption.ALL
      );

      return;
    }

    newChosenFilter.push(filterOption);

    setChosenFilter(newChosenFilter);
  };

  return (
    <div className="bg-[#F3F4F6] p-[20px] flex flex-col gap-[20px] font-inter font-normal text-[14px] text-[#111827] leading-[22px]">
      <div className="flex justify-between">
        <div className="text-[20px] font-semibold leading-[28px]">Journeys</div>
        <Button type={ButtonType.PRIMARY} onClick={() => {}}>
          Create journey
        </Button>
      </div>

      <div className="p-[20px] rounded-[8px] bg-white flex flex-col gap-[20px]">
        <div className="flex justify-between items-center">
          <div className="flex gap-[10px]">
            {filterOptionsToRender.map((filterOption, i) => (
              <button
                className={`px-[12px] py-[5px] rounded-[4px] ${
                  (chosenFilter === FilterOption.ALL &&
                    filterOption === FilterOption.ALL) ||
                  (chosenFilter !== FilterOption.ALL &&
                    filterOption !== FilterOption.ALL &&
                    chosenFilter.includes(filterOption))
                    ? "border-[1px] border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]"
                    : ""
                }`}
                onClick={() => handleChangeChosenFilter(filterOption)}
                key={i}
              >
                {filterOptionToTextMap[filterOption]}
              </button>
            ))}
          </div>

          {showSearch ? (
            <div className="flex gap-[10px] items-center">
              <Input
                value={search}
                onChange={setSearch}
                placeholder="Search all journeys"
              />

              <Button
                type={ButtonType.LINK}
                onClick={() => setShowSearch(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button onClick={() => setShowSearch(true)}>
              <img src={searchIconImage} />
            </button>
          )}
        </div>

        <Table
          headings={[
            <div>Name</div>,
            <div>Status</div>,
            <div>Enrolled customer</div>,
            <div>Last update</div>,
            <div></div>,
          ]}
          rows={[
            [
              <div>1</div>,
              <div>2</div>,
              <div>3</div>,
              <div>4</div>,
              <div>5</div>,
            ],
            [
              <div>6</div>,
              <div>7</div>,
              <div>8</div>,
              <div>9</div>,
              <div>10</div>,
            ],
          ]}
        />
      </div>
    </div>
  );
};

export default JourneyTablev2;
