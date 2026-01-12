import { z } from 'zod';

/**
 * Shared ID validators
 */
const id = z.coerce.number().int().positive();

/**
 * Add to cart
 */
export const addToCartSchema = z.object({
  body: z.object({
    productId: id,
    variantId: id.optional().nullable(),
    quantity: z.coerce.number().int().min(1).default(1),
  }),
});

/**
 * Update cart quantity
 */
export const updateCartQuantitySchema = z.object({
  params: z.object({
    id,
  }),
  body: z.object({
    quantity: z.coerce.number().int().min(0),
  }),
});

/**
 * Remove cart item
 */
export const removeCartItemSchema = z.object({
  params: z.object({
    id,
  }),
});

/**
 * Apply coupon
 */
export const applyCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(3).max(20),
  }),
});
