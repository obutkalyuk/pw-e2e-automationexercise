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
  responseCode: z.number(),
  products: z.array(apiProductSchema),
});

export const searchProductResponseSchema = productsListResponseSchema;

export const brandSchema = z.object({
  id: z.number(),
  brand: z.string(),
});

export const brandsListResponseSchema = z.object({
  responseCode: z.number(),
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
  last_name: z.string().optional(),
  company: z.string().optional(),
  address1: z.string().optional(),
  address2: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  zipcode: z.string().optional(),
  mobile_number: z.string().optional(),
});

export const userDetailResponseSchema = z.object({
  responseCode: z.number(),
  message: z.string().optional(),
  user: userDetailSchema,
});

export type ApiProduct = z.infer<typeof apiProductSchema>;
export type Brand = z.infer<typeof brandSchema>;
export type UserDetail = z.infer<typeof userDetailSchema>;
