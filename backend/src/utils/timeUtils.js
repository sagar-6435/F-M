export const OPENING_TIME_MINUTES = 10 * 60; // 10:00 AM
export const CLOSING_TIME_MINUTES = 23 * 60 + 59; // 11:59 PM
export const SLOT_STEP_MINUTES = 30; // Internal step for generating all possible start times

export const to12HourTime = (minutes) => {
  const period = minutes >= 12 * 60 ? 'PM' : 'AM';
  const hour24 = Math.floor(minutes / 60) % 24;
  const hour12 = hour24 % 12 || 12;
  const mins = minutes % 60;
  return `${hour12}:${String(mins).padStart(2, '0')} ${period}`;
};

export const parse12HourTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (minutes < 0 || minutes >= 60 || hours < 1 || hours > 12) return null;
  if (hours === 12) hours = 0;
  if (period === 'PM') hours += 12;
  return hours * 60 + minutes;
};

export const buildDaySlots = () => {
  const slots = [];
  for (let minute = OPENING_TIME_MINUTES; minute <= CLOSING_TIME_MINUTES; minute += SLOT_STEP_MINUTES) {
    slots.push(to12HourTime(minute));
  }
  return slots;
};

export const calculateBookingTimes = (startTimeStr, durationHours) => {
  const startMinutes = parse12HourTime(startTimeStr);
  if (startMinutes === null) return null;
  
  const movieDurationMinutes = Math.round(Number(durationHours) * 60);
  const endMinutes = startMinutes + movieDurationMinutes;
  const endWithBufferMinutes = endMinutes + 30;
  
  return {
    startTime: startTimeStr,
    startTimeMinutes: startMinutes,
    endTime: to12HourTime(endMinutes),
    endTimeMinutes: endMinutes,
    endTimeWithBuffer: to12HourTime(endWithBufferMinutes),
    endTimeWithBufferMinutes: endWithBufferMinutes
  };
};

export const getBlockedSlotsForBooking = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return [];
  const slotsToBlock = Math.max(1, Math.round((Number(durationHours) * 60) / SLOT_STEP_MINUTES));
  const blocked = [];
  for (let i = 0; i < slotsToBlock; i++) {
    blocked.push(to12HourTime(startMinutes + i * SLOT_STEP_MINUTES));
  }
  return blocked;
};

export const canFitBookingInOperatingHours = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return false;
  const endMinutes = startMinutes + Number(durationHours) * 60;
  // Reject if Start time < 10:00 AM or End time > 11:59 PM
  return startMinutes >= OPENING_TIME_MINUTES && endMinutes <= CLOSING_TIME_MINUTES;
};

export const isOverlappingWithBuffer = (newStart, newDuration, existingStartStr, existingDuration) => {
  const newEnd = newStart + Number(newDuration) * 60;
  const existingStart = parse12HourTime(existingStartStr);
  if (existingStart === null) return false;
  const existingEnd = existingStart + Number(existingDuration) * 60;
  
  // CORE CONDITION: Reject if there's less than 30-min gap between intervals
  if (newStart < (existingEnd + 30) && existingStart < (newEnd + 30)) {
    return true;
  }
  return false;
};

export const getAvailableStartSlots = (bookings, requestedDuration = 1) => {
  const availableSlots = [];
  const SLOT_STEP = 30; // 30-minute granularity for maximum revenue
  const requestedDurationMinutes = Number(requestedDuration) * 60;
  
  // Scans from 10:00 AM to 12:00 AM
  for (let minutes = OPENING_TIME_MINUTES; minutes + requestedDurationMinutes <= CLOSING_TIME_MINUTES; minutes += SLOT_STEP) {
    let hasConflict = false;
    
    for (const b of bookings) {
      // Logic: New Start < (Existing End + 30) AND Existing Start < (New End + 30)
      if (isOverlappingWithBuffer(minutes, requestedDuration, b.timeSlot, b.duration)) {
        hasConflict = true;
        break;
      }
    }
    
    if (!hasConflict) {
      availableSlots.push(to12HourTime(minutes));
    }
  }
  
  return availableSlots;
};
