import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { dataSubArray } from "./Drawer.fixtures";
import { AuthState } from "../../reducers/auth";
import { useTypedSelector } from "../../hooks/useTypeSelector";
import { Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

const drawerWidth = 154;

export default function ResponsiveDrawer() {
  const userState = useTypedSelector<AuthState>((state) => state.auth);
  const { userPermissions = [] } = userState;
  const location = useLocation();

  const generateMenuItem = (item: any) => {
    return (
      <React.Fragment key={item.id}>
        {userPermissions.includes(item.id) ? (
          <Link
            to={item.link}
            style={
              location.pathname.includes(item.link)
                ? {
                    backgroundImage:
                      "linear-gradient(to right, rgba(255,255,255,0.1) , rgba(255,255,255,0))",
                    borderLeft: "5px solid #FAFAFA",
                    display: "flex",
                    textDecoration: "none",
                  }
                : {
                    textDecoration: "none",
                  }
            }
          >
            <ListItem key={item.text} disablePadding>
              <ListItemButton id={item.id}>
                <ListItemIcon>{item.imgIcon}</ListItemIcon>
                <ListItemText>
                  <Typography
                    sx={{
                      color: "#FFF",
                      fontWeight: 500,
                      lineHeight: 1,
                    }}
                  >
                    {item.text}
                  </Typography>
                </ListItemText>
              </ListItemButton>
            </ListItem>
          </Link>
        ) : (
          <></>
        )}
      </React.Fragment>
    );
  };
  const generateMenu = (arr: any) => {
    return (
      <>
        {arr.map((item: any, index: number) => {
          return (
            <React.Fragment key={index}>
              {item.type === "group" ? (
                <>
                  <Typography
                    sx={{
                      textAlign: "left",
                      fontWeight: 500,
                      color: "#B8F2E6",
                      marginTop: "57px",
                      marginLeft: "18px",
                    }}
                  >
                    {item.text}
                  </Typography>
                  {item?.children?.map((menuItem: any) =>
                    generateMenuItem(menuItem)
                  )}
                </>
              ) : (
                generateMenuItem(item)
              )}
            </React.Fragment>
          );
        })}
      </>
    );
  };
  const drawer = (): React.ReactNode => {
    return (
      <div>
        <List sx={{ padding: "0 0" }}>
          <Box sx={{ height: "108px" }} />
          {generateMenu(dataSubArray)}
        </List>
      </div>
    );
  };

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              backgroundColor: "#223343",
              color: "#FFF",
            },
            "& .MuiDrawer-paper::-webkit-scrollbar": { width: 0 },
            "& .MuiTypography-root": {
              fontSize: "16px",
            },
            "& .MuiListItemButton-root": {
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            },
            "& .MuiListItemIcon-root": {
              display: "flex",
              justifyContent: "center",
            },
            "& .MuiListItemText-root": {
              height: "auto",
              lineHeight: 1,
              flex: "none",
              marginBottom: 0,
              marginTop: "8px",
            },
            "& .MuiListItem-root": { margin: "8px 0" },
            "& .MuiButtonBase-root": { height: "76px" },
          }}
          open
        >
          {drawer()}
        </Drawer>
      </Box>
    </Box>
  );
}
