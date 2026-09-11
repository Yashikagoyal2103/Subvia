import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export function getPagination(input: PaginationInput) {
  return {
    skip: (input.page - 1) * input.limit,
    take: input.limit,
  };
}