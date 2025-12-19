/**
 * Check if a punch-in time has exceeded the duration in its timezone
 * Example: If candidate punches in at 9:00 AM EST, they should be auto-punched out at 6:00 PM EST (9 hours later in EST)
 * @param {Date} punchInTime - Punch-in time (stored as UTC in DB)
 * @param {string} timezone - IANA timezone (e.g., 'America/New_York', 'Asia/Kolkata', 'UTC')
 * @param {number} durationHours - Duration in hours
 * @returns {boolean} True if duration has been exceeded in the candidate's timezone
 */
const hasExceededDurationInTimezone = (punchInTime, timezone, durationHours) => {
  const now = new Date();
  
  // If timezone is UTC, use simple time-based calculation
  if (timezone === 'UTC' || !timezone) {
    const elapsedMs = now.getTime() - punchInTime.getTime();
    const elapsedHours = elapsedMs / (1000 * 60 * 60);
    return elapsedHours >= durationHours;
  }
  
  // Get time components in the candidate's timezone for both punch-in and current time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Get punch-in time components in the candidate's timezone
  const punchInParts = formatter.formatToParts(punchInTime);
  const punchInYear = parseInt(punchInParts.find(p => p.type === 'year').value);
  const punchInMonth = parseInt(punchInParts.find(p => p.type === 'month').value) - 1;
  const punchInDay = parseInt(punchInParts.find(p => p.type === 'day').value);
  const punchInHour = parseInt(punchInParts.find(p => p.type === 'hour').value);
  const punchInMinute = parseInt(punchInParts.find(p => p.type === 'minute').value);
  const punchInSecond = parseInt(punchInParts.find(p => p.type === 'second').value);
  
  // Get current time components in the candidate's timezone
  const nowParts = formatter.formatToParts(now);
  const nowYear = parseInt(nowParts.find(p => p.type === 'year').value);
  const nowMonth = parseInt(nowParts.find(p => p.type === 'month').value) - 1;
  const nowDay = parseInt(nowParts.find(p => p.type === 'day').value);
  const nowHour = parseInt(nowParts.find(p => p.type === 'hour').value);
  const nowMinute = parseInt(nowParts.find(p => p.type === 'minute').value);
  const nowSecond = parseInt(nowParts.find(p => p.type === 'second').value);
  
  // Calculate expected punch-out time in the candidate's timezone
  let expectedPunchOutHour = punchInHour + durationHours;
  let expectedPunchOutDay = punchInDay;
  let expectedPunchOutMonth = punchInMonth;
  let expectedPunchOutYear = punchInYear;
  
  // Handle hour overflow (e.g., if punch-in is at 5 PM and duration is 9 hours, it becomes 2 AM next day)
  if (expectedPunchOutHour >= 24) {
    expectedPunchOutDay += Math.floor(expectedPunchOutHour / 24);
    expectedPunchOutHour = expectedPunchOutHour % 24;
  }
  
  // Handle day/month/year overflow (simplified - for production, use a proper date library)
  const daysInMonth = new Date(expectedPunchOutYear, expectedPunchOutMonth + 1, 0).getDate();
  if (expectedPunchOutDay > daysInMonth) {
    expectedPunchOutDay = expectedPunchOutDay - daysInMonth;
    expectedPunchOutMonth += 1;
    if (expectedPunchOutMonth >= 12) {
      expectedPunchOutMonth = 0;
      expectedPunchOutYear += 1;
    }
  }
  
  // Compare current time in timezone with expected punch-out time in timezone
  // Compare year
  if (nowYear > expectedPunchOutYear) return true;
  if (nowYear < expectedPunchOutYear) return false;
  
  // Compare month
  if (nowMonth > expectedPunchOutMonth) return true;
  if (nowMonth < expectedPunchOutMonth) return false;
  
  // Compare day
  if (nowDay > expectedPunchOutDay) return true;
  if (nowDay < expectedPunchOutDay) return false;
  
  // Compare hour
  if (nowHour > expectedPunchOutHour) return true;
  if (nowHour < expectedPunchOutHour) return false;
  
  // Same hour - compare minute (minutes stay the same when adding hours)
  if (nowMinute > punchInMinute) return true;
  if (nowMinute < punchInMinute) return false;
  
  // Same hour and minute - compare second (seconds stay the same when adding hours)
  return nowSecond >= punchInSecond;
};

/**
 * Get time components in a specific timezone
 * @param {Date} date - Date to convert
 * @param {string} timezone - IANA timezone
 * @returns {Object} Object with date components
 */
const getTimeComponentsInTimezone = (date, timezone) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  const parts = formatter.formatToParts(date);
  return {
    year: parseInt(parts.find(p => p.type === 'year').value),
    month: parseInt(parts.find(p => p.type === 'month').value) - 1,
    day: parseInt(parts.find(p => p.type === 'day').value),
    hour: parseInt(parts.find(p => p.type === 'hour').value),
    minute: parseInt(parts.find(p => p.type === 'minute').value),
    second: parseInt(parts.find(p => p.type === 'second').value),
  };
};

export {
  hasExceededDurationInTimezone,
  getTimeComponentsInTimezone,
};

