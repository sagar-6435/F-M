// ─── Constants ────────────────────────────────────────────────────────────────
export const OPENING_TIME_MINUTES = 10 * 60;   // 10:00 AM  = 600 min
export const CLOSING_TIME_MINUTES = 24 * 60;   // 12:00 AM  = 1440 min (midnight)
export const BUFFER_MINUTES = 30;               // mandatory gap between bookings

// ─── Time helpers ─────────────────────────────────────────────────────────────

/** Convert total minutes-since-midnight to 12-hour clock string, e.g. "10:00 AM" */
export const to12HourTime = (minutes) => {
  // Normalise across midnight
  const normalized = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const period  = normalized >= 12 * 60 ? 'PM' : 'AM';
  const hour24  = Math.floor(normalized / 60);
  const hour12  = hour24 % 12 || 12;
  const mins    = normalized % 60;
  return `${hour12}:${String(mins).padStart(2, '0')} ${period}`;
};

/** Parse a 12-hour clock string to total minutes-since-midnight. Returns null on error. */
export const parse12HourTime = (timeString) => {
  if (!timeString || typeof timeString !== 'string') return null;
  const match = timeString.trim().match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period  = match[3].toUpperCase();
  if (minutes < 0 || minutes >= 60 || hours < 1 || hours > 12) return null;
  if (hours === 12) hours = 0;
  if (period === 'PM') hours += 12;
  return hours * 60 + minutes;
};

// ─── Core: generate available slots for a given duration ─────────────────────

// ─── Core: generate available slots for a given duration ─────────────────────

/**
 * Generate the list of available start-time strings for a given duration,
 * taking existing bookings into account.
 *
 * Algorithm
 * ─────────
 * 1. If there are NO bookings → return the default template slots that end ≤ CLOSING.
 * 2. If there ARE bookings:
 *    a. Find the latest "blocked-until" minute across all bookings
 *       (blocked-until = bookingStartMinutes + bookingDuration*60 + 30-min buffer).
 *    b. The FIRST available slot for this duration must start at or after `blockedUntil`.
 *       We snap it up to the next valid position in our spacing grid:
 *       firstStart = max(blockedUntil, BASE_SLOTS_MINUTES[duration][0])
 *       then align to the spacing: firstStart rounded UP to nearest multiple of
 *       START_TO_START starting from BASE_SLOTS[0].
 *    c. Generate subsequent slots every START_TO_START minutes until the slot would
 *       end AFTER CLOSING_TIME_MINUTES.
 *
 * @param {Array}  bookings          Array of booking objects {timeSlot, duration}
 * @param {number} requestedDuration 1 | 2 | 3
 * @returns {string[]}  Array of available start-time strings ("10:00 AM", …)
 */
export const getAvailableStartSlots = (bookings = [], requestedDuration = 1) => {
  const dur          = Number(requestedDuration);
  const durMinutes   = dur * 60;
  const buffer       = BUFFER_MINUTES;
  const opening      = OPENING_TIME_MINUTES;
  const closing      = CLOSING_TIME_MINUTES;

  // ── Sorting bookings by time simplifies overlap detection ─────────────────
  const sortedBookings = [...bookings]
    .map(b => ({
      start: parse12HourTime(b.timeSlot),
      end: (parse12HourTime(b.timeSlot) || 0) + Number(b.duration) * 60
    }))
    .filter(b => b.start !== null)
    .sort((a, b) => a.start - b.start);

  const available = [];
  let currentStart = opening;

  // ── Dynamic Grid Generation: step forward by (Duration + Buffer) ──────────
  while (currentStart + durMinutes <= closing) {
    let conflict = null;
    
    // Check if this potential slot overlaps with ANY existing booking (+buffer)
    for (const b of sortedBookings) {
      const bStart        = b.start;
      const bEndWithBuf   = b.end + buffer;
      
      // Overlap condition for intervals [s1, e1] and [s2, e2]:
      //   s1 < e2 AND s2 < e1
      // Here: s1 = currentStart, e1 = currentStart + durMinutes + buffer
      //       s2 = bStart, e2 = bEndWithBuf
      // Note: we include the buffer of the NEW slot in the check to ensure 
      // there's a gap after it too, or it ends exactly when another starts.
      if (currentStart < bEndWithBuf && bStart < (currentStart + durMinutes + buffer)) {
        conflict = b;
        break;
      }
    }

    if (!conflict) {
      available.push(to12HourTime(currentStart));
      currentStart += (durMinutes + buffer);
    } else {
      // Shift start time to immediately after the conflicting booking's buffer
      currentStart = conflict.end + buffer;
    }
  }

  return available;
};

// ─── Booking-time helpers ─────────────────────────────────────────────────────

/** Calculate derived time fields for a booking. */
export const calculateBookingTimes = (startTimeStr, durationHours) => {
  const startMinutes = parse12HourTime(startTimeStr);
  if (startMinutes === null) return null;

  const durMinutes           = Math.round(Number(durationHours) * 60);
  const endMinutes           = startMinutes + durMinutes;
  const endWithBufferMinutes = endMinutes + BUFFER_MINUTES;

  return {
    startTime:               startTimeStr,
    startTimeMinutes:        startMinutes,
    endTime:                 to12HourTime(endMinutes),
    endTimeMinutes:          endMinutes,
    endTimeWithBuffer:       to12HourTime(endWithBufferMinutes),
    endTimeWithBufferMinutes: endWithBufferMinutes,
  };
};

/**
 * Returns the 30-min micro-slots that should be marked as "booked" in the
 * TimeSlot collection (one record per 30-min chunk the booking occupies).
 */
export const getBlockedSlotsForBooking = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return [];
  const chunksNeeded = Math.max(1, Math.round((Number(durationHours) * 60) / 30));
  const blocked = [];
  for (let i = 0; i < chunksNeeded; i++) {
    blocked.push(to12HourTime(startMinutes + i * 30));
  }
  return blocked;
};

/** Returns true if starting at newStart (minutes) for newDuration hours
 *  would be within 30 min of an existing booking. */
export const isOverlappingWithBuffer = (newStart, newDuration, existingStartStr, existingDuration) => {
  const newEnd       = newStart + Number(newDuration) * 60;
  const existingStart = parse12HourTime(existingStartStr);
  if (existingStart === null) return false;
  const existingEnd  = existingStart + Number(existingDuration) * 60;

  // Two intervals conflict (with 30-min buffer) when:
  //   newStart < existingEnd + 30  AND  existingStart < newEnd + 30
  return newStart < (existingEnd + BUFFER_MINUTES) &&
         existingStart < (newEnd + BUFFER_MINUTES);
};

/** Validate that a booking fits within operating hours (10 AM – midnight). */
export const canFitBookingInOperatingHours = (startTime, durationHours = 1) => {
  const startMinutes = parse12HourTime(startTime);
  if (startMinutes === null) return false;
  const endMinutes = startMinutes + Number(durationHours) * 60;
  return startMinutes >= OPENING_TIME_MINUTES && endMinutes <= CLOSING_TIME_MINUTES;
};

/** Kept for legacy compatibility – not used in the new slot algorithm. */
export const buildDaySlots = () => {
  const slots = [];
  for (let m = OPENING_TIME_MINUTES; m < CLOSING_TIME_MINUTES; m += 30) {
    slots.push(to12HourTime(m));
  }
  return slots;
};
