import { getLocalTimeZone, now } from '@internationalized/date';

export function parseAbsoluteToLocal(date: Date) {
  return now(getLocalTimeZone()).set({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate()
  });
}

