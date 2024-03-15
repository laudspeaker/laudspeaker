const getNumericFormat = (number: number, precision = 1) => {
  const numerals = [
    { suffix: "M", threshold: 1e6 },
    { suffix: "K", threshold: 1e3 },
    { suffix: "", threshold: 1 },
  ];

  const digit = numerals.find(
    (numeral) => Math.abs(number) >= numeral.threshold
  );
  if (digit && digit.threshold !== 1) {
    const formatted =
      (number / digit.threshold).toFixed(precision) + digit.suffix;
    return formatted;
  }

  return number;
};

export default getNumericFormat;
