import React, { useState } from "react";
import Drawer from "../../components/Drawer";
import Header from "../../components/Header";
import TableTemplate from "../../components/TableTemplate";
import {
  Box,
  FormControl,
  Grid,
  MenuItem,
  Modal,
  Typography,
} from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import { formatDistance } from "date-fns";
import DateRangePicker from "components/DateRangePicker";
import Card from "components/Cards/Card";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Popover } from "@mui/material";
import { VictoryChart, VictoryArea } from "victory";
import ApiService from "services/api.service";
import { ApiConfig } from "../../constants";
import NameJourney from "./NamePerson";
import { useNavigate } from "react-router-dom";
import NameTemplate from "./NamePerson";

const PeopleTable = () => {
  const navigate = useNavigate();
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [people, setpeople] = useState<any>([]);
  const [nameModalOpen, setNameModalOpen] = useState<boolean>(false);

  React.useEffect(() => {
    const setLoadingAsync = async () => {
      setLoading(true);
      try {
        const { data } = await ApiService.get({
          url: `${ApiConfig.getAllPeople}`,
        });
        setSuccess("Success");
        setpeople(data);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    setLoadingAsync();
  }, []);

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
        // width: "calc( 100vw - 154px)",
        // left: "154px",
        paddingLeft: "154px",
        position: "relative",
        backgroundColor: "#E5E5E5",
      }}
    >
      <Header />
      <Drawer />
      <Box padding={"37px 30px"}>
        {nameModalOpen ? (
          <Modal
            open={nameModalOpen}
            onClose={() => {}}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <>
              <button
                style={{
                  position: "absolute",
                  top: "30px",
                  right: "15px",
                  border: "0px",
                  background: "transparent",
                  outline: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
                onClick={() => setNameModalOpen(false)}
              >
                x
              </button>
              <NameTemplate onSubmit={handleNameSubmit} isPrimary={true} />
            </>
          </Modal>
        ) : null}
        <GenericButton
          variant="contained"
          onClick={redirectUses}
          fullWidth
          sx={{
            maxWidth: "158px",
            maxHeight: "48px",
            "background-image":
              "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
          }}
          size={"medium"}
        >
          Create Person
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
            <Typography variant="h3">All People</Typography>
          </Grid>
          <TableTemplate data={people} />
        </Card>
      </Box>
    </Box>
  );
};

export default PeopleTable;
