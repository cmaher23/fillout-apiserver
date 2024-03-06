const formatStringStandard = (value) => {
  return typeof value === "string" ? value.toLowerCase() : value;
};

export default formatStringStandard;
