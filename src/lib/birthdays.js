export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function validDob(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return y >= 1900 && localDate(dt) === value && value <= localDate();
}
export function daysUntilBirthday(dob, now = new Date()) {
  const [, m, d] = dob.split("-").map(Number);
  const year = now.getFullYear();
  const birthday = (y) =>
    new Date(y, m - 1, Math.min(d, new Date(y, m, 0).getDate()));
  let next = birthday(year);
  const today = new Date(year, now.getMonth(), now.getDate());
  if (next < today) next = birthday(year + 1);
  return Math.round(
    (Date.UTC(next.getFullYear(), next.getMonth(), next.getDate()) -
      Date.UTC(year, today.getMonth(), today.getDate())) /
      86400000,
  );
}
