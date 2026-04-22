import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('.env') });

const uri = process.env.MONGODB_URI_REVIEWS;
console.log('Testing connection to:', uri);

if (!uri) {
  console.error('No URI found in .env');
  process.exit(1);
}

try {
  const conn = await mongoose.createConnection(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }).asPromise();
  console.log('✓ Connected successfully');
  await conn.close();
  process.exit(0);
} catch (err) {
  console.error('✗ Connection failed:', err.message);
  process.exit(1);
}
