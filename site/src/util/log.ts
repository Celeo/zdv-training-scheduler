import { createLogger, format, transports } from "winston";

/**
 * Backend app logging to console and file.
 */
export const LOGGER = createLogger({
  level: "info",
  transports: [
    new transports.File({
      filename: "log.txt",
      format: format.combine(
        format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        format.simple(),
      ),
    }),
    new transports.Console({
      format: format.combine(format.colorize(), format.simple()),
    }),
  ],
});
