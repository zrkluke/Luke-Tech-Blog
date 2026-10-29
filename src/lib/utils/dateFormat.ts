const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Taipei",
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateFormat = (date: Date | string): string => {
  const [day, month, year] = formatter
    .formatToParts(new Date(date))
    .filter(({ type }) => type !== "literal")
    .map(({ value }) => value);
  return `${day} ${month}, ${year}`;
};

export default dateFormat;
