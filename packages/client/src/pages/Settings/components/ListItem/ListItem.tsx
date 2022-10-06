import { Box, Typography } from "@mui/material";

interface ListItemProps {
  title: string;
  subtitle: string;
  tick?: boolean;
}
const ListItem = ({ title, subtitle, tick }: ListItemProps) => {
  return (
    <Box
      display={"flex"}
      flex={1}
      sx={{
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px",
        border: "1px solid #F3F3F3",
        borderRadius: "5px",
      }}
    >
      <Box>
        <Typography
          sx={{
            fontWeight: 500,
            fontSize: "16px",
            color: "#000",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            marginLeft: "25px",
            fontSize: "12px",
            color: "#000",
          }}
        >
          {subtitle}
        </Typography>
      </Box>
      {tick && (
        <Box
          sx={{
            borderRadius: "50%",
            aspectRatio: "1",
            width: "20px",
            height: "20px",
            backgroundColor: "#4FA198",
            color: "white",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          ✔
        </Box>
      )}
    </Box>
  );
};

export default ListItem;
