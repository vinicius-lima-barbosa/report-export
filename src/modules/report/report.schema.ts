import z from "zod";

export const createReportSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format. Expected a valid date string.",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format. Expected a valid date string.",
  }),
  category: z.string().optional(),
});

export type CreateReportDto = z.infer<typeof createReportSchema>;
