import React, { useState } from "react";
import Header from "../../components/Header";
import TableTemplate from "../../components/TableTemplate";
import { Box, Grid } from "@mui/material";
import { GenericButton } from "components/Elements";
import Card from "components/Cards/Card";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import { useNavigate } from "react-router-dom";
import NameTemplate from "./NamePerson";
import Modal from "components/Elements/Modal";

const PeopleTable = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [people, setPeople] = useState<any>([]);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [pagesCount, setPagesCount] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllPeople}?take=${itemsPerPage}&skip=${
            itemsPerPage * currentPage
          }`,
        });
        const { data: fetchedPeople, totalPages } = data;
        setPagesCount(totalPages);
        setSuccess("Success");
        setPeople(fetchedPeople);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    setLoadingAsync();
  }, [itemsPerPage, currentPage]);

  const redirectUses = () => {
    setNameModalOpen(true);
  };

  const handleNameSubmit = () => {};

  //getAllpeopleData();

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
    <Box
      sx={{
        width: "100%",
        position: "relative",
      }}
    >
      <Header />
      <Box padding={"37px 30px"}>
        <Modal
          isOpen={nameModalOpen}
          onClose={() => {
            setNameModalOpen(false);
          }}
        >
          <NameTemplate onSubmit={handleNameSubmit} isPrimary={true} />
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
              All People
            </h3>
            <GenericButton
              onClick={redirectUses}
              style={{
                maxWidth: "158px",
                maxHeight: "48px",
                "background-image":
                  "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              }}
            >
              Create Person
            </GenericButton>
          </Grid>
          <TableTemplate
            data={people}
            pagesCount={pagesCount}
            setCurrentPage={setCurrentPage}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            setItemsPerPage={setItemsPerPage}
          />
        </div>
      </Box>
    </Box>
  );
};

export default PeopleTable;
