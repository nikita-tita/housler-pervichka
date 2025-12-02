import { z } from 'zod';

// ============ Common schemas ============

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID должен быть числом').transform(Number)
});

export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20')
}).transform(val => ({
  page: Number(val.page) || 1,
  limit: Math.min(Number(val.limit) || 20, 100) // max 100
}));

// ============ Auth schemas ============

export const requestCodeSchema = z.object({
  email: z.string().email('Некорректный email').max(255)
});

export const verifyCodeSchema = z.object({
  email: z.string().email('Некорректный email').max(255),
  code: z.string().length(6, 'Код должен содержать 6 цифр').regex(/^\d+$/, 'Код должен содержать только цифры')
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  phone: z.string().regex(/^\+?[\d\s()-]{10,20}$/, 'Некорректный телефон').optional()
});

// ============ Selections schemas ============

export const createSelectionSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(255, 'Название слишком длинное'),
  clientEmail: z.string().email('Некорректный email').max(255).optional().nullable(),
  clientName: z.string().max(255).optional().nullable(),
  isPublic: z.boolean().optional().default(false)
});

export const updateSelectionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  clientEmail: z.string().email().max(255).optional().nullable(),
  clientName: z.string().max(255).optional().nullable(),
  isPublic: z.boolean().optional()
});

export const addSelectionItemSchema = z.object({
  offerId: z.number().int().positive('ID объекта должен быть положительным числом'),
  comment: z.string().max(1000, 'Комментарий слишком длинный').optional()
});

// ============ Clients schemas ============

export const createClientSchema = z.object({
  name: z.string().min(1, 'Имя обязательно').max(255),
  phone: z.string().regex(/^\+?[\d\s()-]{10,20}$/, 'Некорректный телефон').optional().nullable(),
  email: z.string().email('Некорректный email').max(255).optional().nullable(),
  telegram: z.string().max(100).optional().nullable(),
  whatsapp: z.string().max(20).optional().nullable(),
  comment: z.string().max(2000).optional().nullable(),
  source: z.enum(['manual', 'selection', 'booking', 'import', 'website']).optional().default('manual'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().default('medium'),
  budget_min: z.number().positive().optional().nullable(),
  budget_max: z.number().positive().optional().nullable(),
  desired_rooms: z.array(z.number().int().positive()).optional().nullable(),
  next_contact_date: z.string().datetime().optional().nullable()
});

export const updateClientSchema = createClientSchema.partial();

export const updateClientStageSchema = z.object({
  stage: z.enum(['new', 'in_progress', 'fixation', 'booking', 'deal', 'completed', 'failed'])
});

// ============ Bookings schemas ============

export const createBookingSchema = z.object({
  offerId: z.number().int().positive('ID объекта обязателен'),
  clientName: z.string().min(1, 'Имя клиента обязательно').max(255),
  clientPhone: z.string().regex(/^\+?[\d\s()-]{10,20}$/, 'Некорректный телефон'),
  clientEmail: z.string().email().max(255).optional(),
  comment: z.string().max(2000).optional()
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'completed']),
  comment: z.string().max(2000).optional()
});

// ============ Fixations schemas ============

export const createFixationSchema = z.object({
  offerId: z.number().int().positive('ID объекта обязателен'),
  clientId: z.number().int().positive().optional(),
  clientName: z.string().min(1).max(255),
  clientPhone: z.string().regex(/^\+?[\d\s()-]{10,20}$/),
  lockedPrice: z.number().positive('Цена должна быть положительной'),
  requestedDays: z.number().int().min(1).max(30, 'Максимум 30 дней'),
  agentComment: z.string().max(2000).optional()
});

export const updateFixationStatusSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'expired', 'converted'])
});

// ============ Deals schemas ============

export const createDealSchema = z.object({
  bookingId: z.number().int().positive().optional(),
  clientId: z.number().int().positive(),
  offerId: z.number().int().positive(),
  finalPrice: z.number().positive('Цена должна быть положительной'),
  discountAmount: z.number().min(0).optional().default(0),
  commissionPercent: z.number().min(0).max(100).optional(),
  commissionAmount: z.number().min(0).optional(),
  notes: z.string().max(2000).optional()
});

export const updateDealStatusSchema = z.object({
  status: z.enum(['pending', 'signed', 'registered', 'completed', 'cancelled'])
});

// ============ Failures schemas ============

export const createFailureSchema = z.object({
  clientId: z.number().int().positive().optional(),
  offerId: z.number().int().positive().optional(),
  priceLockId: z.number().int().positive().optional(),
  bookingId: z.number().int().positive().optional(),
  dealId: z.number().int().positive().optional(),
  stage: z.enum(['at_fixation', 'at_booking', 'at_deal']),
  reason: z.string().min(1, 'Причина обязательна').max(100),
  reasonDetails: z.string().max(2000).optional(),
  initiatedBy: z.enum(['client', 'developer', 'agent', 'bank']),
  penaltyAmount: z.number().min(0).optional().default(0)
});

// ============ Offers filters schema ============

export const offersFilterSchema = z.object({
  page: z.string().transform(Number).optional(),
  limit: z.string().transform(Number).optional(),
  complexId: z.string().transform(Number).optional(),
  districtId: z.string().transform(Number).optional(),
  rooms: z.string().optional(), // "1,2,3"
  priceMin: z.string().transform(Number).optional(),
  priceMax: z.string().transform(Number).optional(),
  areaMin: z.string().transform(Number).optional(),
  areaMax: z.string().transform(Number).optional(),
  floorMin: z.string().transform(Number).optional(),
  floorMax: z.string().transform(Number).optional(),
  sort: z.enum(['price_asc', 'price_desc', 'area_asc', 'area_desc', 'created_at_desc']).optional()
});

// Type exports
export type CreateSelectionInput = z.infer<typeof createSelectionSchema>;
export type UpdateSelectionInput = z.infer<typeof updateSelectionSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateFixationInput = z.infer<typeof createFixationSchema>;
export type CreateDealInput = z.infer<typeof createDealSchema>;
export type CreateFailureInput = z.infer<typeof createFailureSchema>;
