import path from 'path'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import dotenv from 'dotenv'
import routes from './routes'
import { errorHandler } from './middleware/errorHandler'
import { purgeExpiredNotifications } from './services/notificationPersistence.service'

dotenv.config()

const app = express()
const PORT = parseInt(process.env.PORT || '4000')
const IS_PROD = process.env.NODE_ENV === 'production'

// Behind nginx (one proxy hop) — trust it so rate limiting keys on the real
// client IP via X-Forwarded-For instead of lumping everyone under the proxy IP.
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow same-origin requests (no Origin header) and whitelisted origins
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true)
      }
      // In production (same-origin), always allow
      if (IS_PROD) return cb(null, true)
      cb(new Error(`CORS: ${origin} not allowed`))
    },
    credentials: true,
  }),
)
// Default ~100kb is too small for profile avatars sent as data URLs from the client.
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '5mb' }))
app.use(cookieParser())

if (!IS_PROD) {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

app.use('/api', routes)

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

if (IS_PROD) {
  const publicDir = path.join(__dirname, '..', '..', 'public')
  app.use(express.static(publicDir))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'))
  })
}

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Auto-purge expired notifications on boot, then every 24h. Single-instance safe.
const PURGE_INTERVAL_MS = 24 * 60 * 60 * 1000
function runPurge() {
  purgeExpiredNotifications()
    .then((count) => {
      if (count > 0) console.log(`[notifications] purged ${count} expired rows`)
    })
    .catch((err) => {
      console.error('[notifications] purge failed:', err)
    })
}
runPurge()
setInterval(runPurge, PURGE_INTERVAL_MS).unref()

export default app
