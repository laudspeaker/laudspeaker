import * as React from "react";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { dataSubArray } from "./SideDrawer.fixtures";
import { Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import CopyIcon from "../../assets/images/CopyIcon.svg";
import { useParams } from "react-router-dom";
import { useTypedSelector } from "hooks/useTypeSelector";

const drawerWidth = (window.innerWidth - 154) * 0.21;

interface Props {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  window?: () => Window;
  selectedNode: string;
  onClick: (id: string) => void;
}

export default function ResponsiveDrawer(props: Props) {
  const { selectedNode, onClick } = props;
  const location = useLocation();
  const { name } = useParams();

  const handleMenuItemClick = (id: string) => {
    onClick(id);
  };

  const expectedOnboarding = useTypedSelector(
    (state) => state.auth.userData.expectedOnboarding
  );

  const generateMenuItem = (item: any) => {
    const isDisabled =
      item.alwaysDisabled ||
      (item.canBeDisabled && !selectedNode) ||
      (item.requiredOnboarding &&
        !expectedOnboarding?.includes(item.requiredOnboarding));
    return (
      <>
        {
          <div
            id={item.id}
            onClick={
              isDisabled ? undefined : () => handleMenuItemClick(item.id)
            }
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
              <ListItemButton disabled={isDisabled}>
                <ListItemIcon>{item.imgIcon}</ListItemIcon>
                <ListItemText>
                  <Typography
                    sx={{
                      color: "#28282E",
                      fontWeight: 500,
                      lineHeight: 1,
                    }}
                  >
                    {item.text}
                  </Typography>
                </ListItemText>
              </ListItemButton>
            </ListItem>
          </div>
          // : (
          //   <></>
          // )
        }
      </>
    );
  };
  const generateMenu = (arr: any) => {
    return (
      <>
        {arr.map((item: any) => {
          return (
            <>
              {item.type === "group" ? (
                <>
                  <Typography
                    sx={{
                      textAlign: "left",
                      fontWeight: 500,
                      color: "#707070",
                      marginTop: "26px",
                      marginLeft: "18px",
                      fontSize: "14px",
                      fontFamily: "Inter",
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
            </>
          );
        })}
      </>
    );
  };
  const drawer = (): React.ReactNode => {
    return (
      <div>
        <List sx={{ padding: "0 0" }}>
          <Box
            sx={{
              height: "50px",
              background: "#4FA198",
              display: "flex",
              justifyContent: "space-between",
              padding: "15px 20px",
            }}
          >
            <Box fontSize="16px" color="#FFFFFF">
              {name}
            </Box>
          </Box>
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
              backgroundColor: "#FFFFFF",
              color: "black",
              left: "154px",
            },
            "& .MuiDrawer-paper::-webkit-scrollbar": { width: 0 },
            "& .MuiTypography-root": {
              fontSize: "16px",
            },
            "& .MuiListItemButton-root": {
              alignItems: "center",
              justifyContent: "center",
              paddingLeft: "16px",
              paddingRight: "24px",
            },
            "& .MuiListItemIcon-root": {
              display: "flex",
              justifyContent: "center",
              minWidth: "unset",
              padding: "14px 12px 14px 17px",
            },
            //     "& .MuiListItemText-root": {
            //       height: "auto",
            //       lineHeight: 1,
            //       flex: "none",
            //       marginBottom: 0,
            //       marginTop: "8px",
            //     },
            //     "& .MuiListItem-root": { margin: "8px 0" },
            //     "& .MuiButtonBase-root": { height: "76px" },
          }}
          open
        >
          {drawer()}
        </Drawer>
      </Box>
    </Box>
  );
}
