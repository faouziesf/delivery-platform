import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Veuillez définir MONGODB_URI dans .env.local');
}

interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts);
  }

  try {
    cached!.conn = await cached!.promise;
    console.log('✅ MongoDB connecté avec succès');
  } catch (e) {
    cached!.promise = null;
    console.error('❌ Erreur connexion MongoDB:', e);
    throw e;
  }

  return cached!.conn;
}

export default dbConnect;