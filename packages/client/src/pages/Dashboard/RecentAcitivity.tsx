import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Divider from "@mui/material/Divider";
import { IconButton, Popover } from "@mui/material";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import { getColorSchema } from "helpers/genericUtils";

export interface IActivity {
  status: "delivered" | "undelivered" | "error";
  iconUrl: string;
  title: string;
  subtitle: string;
  lastUpdated: number;
  sentAt: any;
  email: string;
  userId: string;
}

interface IRecentActivity {
  activities: IActivity[];
}

export default function RecentActivity({ activities }: IRecentActivity) {
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
    null
  );

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popover" : undefined;

  const getListItem = (activity: IActivity) => {
    return (
      <ul className="min-w-full bg-white list-none">
        <li className="flex justify-start items-center decoration-transparent w-full text-left py-[8px] px-[16px] box-border">
          <div className="min-w-[54px]">
            {/* <Avatar>
            <ImageIcon />
          </Avatar> */}
            <div
              style={{
                width: "20px",
                height: "20px",
                background: getColorSchema(activity.status),
                borderRadius: "50%",
              }}
            />
          </div>
          <div className="min-w-[54px]">
            <img
              src={activity.iconUrl}
              style={{ width: "30px" }}
              alt="status"
            />
          </div>
          <ListItemText
            sx={{ display: "flex", flexDirection: "column", width: "500px" }}
            primary={
              <span className="inline text-[20px] font-semibold">
                {activity.title}
              </span>
            }
            secondary={
              <span className="inline text-[14px] font-normal flex-nowrap">
                {activity.subtitle}
              </span>
            }
          ></ListItemText>
          <ListItemText>
            <p className="text-[#707070] font-normal text-[14px]">
              {activity.sentAt}
            </p>
          </ListItemText>
          <ListItemText>
            <span className="inline text-[#28282E] font-normal text-[16px]">
              {activity.email}
            </span>
          </ListItemText>
          <ListItemText>
            <IconButton
              color="primary"
              aria-label="upload picture"
              component="span"
              onClick={handleClick}
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
          </ListItemText>
        </li>
        <Divider variant="inset" component="li" />
      </ul>
    );
  };

  return <>{activities.map((activity) => getListItem(activity))}</>;
}
