import { z } from 'zod';

export const apiProductSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.string(),
  brand: z.string(),
  category: z.object({
    usertype: z.object({
      usertype: z.string(),
    }),
    category: z.string(),
  }),
});

export const productsListResponseSchema = z.object({
  responseCode: z.literal(200),
  products: z.array(apiProductSchema),
});

export const searchProductResponseSchema = productsListResponseSchema;

export const brandSchema = z.object({
  id: z.number(),
  brand: z.string(),
});

export const brandsListResponseSchema = z.object({
  responseCode: z.literal(200),
  brands: z.array(brandSchema),
});

export const userDetailSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  email: z.string().email(),
  title: z.string().optional(),
  birth_day: z.string().optional(),
  birth_month: z.string().optional(),
  birth_year: z.string().optional(),
  first_name: z.string(),
  last_name: z.string(),
  company: z.string().optional(),
  address1: z.string(),
  address2: z.string().optional(),
  country: z.string(),
  state: z.string(),
  city: z.string(),
  zipcode: z.string(),
  mobile_number: z.string().optional(),
});

export const userDetailResponseSchema = z.object({
  responseCode: z.literal(200),
  message: z.string().optional(),
  user: userDetailSchema,
});

export type ApiProduct = z.infer<typeof apiProductSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
