# Friends & Memories Backend

Backend API for the Friends & Memories booking system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

## API Endpoints

### Admin
- `POST /api/admin/login` - Login with password
- `POST /api/admin/logout` - Logout

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch details
- `POST /api/branches` - Create branch (admin only)

### Services & Pricing
- `GET /api/services` - Get all services
- `GET /api/pricing` - Get all pricing
- `GET /api/pricing/:service/:duration` - Get specific pricing

### Add-ons
- `GET /api/cakes` - Get cake options
- `GET /api/decorations` - Get decoration options
- `GET /api/occasions` - Get occasions

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `GET /api/bookings` - List bookings (admin only)
- `PUT /api/bookings/:id` - Update booking (admin only)
- `DELETE /api/bookings/:id` - Cancel booking (admin only)

### Availability
- `GET /api/availability/:branchId/:date/:service` - Get available time slots

### Payments
- `POST /api/payments/process` - Process payment
- `GET /api/payments/:bookingId` - Get payment status

### Admin Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

## Default Admin Password
`admin123`
