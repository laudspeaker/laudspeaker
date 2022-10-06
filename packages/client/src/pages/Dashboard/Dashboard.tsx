import React, { useState } from "react";
import Drawer from "../../components/Drawer";
import RecentActivity from "./RecentAcitivity";
import activities from "./Dashboard.fixtures";
import Header from "../../components/Header";
import { Box, FormControl, Grid, MenuItem, Typography } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import { formatDistance } from "date-fns";
import DateRangePicker from "components/DateRangePicker";
import Card from "components/Cards/Card";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { IconButton, Popover } from "@mui/material";
import { VictoryChart, VictoryArea } from "victory";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeJourney, setActiveJourney] = useState("Daily");
  const [date, setDate] = useState<Date[]>([new Date(), new Date()]);
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );
  const handleActiveJourney = (e: any) => {
    setActiveJourney(e.target.value);
  };

  const handleDateChange = (e: any) => {
    setDate(e);
  };

  const redirectJourney = () => {
    navigate("/flow");
  };

  const redirectUses = () => {};

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const formattedActivities = activities.map((activity) => {
    return {
      ...activity,
      sentAt: formatDistance(new Date(activity.sentAt), new Date(Date.now()), {
        addSuffix: true,
      }),
    };
  });

  const chartTheme = {
    axis: {
      style: {
        tickLabels: {
          // this changed the color of my numbers to white
          fill: "#707070",
          fontFamily: "Poppins",
          fontWeight: 600,
          fontSize: "16px",
        },
        xLabels: {
          fill: "transparent",
        },
        grid: { stroke: "#F4F5F7", strokeWidth: 0 },
        axis: { stroke: "transparent" },
      },
    },
    chart: {
      padding: {
        top: 0,
        bottom: 30,
        right: 15,
        left: 0,
      },
    },
  };

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
      <Grid padding={"30px 31px"}>
        <Box
          borderBottom={"1px solid #D3D3D3"}
          width={"100%"}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            flexDirection: "row",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              paddingBottom: "30px",
            }}
          >
            <Typography variant="h3" minWidth={"204px"}>
              Active Journeys
            </Typography>
            <Box paddingLeft={"49px"}>
              <DateRangePicker onChange={handleDateChange} value={date} />
            </Box>
            <FormControl
              sx={{ maxWidth: "200px", paddingLeft: "15px", minWidth: "112px" }}
            >
              <Select
                id="activeJourney"
                value={activeJourney}
                onChange={handleActiveJourney}
                displayEmpty
              >
                <MenuItem value={"Daily"}>Daily</MenuItem>
                <MenuItem value={"Weekly"}>Weekly</MenuItem>
                <MenuItem value={"Monthly"}>Monthly</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <GenericButton
            variant="contained"
            onClick={redirectJourney}
            fullWidth
            sx={{
              maxWidth: "158px",
              maxHeight: "48px",
              "background-image":
                "linear-gradient(to right, #6BCDB5 , #307179, #122F5C)",
            }}
            size={"medium"}
          >
            See All Journeys
          </GenericButton>
        </Box>
      </Grid>
      <Grid
        container
        direction={"row"}
        justifyContent={"space-between"}
        alignItems={"center"}
        padding={"0px 30px"}
        spacing={3}
      >
        <Grid item xs={12} sm={6} lg={4}>
          <Card
            sx={{
              height: "299px",
            }}
          >
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              borderBottom={"1px solid #D3D3D3"}
              padding={"20px"}
            >
              <Typography variant="body2">0 - Sent</Typography>
              <Typography variant="body2">0 - From last day</Typography>
              {/* <MoreHorizIcon /> */}

              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={handleClick}
                size="small"
              >
                <MoreHorizIcon />
              </IconButton>

              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Typography sx={{ p: 2 }}>View User</Typography>
              </Popover>
            </Grid>
            <Box padding={"20px"}>
              <svg style={{ position: "absolute" }}>
                <defs>
                  <linearGradient
                    id="myGradient"
                    x1="100%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#B8F2E6" />
                    <stop offset="100%" stopColor="#FFF" />
                  </linearGradient>
                </defs>
              </svg>
              <VictoryChart height={176} theme={chartTheme}>
                <VictoryArea
                  data={[
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                    { x: 3, y: 5 },
                    { x: 4, y: 4 },
                    { x: 5, y: 6 },
                  ]}
                  style={{
                    data: { fill: "url(#myGradient)" },
                    parent: { border: "1px solid #ccc" },
                  }}
                />
              </VictoryChart>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card
            sx={{
              height: "299px",
            }}
          >
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              borderBottom={"1px solid #D3D3D3"}
              padding={"20px"}
            >
              <Typography variant="body2">0 - Delivered</Typography>
              <Typography variant="body2">0 - From last day</Typography>
              {/* <MoreHorizIcon /> */}

              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={handleClick}
                size="small"
              >
                <MoreHorizIcon />
              </IconButton>

              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Typography sx={{ p: 2 }}>View User</Typography>
              </Popover>
            </Grid>
            <Box padding={"20px"}>
              <svg style={{ position: "absolute" }}>
                <defs>
                  <linearGradient
                    id="myGradient"
                    x1="100%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#B8F2E6" />
                    <stop offset="100%" stopColor="#FFF" />
                  </linearGradient>
                </defs>
              </svg>
              <VictoryChart height={176} theme={chartTheme}>
                <VictoryArea
                  data={[
                    { x: 1, y: 2 },
                    { x: 2, y: 3 },
                    { x: 3, y: 5 },
                    { x: 4, y: 4 },
                    { x: 5, y: 6 },
                  ]}
                  style={{
                    data: { fill: "url(#myGradient)" },
                    parent: { border: "1px solid #ccc" },
                    labels: {
                      fontFamily: "Poppins",
                      color: "red",
                    },
                  }}
                />
              </VictoryChart>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <Card
            sx={{
              height: "299px",
            }}
          >
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              borderBottom={"1px solid #D3D3D3"}
              padding={"20px"}
            >
              <Typography variant="body2">Deliverability</Typography>
              {/* <MoreHorizIcon /> */}
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                onClick={handleClick}
                size="small"
              >
                <MoreHorizIcon />
              </IconButton>

              <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
              >
                <Typography sx={{ p: 2 }}>View User</Typography>
              </Popover>
            </Grid>
            <Grid
              container
              direction={"row"}
              justifyContent={"space-between"}
              padding="20px 20px 15px 20px"
            >
              <Typography variant="body2" color={"#00AA58"}>
                Bounce rate : $25
              </Typography>
              <Typography variant="body2" color={"#D17E83"}>
                Spam rate : $30
              </Typography>
            </Grid>
            <Box padding={"0px 20px 20px 20px"}>
              <Typography variant="body2">
                Supercharge your transactional delivery.
              </Typography>
              <Typography variant="subtitle1">
                Assign a sending domain specifically for your transactional
                messages.
              </Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>
      <Box padding={"37px 30px"}>
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
            <Typography variant="h3">Active Journeys</Typography>
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
              Go To Customers
            </GenericButton>
          </Grid>
          <Box padding={"20px"}>
            <RecentActivity activities={formattedActivities} />
          </Box>
        </Card>
      </Box>
    </Box>
  );
};

export default Dashboard;
