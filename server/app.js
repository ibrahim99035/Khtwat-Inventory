import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import connectDB from './config/db.js'
import authRoutes from './routes/authRoutes.js'
import salesRoutes from './routes/salesRoutes.js'
import publicRoutes from './routes/publicRoutes.js'
import modelRoutes from './routes/modelRoutes.js'
import inventoryRoutes from './routes/inventoryRoutes.js'

const app = express()

connectDB().catch(err => {
  console.error('MongoDB connection error:', err.message)
})

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/sales', salesRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/models', modelRoutes)
app.use('/api/inventory', inventoryRoutes)

app.get('/api/health', (_, res) => res.json({ status: 'ok' }))

app.use((err, _, res, __) => {
  console.error(err.stack)
  res.status(500).json({ message: err.message || 'Internal server error' })
})

export default app
