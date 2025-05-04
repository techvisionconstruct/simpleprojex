import { z } from "zod";
import {
  Template,
  Module,
  Element,
  Parameter,
  ElementWithValues,
  ProposalFormData,
  template_elements,
  PModule,
  ProposalData
} from "./types";

// Define schemas for each component of the form
export const elementSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional().default(""),
  created_at: z.string().optional(),
  formula: z.string().optional(),
  labor_formula: z.string().optional(),
  updated_at: z.string().optional(),
});

export const moduleSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional().default(""),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const parameterSchema = z.object({
  id: z.number(),
  name: z.string(),
  value: z.union([z.string(), z.number()]),
  type: z.string(),
});

export const elementWithValuesSchema = z.object({
  id: z.number(),
  element: elementSchema,
  module: moduleSchema,
  formula: z.string(),
  labor_formula: z.string(),
  material_cost: z.number().default(0),
  labor_cost: z.number().default(0),
  markup: z.number().default(10),
});

// This matches the backend CreateProjectSchema
export const proposalSubmissionSchema = z.object({
  id: z.number(),
  name: z.string(),
  title: z.string(),
  description: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  clientPhone: z.string(),
  clientAddress: z.string(),
  image: z.string().optional(),
  parameters: z.array(parameterSchema),
  template_elements: z.array(
    z.object({
      id: z.number(),
      formula: z.string().optional(),
      labor_formula: z.string().optional(),
      material_cost: z.number(),
      labor_cost: z.number(),
      markup: z.number(),
      element: z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        formula: z.string().optional(),
        labor_formula: z.string().optional()
      }),
      module: z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional()
      })
    })
  )
});

// This is used for client-side form validation
export const proposalFormSchema = z.object({
  name: z.string().min(3, "Name is required and must be at least 3 characters"),
  description: z.string().min(10, "Description is required and must be at least 10 characters"),
  client_name: z.string().min(3, "Client name is required"),
  client_email: z.string().email("Must be a valid email address"),
  phone_number: z.string().min(7, "Phone number is required"),
  address: z.string().min(5, "Address is required"),
  image: z.string().optional(),
  selectedTemplate: z.object({
    id: z.number(),
    name: z.string(),
    description: z.string().nullable().optional(),
    image: z.string().optional(),
  }).nullable().refine(val => val !== null, {
    message: "Please select a template"
  }),
  selectedModules: z.array(moduleSchema).min(1, "Please select at least one module"),
  selectedParameters: z.array(parameterSchema).min(1, "Please select at least one parameter"),
  selectedElements: z.array(elementWithValuesSchema).min(1, "Please select at least one element"),
});

// Re-export types from types.ts for convenience
export type {
  Template,
  Module,
  Element,
  Parameter,
  ElementWithValues,
  ProposalFormData,
  template_elements,
  PModule,
  ProposalData
};

export const validateProposalForm = (data: ProposalFormData) => {
  return proposalFormSchema.safeParse(data);
};

export { z };
