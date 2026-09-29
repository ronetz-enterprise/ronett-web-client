import { z } from "zod";
export const organizationSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(150),
  currency: z.string().regex(/^[A-Z]{3}$/),
  status: z.enum(["ACTIVE", "SUSPENDED", "CLOSED"]),
  suspensionReason: z.string().nullable(),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  closedAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type Organization = z.infer<typeof organizationSchema>;
