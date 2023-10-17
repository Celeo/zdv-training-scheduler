/**
 * First name, last name, and OIs.
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
