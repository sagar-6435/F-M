# API Documentation

## Base URL
`http://localhost:5000`

## Authentication
Admin endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Admin Authentication

#### Login
```
POST /api/admin/login
Content-Type: application/json

{
  "password": "admin123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Login successful"
}
```

### Branches

#### Get All Branches
```
GET /api/branches

Response:
[
  {
    "id": "branch-1",
    "name": "Friends & Memories - Jubilee Hills",
    "address": "Plot 42, Road No. 10, Jubilee Hills, Hyderabad",
    "phone": "+91 99127 10932",
    "capacity": 100,
    "amenities": ["AC", "Sound System", "Projector"],
    "createdAt": "2026-03-25T...",
    "updatedAt": "2026-03-25T..."
  }
]
```

### Services & Pricing

#### Get All Services
```
GET /api/services

Response:
[
  {
    "id": "party-hall",
    "name": "Party Hall",
    "description": "Spacious party hall for celebrations"
  },
  {
    "id": "private-theatre",
    "name": "Private Theatre",
    "description": "Private theatre for movie nights"
  }
]
```

#### Get Pricing
```
GET /api/pricing

Response:
{
  "party-hall": { "1": 2999, "2": 4999, "3": 6999 },
  "private-theatre": { "1": 1999, "2": 3499, "3": 4999 }
}
```

### Add-ons

#### Get Cakes
```
GET /api/cakes

Response:
[
  {
    "id": "cake-1",
    "name": "Classic Chocolate Truffle",
    "price": 799,
    "description": "Rich dark chocolate layers"
  }
]
```

#### Get Decorations
```
GET /api/decorations

Response:
[
  {
    "id": "extra-1",
    "name": "Balloon Bouquet Setup",
    "price": 1500,
    "description": "100+ premium balloons"
  }
]
```

#### Get Occasions
```
GET /api/occasions

Response:
["Birthday", "Anniversary", "Proposal", "Baby Shower", "Farewell", "Get Together", "Date Night", "Other"]
```

### Availability

#### Get Available Time Slots
```
GET /api/availability/:branchId/:date/:service

Example: GET /api/availability/branch-1/2026-03-28/party-hall

Response:
{
  "availableSlots": ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM", "8:00 PM"],
  "bookedSlots": []
}
```

### Bookings

#### Create Booking
```
POST /api/bookings
Content-Type: application/json

{
  "branch": "branch-1",
  "service": "party-hall",
  "date": "2026-03-28",
  "duration": 2,
  "timeSlot": "4:00 PM",
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "decorationRequired": true,
  "occasion": "Birthday",
  "cakeRequired": true,
  "selectedCake": {
    "id": "cake-1",
    "name": "Classic Chocolate Truffle",
    "price": 799
  },
  "extraDecorations": [
    {
      "id": "extra-1",
      "name": "Balloon Bouquet Setup",
      "price": 1500
    }
  ],
  "totalPrice": 9298
}

Response:
{
  "id": "B12345ABC",
  "branch": "branch-1",
  "service": "party-hall",
  "date": "2026-03-28",
  "duration": 2,
  "timeSlot": "4:00 PM",
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "email": "john@example.com",
  "decorationRequired": true,
  "occasion": "Birthday",
  "cakeRequired": true,
  "selectedCake": {...},
  "extraDecorations": [...],
  "totalPrice": 9298,
  "paymentStatus": "pending",
  "createdAt": "2026-03-25T...",
  "updatedAt": "2026-03-25T..."
}
```

#### Get Booking Details
```
GET /api/bookings/:id

Example: GET /api/bookings/B12345ABC

Response: (same as create booking response)
```

#### Get All Bookings (Admin)
```
GET /api/bookings?status=pending&branch=branch-1&startDate=2026-03-01&endDate=2026-03-31

Headers:
Authorization: Bearer <token>

Response: Array of bookings
```

#### Update Booking (Admin)
```
PUT /api/bookings/:id
Headers:
Authorization: Bearer <token>

{
  "paymentStatus": "paid"
}

Response: Updated booking
```

#### Cancel Booking (Admin)
```
DELETE /api/bookings/:id

Headers:
Authorization: Bearer <token>

Response:
{
  "message": "Booking cancelled"
}
```

### Payments

#### Process Payment
```
POST /api/payments/process
Content-Type: application/json

{
  "bookingId": "B12345ABC",
  "amount": 9298
}

Response:
{
  "success": true,
  "message": "Payment processed",
  "booking": {...}
}
```

#### Get Payment Status
```
GET /api/payments/:bookingId

Example: GET /api/payments/B12345ABC

Response:
{
  "bookingId": "B12345ABC",
  "paymentStatus": "paid"
}
```

### Admin Dashboard

#### Get Dashboard Statistics (Admin)
```
GET /api/admin/dashboard/stats

Headers:
Authorization: Bearer <token>

Response:
{
  "totalBookings": 10,
  "paidBookings": 7,
  "pendingBookings": 3,
  "totalRevenue": 75000
}
```

### Health Check

#### Server Health
```
GET /api/health

Response:
{
  "status": "OK",
  "timestamp": "2026-03-25T..."
}
```
