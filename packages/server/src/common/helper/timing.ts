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

  let checkIntervals: [number, number][] = [];
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
      currentTimeMinOfDay >= checkInterval[0] &&
      currentTimeMinOfDay <= checkInterval[1]
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

