import { z } from "zod";

export const templateDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z
    .any()
    .refine(
      (file) => file instanceof File || file === undefined || file === null,
      {
        message: "Image is required",
      }
    ),
});

export type TemplateDetailsForm = z.infer<typeof templateDetailsSchema>;

export const parametersSchema = z
  .array(
    z.object({
      id: z.number(),
      name: z.string().min(1, "Name is required"),
      value: z.number(),
      type: z.string()
        .min(1, "Type is required")
        .refine((type) => type !== "", {
          message: "Please select a valid type",
        }),
    })
  )
  .min(1, { message: "At least one parameter is required" });

export type ParameterForm = z.infer<typeof parametersSchema>;

export const modulesSchema = z
  .array(
    z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string().min(1),
      created_at: z.string(),
      updated_at: z.string(),
      elements: z.array(
        z.object({
          id: z.number(),
          name: z.string().min(1),
          description: z.string().min(1),
          formula: z.string().min(1),
          labor_formula: z.string().min(1),
          markup: z.string().min(1),
        })
      ),
    })
  )
  .min(1, { message: "At least one module is required" });

export type ModuleForm = z.infer<typeof modulesSchema>;

export const previewSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  image: z.any().optional(),
  parameters: z.array(z.any()).min(1, "At least one parameter is required"),
  modules: z.array(z.any()).min(1, "At least one module is required"),
});

export type PreviewForm = z.infer<typeof previewSchema>;
