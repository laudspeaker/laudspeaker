import React, { useState } from "react";
import Header from "../../components/Header";
import { TableTemplate } from "../../components/TableTemplate/index";
import { TableTemplateBeta } from "../../components/TableTemplate/index";
import { Grid } from "@mui/material";
import { GenericButton } from "components/Elements";
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

  //getAllJourneysData();

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
    <div>
      <div className="relative w-full">
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
          <div className="shadow-xl rounded-[10px]">
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              alignItems={"center"}
              padding={"20px"}
              borderBottom={"1px solid #D3D3D3"}
              height={"104px"}
            >
              <h3 className="font-[Inter] font-semibold text-[25px] leading-[38px]">
                Active Journeys
              </h3>
              <GenericButton
                onClick={redirectUses}
                style={{
                  maxWidth: "158px",
                  maxHeight: "48px",
                }}
              >
                Create Journey
              </GenericButton>
            </Grid>
            <TableTemplateBeta />
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
