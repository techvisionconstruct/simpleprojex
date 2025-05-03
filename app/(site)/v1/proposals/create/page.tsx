"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getTemplates } from "@/api/client/templates";
import { getModules } from "@/api/client/modules";
import { getParameters } from "@/api/client/parameters";
import { getElements } from "@/api/client/elements";
import { postProposal } from "@/api/server/proposals";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Button,
  Card,
  CardContent,
} from "@/components/shared";
import { Check, CircleDot, HelpCircle } from "lucide-react";
import { evaluateFormula } from "@/lib/formula-evaluator";
import { toast } from "sonner";
import { CreateProposalTour } from "@/components/features/tour-guide/create-proposal-tour";

import { TemplateSelectionTab } from "@/components/features/create-proposal-page/template-selection-tab";
import { ProposalDetailsTab } from "@/components/features/create-proposal-page/proposal-details-tab";
import { TradesTab } from "@/components/features/create-proposal-page/trades-tab";
import {
  ProposalFormData,
  Template,
  Module,
  Element,
  Parameter,
  ElementWithValues,
  validateProposalForm,
} from "@/components/features/create-proposal-page/zod-schema";
import { TemplateElementWithValues } from "@/components/features/create-proposal-page/types";

export default function CreateProposal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("template");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isTourRunning, setIsTourRunning] = useState(false);

  const [proposalDetails, setProposalDetails] = useState({
    name: "",
    description: "",
    client_name: "",
    client_email: "",
    phone_number: "",
    address: "",
    image: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [selectedModules, setSelectedModules] = useState<Module[]>([]);
  const [customModules, setCustomModules] = useState<Module[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<Parameter[]>([]);
  const [selectedElements, setSelectedElements] = useState<ElementWithValues[]>(
    []
  );
  const [useGlobalMarkup, setUseGlobalMarkup] = useState(false);
  const [globalMarkupPercentage, setGlobalMarkupPercentage] = useState(10);

  const tabSteps = ["template", "details", "trades"];
  const currentStepIndex = tabSteps.indexOf(activeTab);

  // Check if the user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenCreateProposalTour") === "true";
    if (!hasSeenTour) {
      setIsTourRunning(true);
    }
  }, []);

  const startTour = () => {
    setIsTourRunning(true);
  };

  const templates = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const modules = useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
  });

  const parameters = useQuery({
    queryKey: ["parameters"],
    queryFn: getParameters,
  });

  const elements = useQuery({
    queryKey: ["elements"],
    queryFn: () => getElements(""),
  });

  const { mutate: submitProposal, isPending } = useMutation({
    mutationFn: postProposal,
    onSuccess: (data) => {
      toast.success("Proposal created successfully", {
        position: "top-center",
        duration: 3000,
      });
      router.push(`/proposals/${data.id}`);
    },
    onError: (error) => {
      console.error("Error creating proposal:", error);
      toast.error(`Failed to create proposal: ${error.message}`, {
        position: "top-center",
        duration: 5000,
      });
    },
  });

  const handleTemplateSelect = (template: Template) => {
    const templateElements = template.template_elements || [];
    const parametersList = template.parameters || [];

    const sanitizedTemplate = {
      ...template,
      image: template.image || "", // Ensure image is never null
      template_elements: templateElements.map((element) => ({
        ...element,
        material_cost:
          typeof element.material_cost === "string"
            ? parseFloat(element.material_cost) || 0
            : element.material_cost || 0,
        labor_cost:
          typeof element.labor_cost === "string"
            ? parseFloat(element.labor_cost) || 0
            : element.labor_cost || 0,
        markup: element.markup || 10,
      })),
    };

    // Map template elements to the format required for selectedElements
    let elementsFromTemplate = templateElements.map((templateElement: TemplateElementWithValues) => {
      return {
        id: templateElement.element.id,
        element: templateElement.element,
        module: templateElement.module,
        formula: templateElement.element.formula || "",
        labor_formula: templateElement.element.labor_formula || "",
        material_cost: 0,
        labor_cost: 0,
        markup: templateElement.markup || 10,
      };
    });

    // Calculate initial costs based on template parameters
    elementsFromTemplate = calculateElementCosts(
      elementsFromTemplate,
      parametersList
    );

    // Update all the related state variables
    setSelectedTemplate(sanitizedTemplate);
    setSelectedModules(template.modules || []);
    setSelectedParameters(parametersList);
    setSelectedElements(elementsFromTemplate);
  };

  const handleModuleToggle = (module: Module) => {
    setSelectedModules((prev) => {
      const exists = prev.find((m) => m.id === module.id);

      if (exists) {
        // When removing a module, also remove its elements
        setSelectedElements(prev => 
          prev.filter(element => element.module.id !== module.id)
        );
        return prev.filter((m) => m.id !== module.id);
      } else {
        return [...prev, module];
      }
    });
  };

  const handleAddCustomModule = (newModule: Module) => {
    // Check if the module already exists in custom modules
    const exists = customModules.some((m) => m.id === newModule.id);
    if (!exists) {
      setCustomModules((prev) => [...prev, newModule]);
    }
    // Automatically select the newly created module
    handleModuleToggle(newModule);
  };

  const calculateElementCosts = (
    elements: ElementWithValues[],
    parameters: Parameter[]
  ) => {
    return elements.map((el: ElementWithValues) => {
      const materialFormula = el.formula || el.element.formula || "";
      const materialCost = evaluateFormula(materialFormula, parameters);

      const laborFormula = el.labor_formula || el.element.labor_formula || "";
      const laborCost = evaluateFormula(laborFormula, parameters);

      return {
        ...el,
        name: el.element.name || "",
        material_cost: materialCost,
        labor_cost: laborCost,
      };
    });
  };

  const handleParameterValueUpdate = (
    parameterId: number,
    value: string | number
  ) => {
    // Find and update the parameter
    const newParameters = selectedParameters.map((param) => {
      if (param.id === parameterId) {
        return { ...param, value };
      }
      return param;
    });

    // Recalculate element costs with updated parameter values
    const updatedElements = calculateElementCosts(
      selectedElements,
      newParameters
    );

    // Update both state variables
    setSelectedParameters(newParameters);
    setSelectedElements(updatedElements);
  };

  const handleElementToggle = (element: Element, module: Module) => {
    setSelectedElements((prev: any) => {
      const existingElement = prev.find(
        (e: any) => e.element.id === element.id && e.module.id === module.id
      );

      if (existingElement) {
        return prev.filter(
          (e: any) =>
            !(e.element.id === element.id && e.module.id === module.id)
        );
      } else {
        // Ensure the element has a valid description, even if it's an empty string
        const safeElement = {
          ...element,
          description: element.description || "",
        };

        // Create a new element and calculate its initial costs
        const newElement = {
          id: Date.now(), // temporary unique ID
          element: safeElement,
          module: module,
          formula: element.formula || "",
          labor_formula: element.labor_formula || "",
          material_cost: 0,
          labor_cost: 0,
          markup: 10,
        };

        // Calculate costs based on current parameters
        const materialCost = evaluateFormula(newElement.formula, selectedParameters);
        const laborCost = evaluateFormula(newElement.labor_formula, selectedParameters);

        return [
          ...prev,
          {
            ...newElement,
            material_cost: materialCost,
            labor_cost: laborCost,
          },
        ];
      }
    });
  };

  const handleElementValueUpdate = (
    elementId: number,
    module: Module,
    field: string,
    formula: string,
    value: number
  ) => {
    setSelectedElements((prev) => {
      const newElements = prev.map((e) => {
        if (e.element.id === elementId && e.module.id === module.id) {
          return {
            ...e,
            [field]: value,
            ...(field === "formula" ? { formula } : {}),
            ...(field === "labor_formula" ? { labor_formula: formula } : {}),
          };
        }
        return e;
      });

      if (field === "formula" || field === "labor_formula") {
        return calculateElementCosts(newElements, selectedParameters);
      }

      return newElements;
    });
  };

  const handleGlobalMarkupChange = (isUse: boolean, percentage: number) => {
    setUseGlobalMarkup(isUse);
    setGlobalMarkupPercentage(percentage);
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const formData: ProposalFormData = {
        ...proposalDetails,
        selectedTemplate,
        selectedModules,
        selectedParameters,
        selectedElements,
      };

      const validationResult = validateProposalForm(formData);

      if (!validationResult.success) {
        const newErrors: Record<string, string> = {};

        validationResult.error.errors.forEach((err) => {
          const path = err.path.join(".");
          newErrors[path] = err.message;
        });
        setErrors(newErrors);

        const firstError = validationResult.error.errors[0];
        const errorPath = firstError.path[0] as string;

        toast.error(`Please fix the following issue: ${firstError.message}`, {
          position: "top-center",
          duration: 5000,
        });

        if (
          errorPath.includes("name") ||
          errorPath.includes("client") ||
          errorPath.includes("address") ||
          errorPath.includes("description")
        ) {
          setActiveTab("details");
        } else if (errorPath.includes("selectedTemplate")) {
          setActiveTab("template");
        } else if (
          errorPath.includes("selectedModules") ||
          errorPath.includes("selectedElements") ||
          errorPath.includes("selectedParameters")
        ) {
          setActiveTab("trades");
        }

        setIsSubmitting(false);
        return;
      }

      // Apply global markup if enabled
      const elementsWithMarkup = selectedElements.map(el => ({
        ...el,
        markup: useGlobalMarkup ? globalMarkupPercentage : el.markup
      }));

      const formattedElements = elementsWithMarkup.map(el => ({
        id: el.id,
        formula: el.formula || "",
        labor_formula: el.labor_formula || "",
        markup: parseInt(el.markup.toString()) || 0,
        material_cost: parseFloat(el.material_cost.toString()) || 0, 
        labor_cost: parseFloat(el.labor_cost.toString()) || 0, 
        element: {
          id: el.element.id,
          name: el.element.name,
          description: el.element.description || "",
          formula: el.element.formula || "",
          labor_formula: el.element.labor_formula || ""
        },
        module: {
          id: el.module.id,
          name: el.module.name,
          description: el.module.description || ""
        }
      }));

      const formattedParameters = selectedParameters.map(param => {
        let paramValue = param.value;
        
        if (typeof paramValue === 'string' && !isNaN(Number(paramValue))) {
          paramValue = parseFloat(paramValue);
        }
        
        return {
          id: param.id,
          name: param.name,
          value: paramValue,
          type: param.type || "number" 
        };
      });

      const payload = {
        id: selectedTemplate?.id,
        name: proposalDetails.name,
        title: proposalDetails.name,
        description: proposalDetails.description,
        clientName: proposalDetails.client_name,
        clientEmail: proposalDetails.client_email,
        clientPhone: proposalDetails.phone_number,
        clientAddress: proposalDetails.address,
        image: proposalDetails.image,
        parameters: formattedParameters,
        template_elements: formattedElements,
      };
      
      submitProposal(payload);
    } catch (error) {
      console.error("Error creating proposal:", error);
      toast.error("Failed to create proposal. Please try again.", {
        position: "top-center",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParameterToggle = (parameter: Parameter) => {
    setSelectedParameters((prev) => {
      const exists = prev.find((p) => p.id === parameter.id);
      let newParameters;

      if (exists) {
        newParameters = prev.filter((p) => p.id !== parameter.id);
      } else {
        newParameters = [...prev, parameter];
      }

      // Also update element costs with the new parameters
      const updatedElements = calculateElementCosts(
        selectedElements,
        newParameters
      );
      setSelectedElements(updatedElements);

      return newParameters;
    });
  };

  return (
    <div className="w-full px-4 relative">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Proposal</h1>
          <p className="text-muted-foreground mt-1">
            Create a detailed proposal for your client
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center w-full mb-8 relative max-w-5xl mx-auto">
                {/* Background track for progress bar */}
                <div className="absolute top-[22px] left-[6%] right-[6%] h-1.5 bg-muted rounded-full"></div>
                
                {/* Progress bars between steps */}
                <div 
                  className={`absolute top-[22px] left-[6%] w-[44%] h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                    currentStepIndex >= 1 ? "bg-primary shadow-sm shadow-primary/20" : "bg-muted"
                  }`}
                  style={{ zIndex: 5 }}
                ></div>
                <div 
                  className={`absolute top-[22px] left-[50%] w-[44%] h-1.5 rounded-full transition-all duration-500 ease-in-out ${
                    currentStepIndex >= 2 ? "bg-primary shadow-sm shadow-primary/20" : "bg-muted"
                  }`}
                  style={{ zIndex: 5 }}
                ></div>

                {tabSteps.map((step, index) => (
                  <div
                    key={step}
                    className={`flex flex-col items-center relative tab-trigger ${index === 0 ? 'template-tab-trigger' : ''} ${index === 1 ? 'details-tab-trigger' : ''} ${index === 2 ? 'trades-tab-trigger' : ''}`}
                    data-value={step}
                    onClick={() => {
                      if (index <= currentStepIndex + 1) {
                        setActiveTab(step);
                      }
                    }}
                    style={{ zIndex: 10 }}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 cursor-pointer 
                        ${
                          index <= currentStepIndex
                            ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                            : index === currentStepIndex + 1
                            ? "border-primary text-primary hover:bg-primary/10"
                            : "border-muted-foreground text-muted-foreground"
                        }
                        transition-all duration-300 hover:scale-105 z-10
                      `}
                    >
                      {index < currentStepIndex ? (
                        <Check className="w-6 h-6" />
                      ) : index === currentStepIndex ? (
                        <CircleDot className="w-6 h-6" />
                      ) : (
                        <span className="text-lg">{index + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm mt-2 font-medium ${
                        index <= currentStepIndex
                          ? "text-primary"
                          : index === currentStepIndex + 1
                          ? "text-primary"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step === "template" ? "Template" : 
                       step === "details" ? "Details" :
                       step === "trades" ? "Trades" : step}
                    </span>
                  </div>
                ))}
              </div>

              {/* Template Selection Tab */}
              <TabsContent value="template" className="template-tab-content">
                <TemplateSelectionTab
                  templates={templates.data || []}
                  selectedTemplate={selectedTemplate}
                  handleTemplateSelect={handleTemplateSelect}
                  onBack={() => null}
                  onNext={() => setActiveTab("details")}
                />
              </TabsContent>

              {/* Proposal Details Tab */}
              <TabsContent value="details" className="details-tab-content">
                <ProposalDetailsTab
                  value={proposalDetails}
                  onChange={setProposalDetails}
                  onBack={() => setActiveTab("template")}
                  onNext={() => setActiveTab("trades")}
                  errors={errors}
                />
              </TabsContent>

              {/* Trades & Parameters Tab */}
              <TabsContent value="trades" className="trades-tab-content">
                <TradesTab
                  modules={modules}
                  elements={elements}
                  parameters={parameters}
                  selectedModules={selectedModules}
                  selectedElements={selectedElements}
                  selectedParameters={selectedParameters}
                  customModules={customModules}
                  handleModuleToggle={handleModuleToggle}
                  handleElementToggle={handleElementToggle}
                  handleElementValueUpdate={handleElementValueUpdate}
                  handleParameterToggle={handleParameterToggle}
                  handleParameterValueUpdate={handleParameterValueUpdate}
                  onBack={() => setActiveTab("details")}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting || isPending}
                  errors={errors}
                  isUseGlobalMarkup={useGlobalMarkup}
                  globalMarkupPercentage={globalMarkupPercentage}
                  onGlobalMarkupChange={handleGlobalMarkupChange}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Tour guide component */}
      <CreateProposalTour 
        isRunning={isTourRunning} 
        setIsRunning={setIsTourRunning}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Floating help button */}
      <div className="fixed bottom-6 right-6">
        <Button
          onClick={startTour}
          variant="secondary"
          className="rounded-full w-12 h-12 shadow-lg bg-white text-gray-800 hover:bg-gray-100 border border-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:hover:bg-zinc-700 dark:text-gray-200"
          aria-label="Start tour guide"
        >
          <HelpCircle size={24} />
        </Button>
      </div>
    </div>
  );
}
