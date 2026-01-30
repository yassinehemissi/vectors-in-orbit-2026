import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set in the environment.");
}

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = global as unknown as { mongoose: MongooseCache };

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (globalForMongoose.mongoose.conn) {
    return globalForMongoose.mongoose.conn;
  }

  if (!globalForMongoose.mongoose.promise) {
    globalForMongoose.mongoose.promise = mongoose.connect(process.env.MONGODB_URI as string, {
      bufferCommands: false,
    });
  }

  globalForMongoose.mongoose.conn = await globalForMongoose.mongoose.promise;
  return globalForMongoose.mongoose.conn;
}
