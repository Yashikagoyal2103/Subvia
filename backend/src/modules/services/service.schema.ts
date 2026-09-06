import { z } from "zod";

export const serviceParamsSchema = z.object({
  businessId: z.uuid(),
  serviceId: z.uuid().optional(),
});

export const createServiceSchema = z.object({
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export type ServiceParams = z.infer<typeof serviceParamsSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
