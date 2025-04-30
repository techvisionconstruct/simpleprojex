export interface Template {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
    image: string;
    modules: Module[];
    // template_elements: TemplateElement[];
    parameters: Parameter[];
  }
  
  export interface Module {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface TemplateElement {
    id: number;
    element: Element;
    material_cost: string;
    labor_cost: string;
    image: string;
    module: Module2;
    markup: number;
  }
  
  export interface Element {
    id: number;
    name: string;
    description: string;
    created_at: string;
    formula: string;
    labor_formula: string;
    updated_at: string;
    image: string;
  }
  
  export interface Module2 {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Parameter {
    id: number;
    name: string;
    value: number;
    type: string;
  }
  
  export interface FormulaToken {
    id: number;
    text: string;
    type: 'variable' | 'operator' | 'number' | 'function';
  }
