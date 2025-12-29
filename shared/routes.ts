import { z } from 'zod';
import { insertReelSchema, insertTransactionSchema, reels, transactions, users } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.object({ message: z.string() }),
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: z.void(),
      },
    },
  },
  reels: {
    list: {
      method: 'GET' as const,
      path: '/api/reels',
      responses: {
        200: z.array(z.custom<typeof reels.$inferSelect & { currentStock: number }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/reels/:id',
      responses: {
        200: z.custom<typeof reels.$inferSelect & { 
          currentStock: number, 
          transactions: typeof transactions.$inferSelect[] 
        }>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/reels',
      input: insertReelSchema,
      responses: {
        201: z.custom<typeof reels.$inferSelect>(),
        409: errorSchemas.conflict,
        400: errorSchemas.validation,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/reels/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
        400: z.object({ message: z.string() }),
      },
    },
  },
  transactions: {
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: insertTransactionSchema,
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/transactions/:id',
      input: z.object({
        quantity: z.number().min(0.01),
        bitReelKg: z.number().min(0).default(0),
        notes: z.string().optional(),
      }),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        400: z.object({ message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: {
        200: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// Type exports for use in hooks and components
export type User = typeof users.$inferSelect;
