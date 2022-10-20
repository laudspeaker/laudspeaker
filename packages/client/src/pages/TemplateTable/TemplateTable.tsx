import React, { useState } from "react";
import Drawer from "../../components/Drawer";
import Header from "../../components/Header";
import TableTemplate from "../../components/TableTemplate";
import { Box, FormControl, Grid, MenuItem, Typography } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import { formatDistance } from "date-fns";
import DateRangePicker from "components/DateRangePicker";
import Card from "components/Cards/Card";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Popover } from "@mui/material";
import { VictoryChart, VictoryArea } from "victory";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameJourney from "./NameTemplate";
import { useNavigate } from "react-router-dom";
import NameTemplate from "./NameTemplate";
import Modal from "components/Elements/Modal";

const TemplateTable = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [templates, setTemplates] = useState<any>([]);
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
          url: `${ApiConfig.getAllTemplates}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }&orderBy=${Object.keys(sortOptions)[0] || ""}&orderType=${
            Object.values(sortOptions)[0] || ""
          }`,
        });
        const { data: fetchedTemplates, totalPages } = data;
        setPagesCount(totalPages);
        setSuccess("Success");
        setTemplates(fetchedTemplates);
      } catch (err) {
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

  //getAlltemplatesData();

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
    <div className="w-full relative bg-[#E5E5E5]">
      <Header />
      <div className="py-[37px] px-[30px]">
        <Modal
          isOpen={nameModalOpen}
          onClose={() => {
            setNameModalOpen(false);
          }}
        >
          <NameTemplate onSubmit={handleNameSubmit} isPrimary={true} />
        </Modal>
        <GenericButton
          onClick={redirectUses}
          style={{
            maxWidth: "158px",
            maxHeight: "48px",
            "background-image":
              "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
          }}
        >
          Create Template
        </GenericButton>
        <Card>
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
              All Templates
            </h3>
          </Grid>
          <TableTemplate
            data={templates}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
            sortOptions={sortOptions}
            setSortOptions={setSortOptions}
          />
        </Card>
      </div>
    </div>
  );
};

export default TemplateTable;
