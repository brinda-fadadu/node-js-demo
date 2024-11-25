const capitalize = (str) => {
  try {
    if (!str) return "";
    let strings = str.split("_");
    let result = "";
    strings.forEach((string) => {
      result += string.charAt(0).toUpperCase() + string.slice(1) + " ";
    });
    return result.trim();
  } catch (err) {
    console.error(err);
    return "";
  }
};

module.exports = {
  capitalize,
};
