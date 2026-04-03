import { getAvailableStartSlots, parse12HourTime, to12HourTime } from './src/utils/timeUtils.js';

const fmt = (slots) => slots.join(', ');

console.log('NO BOOKINGS:');
console.log('1hr:', fmt(getAvailableStartSlots([], 1)));
console.log('2hr:', fmt(getAvailableStartSlots([], 2)));
console.log('3hr:', fmt(getAvailableStartSlots([], 3)));

console.log('\nAFTER 1hr booking @ 10:00 AM:');
const b1 = [{ timeSlot: '10:00 AM', duration: 1 }];
console.log('1hr:', fmt(getAvailableStartSlots(b1, 1)));
console.log('2hr:', fmt(getAvailableStartSlots(b1, 2)));
console.log('3hr:', fmt(getAvailableStartSlots(b1, 3)));

console.log('\nAFTER 2hr booking @ 10:00 AM:');
const b2 = [{ timeSlot: '10:00 AM', duration: 2 }];
console.log('1hr:', fmt(getAvailableStartSlots(b2, 1)));
console.log('2hr:', fmt(getAvailableStartSlots(b2, 2)));
console.log('3hr:', fmt(getAvailableStartSlots(b2, 3)));

const s3 = getAvailableStartSlots([], 3);
const last3 = s3[s3.length-1];
const m = parse12HourTime(last3);
console.log('\n3hr last slot:', last3, '-> end:', to12HourTime(m+180));
