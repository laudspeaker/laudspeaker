import * as React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

function handleClick(event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
  event.preventDefault();
  console.info("You clicked a breadcrumb.");
}

export default function CustomSeparator() {
  const breadcrumbs = [
    <Link
      underline="hover"
      key="1"
      color="inherit"
      href="/"
      onClick={handleClick}
      sx={{ fontSize: 14 }}
    >
      Segments
    </Link>,
    <Link
      underline="hover"
      key="2"
      color="inherit"
      href="/"
      onClick={handleClick}
      sx={{ fontSize: 14 }}
    >
      New
    </Link>,
  ];

  return (
    <div className="flex py-[18px] px-[30px] bg-white border-b-[1px] border-b-[#D3D3D3] cursor-pointer">
      <Stack spacing={2}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </Stack>
    </div>
  );
}
