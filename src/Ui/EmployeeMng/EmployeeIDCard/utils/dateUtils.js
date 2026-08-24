/**
 * Returns a new Date that is `months` months from today.
 */
export const addMonths = (months) => {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d;
};

/**
 * Format a Date as DD/MM/YYYY (displayed on the card).
 */
export const formatDate = (d) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(
    2,
    "0",
  )}/${d.getFullYear()}`;

/**
 * Format a Date as YYYY-MM-DD (used as the value of <input type="date">).
 */
export const toInputValue = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;