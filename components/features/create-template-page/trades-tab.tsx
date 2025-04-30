import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getParameters } from "@/api/client/parameters";
import { getModules } from "@/api/client/modules";
import { getElements } from "@/api/client/elements";
import { Parameter, Module, Element } from "./types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Button,
  Input,
  Separator,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  VisuallyHidden
} from "@/components/shared";
import {
  X,
  Pencil,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Package,
  PlusCircle,
  Variable,
  SlidersHorizontal,
  Hammer,
  Settings,
  HelpCircle,
  FileText,
  Calculator,
  Info,
  Check,
} from "lucide-react";
import { parametersSchema } from "./zod-schema";
import { EditModuleDialog } from "./edit-module-dialog";
import { AddElementDialog } from "./add-element-dialog";
import { EditElementDialog } from "./edit-element-dialog";
import { ModuleForm, ParameterForm } from "./zod-schema";
import { ParametersTab } from "./parameters-tab";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/shared";

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
  moduleValue,
  onModuleChange,
  parameterValue,
  onParameterChange,
  onPrev,
  onNext,
}: {
  moduleValue: Module[];
  onModuleChange: (modules: ModuleForm) => void;
  parameterValue: Parameter[];
  onParameterChange: (params: ParameterForm) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  // Variables (Parameters) section state
  const [paramInput, setParamInput] = React.useState("");
  const [paramAdded, setParamAdded] = React.useState<Parameter[]>(parameterValue);
  const [paramError, setParamError] = React.useState<string | null>(null);
  const [showAddParamDialog, setShowAddParamDialog] = React.useState(false);
  const [newParamName, setNewParamName] = React.useState("");
  const [newParamType, setNewParamType] = React.useState("");
  const parameterTypes = ["Linear Feet", "Square Feet", "Cube Feet", "Count"];
  // Autocomplete state
  const [activeAutocompleteSuggestion, setActiveAutocompleteSuggestion] = React.useState<Parameter | null>(null);

  // Modules (Trades) section state
  const [tradeInput, setTradeInput] = React.useState("");
  const [tradesAdded, setTradesAdded] = React.useState<Module[]>(moduleValue);
  const [tradeHighlighted, setTradeHighlighted] = React.useState<number>(-1);
  const [tradeError, setTradeError] = React.useState<string | null>(null);
  const [editingModule, setEditingModule] = React.useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [addElementModule, setAddElementModule] = React.useState<Module | null>(null);
  const [isAddElementDialogOpen, setIsAddElementDialogOpen] = React.useState(false);
  const [editingElement, setEditingElement] = React.useState<Element | null>(null);
  const [isEditElementDialogOpen, setIsEditElementDialogOpen] = React.useState(false);
  // Trade autocomplete state
  const [activeTradeAutocompleteSuggestion, setActiveTradeAutocompleteSuggestion] = React.useState<Module | null>(null);
  
  // For keyboard navigation
  const variableCardRef = React.useRef<HTMLDivElement>(null);
  const tradeCardRef = React.useRef<HTMLDivElement>(null);
  const paramInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    setParamAdded(parameterValue);
  }, [parameterValue]);

  React.useEffect(() => {
    setTradesAdded(moduleValue);
  }, [moduleValue]);

  // Variable (Parameter) Functions
  function openAddParamDialog(name: string) {
    setNewParamName(name);
    setNewParamType(""); // Reset to empty to force user selection
    setShowAddParamDialog(true);
  }

  function handleAddParamDialog() {
    if (!newParamName.trim()) return;
    if (!newParamType) return; // Don't proceed if no type selected
    
    const newParam: Parameter = {
      id: Date.now(),
      name: newParamName.trim(),
      value: 0,
      type: newParamType,
    };
    const updated = [...paramAdded, newParam];
    setParamAdded(updated);
    onParameterChange(updated);
    setParamInput("");
    setShowAddParamDialog(false);
    setNewParamName("");
    setNewParamType("");
    
    // Announce success for screen readers
    announceToScreenReader(`Added variable ${newParamName}`);
  }

  function handleParamInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Tab autocomplete
    if (e.key === "Tab" && activeAutocompleteSuggestion) {
      e.preventDefault();
      // Check if this parameter already exists but with different casing
      const existingParam = paramAdded.find(
        p => p.name.toLowerCase() === activeAutocompleteSuggestion.name.toLowerCase()
      );
      
      if (existingParam) {
        announceToScreenReader(`Variable ${existingParam.name} already exists`);
      } else {
        handleAddParam(activeAutocompleteSuggestion);
        // Clear the input field after autocompleting
        setParamInput("");
      }
      return;
    }

    if (e.key === "Enter" && paramInput.trim()) {
      // Check if this parameter already exists but with different casing
      const existingParam = paramAdded.find(
        p => p.name.toLowerCase() === paramInput.trim().toLowerCase()
      );
      
      if (existingParam) {
        announceToScreenReader(`Variable ${existingParam.name} already exists`);
      } else {
        // If there's an active autocomplete suggestion, use it
        if (activeAutocompleteSuggestion && 
            activeAutocompleteSuggestion.name.toLowerCase().startsWith(paramInput.toLowerCase())) {
          handleAddParam(activeAutocompleteSuggestion);
        } else {
          openAddParamDialog(paramInput.trim());
        }
      }
      e.preventDefault();
    }
  }

  function handleAddParam(param: Parameter) {
    // Check if param already exists with case insensitive comparison
    const alreadyExists = paramAdded.some(
      p => p.name.toLowerCase() === param.name.toLowerCase()
    );
    
    if (alreadyExists) {
      announceToScreenReader(`Variable ${param.name} already exists`);
      return;
    }
    
    const updated = [...paramAdded, param];
    setParamAdded(updated);
    onParameterChange(updated);
    setParamInput("");
    setParamError(null);
    setShowAddParamDialog(false);
    setNewParamName("");
    // Clear autocomplete suggestion when adding a parameter
    setActiveAutocompleteSuggestion(null);
  }

  function handleParamInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setParamInput(value);
    
    // Update autocomplete suggestion with filtered matches based on current input
    if (value.trim()) {
      const filteredSuggestions = parameters.filter(
        (p: Parameter) =>
          p.name.toLowerCase().startsWith(value.toLowerCase()) &&
          !paramAdded.some((a) => a.id === p.id)
      );
      setActiveAutocompleteSuggestion(filteredSuggestions.length > 0 ? filteredSuggestions[0] : null);
    } else {
      setActiveAutocompleteSuggestion(null);
    }
    
    if (paramError && value.trim()) {
      setParamError(null);
    }
  }

  function handleDeleteParam(id: number, name: string) {
    const updated = paramAdded.filter((p) => p.id !== id);
    setParamAdded(updated);
    onParameterChange(updated);
    announceToScreenReader(`Removed variable ${name}`);
  }

  function validateParameters() {
    const result = parametersSchema.safeParse(paramAdded);
    if (!result.success) {
      const errorMessage =
        result.error.errors[0]?.message || "At least one variable is required";
      setParamError(errorMessage);
      return false;
    }
    setParamError(null);
    return true;
  }

  // Helper function to guess the parameter type based on variable name
  function guessParameterType(variableName: string): string {
    const name = variableName.toLowerCase();
    
    if (name.includes('length') || name.includes('width') || name.includes('height') || 
        name.includes('perimeter') || name.includes('run') || name.includes('span') ||
        name.includes('distance') || name.includes('depth')) {
      return "Linear Feet";
    } else if (name.includes('area') || name.includes('surface') || name.includes('sq') || 
              name.includes('square')) {
      return "Square Feet";
    } else if (name.includes('volume') || name.includes('cubic') || name.includes('cu')) {
      return "Cube Feet";
    } else {
      return "Count";
    }
  }

  // Trade (Module) Functions
  function handleAddTrade(mod: Module) {
    const updated = [...tradesAdded, mod];
    setTradesAdded(updated);
    setTradeInput("");
    setTradeHighlighted(-1);
    setTradeError(null);
    // Clear autocomplete suggestion when adding a trade
    setActiveTradeAutocompleteSuggestion(null);
    
    // Extract and add variables from elements if they exist
    const extractAndAddVariables = async () => {
      try {
        // Fetch elements for this module if we don't have them yet
        const elements = await getElements(mod.name);
        if (elements && elements.length > 0) {
          const variablesToAdd: Set<string> = new Set();
          
          // Extract variables from all formulas in elements
          elements.forEach((element: Element) => {
            if (element.formula) {
              const formulaVars = extractVariablesFromFormula(element.formula);
              formulaVars.forEach(v => variablesToAdd.add(v));
            }
            if (element.labor_formula) {
              const laborVars = extractVariablesFromFormula(element.labor_formula);
              laborVars.forEach(v => variablesToAdd.add(v));
            }
          });
          
          // Create new parameters for each extracted variable if they don't exist already
          const newParams: Parameter[] = [];
          variablesToAdd.forEach(varName => {
            // Check if this parameter already exists (case insensitive)
            const exists = paramAdded.some(p => p.name.toLowerCase() === varName.toLowerCase());
            
            if (!exists) {
              const paramType = guessParameterType(varName);
              const newParam: Parameter = {
                id: Date.now() + newParams.length, // Ensure unique IDs
                name: varName,
                value: 0,
                type: paramType,
              };
              newParams.push(newParam);
            }
          });
          
          // Add all new parameters if we found any
          if (newParams.length > 0) {
            const updatedParams = [...paramAdded, ...newParams];
            setParamAdded(updatedParams);
            onParameterChange(updatedParams);
            
            // Announce added variables
            if (newParams.length === 1) {
              announceToScreenReader(`Added variable ${newParams[0].name} from elements in ${mod.name}`);
            } else {
              announceToScreenReader(`Added ${newParams.length} variables from elements in ${mod.name}`);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching elements for variable extraction:", error);
      }
    };
    
    // Call the async function
    extractAndAddVariables();
    
    // Announce to screen readers
    announceToScreenReader(`Added trade ${mod.name}`);
    
    // Update modules with elements
    const tradesWithElements = updated.map((trade) => {
      if (trade.id === mod.id) {
        return {
          ...trade,
          elements: [],
        };
      }
      const index = updated.findIndex(t => t.id === trade.id);
      const combinedElements = index >= 0 ? getCombinedElements(index) : [];
      return {
        ...trade,
        elements: combinedElements,
      };
    });
    onModuleChange(tradesWithElements);
  }

  function handleDeleteTrade(idx: number, name: string) {
    const updated = tradesAdded.filter((_, i) => i !== idx);
    setTradesAdded(updated);
    announceToScreenReader(`Removed trade ${name}`);
    
    // Update modules without deleted trade
    const tradesWithElements = updated.map((trade) => {
      const index = updated.findIndex(t => t.id === trade.id);
      const combinedElements = index >= 0 ? getCombinedElements(index) : [];
      return {
        ...trade,
        elements: combinedElements,
      };
    });
    
    onModuleChange(tradesWithElements);
  }

  function handleEditTrade(idx: number) {
    const mod = tradesAdded[idx];
    setEditingModule(mod);
    setIsEditDialogOpen(true);
  }

  function handleSaveTradeEdit(updatedModule: Module) {
    const updated = tradesAdded.map((m) =>
      m.id === updatedModule.id ? updatedModule : m
    );
    setTradesAdded(updated);
    setEditingModule(null);
    
    // Announce to screen readers
    announceToScreenReader(`Updated trade ${updatedModule.name}`);
    
    // Update with elements preserved
    const tradesWithElements = updated.map((mod) => {
      const index = updated.findIndex(t => t.id === mod.id);
      const combinedElements = index >= 0 ? getCombinedElements(index) : [];
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    onModuleChange(tradesWithElements);
  }

  function handleAddElement(idx: number) {
    const mod = tradesAdded[idx];
    setAddElementModule(mod);
    setIsAddElementDialogOpen(true);
  }

  const getCombinedElements = (moduleIndex: number) => {
    if (moduleIndex < 0 || moduleIndex >= tradesAdded.length) return [];
    
    const apiElements = elementsQueries[moduleIndex]?.data || [];
    const moduleElements = (tradesAdded[moduleIndex] as Module & { elements?: Element[] }).elements || [];
    const apiElementsMap = new Map(
      apiElements.map((el: Element) => [el.id, el])
    );
    const uniqueModuleElements = moduleElements.filter(
      (el: Element) => !apiElementsMap.has(el.id)
    );
    return [...apiElements, ...uniqueModuleElements];
  };

  function handleSaveAddElement(module: Module, newElement: Element) {
    const moduleIdx = tradesAdded.findIndex((m) => m.id === module.id);
    if (moduleIdx >= 0) {
      // Ensure the data array exists
      if (!elementsQueries[moduleIdx].data) {
        elementsQueries[moduleIdx].data = [];
      }
      
      // Add the new element to the array
      elementsQueries[moduleIdx].data.push(newElement);
      
      // Create updated modules array with all current elements to pass to parent
      const tradesWithElements = tradesAdded.map((mod, index) => {
        const combinedElements = getCombinedElements(index);
        return {
          ...mod,
          elements: combinedElements,
        };
      });
      
      // Update local state and parent component
      setTradesAdded([...tradesAdded]);
      onModuleChange(tradesWithElements);
      
      // Announce to screen readers
      announceToScreenReader(`Added element ${newElement.name} to ${module.name}`);
    }
  }

  function handleEditModuleElement(
    moduleId: number,
    elementId: number,
    isQueryElement = false,
    moduleIdx = -1,
    elIdx = -1
  ) {
    if (isQueryElement && moduleIdx >= 0 && elIdx >= 0) {
      const module = tradesAdded[moduleIdx];
      const element = elementsQueries[moduleIdx]?.data?.[elIdx];

      if (module && element) {
        setAddElementModule(module);
        setEditingElement(element);
        setIsEditElementDialogOpen(true);
      }
    } else {
      const module = tradesAdded.find((m) => m.id === moduleId);
      if (module) {
        setAddElementModule(module);
        setIsEditElementDialogOpen(true);
      }
    }
  }

  function handleDeleteElement(moduleIdx: number, elIdx: number) {
    const elements = getCombinedElements(moduleIdx);
    if (elements.length <= elIdx) return;
    const elementToDelete = elements[elIdx];
    const elementName = elementToDelete.name;
    
    const apiElements = elementsQueries[moduleIdx]?.data || [];
    const apiElementIndex = apiElements.findIndex(
      (el: Element) => el.id === elementToDelete.id
    );

    if (apiElementIndex >= 0) {
      elementsQueries[moduleIdx].data.splice(apiElementIndex, 1);
    } else {
      const moduleWithElements = tradesAdded[moduleIdx] as Module & { elements?: Element[] };
      const moduleElements = moduleWithElements.elements || [];
      const updatedModuleElements = moduleElements.filter(
        (el: Element) => el.id !== elementToDelete.id
      );

      const updatedModule = {
        ...tradesAdded[moduleIdx],
        elements: updatedModuleElements,
      };

      const updatedModules = [...tradesAdded];
      updatedModules[moduleIdx] = updatedModule;
      setTradesAdded(updatedModules);
    }

    // Update local state
    setTradesAdded((prev) => [...prev]);
    
    // Create updated modules array with all current elements to pass to parent
    const tradesWithElements = tradesAdded.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Sync with parent component
    onModuleChange(tradesWithElements);
    
    // Announce to screen readers
    const tradeName = tradesAdded[moduleIdx]?.name || "trade";
    announceToScreenReader(`Removed element ${elementName} from ${tradeName}`);
  }

  function handleSaveEditedElement(module: Module, updatedElement: Element) {
    const moduleIdx = tradesAdded.findIndex((m) => m.id === module.id);
    if (moduleIdx < 0) return;

    const apiElements = elementsQueries[moduleIdx]?.data || [];
    const apiElementIdx = apiElements.findIndex(
      (el: Element) => el.id === updatedElement.id
    );

    if (apiElementIdx >= 0) {
      elementsQueries[moduleIdx].data[apiElementIdx] = updatedElement;
    } else {
      const moduleWithElements = tradesAdded[moduleIdx] as Module & { elements?: Element[] };
      const moduleElements = moduleWithElements.elements || [];
      const moduleElementIdx = moduleElements.findIndex(
        (el: Element) => el.id === updatedElement.id
      );

      if (moduleElementIdx >= 0) {
        moduleElements[moduleElementIdx] = updatedElement;
        const updatedModule = {
          ...tradesAdded[moduleIdx],
          elements: moduleElements,
        };
        const updatedModules = [...tradesAdded];
        updatedModules[moduleIdx] = updatedModule;
        setTradesAdded(updatedModules);
      }
    }

    // Update local state
    setTradesAdded((prev) => [...prev]);
    
    // Create updated modules array with all current elements to pass to parent
    const tradesWithElements = tradesAdded.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Sync with parent component
    onModuleChange(tradesWithElements);
    
    // Announce to screen readers
    announceToScreenReader(`Updated element ${updatedElement.name}`);
  }

  function handleTradeInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Tab autocomplete
    if (e.key === "Tab" && activeTradeAutocompleteSuggestion) {
      e.preventDefault();
      // Check if this trade already exists but with different casing
      const existingTrade = tradesAdded.find(
        t => t.name.toLowerCase() === activeTradeAutocompleteSuggestion.name.toLowerCase()
      );
      
      if (existingTrade) {
        announceToScreenReader(`Trade ${existingTrade.name} already exists`);
      } else {
        handleAddTrade(activeTradeAutocompleteSuggestion);
        // Clear the input field after autocompleting
        setTradeInput("");
      }
      return;
    }

    if (e.key === "Enter" && tradeInput.trim()) {
      // Check if this trade already exists but with different casing
      const existingTrade = tradesAdded.find(
        t => t.name.toLowerCase() === tradeInput.trim().toLowerCase()
      );
      
      if (existingTrade) {
        announceToScreenReader(`Trade ${existingTrade.name} already exists`);
      } else {
        // If there's an active autocomplete suggestion, use it
        if (activeTradeAutocompleteSuggestion && 
            activeTradeAutocompleteSuggestion.name.toLowerCase().startsWith(tradeInput.toLowerCase())) {
          handleAddTrade(activeTradeAutocompleteSuggestion);
        } else {
          const newMod: Module = {
            id: Date.now(),
            name: tradeInput.trim(),
            description: "Newly created trade",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          handleAddTrade(newMod);
        }
      }
      e.preventDefault();
    }
  }

  function handleTradeInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setTradeInput(value);
    
    // Update autocomplete suggestion with filtered matches based on current input
    if (value.trim()) {
      const filteredSuggestions = modules.filter(
        (m: Module) =>
          m.name.toLowerCase().startsWith(value.toLowerCase()) &&
          !tradesAdded.some((a) => a.id === m.id)
      );
      setActiveTradeAutocompleteSuggestion(filteredSuggestions.length > 0 ? filteredSuggestions[0] : null);
    } else {
      setActiveTradeAutocompleteSuggestion(null);
    }
    
    if (tradeError && value.trim()) {
      setTradeError(null);
    }
  }

  function validateTrades() {
    if (tradesAdded.length === 0) {
      setTradeError("At least one trade is required");
      return false;
    }
    setTradeError(null);
    return true;
  }

  function handleNext() {
    const paramsValid = validateParameters();
    const tradesValid = validateTrades();
    
    if (paramsValid && tradesValid) {
      const tradesWithElements = tradesAdded.map((mod, index) => {
        const combinedElements = getCombinedElements(index);
        return {
          ...mod,
          elements: combinedElements,
        };
      });
      onModuleChange(tradesWithElements);
      onNext();
    } else {
      // Focus the first error area
      if (!paramsValid && variableCardRef.current) {
        variableCardRef.current.focus();
        announceToScreenReader("Please fix errors in the Variables section");
      } else if (!tradesValid && tradeCardRef.current) {
        tradeCardRef.current.focus();
        announceToScreenReader("Please fix errors in the Trades section");
      }
    }
  }

  // Data Fetching
  const { data: parameters = [] } = useQuery({
    queryKey: ["parameters"],
    queryFn: getParameters,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
  });

  const elementsQueries = useQueries({
    queries: tradesAdded.map((mod) => ({
      queryKey: ["elements", mod.name],
      queryFn: () => getElements(mod.name),
      enabled: !!mod.name,
    })),
  });

  const paramSuggestions = paramInput
    ? parameters.filter(
        (p: Parameter) =>
          p.name.toLowerCase().includes(paramInput.toLowerCase()) &&
          !paramAdded.some((a) => a.id === p.id)
      )
    : [];

  const tradeSuggestions = tradeInput
    ? modules.filter(
        (m: Module) =>
          m.name.toLowerCase().includes(tradeInput.toLowerCase()) &&
          !tradesAdded.some((a) => a.id === m.id)
      )
    : [];

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
  
  // Accessibility helper
  const [announcement, setAnnouncement] = React.useState("");
  
  function announceToScreenReader(message: string) {
    setAnnouncement(message);
    // Clear after a short delay to ensure it's read again if the same message is announced
    setTimeout(() => setAnnouncement(""), 1000);
  }

  // Helper function to extract variables from formulas
  function extractVariablesFromFormula(formula: string): string[] {
    if (!formula) return [];
    
    // Regular expressions to match both ${variableName} and plain variables
    // First check for ${variableName} pattern
    const templateVarRegex = /\${([^}]+)}/g;
    const plainVarRegex = /\b([A-Za-z][A-Za-z0-9_\s]*(?:\s+[A-Za-z][A-Za-z0-9_\s]*)*)\b/g;
    
    const variables: Set<string> = new Set();
    let match;
    
    // Extract ${variableName} pattern variables
    while ((match = templateVarRegex.exec(formula)) !== null) {
      // match[1] contains the variable name without the ${ and }
      variables.add(match[1].trim());
    }
    
    // Extract plain variable names (words with spaces that aren't operators)
    while ((match = plainVarRegex.exec(formula)) !== null) {
      const potential = match[1].trim();
      // Skip common operators and math functions
      if (!['sin', 'cos', 'tan', 'log', 'sqrt', 'pow', 'min', 'max', 'Math',
           'if', 'then', 'else', 'and', 'or', 'not', 'true', 'false'].includes(potential)) {
        variables.add(potential);
      }
    }
    
    return Array.from(variables);
  }

  return (
    <div className="space-y-8 bg-background text-foreground min-h-screen p-4 md:p-6">
      {/* Screen reader announcements */}
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </VisuallyHidden>
      
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Project Components</h1>
        <div className="flex items-center text-muted-foreground">
          <p>Define the variables and trades for your project template</p>
          <HelpTooltip 
            label="Help: Project Components Overview"
            tip={
              <div className="space-y-2">
                <p className="font-medium">Project Components:</p>
                <ul className="list-disc pl-4 space-y-1 text-sm">
                  <li>First add measurement variables (Tab to autocomplete)</li>
                  <li>Then organize them into trade categories</li>
                  <li>Finally, add elements to trades with their formulas</li>
                </ul>
              </div>
            }
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Variables section - 1/4 width */}
        <div className="md:col-span-1 space-y-6">
          <Card 
            className={`border shadow-sm ${paramError ? 'border-red-300 ring-1 ring-red-300' : ''}`}
            tabIndex={0}
            ref={variableCardRef}
          >
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Variable className="h-5 w-5 text-gray-600" aria-hidden="true" />
                  Variables
                </CardTitle>
                <Badge variant="outline" className="font-normal py-1">
                  {paramAdded.length} Added
                </Badge>
              </div>
              <CardDescription>
                Measurements used in project calculations (press Tab to autocomplete)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="paramInput" className="text-sm font-medium flex items-center">
                    Add or search for a variable
                  </label>
                  <div className="relative">
                    <Input
                      id="paramInput"
                      ref={paramInputRef}
                      value={paramInput}
                      onChange={handleParamInputChange}
                      onKeyDown={handleParamInputKeyDown}
                      placeholder="Type variable name and press Enter..."
                      className="h-10 text-base focus:ring-2 focus:ring-black focus:border-black"
                      aria-invalid={!!paramError}
                    />
                    
                    {/* Improved autocomplete hint - more seamless and inline with typing */}
                    {activeAutocompleteSuggestion && (
                      <div className="absolute left-0 top-0 w-full pointer-events-none">
                        <div className="flex items-center h-10 px-3">
                          <div className="flex-1">
                            <span className="text-transparent">{paramInput}</span>
                            <span className="text-gray-400">{activeAutocompleteSuggestion.name.substring(paramInput.length)}</span>
                          </div>
                          <span className="text-xs text-gray-400 ml-2">Tab to complete</span>
                        </div>
                      </div>
                    )}
                     
                    {paramSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-medium text-muted-foreground">Available Variables</p>
                        </div>
                        {paramSuggestions.map((suggestion: Parameter) => (
                          <div
                            key={suggestion.id}
                            className="flex items-center p-3 hover:bg-accent cursor-pointer"
                            onClick={() => handleAddParam(suggestion)}
                            tabIndex={0} 
                            role="button"
                            aria-label={`Add variable ${suggestion.name}, Type: ${suggestion.type}`}
                            onKeyDown={(e) => e.key === "Enter" && handleAddParam(suggestion)}
                          >
                            <div className="mr-2">
                              {getTypeIcon(suggestion.type)}
                            </div>
                            <div>
                              <div className="font-medium">{suggestion.name}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.type}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {paramError && (
                <div className="text-red-600 flex items-center gap-2 p-3 bg-red-50 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{paramError}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {paramAdded.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-6 text-center">
                    <Variable className="w-8 h-8 text-muted-foreground mb-2" aria-hidden="true" />
                    <p className="text-muted-foreground font-medium">No variables added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-foreground" id="variablesList">
                      Your Variables ({paramAdded.length})
                    </div>
                    <div className="space-y-3" role="list" aria-labelledby="variablesList">
                      {paramAdded.map((param) => (
                        <div
                          key={param.id}
                          className="group flex items-center justify-between p-3 rounded-md border border-gray-200 bg-card hover:border-gray-300 transition-colors"
                          role="listitem"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600">
                              {getTypeIcon(param.type)}
                            </span>
                            <div>
                              <div className="font-medium">{param.name}</div>
                              <div className="text-xs text-muted-foreground">{param.type}</div>
                            </div>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                  onClick={() => handleDeleteParam(param.id, param.name)}
                                  aria-label={`Remove ${param.name}`}
                                >
                                  <X className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Remove variable</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trades section - 3/4 width */}
        <div className="md:col-span-3 space-y-6">
          <Card 
            className={`border shadow-sm ${tradeError ? 'border-red-300 ring-1 ring-red-300' : ''}`}
            tabIndex={0}
            ref={tradeCardRef}
          >
            <CardHeader className="space-y-1 pb-4">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Hammer className="h-5 w-5 text-gray-600" aria-hidden="true" />
                  Trades
                </CardTitle>
                <Badge variant="outline" className="font-normal py-1">
                  {tradesAdded.length} Added
                </Badge>
              </div>
              <CardDescription>
                Trades organize your project elements into categories like Framing, Electrical, or Plumbing.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="relative">
                <div className="flex flex-col space-y-1.5">
                  <label htmlFor="tradeInput" className="text-sm font-medium flex items-center">
                    Add or search for a trade
                  </label>
                  <div className="relative">
                    <Input
                      id="tradeInput"
                      value={tradeInput}
                      onChange={handleTradeInputChange}
                      onKeyDown={handleTradeInputKeyDown}
                      placeholder="Type trade name and press Enter..."
                      className="h-10 text-base focus:ring-2 focus:ring-black focus:border-black"
                      aria-invalid={!!tradeError}
                    />
                    
                    {/* Improved autocomplete hint - more seamless and aesthetic */}
                    {activeTradeAutocompleteSuggestion && (
                      <div className="absolute left-0 top-0 w-full pointer-events-none">
                        <div className="flex items-center h-10 px-3">
                          <div className="flex-1">
                            <span className="text-transparent">{tradeInput}</span>
                            <span className="text-gray-400">{activeTradeAutocompleteSuggestion.name.substring(tradeInput.length)}</span>
                          </div>
                          <span className="text-xs text-gray-400 ml-2">Tab to complete</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {tradeSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs font-medium text-muted-foreground">Available Trades</p>
                    </div>
                    {tradeSuggestions.map((suggestion: Module) => (
                      <div
                        key={suggestion.id}
                        className="flex items-center p-3 hover:bg-accent cursor-pointer"
                        onClick={() => handleAddTrade(suggestion)}
                        tabIndex={0} 
                        role="button"
                        aria-label={`Add trade ${suggestion.name}`}
                        onKeyDown={(e) => e.key === "Enter" && handleAddTrade(suggestion)}
                      >
                        <div className="mr-2">
                          <Hammer className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="font-medium">{suggestion.name}</div>
                          <div className="text-xs text-muted-foreground">{suggestion.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {tradeError && (
                <div className="text-red-600 flex items-center gap-2 p-3 bg-red-50 rounded-md">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm">{tradeError}</span>
                </div>
              )}
              
              <div className="space-y-4">
                {tradesAdded.length === 0 ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center p-6 text-center">
                    <Hammer className="w-8 h-8 text-muted-foreground mb-2" aria-hidden="true" />
                    <p className="text-muted-foreground font-medium">No trades added yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-sm font-semibold text-foreground" id="tradesList">
                      Your Trades ({tradesAdded.length})
                    </div>
                    <div className="space-y-4" role="list" aria-labelledby="tradesList">
                      {tradesAdded.map((trade, idx) => (
                        <Card key={trade.id} className="shadow-none" role="listitem">
                          <CardHeader className="p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <CardTitle className="text-lg">{trade.name}</CardTitle>
                                <CardDescription>{trade.description}</CardDescription>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm"
                                        variant="outline"
                                        className="h-9 gap-1"
                                        onClick={() => handleAddElement(idx)}
                                        aria-label={`Add element to ${trade.name}`}
                                      >
                                        <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                                        <span>Add Element</span>
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add a new element to this trade</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 w-9 p-0"
                                        onClick={() => handleEditTrade(idx)}
                                        aria-label={`Edit ${trade.name}`}
                                      >
                                        <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit trade details</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <TooltipProvider delayDuration={300}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        size="sm"
                                        variant="ghost"
                                        className="h-9 w-9 p-0 hover:text-red-600"
                                        onClick={() => handleDeleteTrade(idx, trade.name)}
                                        aria-label={`Delete ${trade.name}`}
                                      >
                                        <X className="w-3.5 h-3.5" aria-hidden="true" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove this trade</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                          </CardHeader>
                          
                          {/* Elements section for each trade */}
                          {getCombinedElements(idx).length > 0 ? (
                            <CardContent className="pb-4 pt-0 px-4">
                              <div className="bg-accent/40 rounded-md p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-1.5">
                                    <Package className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                                    <span className="text-sm font-medium text-muted-foreground">Elements ({getCombinedElements(idx).length})</span>
                                  </div>
                                </div>
                                <div className="grid gap-2" role="list" aria-label={`Elements in ${trade.name}`}>
                                  {getCombinedElements(idx).map((element: Element, elIdx) => (
                                    <div 
                                      key={`${trade.id}-${element.id}`} 
                                      className="group flex flex-col p-3 rounded-md bg-card border border-gray-200 hover:border-gray-300 text-sm"
                                      role="listitem"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium">{element.name}</div>
                                        <div className="flex items-center">
                                          <TooltipProvider delayDuration={300}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  type="button"
                                                  className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-accent rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                                  onClick={() => handleEditModuleElement(trade.id, element.id, true, idx, elIdx)}
                                                  aria-label={`Edit element ${element.name}`}
                                                >
                                                  <Pencil className="w-3 h-3" aria-hidden="true" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Edit element</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                          
                                          <TooltipProvider delayDuration={300}>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <button
                                                  type="button"
                                                  className="h-7 w-7 flex items-center justify-center text-gray-500 hover:bg-accent hover:text-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                                                  onClick={() => handleDeleteElement(idx, elIdx)}
                                                  aria-label={`Remove element ${element.name}`}
                                                >
                                                  <X className="w-3 h-3" aria-hidden="true" />
                                                </button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Remove element</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      </div>
                                      
                                      {/* Formula display section */}
                                      <div className="mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex flex-wrap gap-2">
                                          {element.formula && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded text-xs">
                                              <Calculator className="h-3 w-3 text-black dark:text-white" aria-hidden="true" />
                                              <div className="flex flex-col">
                                                <span className="font-medium text-[10px] text-gray-500 dark:text-gray-400">Formula</span>
                                                <code className="font-mono text-black dark:text-white">{element.formula}</code>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {element.labor_formula && (
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm rounded text-xs">
                                              <Hammer className="h-3 w-3 text-black dark:text-white" aria-hidden="true" />
                                              <div className="flex flex-col">
                                                <span className="font-medium text-[10px] text-gray-500 dark:text-gray-400">Labor</span>
                                                <code className="font-mono text-black dark:text-white">{element.labor_formula}</code>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          ) : (
                            <CardContent className="pb-4 pt-0 px-4">
                              <div className="border border-dashed border-gray-200 rounded-md p-4 flex flex-col items-center text-center">
                                <Package className="h-8 w-8 text-muted-foreground mb-2" aria-hidden="true" />
                                <p className="text-sm text-muted-foreground">No elements in this trade yet</p>
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  className="mt-1"
                                  onClick={() => handleAddElement(idx)}
                                >
                                  <Plus className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                                  Add Element
                                </Button>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="px-6 font-medium order-2 sm:order-1 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Back
        </Button>
        <Button 
          onClick={handleNext} 
          size="lg" 
          className="px-8 font-medium order-1 sm:order-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      {/* Dialogs */}
      <EditModuleDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        module={editingModule}
        onSave={handleSaveTradeEdit}
      />

      <AddElementDialog
        isOpen={isAddElementDialogOpen}
        onClose={() => setIsAddElementDialogOpen(false)}
        module={addElementModule}
        onSave={handleSaveAddElement}
        parameterValue={paramAdded}
        openAddParamDialog={openAddParamDialog}
        handleAddParamDialog={handleAddParamDialog}
        handleAddParam={handleAddParam}
        onParameterChange={onParameterChange}
      />

      <EditElementDialog
        isOpen={isEditElementDialogOpen}
        onClose={() => setIsEditElementDialogOpen(false)}
        module={addElementModule}
        element={editingElement}
        onSave={handleSaveEditedElement}
        parameterValue={paramAdded}
        openAddParamDialog={openAddParamDialog}
        handleAddParamDialog={handleAddParamDialog}
        handleAddParam={handleAddParam}
        onParameterChange={onParameterChange}
      />

      {/* Add Parameter Dialog */}
      <Dialog open={showAddParamDialog} onOpenChange={setShowAddParamDialog}>
        <DialogContent className="max-w-sm w-full bg-card border-gray-200 shadow-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Variable className="h-5 w-5 text-gray-600" aria-hidden="true" />
              Add Variable
            </DialogTitle>
            <DialogDescription>
              Create a new variable for your project calculations
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="dialog-param-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="dialog-param-name"
                value={newParamName}
                onChange={e => setNewParamName(e.target.value)}
                placeholder="e.g., Wall Height, Floor Area"
                className="h-10"
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="dialog-param-type" className="text-sm font-medium">
                Type
              </label>
              <Select 
                value={newParamType} 
                onValueChange={setNewParamType}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Choose a type" />
                </SelectTrigger>
                <SelectContent>
                  {parameterTypes.map((type) => (
                    <SelectItem key={type} value={type} className="flex items-center gap-2">
                      <span className="flex items-center gap-2">
                        {getTypeIcon(type)} {type}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newParamType === "" && (
                <p className="text-xs text-muted-foreground">Please select a measurement type</p>
              )}
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setShowAddParamDialog(false)}
              className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              onClick={handleAddParamDialog}
              disabled={!newParamName.trim() || !newParamType}
              className="gap-2 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Add Variable
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
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
                  <li>Press Tab to autocomplete variable names</li>
                  <li>Variable search is case-insensitive</li>
                  <li>Add variables like Wall Length, Room Area first</li>
                  <li>Create trades like Framing, Plumbing to organize work</li>
                  <li>Add elements to each trade with formulas using your variables</li>
                </ul>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}