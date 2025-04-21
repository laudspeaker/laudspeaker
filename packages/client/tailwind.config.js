/** @type {import('tailwindcss').Config} */
const withMT = require("@material-tailwind/react/utils/withMT");
module.exports = withMT({
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        segoe: ["Segoe UI", "Roboto"],
        roboto: ["Roboto"],
        inter: ["Inter", "Roboto"],
        pingFangSC: ["PingFang SC", "Roboto"],
      },
    },
  },
  plugins: [require("@tailwindcss/forms")],
});
