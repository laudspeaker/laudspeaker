import { Box, Typography } from "@mui/material";
import React from "react";
import EmailIcon from "../../../assets/images/EmailIcon.svg";

interface IListProp {
  title?: string;
}
const SearchListItem = (props: IListProp) => {
  const { title } = props;
  return (
    <Box
      display="flex"
      flexDirection="column"
      gap="5px"
      margin="5px 15px"
      border="1px solid #F3F3F3"
      padding="5px"
      borderRadius="5px"
    >
      <Box display="flex" gap="12px">
        <img src={EmailIcon} />
        <Typography variant="subtitle2">{title}</Typography>
      </Box>
      <Box display="flex" marginLeft="30px">
        <Typography
          sx={{
            fontFamily: "Inter",
            fontStyle: "normal",
            fontWeight: " 400",
            fontSize: "12px",
            lineHeight: "24px",
          }}
        >
          Subtitle
        </Typography>
      </Box>
    </Box>
  );
};

export default SearchListItem;
