import React, { useState, useEffect, useRef } from "react";
import {
  Module,
  Element,
  Parameter,
  ElementWithValues
} from "./zod-schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Separator,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  VisuallyHidden,
  Label,
  Switch,
} from "@/components/shared";
import {
  X,
  Pencil,
  ArrowRight,
  ArrowLeft,
  Variable,
  SlidersHorizontal,
  Settings,
  HelpCircle,
  FileText,
  Calculator,
  Info,
  ChevronDown,
  Percent,
  DollarSign,
  Trash2,
  Save,
  Package,
  Hammer,
} from "lucide-react";
import { formatCurrency } from "@/lib/formula-evaluator";

interface TradesTabProps {
  modules: any;
  elements: any;
  parameters: any;
  selectedModules: Module[];
  selectedElements: ElementWithValues[];
  selectedParameters: Parameter[];
  customModules: Module[];
  handleModuleToggle: (module: Module) => void;
  handleElementToggle: (element: Element, module: Module) => void;
  handleElementValueUpdate: (
    elementId: number,
    module: Module, 
    field: string, 
    formula: string, 
    value: number
  ) => void;
  handleParameterToggle: (parameter: Parameter) => void;
  handleParameterValueUpdate: (parameterId: number, value: string | number) => void;
  onBack: () => void;
  onNext?: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  errors?: Record<string, string>;
  isUseGlobalMarkup?: boolean;
  globalMarkupPercentage?: number;
  onGlobalMarkupChange?: (isUsed: boolean, percentage: number) => void;
}

