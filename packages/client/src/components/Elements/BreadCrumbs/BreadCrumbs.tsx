import * as React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import { Box } from "@mui/material";

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
    // <Typography key="3" color="text.primary" sx={{ fontSize: 14 }}>
    //   Breadcrumb
    // </Typography>,
  ];

  return (
    <Box
      sx={{
        display: "flex",
        padding: "18px 30px",
        backgroundColor: "#FFFFFF",
        borderBottom: "1px solid #D3D3D3",
        cursor: "pointer",
      }}
    >
      <Stack spacing={2}>
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {breadcrumbs}
        </Breadcrumbs>
      </Stack>
    </Box>
  );
}
