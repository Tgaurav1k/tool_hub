import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

export function validateRequest(schema: ZodSchema, source: 'body' | 'params' | 'query' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source])
      req[source] = data
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        })
      }
      next(err)
    }
  }
}
