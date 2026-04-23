export const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:5173',
      'http://localhost:8080',
      'https://friendsandmemories.vercel.app',
      'https://friendsandmemories.in',
      'https://www.friendsandmemories.in',
      'https://f-m-8146.onrender.com'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Still allow for now, but log it
      console.warn(`CORS request from origin: ${origin}`);
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
  optionsSuccessStatus: 200,
  maxAge: 86400
};
