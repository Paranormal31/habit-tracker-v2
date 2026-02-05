import { User } from "../models/User";

export function formatDateParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

export function isValidDateString(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function parseMonth(month: string) {
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  return { year, month: monthNum };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export function addDays(dateStr: string, offset: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + offset);
  return formatDateParts(date, "UTC");
}

export async function getTodayInTimezone(userId: string) {
  const user = await User.findById(userId).select("timezone");
  const timeZone = user?.timezone || "UTC";
  return formatDateParts(new Date(), timeZone);
}
