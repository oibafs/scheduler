export function daysUntilRepeat(originalDate, recurring, recPeriod) {
  let future = new Date(originalDate);

  switch (recPeriod) {

    case "days":
      return recurring;
      break;

    case "weeks":
      return (recurring * 7);
      break;

    case "months":
      future.setUTCMonth(future.getUTCMonth() + recurring);
      return dateDiff(originalDate, future);
      break;

    case "years":
      future.setUTCFullYear(future.getUTCFullYear() + recurring);
      return dateDiff(originalDate, future);
      break;

  }

}

export function dateDiff(originalDate, futureDate) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.floor((futureDate - originalDate) / _MS_PER_DAY);
}