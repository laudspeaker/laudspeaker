export const getColorSchema = (status: string) => {
  switch (status) {
    case "delivered":
      return "#B8F2E6";
    case "undelivered":
      return "#D3D3D3";
    case "error":
      return "#D17E83";
  }
};
