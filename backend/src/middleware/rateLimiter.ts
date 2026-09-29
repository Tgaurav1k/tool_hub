import rateLimit from 'express-rate-limit'

export const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_ATTEMPTS || '10'),
  message: { error: 'Too many attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  // Only failed logins count toward the limit; a correct password never locks you out.
  skipSuccessfulRequests: true,
  // Bucket per account (the email being logged into), not per IP — otherwise one
  // person's failed attempts lock out everyone else sharing the same network/IP.
  // Falls back to IP for requests with no email (shouldn't happen on /login).
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return email || req.ip || 'unknown'
  },
})
