import React, { useEffect, useState } from "react";
import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "./../../constants";
import NameJourney from "./NameJourney";
import posthog from "posthog-js";
import Modal from "components/Elements/Modal";
import { Workflow } from "types/Workflow";
import Progress from "components/Progress";
import { SortOptions } from "components/TableTemplate/TableTemplate";
import AutoComplete from "components/Autocomplete";
import { Select } from "components/Elements";
import { useDebounce } from "react-use";
import { JourneyStatus } from "pages/JourneyTablev2/JourneyTablev2";

const FlowTable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [journeys, setJourneys] = useState<Workflow[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [update, setUpdate] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState<SortOptions>({
    createdAt: "desc",
  });
  const [isShowDisabled, setIsShowDisabled] = useState(false);
  const [possibleNames, setPossibleNames] = useState<string[]>([]);
  const [searchName, setSearchName] = useState("");
  const [searchStatuses, setSearchStatuses] = useState<JourneyStatus[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await ApiService.get({
        url: `/journeys?take=${itemsPerPage}&skip=${
          itemsPerPage * currentPage
        }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
          Object.values(sortOptions)[0] || ""
        }${
          isShowDisabled ? "&showDisabled=true" : ""
        }&search=${searchName}&filterStatuses=${searchStatuses.join(",")}`,
      });
      const {
        data: fetchedJourneys,
        totalPages,
      }: { data: Workflow[]; totalPages: number } = data;
      setPagesCount(totalPages);
      setJourneys(fetchedJourneys);
      setPossibleNames(fetchedJourneys.map((journey) => journey.name));
    } catch (err) {
      posthog.capture("flowTableError", {
        flowTableError: err,
      });
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [
    update,
    isShowDisabled,
    itemsPerPage,
    currentPage,
    sortOptions,
    searchStatuses,
  ]);

  useDebounce(
    () => {
      loadData();
    },
    800,
    [searchName]
  );

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );
  if (loading) return <Progress />;
  return (
    <div className="bg-gray-100">
      <div className="relative w-full h-full ">
        <div className="py-[37px] px-[30px]">
          <Modal
            isOpen={nameModalOpen}
            onClose={() => {
              setNameModalOpen(false);
            }}
          >
            <NameJourney />
          </Modal>
          <div>
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
              padding={"20px"}
              height={"104px"}
            >
              <h3 className="font-[Inter] font-semibold text-[25px] leading-[38px]">
                Active Journeys
              </h3>
              <div className="mt-6 flex space-x-3 md:mt-0 md:ml-4">
                <button
                  type="button"
                  className="inline-flex items-center border border-transparent bg-[#6366F1] px-6 py-3 text-base font-medium text-white shadow-sm hover:border-[#818CF8] hover:bg-[#818CF8] focus:border-[#4338CA] focus:bg-[#4338CA] disabled:!bg-[#F3F4F6] rounded-md"
                  onClick={redirectUses}
                >
                  Create Journey
                </button>
              </div>
            </Grid>
            <div className="flex w-full justify-between items-center gap-[10px] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 my-[20px]">
              <AutoComplete
                inputId="keyInput"
                items={possibleNames}
                inputValue={searchName}
                wrapperClassNames="w-full"
                customLabelClassNames="mb-[4px]"
                customInputClassNames="!shadow-sm !border-[1px] !border-gray-300"
                onInputChange={(e) => setSearchName(e.target.value)}
                label="Name"
                onOptionSelect={(name) => {
                  setSearchName(name);
                }}
                optionKey={(name) => name}
                optionRender={(name) => name}
              />
              <Select
                value={searchStatuses}
                options={[
                  { value: JourneyStatus.ACTIVE },
                  { value: JourneyStatus.DELETED },
                  { value: JourneyStatus.DRAFT },
                  { value: JourneyStatus.PAUSED },
                  { value: JourneyStatus.STOPPED },
                ]}
                label="Filter by statuses"
                multipleSelections={true}
                onChange={(val) => setSearchStatuses(val)}
                wrapperClassnames="min-w-[10vw]"
              />
            </div>
            <TableTemplate
              data={journeys}
              pagesCount={pagesCount}
              setCurrentPage={setCurrentPage}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              sortOptions={sortOptions}
              setSortOptions={setSortOptions}
              isShowDisabled={isShowDisabled}
              setIsShowDisabled={setIsShowDisabled}
              refresh={() => setUpdate((prev) => !prev)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowTable;
