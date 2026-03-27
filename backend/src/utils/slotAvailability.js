/**
 * Slot Availability Logic with Gap-Based Restrictions
 * 
 * Rules:
 * - If 10–1 is booked → next available slot starts at 1:00
 * - If gap = 1 hour → allow only 1 hour booking
 * - If gap = 3 hours → allow all (1/2/3 hour) bookings
 * - If gap < 1 hour → no bookings allowed
 */

const SLOT_STEP_MINUTES = 30;

/**
 * Parse 12-hour time format to minutes since midnight
 * @param {string} timeString - Time in format "HH:MM AM/PM"
 * @returns {number|null} Minutes since midnight or null if invalid
 */
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

/**
 * Calculate the gap in minutes between the end of the last booking
 * and the start of the requested slot
 * 
 * @param {string[]} bookedSlots - Array of booked time slots
 * @param {number} startSlotIndex - Index of the requested start slot in daySlots
 * @param {string[]} daySlots - All available slots for the day
 * @returns {number} Gap in minutes (Infinity if no prior bookings)
 */
export const calculateGapMinutes = (bookedSlots, startSlotIndex, daySlots) => {
  if (bookedSlots.length === 0) return Infinity; // No bookings, unlimited gap
  
  const startSlot = daySlots[startSlotIndex];
  const startMinutes = parse12HourTime(startSlot);
  
  // Find the last booked slot before this start time
  let lastBookedMinutes = -1;
  for (const bookedSlot of bookedSlots) {
    const bookedMinutes = parse12HourTime(bookedSlot);
    if (bookedMinutes < startMinutes && bookedMinutes > lastBookedMinutes) {
      lastBookedMinutes = bookedMinutes;
    }
  }
  
  if (lastBookedMinutes === -1) return Infinity; // No prior bookings
  
  // Gap is from end of last booking to start of next slot
  // Each slot is 30 minutes, so add 30 to get the end time
  const lastBookedEndMinutes = lastBookedMinutes + SLOT_STEP_MINUTES;
  return startMinutes - lastBookedEndMinutes;
};

/**
 * Get allowed booking durations based on the gap between bookings
 * 
 * Gap Rules:
 * - Gap >= 3 hours: Allow 1, 2, 3 hour bookings
 * - Gap = 1 hour: Allow only 1 hour booking
 * - Gap < 1 hour: No bookings allowed
 * 
 * @param {number} gapMinutes - Gap in minutes
 * @returns {number[]} Array of allowed durations in hours
 */
export const getAllowedDurationsForGap = (gapMinutes) => {
  if (gapMinutes >= 3 * 60) {
    // Gap >= 3 hours: allow 1, 2, 3 hour bookings
    return [1, 2, 3];
  } else if (gapMinutes >= 1 * 60) {
    // Gap = 1 hour: allow only 1 hour booking
    return [1];
  }
  return []; // Gap < 1 hour: no bookings allowed
};

/**
 * Get available slots with gap-based duration restrictions
 * 
 * @param {string[]} bookedSlots - Array of booked time slots
 * @param {number} requestedDuration - Requested booking duration in hours
 * @param {string[]} daySlots - All available slots for the day
 * @param {number} closingTimeMinutes - Closing time in minutes since midnight
 * @returns {string[]} Array of available start times for the requested duration
 */
export const getAvailableSlotsWithGapRestrictions = (
  bookedSlots,
  requestedDuration = 1,
  daySlots,
  closingTimeMinutes
) => {
  const bookedSet = new Set(bookedSlots);
  const needed = Math.max(1, Math.round((Number(requestedDuration) * 60) / SLOT_STEP_MINUTES));
  const available = [];

  for (let i = 0; i < daySlots.length; i++) {
    const start = daySlots[i];
    const startMinutes = parse12HourTime(start);
    if (startMinutes === null) continue;

    const endMinutes = startMinutes + Number(requestedDuration) * 60;
    if (endMinutes > closingTimeMinutes + SLOT_STEP_MINUTES) continue;

    // Check if slots are available (not booked)
    let canUse = true;
    for (let j = 0; j < needed; j++) {
      const slot = daySlots[i + j];
      if (!slot || bookedSet.has(slot)) {
        canUse = false;
        break;
      }
    }
    
    if (!canUse) continue;

    // Check gap-based restrictions
    const gapMinutes = calculateGapMinutes(bookedSlots, i, daySlots);
    const allowedDurations = getAllowedDurationsForGap(gapMinutes);
    
    if (allowedDurations.includes(requestedDuration)) {
      available.push(start);
    }
  }

  return available;
};

/**
 * Get all possible durations available for a given slot
 * Useful for showing users what durations they can book
 * 
 * @param {string[]} bookedSlots - Array of booked time slots
 * @param {number} slotIndex - Index of the slot to check
 * @param {string[]} daySlots - All available slots for the day
 * @returns {number[]} Array of available durations in hours
 */
export const getAvailableDurationsForSlot = (bookedSlots, slotIndex, daySlots) => {
  const gapMinutes = calculateGapMinutes(bookedSlots, slotIndex, daySlots);
  return getAllowedDurationsForGap(gapMinutes);
};