// Reusable HelpTooltip component
function HelpTooltip({ label, tip }: { label: string; tip: string | React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className="ml-2 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-full"
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground p-3 rounded-md shadow-sm max-w-xs">
          {typeof tip === 'string' ? <p className="text-sm">{tip}</p> : tip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TradesTab({
  modules,
  elements,
  parameters,
  selectedModules,
  selectedElements,
  selectedParameters,
  customModules,
  handleModuleToggle,
  handleElementToggle,
  handleElementValueUpdate,
  handleParameterToggle,
  handleParameterValueUpdate,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
  errors = {},
  isUseGlobalMarkup,
  globalMarkupPercentage,
  onGlobalMarkupChange
}: TradesTabProps) {
  const [activeModuleAccordions, setActiveModuleAccordions] = useState<Record<string, boolean>>({});
  const [editingMarkup, setEditingMarkup] = useState<{elementId: number; moduleId: number} | null>(null);
  
  // Use props for global markup if provided, otherwise use local state
  const [globalMarkup, setGlobalMarkup] = useState(globalMarkupPercentage || 10);
  const [useGlobalMarkup, setUseGlobalMarkup] = useState(isUseGlobalMarkup || false);

  const markupInputRef = useRef<HTMLInputElement>(null);
  
  // Screen reader announcements
  const [announcement, setAnnouncement] = useState("");
  
  function announceToScreenReader(message: string) {
    setAnnouncement(message);
    setTimeout(() => setAnnouncement(""), 1000);
  }

  // Update local state when props change
  React.useEffect(() => {
    if (globalMarkupPercentage !== undefined) {
      setGlobalMarkup(globalMarkupPercentage);
    }
    if (isUseGlobalMarkup !== undefined) {
      setUseGlobalMarkup(isUseGlobalMarkup);
    }
  }, [globalMarkupPercentage, isUseGlobalMarkup]);

  // Focus markup input when editing
  React.useEffect(() => {
    if (editingMarkup && markupInputRef.current) {
      markupInputRef.current.focus();
    }
  }, [editingMarkup]);

  // Toggle module accordion
  const toggleModuleAccordion = (moduleId: number) => {
    setActiveModuleAccordions(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Open all accordions by default for better UX
  React.useEffect(() => {
    const initialAccordionState: Record<string, boolean> = {};
    selectedModules.forEach(module => {
      initialAccordionState[module.id] = true;
    });
    setActiveModuleAccordions(initialAccordionState);
  }, [selectedModules]);

  // Calculate total cost
  const calculateTotalCost = () => {
    return selectedElements.reduce((total, element) => {
      const materialCost = typeof element.material_cost === 'number' ? element.material_cost : 0;
      const laborCost = typeof element.labor_cost === 'number' ? element.labor_cost : 0;
      const markup = useGlobalMarkup ? globalMarkup : (element.markup || 10);
      
      const subtotal = (materialCost + laborCost) * (1 + markup / 100);
      return total + subtotal;
    }, 0);
  };

  // Filter modules - no search now
  const filteredModules = [...selectedModules, ...customModules];

  // Handle edit markup for an element
  const handleEditMarkup = (elementId: number, moduleId: number) => {
    setEditingMarkup({ elementId, moduleId });
  };

  const handleMarkupChange = (elementId: number, moduleId: number, value: string) => {
    const markupValue = parseFloat(value);
    if (!isNaN(markupValue)) {
      handleElementValueUpdate(
        elementId,
        { id: moduleId } as Module,
        'markup',
        '',
        markupValue
      );
    }
    setEditingMarkup(null);
  };

  // Handle global markup changes
  const handleGlobalMarkupValueChange = (value: number) => {
    setGlobalMarkup(value);
    if (onGlobalMarkupChange) {
      onGlobalMarkupChange(useGlobalMarkup, value);
    }
  };

  const handleUseGlobalMarkupChange = (isUsed: boolean) => {
    setUseGlobalMarkup(isUsed);
    if (onGlobalMarkupChange) {
      onGlobalMarkupChange(isUsed, globalMarkup);
    }
  };

  // Get type icon based on parameter type
  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'linear feet':
        return <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />;
      case 'square feet':
        return <Calculator className="w-4 h-4" aria-hidden="true" />;
      case 'cube feet':
        return <Package className="w-4 h-4" aria-hidden="true" />;
      case 'count':
        return <FileText className="w-4 h-4" aria-hidden="true" />;
      default:
        return <Variable className="w-4 h-4" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-8 bg-background text-foreground min-h-screen p-4 md:p-6">
      {/* Add screen reader announcements */}
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>

      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Project Components</h1>
        <div className="flex items-center text-muted-foreground">
          <p>Configure trades and elements for your project proposal</p>
          <HelpTooltip 
            label="Help: Project Components Overview"
            tip={
              <div className="space-y-2">
                <p className="font-medium">Project Components:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>Review measurement variables and their values</li>
                  <li>View trades and elements in your proposal</li> 
                  <li>Review calculated costs based on formulas</li>
                  <li>Adjust markup percentages as needed</li>
                </ul>
              </div>
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Parameters section - 1/4 width */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Variable className="h-4 w-4 text-muted-foreground" />
                Variables
              </CardTitle>
              <CardDescription>
                Set measurement variables for calculations
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              {selectedParameters.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No variables selected yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedParameters.map((parameter) => (
                    <Card key={parameter.id} className="overflow-hidden">
                      <CardContent className="p-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-sm font-medium flex items-center">
                                {parameter.name}
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {parameter.type}
                                </Badge>
                              </h4>
                            </div>
                          </div>
                          <div className="mt-1">
                            <Label
                              htmlFor={`param-${parameter.id}`}
                              className="text-xs text-muted-foreground mb-1"
                            >
                              Value
                            </Label>
                            <Input
                              id={`param-${parameter.id}`}
                              type={parameter.type === "number" ? "number" : "text"}
                              value={parameter.value}
                              onChange={(e) => handleParameterValueUpdate(parameter.id, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Trades section - 3/4 width */}
        <div className="md:col-span-3 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Trades & Elements
                </CardTitle>
              </div>
              <CardDescription>
                View trades and elements for your proposal
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center gap-4 justify-end">
                <div className="space-x-2 flex items-center whitespace-nowrap">
                  <Label htmlFor="global-markup" className="text-sm font-medium">
                    Global Markup:
                  </Label>
                  <div className="relative">
                    <Percent className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="global-markup"
                      type="number"
                      value={globalMarkup}
                      onChange={(e) => handleGlobalMarkupValueChange(Number(e.target.value) || 0)}
                      className="w-24 pr-9"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="use-global-markup" 
                      checked={useGlobalMarkup}
                      onCheckedChange={handleUseGlobalMarkupChange}
                    />
                    <Label htmlFor="use-global-markup" className="text-sm">Use Global</Label>
                  </div>
                </div>
              </div>

              {filteredModules.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    No trades selected yet
                  </p>
                </div>
              )}

              <div className="space-y-4 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                {filteredModules.map((module) => {
                  const moduleElements = selectedElements.filter(
                    (el) => el.module.id === module.id
                  );
                  
                  const isActive = !!activeModuleAccordions[module.id];

                  return (
                    <Card key={module.id} className={isActive ? 'ring-1 ring-primary/20' : ''}>
                      <CardHeader 
                        className="py-3 px-4 cursor-pointer hover:bg-accent/50"
                        onClick={() => toggleModuleAccordion(module.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <ChevronDown 
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isActive ? 'transform rotate-180' : ''
                              }`} 
                            />
                            <h3 className="font-medium text-base">{module.name}</h3>
                            <Badge variant="outline" className="ml-2">
                              {moduleElements.length} {moduleElements.length === 1 ? 'element' : 'elements'}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      
                      {isActive && (
                        <>
                          <Separator />
                          <CardContent className="pt-4">
                            {moduleElements.length === 0 ? (
                              <div className="text-center py-4 text-muted-foreground">
                                <p className="mb-2">No elements added to this trade</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground px-1">
                                  <div className="col-span-4">Element</div>
                                  <div className="col-span-2">Formula</div>
                                  <div className="col-span-2 text-right">Material</div>
                                  <div className="col-span-2 text-right">Labor</div>
                                  <div className="col-span-2 text-right">Total</div>
                                </div>
                                
                                {moduleElements.map((element) => {
                                  const materialCost = Number(element.material_cost) || 0;
                                  const laborCost = Number(element.labor_cost) || 0;
                                  const markup = useGlobalMarkup ? globalMarkup : (element.markup || 10);
                                  const total = (materialCost + laborCost) * (1 + markup / 100);

                                  return (
                                    <div 
                                      key={`${element.element.id}-${element.module.id}`} 
                                      className="grid grid-cols-12 gap-4 items-center border p-3 rounded-lg bg-background"
                                    >
                                      <div className="col-span-4">
                                        <div className="font-medium text-sm">
                                          {element.element.name}
                                        </div>
                                        {element.element.description && (
                                          <div className="text-xs text-muted-foreground mt-0.5">
                                            {element.element.description}
                                          </div>
                                        )}
                                      </div>
                                      
                                      {/* Updated formula display with hammer icon */}
                                      <div className="col-span-2">
                                        <TooltipProvider>
                                          <div className="space-y-1.5">
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1.5 bg-muted/40 rounded-md px-2 py-1 hover:bg-muted/60 transition-colors group cursor-default">
                                                  <Hammer className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                                                  <div className="text-xs font-medium truncate max-w-[120px] text-muted-foreground group-hover:text-foreground">
                                                    {element.formula || "No formula"}
                                                  </div>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-[300px] p-2">
                                                <p className="text-sm font-mono">
                                                  Material: {element.formula || "No formula"}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                            
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <div className="flex items-center gap-1.5 bg-muted/40 rounded-md px-2 py-1 hover:bg-muted/60 transition-colors group cursor-default">
                                                  <Hammer className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                                                  <div className="text-xs font-medium truncate max-w-[120px] text-muted-foreground group-hover:text-foreground">
                                                    {element.labor_formula || "No formula"}
                                                  </div>
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent side="top" className="max-w-[300px] p-2">
                                                <p className="text-sm font-mono">
                                                  Labor: {element.labor_formula || "No formula"}
                                                </p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </div>
                                        </TooltipProvider>
                                      </div>
                                      
                                      <div className="col-span-2 text-right">
                                        {formatCurrency(materialCost)}
                                      </div>
                                      <div className="col-span-2 text-right">
                                        {formatCurrency(laborCost)}
                                      </div>
                                      <div className="col-span-2 text-right">
                                        <div className="font-medium">
                                          {formatCurrency(total)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {markup}% markup
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                <div className="flex justify-between items-center border-t pt-4 px-1 mt-4">
                                  <span className="text-sm font-medium">
                                    Module Subtotal
                                  </span>
                                  <span className="font-semibold">
                                    {formatCurrency(
                                      moduleElements.reduce((total, element) => {
                                        const materialCost = Number(element.material_cost) || 0;
                                        const laborCost = Number(element.labor_cost) || 0;
                                        const markup = useGlobalMarkup ? globalMarkup : (element.markup || 10);
                                        return total + ((materialCost + laborCost) * (1 + markup/100));
                                      }, 0)
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </>
                      )}
                    </Card>
                  );
                })}
              </div>

              {filteredModules.length > 0 && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-lg">Total Estimate</h3>
                        <p className="text-sm text-muted-foreground">
                          Includes all trades and elements with markup
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {formatCurrency(calculateTotalCost())}
                        </div>
                        {useGlobalMarkup && (
                          <div className="text-xs text-muted-foreground mt-1">
                            With {globalMarkup}% Global Markup
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="px-6 font-medium order-2 sm:order-1 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        
        {onSubmit ? (
          <Button 
            onClick={onSubmit}
            size="lg" 
            className="px-8 font-medium order-1 sm:order-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Creating...
              </>
            ) : (
              <>
                Create Proposal
                <Save className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        ) : onNext && (
          <Button 
            onClick={onNext}
            size="lg" 
            className="px-8 font-medium order-1 sm:order-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
          >
            Continue
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Help tooltip that follows the user */}
      <div className="fixed bottom-4 right-4 z-50">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full border-gray-200 bg-white/90 backdrop-blur shadow-md focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Get help and tips"
              >
                <HelpCircle className="h-5 w-5" />
                <span className="sr-only">Help and tips</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" align="end" className="max-w-xs">
              <div className="space-y-1.5">
                <p className="font-medium">Quick Tips:</p>
                <ul className="text-sm space-y-1 list-disc pl-4">
                  <li>Review your trades and elements carefully</li>
                  <li>Check that formulas are generating expected values</li>
                  <li>Adjust variable values to see real-time cost changes</li>
                  <li>Use global markup to apply consistent pricing</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}