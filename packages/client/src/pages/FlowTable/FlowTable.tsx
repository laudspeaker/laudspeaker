import React, { useState } from "react";
import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import ApiService from "services/api.service";
import { ApiConfig } from "./../../constants";
import NameJourney from "./NameJourney";
import posthog from "posthog-js";
import Modal from "components/Elements/Modal";

const FlowTable = () => {
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [journeys, setJourneys] = useState<any>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);
  const [sortOptions, setSortOptions] = useState({});

  React.useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.flow}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
            Object.values(sortOptions)[0] || ""
          }`,
        });
        const { data: fetchedJourneys, totalPages } = data;
        setSuccess("Success");
        setPagesCount(totalPages);
        setJourneys(fetchedJourneys);
      } catch (err) {
        posthog.capture("flowTableError", {
          flowTableError: err,
        });
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    setLoadingAsync();
  }, [itemsPerPage, currentPage, sortOptions]);

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const handleNameSubmit = () => {};

  if (error)
    return (
      <div>
        <p style={{ textAlign: "center" }}>Error</p>
      </div>
    );
  if (loading)
    return (
      <div>
        <p style={{ textAlign: "center" }}>One moment</p>
      </div>
    );
  return (
    <div className="bg-gray-100">
      <div className="relative w-full h-full ">
        <Header />
        <div className="py-[37px] px-[30px]">
          <Modal
            isOpen={nameModalOpen}
            onClose={() => {
              setNameModalOpen(false);
            }}
          >
            <NameJourney onSubmit={handleNameSubmit} isPrimary={true} />
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
                  className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md bg-white font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={redirectUses}
                >
                  Create Journey
                </button>
              </div>
            </Grid>
            <TableTemplate
              data={journeys}
              pagesCount={pagesCount}
              setCurrentPage={setCurrentPage}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              setItemsPerPage={setItemsPerPage}
              sortOptions={sortOptions}
              setSortOptions={setSortOptions}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowTable;
