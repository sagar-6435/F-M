import XLSX from 'xlsx';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const excelDir = path.join(__dirname, '../../data/bookings');

// Ensure directory exists
await fs.mkdir(excelDir, { recursive: true }).catch(() => {});

export const exportBookingToExcel = async (booking) => {
  try {
    const fileName = `bookings_${booking.branch || 'all'}.xlsx`;
    const filePath = path.join(excelDir, fileName);

    let workbook;
    let worksheet;

    // Check if file exists
    try {
      await fs.access(filePath);
      // File exists, read it
      const fileBuffer = await fs.readFile(filePath);
      workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      worksheet = workbook.Sheets[workbook.SheetNames[0]];
    } catch {
      // File doesn't exist, create new workbook
      workbook = XLSX.utils.book_new();
      worksheet = XLSX.utils.aoa_to_sheet([
        [
          'Booking ID',
          'Branch',
          'Service',
          'Date',
          'Time Slot',
          'Duration (hrs)',
          'Customer Name',
          'Phone',
          'Occasion',
          'Decoration Required',
          'Cake Selected',
          'Extra Decorations',
          'Total Price',
          'Payment Status',
          'Booking Date',
        ],
      ]);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Bookings');
    }

    // Get existing data
    const existingData = XLSX.utils.sheet_to_json(worksheet);

    // Format extra decorations
    const extraDecorations = booking.extraDecorations
      ?.map((d) => `${d.name} (₹${d.price})`)
      .join('; ') || 'None';

    // Add new booking row
    const newRow = {
      'Booking ID': booking.id,
      'Branch': booking.branch,
      'Service': booking.service,
      'Date': booking.date,
      'Time Slot': booking.timeSlot,
      'Duration (hrs)': booking.duration,
      'Customer Name': booking.name,
      'Phone': booking.phone,
      'Occasion': booking.customOccasion || booking.occasion,
      'Decoration Required': booking.decorationRequired ? 'Yes' : 'No',
      'Cake Selected': booking.selectedCake ? `${booking.selectedCake.name} (₹${booking.selectedCake.price})` : 'None',
      'Extra Decorations': extraDecorations,
      'Total Price': booking.totalPrice,
      'Payment Status': booking.paymentStatus,
      'Booking Date': new Date().toLocaleString(),
    };

    existingData.push(newRow);

    // Create new worksheet with updated data
    const newWorksheet = XLSX.utils.json_to_sheet(existingData);

    // Set column widths
    const columnWidths = [
      { wch: 12 }, // Booking ID
      { wch: 15 }, // Branch
      { wch: 18 }, // Service
      { wch: 12 }, // Date
      { wch: 15 }, // Time Slot
      { wch: 14 }, // Duration
      { wch: 18 }, // Customer Name
      { wch: 15 }, // Phone
      { wch: 20 }, // Occasion
      { wch: 18 }, // Decoration
      { wch: 25 }, // Cake
      { wch: 30 }, // Extra Decorations
      { wch: 12 }, // Total Price
      { wch: 15 }, // Payment Status
      { wch: 20 }, // Booking Date
    ];
    newWorksheet['!cols'] = columnWidths;

    // Replace worksheet
    workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;

    // Write file
    await fs.writeFile(filePath, XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }));

    console.log(`Booking exported to Excel: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error exporting booking to Excel:', error);
    throw error;
  }
};

export const getBookingsExcelFile = async (branch) => {
  try {
    const fileName = `bookings_${branch || 'all'}.xlsx`;
    const filePath = path.join(excelDir, fileName);

    // Check if file exists
    await fs.access(filePath);
    return filePath;
  } catch {
    return null;
  }
};
