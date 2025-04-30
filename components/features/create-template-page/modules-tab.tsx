import React from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { getModules } from "@/api/client/modules";
import { getElements } from "@/api/client/elements";
import { Module } from "./types";
import { Element } from "./types";
import { Parameter } from "./types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from "@/components/shared";
import {
  X,
  Pencil,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  FileText,
  Package,
  PlusCircle,
} from "lucide-react";
import { z } from "zod";
import { EditModuleDialog } from "./edit-module-dialog";
import { AddElementDialog } from "./add-element-dialog";
import { EditElementDialog } from "./edit-element-dialog";
import { ModuleForm } from "./zod-schema";

const modulesSchema = z
  .array(
    z.object({
      id: z.number(),
      name: z.string().min(1),
      description: z.string(),
      created_at: z.string(),
      updated_at: z.string(),
    })
  )
  .min(1, { message: "At least one module is required" });

export function ModulesTab({
  value,
  onChange,
  onPrev,
  onNext,
  parameterValue,
  openAddParamDialog,
  handleAddParamDialog,
  handleAddParam,
  onParameterChange,
}: {
  value: Module[];
  onChange: (modules: ModuleForm) => void;
  onPrev: () => void;
  onNext: () => void;
  parameterValue: Parameter[];
  openAddParamDialog: (name: string) => void;
  handleAddParamDialog: () => void;
  handleAddParam: (param: Parameter) => void;
  onParameterChange: (params: Parameter[]) => void;
}) {
  const [input, setInput] = React.useState("");
  const [added, setAdded] = React.useState<Module[]>(value);
  const [highlighted, setHighlighted] = React.useState<number>(-1);
  const [error, setError] = React.useState<string | null>(null);
  const [editingModule, setEditingModule] = React.useState<Module | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
  const [addElementModule, setAddElementModule] = React.useState<Module | null>(
    null
  );
  const [isAddElementDialogOpen, setIsAddElementDialogOpen] =
    React.useState(false);
  const [editingElement, setEditingElement] = React.useState<Element | null>(
    null
  );
  const [isEditElementDialogOpen, setIsEditElementDialogOpen] =
    React.useState(false);

  React.useEffect(() => {
    setAdded(value);
  }, [value]);

  const { data: modules = [] } = useQuery({
    queryKey: ["modules"],
    queryFn: getModules,
  });

  const elementsQueries = useQueries({
    queries: added.map((mod) => ({
      queryKey: ["elements", mod.name],
      queryFn: () => getElements(mod.name),
      enabled: !!mod.name,
    })),
  });

  const suggestions = input
    ? modules.filter(
        (m: Module) =>
          m.name.toLowerCase().includes(input.toLowerCase()) &&
          !added.some((a) => a.id === m.id)
      )
    : [];

  function handleAdd(mod: Module) {
    const updated = [...added, mod];
    setAdded(updated);
    setInput("");
    setHighlighted(-1);
    setError(null);
  }

  function handleDeleteModule(idx: number) {
    const updated = added.filter((_, i) => i !== idx);
    setAdded(updated);
    
    // Create updated modules array with all current elements to pass to parent
    const modulesWithElements = updated.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Update parent component with the latest data
    onChange(modulesWithElements);
  }

  function handleDeleteElement(moduleIdx: number, elIdx: number) {
    const combinedElements = getCombinedElements(moduleIdx);
    const elementToDelete = combinedElements[elIdx];
    const apiElements = elementsQueries[moduleIdx]?.data || [];
    const apiElementIndex = apiElements.findIndex(
      (el: Element) => el.id === elementToDelete.id
    );

    if (apiElementIndex >= 0) {
      elementsQueries[moduleIdx].data.splice(apiElementIndex, 1);
    } else {
      const moduleElements = (added[moduleIdx] as any).elements || [];
      const updatedModuleElements = moduleElements.filter(
        (el: Element) => el.id !== elementToDelete.id
      );

      const updatedModule = {
        ...added[moduleIdx],
        elements: updatedModuleElements,
      };

      const updatedModules = [...added];
      updatedModules[moduleIdx] = updatedModule;
      setAdded(updatedModules);
    }

    // Update the local state
    setAdded((prev) => [...prev]);
    
    // Create updated modules array with all current elements to pass to parent
    const modulesWithElements = added.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Update parent component with the latest data
    onChange(modulesWithElements);
  }

  function handleEditModule(idx: number) {
    const mod = added[idx];
    setEditingModule(mod);
    setIsEditDialogOpen(true);
  }

  function handleSaveModuleEdit(updatedModule: Module) {
    const updated = added.map((m) =>
      m.id === updatedModule.id ? updatedModule : m
    );
    setAdded(updated);
    setEditingModule(null);
    
    // Create updated modules array with all current elements to pass to parent
    const modulesWithElements = updated.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Update parent component with the latest data
    onChange(modulesWithElements);
  }

  function handleAddElement(idx: number) {
    const mod = added[idx];
    setAddElementModule(mod);
    setIsAddElementDialogOpen(true);
  }

  const getCombinedElements = (moduleIndex: number) => {
    const apiElements = elementsQueries[moduleIndex]?.data || [];
    const moduleElements = (added[moduleIndex] as any).elements || [];
    const apiElementsMap = new Map(
      apiElements.map((el: Element) => [el.id, el])
    );
    const uniqueModuleElements = moduleElements.filter(
      (el: Element) => !apiElementsMap.has(el.id)
    );
    return [...apiElements, ...uniqueModuleElements];
  };

  function handleSaveAddElement(module: Module, newElement: Element) {
    const moduleIdx = added.findIndex((m) => m.id === module.id);
    if (moduleIdx >= 0) {
      // Ensure the data array exists
      if (!elementsQueries[moduleIdx].data) {
        elementsQueries[moduleIdx].data = [];
      }
      
      // Add the new element to the array
      elementsQueries[moduleIdx].data.push(newElement);
      
      // Create updated modules array with all current elements to pass to parent
      const modulesWithElements = added.map((mod, index) => {
        const combinedElements = getCombinedElements(index);
        return {
          ...mod,
          elements: combinedElements,
        };
      });
      
      // Update local state and parent component
      setAdded([...added]);
      onChange(modulesWithElements);
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
      const module = added[moduleIdx];
      const element = elementsQueries[moduleIdx]?.data?.[elIdx];

      if (module && element) {
        setAddElementModule(module);
        setEditingElement(element);
        setIsEditElementDialogOpen(true);
      }
    } else {
      const module = added.find((m) => m.id === moduleId);

      if (module) {
        setAddElementModule(module);

        setIsEditElementDialogOpen(true);
      }
    }
  }

  function handleDeleteModuleElement(moduleId: number, elementId: number) {}

  function handleSaveEditedElement(module: Module, updatedElement: Element) {
    const moduleIdx = added.findIndex((m) => m.id === module.id);
    if (moduleIdx < 0) return;

    const apiElements = elementsQueries[moduleIdx]?.data || [];
    const apiElementIdx = apiElements.findIndex(
      (el: Element) => el.id === updatedElement.id
    );

    if (apiElementIdx >= 0) {
      elementsQueries[moduleIdx].data[apiElementIdx] = updatedElement;
    } else {
      const moduleElements = (added[moduleIdx] as any).elements || [];
      const moduleElementIdx = moduleElements.findIndex(
        (el: Element) => el.id === updatedElement.id
      );

      if (moduleElementIdx >= 0) {
        moduleElements[moduleElementIdx] = updatedElement;
        const updatedModule = {
          ...added[moduleIdx],
          elements: moduleElements,
        };
        const updatedModules = [...added];
        updatedModules[moduleIdx] = updatedModule;
        setAdded(updatedModules);
      }
    }

    // Create updated modules array with all current elements to pass to parent
    const modulesWithElements = added.map((mod, index) => {
      const combinedElements = getCombinedElements(index);
      return {
        ...mod,
        elements: combinedElements,
      };
    });
    
    // Update local state and parent component
    setAdded((prev) => [...prev]);
    onChange(modulesWithElements);
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      setHighlighted((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      setHighlighted((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      e.preventDefault();
    } else if (e.key === "Enter") {
      if (suggestions.length > 0 && highlighted >= 0) {
        handleAdd(suggestions[highlighted]);
      } else if (suggestions.length > 0) {
        handleAdd(suggestions[0]);
      }      else if (input.trim()) {
        const newMod: Module = {
          id: Date.now(),
          name: input.trim(),
          description: "Newly created module",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        handleAdd(newMod);
        const modulesWithElements = [...added, newMod].map((mod, index, arr) => {
          if (index === arr.length - 1 && mod.id === newMod.id) {
            return {
              ...mod,
              elements: [],
            };
          }
          const combinedElements = getCombinedElements(index);
          return {
            ...mod,
            elements: combinedElements,
          };
        });
        onChange(modulesWithElements);
      }
      e.preventDefault();
    }
  }

  function handleNext() {
    if (added.length > 0) {
      setError(null);
      const modulesWithElements = added.map((mod, index) => {
        const combinedElements = getCombinedElements(index);
        return {
          ...mod,
          elements: combinedElements,
        };
      });
      onChange(modulesWithElements);
      onNext();
    } else {
      setError("At least one module is required");
    }
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Modules</h2>
        <p className="text-sm text-muted-foreground">
          Add modules that contain elements for your template. Modules organize
          related components together.
        </p>
      </div>

      <div className="space-y-6">
        <form autoComplete="off" className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search for modules or create a custom one..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                className="pr-10"
              />
              {input && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    const newMod: Module = {
                      id: Date.now(),
                      name: input.trim(),
                      description: "Newly created module",
                      created_at: new Date().toISOString(),
                      updated_at: new Date().toISOString(),
                    };
                    handleAdd(newMod);
                    // Immediately reflect this change to parent component
                    const modulesWithElements = [...added, newMod].map((mod, index, arr) => {
                      // For the newly added module, we need special handling
                      if (index === arr.length - 1 && mod.id === newMod.id) {
                        return {
                          ...mod,
                          elements: [],
                        };
                      }
                      // For existing modules, use the normal logic
                      const combinedElements = getCombinedElements(index);
                      return {
                        ...mod,
                        elements: combinedElements,
                      };
                    });
                    onChange(modulesWithElements);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  <span className="sr-only">Add module</span>
                </Button>
              )}
            </div>
          </div>

          {input && suggestions.length > 0 && (
            <div className="absolute z-10 bg-card border rounded-md shadow-md w-full mt-1 max-h-48 overflow-auto">
              {suggestions.map((mod: Module, idx: number) => (
                <div
                  key={mod.id}
                  className={`px-4 py-2 cursor-pointer hover:bg-muted transition-colors ${
                    highlighted === idx ? "bg-muted" : ""
                  }`}
                  onClick={() => handleAdd(mod)}
                  onMouseEnter={() => setHighlighted(idx)}
                >
                  <div className="font-medium">{mod.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {mod.description}
                  </div>
                </div>
              ))}
            </div>
          )}
          {input && suggestions.length === 0 && (
            <div className="absolute z-10 bg-card border rounded-md shadow-md w-full mt-1 overflow-hidden">
              <div className="px-4 py-3 text-sm">
                No modules found. Press{" "}
                <kbd className="px-2 py-0.5 rounded-md bg-muted text-xs">
                  Enter
                </kbd>{" "}
                or click <Plus className="inline-block h-3 w-3" /> to add "
                {input}" as a custom module.
              </div>
            </div>
          )}
        </form>

        {error && (
          <div className="text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-md">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <div className="space-y-4">
          {added.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No modules added yet</p>
              <p className="text-sm">Search or type a module name to add it</p>
            </div>
          ) : (
            added.map((mod, i) => (
              <Card
                key={mod.id}
                id={`module-card-${mod.id}`}
                className="overflow-hidden"
              >
                <CardHeader className="px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {mod.name}
                    </CardTitle>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => handleEditModule(i)}
                        aria-label="Edit module"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteModule(i)}
                        aria-label="Delete module"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {mod.description}
                  </p>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="font-medium text-sm">Elements</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs flex items-center gap-1"
                        onClick={() => handleAddElement(i)}
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                        Add Element
                      </Button>
                    </div>

                    {elementsQueries[i]?.isLoading && (
                      <div className="text-xs py-2">Loading elements...</div>
                    )}

                    {!elementsQueries[i]?.isLoading &&
                      getCombinedElements(i).length === 0 && (
                        <div className="text-xs text-muted-foreground py-2 italic">
                          No elements found for this module.
                        </div>
                      )}

                    {!elementsQueries[i]?.isLoading &&
                      getCombinedElements(i).length > 0 && (
                        <div className="space-y-3">
                          {getCombinedElements(i).map(
                            (el: Element, elIdx: number) => {
                              return (
                                <div
                                  key={el.id}
                                  className="bg-muted/50 p-3 rounded-md relative"
                                >
                                  <div className="flex justify-between items-start">
                                    <div className="font-medium text-sm">
                                      {el.name}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                                        onClick={() =>
                                          handleEditModuleElement(
                                            mod.id,
                                            el.id,
                                            true,
                                            i,
                                            elIdx
                                          )
                                        }
                                        aria-label="Edit element"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() =>
                                          handleDeleteElement(i, elIdx)
                                        }
                                        aria-label="Delete element"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="mt-2 text-xs space-y-1">
                                    <div className="text-muted-foreground">
                                      <span className="font-medium text-foreground">
                                        Description:
                                      </span>{" "}
                                      {el.description || "N/A"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      <span className="font-medium text-foreground">
                                        Formula:
                                      </span>{" "}
                                      {el.formula || "N/A"}
                                    </div>
                                    <div className="text-muted-foreground">
                                      <span className="font-medium text-foreground">
                                        Labor Formula:
                                      </span>{" "}
                                      {el.labor_formula || "N/A"}
                                    </div>
                                  </div>
                                  {el.image && (
                                    <div className="mt-2">
                                      <img
                                        src={el.image}
                                        alt={el.name}
                                        className="w-16 h-16 object-cover rounded-md border"
                                      />
                                    </div>
                                  )}
                                </div>
                              );
                            }
                          )}
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          size="lg"
          className="px-6 font-medium"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleNext} size="lg" className="px-8 font-medium">
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Edit Module Dialog */}
      <EditModuleDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        module={editingModule}
        onSave={handleSaveModuleEdit}
      />

      {/* Add Element Dialog */}
      <AddElementDialog
        isOpen={isAddElementDialogOpen}
        onClose={() => setIsAddElementDialogOpen(false)}
        module={addElementModule}
        onSave={handleSaveAddElement}
        parameterValue={parameterValue}
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
        parameterValue={parameterValue}
        openAddParamDialog={openAddParamDialog}
        handleAddParamDialog={handleAddParamDialog}
        handleAddParam={handleAddParam}
        onParameterChange={onParameterChange}
      />
    </div>
  );
}
