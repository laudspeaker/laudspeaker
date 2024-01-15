/**
 * Returns true if @param checkTime falls
 *  between the interval @param startTime and @param endtTime.
 *  This function is day independent, so if endTime is before startTime
 *  it will still work as expected.
 *
 * @param startTime: time string formatted as "hh:mm"
 * @param endTime: time string formatted as "hh:mm"
 * @param checkTime: time string formatted as "hh:mm"
 * @returns @boolean
 */
export function isWithinInterval(
  startTime: string,
  endTime: string,
  checkTime: string
) {
  const currentTimeMinOfDay = getMinuteOfDay(checkTime);
  const startTimeMinOfDay = getMinuteOfDay(startTime);
  const endTimeMinOfDay = getMinuteOfDay(endTime);

  const checkIntervals: [number, number][] = [];
  if (endTimeMinOfDay < startTimeMinOfDay) {
    // add start time to 23:59
    checkIntervals.push([startTimeMinOfDay, 24 * 60]);
    // add 00:00 - end time
    checkIntervals.push([0, endTimeMinOfDay]);
  } else {
    checkIntervals.push([startTimeMinOfDay, endTimeMinOfDay]);
  }
  let isWithin = false;
  for (const checkInterval of checkIntervals) {
    if (
      currentTimeMinOfDay > checkInterval[0] &&
      currentTimeMinOfDay < checkInterval[1]
    ) {
      isWithin = true;
    }
  }
  return isWithin;
}

/**
 * Convert time string "hh:mm" to integer minute of day representation.
 * @param timeString: in format "hh:mm"
 * @returns integer minute of day
 */
function getMinuteOfDay(timeString: string) {
  return (
    parseInt(timeString.split(':')[0]) * 60 + parseInt(timeString.split(':')[1])
  );
}

/**
 * Convert minute of day to timeString in format "hh:mm"
 * @param minOfDay: number, can't be over 1439 or you'll get unexpected results.
 * @returns timeString in format "hh:mm"
 */
function getTimeString(minOfDay: number) {
  const numFormatter = Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
  const hour = Math.floor(minOfDay / 60);
  const minute = minOfDay - hour * 60;
  return `${numFormatter.format(hour)}:${numFormatter.format(minute)}`;
}

/**
 * Convert time string to the corresponding time in UTC.
 * This function if the time is one day before, it will properly
 * convert to the time it was 1 day before and not go negative
 * or greater than 23:59
 * @param time, string in format "hh:mm"
 * @param utcOffset
 * @returns time, UTC
 */
export function convertTimeToUTC(time: string, utcOffset: string) {
  if (!utcOffset.startsWith('UTC+') && !utcOffset.startsWith('UTC-')) {
    throw Error(
      `UTCOffset was not formatted correctly ${utcOffset}, ${convertTimeToUTC.name}`
    );
  }
  const utcSign = utcOffset[3] as '+' | '-';
  const offsetTime = getMinuteOfDay(utcOffset.split(utcSign)[1]);
  const localTime = getMinuteOfDay(time);
  let utcTime: number;
  if (utcSign === '+') {
    utcTime = localTime - offsetTime;
  } else {
    utcTime = localTime + offsetTime;
  }
  if (utcTime < 0) {
    utcTime = 60 * 24 + utcTime;
  } else if (utcTime >= 60 * 24) {
    utcTime = utcTime - 60 * 24;
  }
  return getTimeString(utcTime);
}
