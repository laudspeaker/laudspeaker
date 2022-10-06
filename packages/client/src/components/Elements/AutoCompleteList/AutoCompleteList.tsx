import * as React from "react";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Autocomplete from "@mui/material/Autocomplete";
import SearchListItem from "../SearchListItem";

// Top 100 films as rated by IMDb users. http://www.imdb.com/chart/top
const top100Films = [
  { title: "The Shawshank Redemption", year: 1994 },
  { title: "The Godfather", year: 1972 },
  { title: "The Godfather: Part II", year: 1974 },
  { title: "The Dark Knight", year: 2008 },
  { title: "12 Angry Men", year: 1957 },
];

const AutoCompleteList = () => {
  return (
    <Stack>
      <Autocomplete
        id="free-solo-demo"
        freeSolo
        open
        noOptionsText
        options={top100Films.map((option) => option.title)}
        renderOption={(props, option) => {
          return <SearchListItem title={option} />;
        }}
        renderInput={(params) => <TextField {...params} label="" />}
        placeholder="Search by message or campaign"
        sx={{
          margin: "100px",
          borderRadius: "15px",
          ".MuiOutlinedInput-root": {
            padding: "15px",
            // background: "#FAFAFA",
            // border: "1px solid rgba(0, 0, 0, 0.25)",
            // borderRadius: "9px",
          },
          ".MuiOutlinedInput-notchedOutline": {
            border: 0,
          },
        }}
      />
    </Stack>
  );
};

export default AutoCompleteList;
