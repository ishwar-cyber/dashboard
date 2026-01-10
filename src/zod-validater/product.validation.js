import { z } from 'zod';

const number = z.coerce.number().refine(Number.isFinite);
const boolean = z.coerce.boolean();

const imageSchema = z.object({
  url: z.string().min(1),
  publicId: z.string().optional()
});

const variantSchema = z.object({
  name: z.string(),
  sku: z.string(),
  price: number,
  stock: number,
  images: z.array(imageSchema).optional()
});

export const updateProductSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),

  price: number.optional(),
  stock: number.optional(),
  status: boolean.optional(),

  weight: number.optional(),
  width: number.optional(),
  height: number.optional(),
  length: number.optional(),

  serviceCharge: number.optional(),

  brand: number.optional(),
  category: number.optional(),
  subCategory: number.optional(),

  description: z.string().optional(),

  productImages: z.array(imageSchema).optional(),
  variants: z.array(variantSchema).optional(),

  warranty: z.object({
    period: number.optional(),
    type: z.string()
  }).optional(),

  specifications: z.array(
    z.object({
      name: z.string(),
      value: z.string()
    })
  ).optional(),

  offerPrice: z.array(
    z.object({
      quantity: number,
      price: number
    })
  ).optional()
});
