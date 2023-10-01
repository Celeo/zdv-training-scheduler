/**
 * Take a JS-native `Date` object and return a string
 * in the form of 'yyyy-mm-dd', like '2023-06-15'.
 */
export function dateToDateStr(date: Date): string {
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}
