import mongoose from 'mongoose'

const cache = global.mongoose || { conn: null, promise: null }
global.mongoose = cache

const connectDB = async () => {
  if (cache.conn) return cache.conn
  if (!cache.promise) {
    cache.promise = mongoose.connect(process.env.MONGO_URI).then(m => m)
  }
  cache.conn = await cache.promise
  console.log(`MongoDB connected: ${cache.conn.connection.host}`)
  return cache.conn
}

export default connectDB
