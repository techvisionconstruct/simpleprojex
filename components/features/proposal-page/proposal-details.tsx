import React, { useEffect } from "react";
import { ProjectModule, ProjectParameter, ProjectElement } from "@/types/proposals";
import { Button } from "@/components/shared";
import { evaluateFormula } from "@/lib/formula-evaluator";

interface ProposalDetailsProps {
  proposal: any;
}

export function ProposalDetails({ proposal }: ProposalDetailsProps) {
  // Debug: Log the full proposal data structure when it first loads
  useEffect(() => {
    console.log("Proposal data received:", proposal);
    if (proposal?.project_elements?.length > 0) {
      console.log("First project element:", proposal.project_elements[0]);
    }
  }, [proposal]);

  // Convert parameters to format needed by evaluateFormula
  const getParametersForFormula = () => {
    if (!proposal?.project_parameters || proposal.project_parameters.length === 0) {
      return [];
    }
    
    return proposal.project_parameters.map((param: ProjectParameter) => ({
      name: param.parameter.name,
      value: param.value || 0
    }));
  };

  // Function to evaluate a formula using parameters from the project
  const evaluateElementFormula = (formula: string | null | undefined): number => {
    if (!formula) return 0;
    
    // Check if formula is already a number
    const numValue = parseFloat(formula);
    if (!isNaN(numValue)) return numValue;
    
    // Get parameters and evaluate formula
    const parameters = getParametersForFormula();
    return evaluateFormula(formula, parameters);
  };

  // Format currency values
  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined) return "$0.00";
    
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numValue);
  };

  // Calculate module total by evaluating all formulas
  const calculateModuleSubtotal = (moduleId: number): number => {
    if (!proposal.project_elements || !proposal.project_elements.length) {
      return 0;
    }

    const moduleElements = proposal.project_elements.filter(
      (el: ProjectElement) => el.project_module?.id === moduleId
    );

    return moduleElements.reduce((total: number, el: ProjectElement) => {
      // Evaluate formulas or use direct values
      const materialCost = evaluateElementFormula(el.material_cost);
      const laborCost = evaluateElementFormula(el.labor_cost);
      const markup = parseFloat(el.markup?.toString() || "0");
      
      const elementTotal = (materialCost + laborCost) * (1 + markup/100);
      return total + elementTotal;
    }, 0);
  };

  // Calculate total cost for the entire proposal
  const calculateTotalCost = (): number => {
    if (!proposal.project_elements || proposal.project_elements.length === 0) {
      return 0;
    }

    return proposal.project_elements.reduce((total: number, element: ProjectElement) => {
      // Evaluate formulas or use direct values
      const materialCost = evaluateElementFormula(element.material_cost);
      const laborCost = evaluateElementFormula(element.labor_cost);
      const markup = parseFloat(element.markup?.toString() || "0");
      
      const elementTotal = (materialCost + laborCost) * (1 + markup/100);
      return total + elementTotal;
    }, 0);
  };

  const totalCost = calculateTotalCost();

  return (
    <>
      <div className="w-full max-w-8xl relative left-1/2 right-1/2 -translate-x-1/2 h-48 md:h-64 mb-4">
        <img
          src={
            proposal?.image ||
            "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"
          }
          alt={proposal?.name || "Proposal Image"}
          className="w-full h-full object-cover object-center rounded-2xl shadow"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-start gap-8">
        <div className="flex-1 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-4xl font-bold mb-2 tracking-tight leading-tight">
                {proposal?.name}
              </h2>
              <p className="text-lg text-muted-foreground mb-2">
                {proposal?.description}
              </p>
              {proposal?.project_parameters?.length > 0 && (
                <div className="mt-4 w-full">
                  <h3 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                    Parameters
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {proposal.project_parameters.map((param: ProjectParameter) => (
                      <span
                        key={param.id}
                        className="inline-block rounded bg-muted px-3 py-1 text-xs font-medium text-muted-foreground border"
                      >
                        {param.parameter.name}: {param.value}{" "}
                        <span className="text-[10px] text-gray-400">
                          ({param.parameter.type})
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="w-full lg:w-[380px] flex-shrink-0">
              {/* Action Buttons above Client Details */}
              <div className="flex gap-2 mb-4 justify-end">
                <Button variant="outline" onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="default" onClick={() => {/* TODO: Implement email to client */}}>
                  Email to Client
                </Button>
                <Button variant="secondary" onClick={() => {/* TODO: Implement make contract */}}>
                  Make a Contract
                </Button>
              </div>
              <div className="my-0 p-4 rounded-lg border bg-muted/30">
                <h3 className="text-lg font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                  Client Details
                </h3>
                <div className="grid grid-cols-1 gap-y-2 text-sm">
                  <div>
                    <span className="font-medium">Client Name:</span>{" "}
                    {proposal?.client_name}
                  </div>
                  <div>
                    <span className="font-medium">Client Email:</span>{" "}
                    {proposal?.client_email}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span>{" "}
                    {proposal?.phone_number}
                  </div>
                  <div>
                    <span className="font-medium">Address:</span>{" "}
                    {proposal?.address}
                  </div>
                </div>
              </div>
              
              {/* Total Cost Summary Card */}
              <div className="mt-4 p-4 rounded-lg border bg-primary/10">
                <h3 className="text-lg font-semibold mb-2 text-primary uppercase tracking-wider">
                  Total Estimate
                </h3>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(totalCost)}
                </div>
              </div>
            </div>
          </div>
          {proposal?.project_modules?.length > 0 && (
            <div className="mt-8 w-full">
              <h3 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                Modules
              </h3>
              <div className="flex flex-col gap-4 w-full">
                {proposal.project_modules.map((pm: ProjectModule) => {
                  // Calculate module subtotal
                  const moduleSubtotal = calculateModuleSubtotal(pm.id);
                  
                  // Get elements for this module
                  const moduleElements = proposal.project_elements?.filter(
                    (el: ProjectElement) => el.project_module?.id === pm.id
                  ) || [];
                  
                  return (
                    <div
                      key={pm.id}
                      className="rounded-lg border border-border bg-muted/40 px-4 py-3 hover:bg-accent/40 transition-colors w-full"
                    >
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-base mb-1">
                          {pm.module.name}
                        </h4>
                        <div className="text-sm font-medium">
                          Subtotal: {formatCurrency(moduleSubtotal)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {pm.module.description}
                      </p>
                      {moduleElements.length > 0 && (
                        <div className="ml-2 mt-2 w-full">
                          <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                            Elements
                          </div>
                          <div className="flex flex-col gap-2 w-full">
                            {moduleElements.map((el: ProjectElement) => {
                              // Evaluate formulas for each element
                              const materialCost = evaluateElementFormula(el.material_cost);
                              const laborCost = evaluateElementFormula(el.labor_cost);
                              const markup = parseFloat(el.markup?.toString() || "0");
                              const total = (materialCost + laborCost) * (1 + markup/100);
                              
                              return (
                                <div
                                  key={el.id}
                                  className="flex items-center gap-3 p-4 rounded border bg-background w-full"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm">
                                      {el.element.name}
                                    </div>
                                    <div className="text-xs text-muted-foreground line-clamp-1">
                                      {el.element.description}
                                    </div>
                                  </div>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                                      Material: {formatCurrency(materialCost)}
                                    </span>
                                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                                      Labor: {formatCurrency(laborCost)}
                                    </span>
                                    <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                                      Markup: {markup}%
                                    </span>
                                    <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium border border-primary/20">
                                      Total: {formatCurrency(total)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
