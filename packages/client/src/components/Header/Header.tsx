import React from "react";
import Help from "../../assets/images/Help.svg";
import Notification from "../../assets/images/Notification.svg";
import Profile from "../../assets/images/Profile.svg";
import "./Header.css";
import { Menu, MenuItem } from "@mui/material";

const Header = () => {
  const [anchorEl, setAnchorEl] = React.useState<Element>();

  const helpClick = () => {};
  const notificationClick = () => {};
  const profileClick = (e: React.MouseEvent) => {
    setAnchorEl(e.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(undefined);
  };
  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "";
    window.location.reload();
  };
  return (
    <div className="flex justify-end py-[18px] px-[30px] bg-white border-b-[1px] border-b-[#D3D3D3] cursor-pointer">
      <div className="flex">
        <img
          src={Help}
          alt="help"
          onClick={helpClick}
          style={{ padding: "0 8px" }}
        />
        <img
          src={Notification}
          alt="notification"
          onClick={notificationClick}
          style={{ padding: "0 8px" }}
        />
        <img
          src={Profile}
          alt="profile"
          onClick={profileClick}
          style={{ padding: "0 8px" }}
        />
      </div>
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleLogout}>Logout</MenuItem>
      </Menu>
    </div>
  );
};

export default Header;
