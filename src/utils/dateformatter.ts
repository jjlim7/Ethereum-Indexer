export const formatDateForMongoDB = (timestamp: number): string => {
  let date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.toISOString().replace("Z", "+00:00");
};
