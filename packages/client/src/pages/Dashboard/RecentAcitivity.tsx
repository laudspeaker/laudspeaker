import * as React from "react";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
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
      <List
        sx={{
          minWidth: "100%",
          bgcolor: "background.paper",
        }}
      >
        <ListItem>
          <ListItemAvatar>
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
          </ListItemAvatar>
          <ListItemAvatar>
            <img
              src={activity.iconUrl}
              style={{ width: "30px" }}
              alt="status"
            />
          </ListItemAvatar>
          <ListItemText
            sx={{ display: "flex", flexDirection: "column", width: "500px" }}
            primary={
              <Typography
                sx={{ display: "inline", fontSize: "20px", fontWeight: 600 }}
                component="span"
                variant="body2"
                color="text.primary"
              >
                {activity.title}
              </Typography>
            }
            secondary={
              <Typography
                sx={{ display: "inline", fontSize: "14px", fontWeight: 400 }}
                component="span"
                variant="body2"
                color="text.primary"
                noWrap
              >
                {activity.subtitle}
              </Typography>
            }
          ></ListItemText>
          <ListItemText>
            <Typography
              sx={{
                color: "#707070",
                fontWeight: 400,
                fontSize: "14px",
              }}
            >
              {activity.sentAt}
            </Typography>
          </ListItemText>
          <ListItemText>
            <Typography
              sx={{
                display: "inline",
                color: "#28282E",
                fontWeight: 400,
                fontSize: "16px",
              }}
              component="span"
              variant="body2"
              color="text.primary"
            >
              {activity.email}
            </Typography>
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
              <Typography sx={{ p: 2 }}>View User</Typography>
            </Popover>
          </ListItemText>
        </ListItem>
        <Divider variant="inset" component="li" />
      </List>
    );
  };

  return <>{activities.map((activity) => getListItem(activity))}</>;
}
