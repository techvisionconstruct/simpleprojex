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
} from "@/components/shared";
import { Save, Loader2, Info, HelpCircle } from "lucide-react";
import { evaluateFormula } from "@/lib/formula-evaluator";
import { toast } from "sonner";
import { CreateProposalTour } from "@/components/features/tour-guide/create-proposal-tour";

import { ProposalDetailsTab } from "@/components/features/create-proposal-page/proposal-details-tab";
import { TemplateSelectionTab } from "@/components/features/create-proposal-page/template-selection-tab";
import { ModulesTab } from "@/components/features/create-proposal-page/modules-tab";
import { ParametersTab } from "@/components/features/create-proposal-page/parameters-tab";
import {
  ProposalFormData,
  Template,
  Module,
  Element,
  Parameter,
  ElementWithValues,
  validateProposalForm,
} from "@/components/features/create-proposal-page/zod-schema";

export default function CreateProposal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("details");
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
    image: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b",
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
    let elementsFromTemplate = templateElements.map((templateElement) => {
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

    console.log("test", elementsFromTemplate);

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
    return elements.map((el) => {
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

        return [
          ...prev,
          {
            id: Date.now(), // temporary unique ID
            element: safeElement,
            module: module,
            formula: element.formula || "",
            labor_formula: element.labor_formula || "",
            material_cost: 0,
            labor_cost: 0,
            markup: 10,
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

        // Show toast notification for validation error
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
          errorPath.includes("selectedElements")
        ) {
          setActiveTab("modules");
        } else if (errorPath.includes("selectedParameters")) {
          setActiveTab("parameters");
        }

        setIsSubmitting(false);
        return;
      }

      submitProposal({
        id: selectedTemplate?.id,
        name: proposalDetails.name,
        title: proposalDetails.name,
        description: proposalDetails.description,
        clientName: proposalDetails.client_name,
        clientEmail: proposalDetails.client_email,
        clientPhone: proposalDetails.phone_number,
        clientAddress: proposalDetails.address,
        image: proposalDetails.image,
        parameters: selectedParameters,
        template_elements: selectedElements,
      });
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

  console.log("Selected Parameters:", selectedParameters);
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

  // Navigation functions
  const goToTab = (tab: string) => setActiveTab(tab);

  return (
    <div className="max-w-full mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Create New Proposal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create a detailed proposal for your client.
          </p>
        </div>

        {/* Optional: Add a button to manually trigger the tour */}
        {/* <Button
          onClick={startTour}
          variant="outline"
          size="sm"
          className="absolute top-6 right-6 h-10 px-4 text-sm font-medium rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-md z-50"
        >
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4" />
            Tour Guide
          </span>
        </Button> */}

        {/* <Button
          value={activeTab}
          // onValueChange={handleTabChange}
          className="w-full h-full flex flex-col"
        >
          {isSubmitting || isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Proposal
        </Button> */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="details" className="tab-trigger" data-value="details">Proposal Details</TabsTrigger>
          <TabsTrigger value="template" className="tab-trigger" data-value="template">Template Selection</TabsTrigger>
          <TabsTrigger value="modules" className="tab-trigger" data-value="modules">Modules & Elements</TabsTrigger>
          <TabsTrigger value="parameters" className="tab-trigger" data-value="parameters">Parameters</TabsTrigger>
        </TabsList>

        {/* Proposal Details Tab */}
        <TabsContent value="details" className="details-tab-content">
          <ProposalDetailsTab
            value={proposalDetails}
            onChange={setProposalDetails}
            onNext={() => goToTab("template")}
            errors={errors}
          />
        </TabsContent>

        {/* Template Selection Tab */}
        <TabsContent value="template" className="template-tab-content">
          <TemplateSelectionTab
            templates={templates}
            selectedTemplate={selectedTemplate}
            handleTemplateSelect={handleTemplateSelect}
            onBack={() => goToTab("details")}
            onNext={() => goToTab("modules")}
          />
        </TabsContent>

        {/* Modules & Elements Tab */}
        <TabsContent value="modules" className="modules-tab-content">
          <ModulesTab
            modules={modules}
            elements={elements}
            selectedModules={selectedModules}
            selectedElements={selectedElements}
            selectedTemplate={selectedTemplate}
            selectedParameters={selectedParameters}
            customModules={customModules}
            handleModuleToggle={handleModuleToggle}
            handleAddCustomModule={handleAddCustomModule}
            handleElementToggle={handleElementToggle}
            handleElementValueUpdate={handleElementValueUpdate}
            onBack={() => setActiveTab("template")}
            onNext={() => setActiveTab("parameters")}
            errors={errors}
          />
        </TabsContent>

        {/* Parameters Tab */}
        <TabsContent value="parameters" className="parameters-tab-content">
          <ParametersTab
            parameters={parameters}
            selectedParameters={selectedParameters}
            handleParameterToggle={handleParameterToggle}
            handleParameterValueUpdate={handleParameterValueUpdate}
            isSubmitting={isSubmitting}
            onBack={() => goToTab("modules")}
            onSubmit={handleSubmit}
            errors={errors}
          />
        </TabsContent>
      </Tabs>

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
