import Cookies from "js-cookie";
import { evaluateFormula } from "@/lib/formula-evaluator";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const getAuthToken = () => Cookies.get("auth-token");

export const getProposals = async () => {
  const token = getAuthToken();

  const res = await fetch(`${API_URL}/api/projects/project`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return res.json();
};

export const getProposalById = async (id: number) => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/projects/project/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  const data = await res.json();
  
  // Process the returned data to evaluate formulas if needed
  if (data && data.project_elements && data.project_elements.length > 0) {
    // Get parameters for formula evaluation
    const parameters = data.project_parameters || [];
    const paramMap = parameters.reduce((acc: any, param: any) => {
      acc[param.parameter.name] = param.value;
      return acc;
    }, {});
    
    // Process each element to evaluate formulas
    data.project_elements = data.project_elements.map((element: any) => {
      // If material_cost or labor_cost is a string that looks like a formula, evaluate it
      const isFormula = (value: any) => 
        typeof value === 'string' && 
        (value.includes('+') || value.includes('-') || 
         value.includes('*') || value.includes('/') ||
         value.includes('(') || value.includes(')'));
      
      if (isFormula(element.material_cost)) {
        try {
          element.material_cost = evaluateFormula(element.material_cost, parameters);
        } catch (error) {
          console.error(`Failed to evaluate material cost formula: ${element.material_cost}`, error);
        }
      }
      
      if (isFormula(element.labor_cost)) {
        try {
          element.labor_cost = evaluateFormula(element.labor_cost, parameters);
        } catch (error) {
          console.error(`Failed to evaluate labor cost formula: ${element.labor_cost}`, error);
        }
      }
      
      // Make sure markup is a number
      if (typeof element.markup === 'string') {
        element.markup = parseFloat(element.markup) || 0;
      }
      
      return element;
    });
  }
  
  return data;
};
