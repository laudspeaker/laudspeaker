import React, { useState } from "react";
import RecentActivity from "./RecentAcitivity";
import activities from "./Dashboard.fixtures";
import Header from "../../components/Header";
import { FormControl } from "@mui/material";
import { GenericButton, Select } from "components/Elements";
import { formatDistance } from "date-fns";
import DateRangePicker from "components/DateRangePicker";
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
  const handleActiveJourney = (value: string) => {
    setActiveJourney(value);
  };

  const handleDateChange = (e: Date[]) => {
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
    <div className="relative bg-white">
      <Header />
      <div className="flex p-[30px]">
        <div className="border-b-[1px] border-b-[#D3D3D3] w-full flex justify-between flex-row">
          <div className="flex items-center pb-[30px]">
            <h3 className="min-w-[204px]">Active Journeys</h3>
            <div className="pl-[49px]">
              <DateRangePicker onChange={handleDateChange} value={date} />
            </div>
            <FormControl
              sx={{ maxWidth: "200px", paddingLeft: "15px", minWidth: "112px" }}
            >
              <Select
                id="activeJourney"
                value={activeJourney}
                options={[
                  { value: "Daily" },
                  { value: "Weekly" },
                  { value: "Monthly" },
                ]}
                onChange={handleActiveJourney}
                displayEmpty
              />
            </FormControl>
          </div>
          <GenericButton
            onClick={redirectJourney}
            style={{
              maxWidth: "158px",
              maxHeight: "48px",
            }}
          >
            See All Journeys
          </GenericButton>
        </div>
      </div>
      <div className="flex items-center justify-between p-[0px_30px] space-x-[30px]">
        <div className="shadow-2xl rounded-3xl">
          <div className="h-[299px] bg-white rounded-3xl">
            <div className="flex flex-row justify-between border-b-[1px] border-b-[#D3D3D3] p-[20px]">
              <p>0 - Sent</p>
              <p>0 - From last day</p>
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
                <p className="p-[2]">View User</p>
              </Popover>
            </div>
            <div className="p-[20px] bg-white rounded-3xl">
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
            </div>
          </div>
        </div>
        <div className="shadow-2xl rounded-3xl">
          <div className="h-[299px] bg-white rounded-3xl">
            <div className="flex flex-row justify-between border-b-[1px] border-b-[#D3D3D3] p-[20px]">
              <p>0 - Delivered</p>
              <p>0 - From last day</p>
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
                <p className="p-[2]">View User</p>
              </Popover>
            </div>
            <div className="p-[20px] bg-white rounded-3xl">
              <svg className="absolute">
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
            </div>
          </div>
        </div>
        <div className="shadow-2xl rounded-3xl">
          <div className="h-[299px] bg-white rounded-3xl">
            <div className="flex flex-row justify-between border-b-[1px] border-b-[#D3D3D3] p-[20px]">
              <p>Deliverability</p>
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
                <p className="p-[2]">View User</p>
              </Popover>
            </div>
            <div className="flex justify-between flex-row p-[20px_20px_15px_20px]">
              <p className="text-[#00AA58]">Bounce rate : $25</p>
              <p className="text-[#D17E83]">Spam rate : $30</p>
            </div>
            <div className="p-[0px_20px_20px_20px]">
              <p>Supercharge your transactional delivery.</p>
              <p>
                Assign a sending domain specifically for your transactional
                messages.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="p-[37px_30px]">
        <div className="bg-white shadow-2xl rounded-3xl">
          <div className="flex flex-row justify-between items-center p-[20px] border-b-[1px] border-b-[#D3D3D3] h-[104px]">
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
              Go To Customers
            </GenericButton>
          </div>
          <div className="p-[20px]">
            <RecentActivity activities={formattedActivities} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
