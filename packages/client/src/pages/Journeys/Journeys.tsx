import React, { useState } from "react";
import ShowTable from "../../components/ShowTable";
import { Box, Typography } from "@mui/material";
import { GenericButton, Input } from "components/Elements";

const Journeys = () => {
  const addJourney = () => {};
  const [email, setEmail] = useState("");
  return (
    <Box sx={{ padding: "0 20px" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "25px 0",
        }}
      >
        <Box>
          <Typography
            variant="h3"
            display={"flex"}
            alignItems="center"
            sx={{
              fontSize: "25px",
              fontWeight: 600,
              lineHeight: "40px",
              marginBottom: "10px",
            }}
          >
            Journeys
          </Typography>
        </Box>
        <Box sx={{ display: "flex" }}>
          <GenericButton
            variant="contained"
            onClick={addJourney}
            fullWidth
            sx={{
              height: "50px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
              boxShadow: "0px 8px 16px -6px rgba(0, 0, 0, 0.1)",
              fontSize: "16px",
              fontWeight: 500,
              padding: "10px 20px",
              width: "150px",
              lineHeight: "25px",
            }}
          >
            Add Journeys
          </GenericButton>
          <GenericButton
            variant="contained"
            onClick={addJourney}
            fullWidth
            sx={{
              height: "50px",
              background: "#FFF",
              fontSize: "14px",
              fontWeight: 500,
              padding: "10px 20px",
              width: "150px",
              lineHeight: "30px",
              color: "#223343",
            }}
          >
            Next
          </GenericButton>
        </Box>
      </Box>

      <Box
        sx={{ display: "flex", alignItems: "center", marginBottom: "140px" }}
      >
        <Box>
          <Typography
            // variant="h3"
            display={"flex"}
            alignItems="center"
            sx={{
              fontSize: "16px",
              fontWeight: 400,
              lineHeight: "30px",
              color: "#223343",
              margin: "0 10px",
            }}
          >
            Filter for journeys by
          </Typography>
        </Box>
        <Box>
          <Input
            value={email}
            placeholder={"Email Address"}
            name="email"
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            // onKeyDown={handleTitleEnter}
            autoFocus
            inputProps={{
              style: {
                padding: "10px",
                height: "44px",
                background: "#E5E5E5",
                fontWeight: "400",
                fontSize: "16px",
                color: "#6B7280",
                borderRadius: "10px",
              },
            }}
          />
        </Box>
      </Box>
      <ShowTable />
    </Box>
  );
};

export default Journeys;
