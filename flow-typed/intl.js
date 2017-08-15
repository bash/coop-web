// @flow

type DateTimeFormatOptions = {
  localeMatcher?: "lookup" | "best fit",
  timeZone?: string,
  hour12?: boolean,
  formatMatcher?: "basic" | "best fit",
  weekday?: "narrow" | "short" | "long",
  era?: "narrow" | "short" | "long",
  year?: "numeric" | "2-digit",
  month?: "numeric" | "2-digit" | "narrow" | "short" | "long",
  day?: "numeric" | "2-digit",
  hour?: "numeric" | "2-digit",
  minute?: "numeric" | "2-digit",
  second?: "numeric" | "2-digit",
  timeZoneName?: "short" | "short" | "long",
}

class DateTimeFormat {
  constructor (locales?: string|Array<string>, options: DateTimeFormatOptions) {}
  format (date: Date): string { return "" }
}

declare var Intl: {
  DateTimeFormat: Class<DateTimeFormat>
}
