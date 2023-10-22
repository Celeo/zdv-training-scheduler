import { DateTime } from "luxon";

/**
 * First name, last name, and OIs.
 *
 * Many other data types have these fields, and can
 * be used in `infoToName` without modification.
 */
export type PrintableName = {
  first_name: string;
  last_name: string;
  operating_initials: string;
};

/**
 * Using a user or controller's info, format
 * their name for display and logging.
 */
export function infoToName(info: PrintableName): string {
  return `${info.first_name} ${info.last_name} (${info.operating_initials})`;
}

/**
 * `Date` to `string` options.
 */
export enum DateDisplayTypes {
  DateAndTime,
  Date,
  Time,
}

/**
 * Format a JS `Date` object for display.
 */
export function dateToStr(dateTime: DateTime, type: DateDisplayTypes): string {
  switch (type) {
    case DateDisplayTypes.DateAndTime: {
      const d = dateToStr(dateTime, DateDisplayTypes.Date);
      const t = dateToStr(dateTime, DateDisplayTypes.Time);
      return `${d} at ${t}`;
    }
    case DateDisplayTypes.Date:
      return dateTime.toISODate()!;
    case DateDisplayTypes.Time:
      return dateTime.toLocaleString(DateTime.TIME_24_SIMPLE);
  }
}
