"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
  Badge,
} from "@/components/shared";
import { Element } from "./types";
import { Module } from "./types";
import { FormulaToken } from "./types";
import { useQuery } from "@tanstack/react-query";
import { getParameters } from "@/api/client/parameters";
import { X, Plus, Calculator, Hash, Variable, Parentheses as FunctionIcon } from "lucide-react";
import { Parameter } from "./types";

interface EditElementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  element: Element | null;
  onSave: (module: Module, updatedElement: Element) => void;
  parameterValue: Parameter[];
  openAddParamDialog: (name: string) => void;
  handleAddParamDialog: () => void;
  handleAddParam: (param: Parameter) => void;
  onParameterChange: (params: Parameter[]) => void;
}

export function EditElementDialog({
  isOpen,
  onClose,
  module,
  element,
  onSave,
  parameterValue,
  openAddParamDialog,
  handleAddParamDialog,
  handleAddParam,
  onParameterChange,
}: EditElementDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [markup, setMarkup] = useState("0");
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [markupError, setMarkupError] = useState("");

  // Formula states
  const [materialFormulaTokens, setMaterialFormulaTokens] = useState<FormulaToken[]>([]);
  const [laborFormulaTokens, setLaborFormulaTokens] = useState<FormulaToken[]>([]);
  const [materialFormulaInput, setMaterialFormulaInput] = useState("");
  const [laborFormulaInput, setLaborFormulaInput] = useState("");
  const [materialFormulaError, setMaterialFormulaError] = useState("");
  const [laborFormulaError, setLaborFormulaError] = useState("");
  
  // Added pending variable states for parameter creation
  const [pendingMaterialVariable, setPendingMaterialVariable] = useState<string>("");
  const [pendingLaborVariable, setPendingLaborVariable] = useState<string>("");
  
  // Autocomplete states
  const [showMaterialFormulaSuggestions, setShowMaterialFormulaSuggestions] = useState(false);
  const [showLaborFormulaSuggestions, setShowLaborFormulaSuggestions] = useState(false);
  const [activeMaterialSuggestion, setActiveMaterialSuggestion] = useState<string | null>(null);
  const [activeLaborSuggestion, setActiveLaborSuggestion] = useState<string | null>(null);
  
  // Refs for input fields
  const materialFormulaInputRef = useRef<HTMLInputElement>(null);
  const laborFormulaInputRef = useRef<HTMLInputElement>(null);

  // Fetch parameters for formula suggestions
  const { data: parameters = [] } = useQuery({
    queryKey: ["parameters"],
    queryFn: getParameters,
  });

  // Parse formula string to tokens
  const parseFormulaToTokens = (formula: string): FormulaToken[] => {
    if (!formula) return [];
    
    // Basic parsing - split by operators but keep operators
    const operators = ['+', '-', '*', '/', '(', ')', '^'];
    let tokens: FormulaToken[] = [];
    let currentToken = '';
    let id = 0;

    for (let i = 0; i < formula.length; i++) {
      const char = formula[i];
      
      if (operators.includes(char)) {
        // Add current token if exists
        if (currentToken) {
          // Check if it's a parameter name
          const isVariable = parameters.some(
            (p: any) => p.name.toLowerCase() === currentToken.toLowerCase()
          );
          tokens.push({
            id: id++,
            text: currentToken,
            type: isNaN(Number(currentToken)) 
              ? isVariable 
                ? 'variable' 
                : 'function'
              : 'number'
          });
          currentToken = '';
        }
        
        // Add operator token
        tokens.push({
          id: id++,
          text: char,
          type: 'operator'
        });
      } else {
        currentToken += char;
      }
    }
    
    // Add final token if exists
    if (currentToken) {
      const isVariable = parameters.some(
        (p: any) => p.name.toLowerCase() === currentToken.toLowerCase()
      );
      tokens.push({
        id: id++,
        text: currentToken,
        type: isNaN(Number(currentToken)) 
          ? isVariable 
            ? 'variable' 
            : 'function'
          : 'number'
      });
    }
    
    return tokens;
  };

  // Convert tokens back to formula string
  const tokensToFormulaString = (tokens: FormulaToken[]): string => {
    return tokens.map(token => token.text).join('');
  };

  // Initialize form when dialog opens with the element's data
  useEffect(() => {
    if (isOpen && element) {
      setName(element.name || "");
      setDescription(element.description || "");
      setMarkup(element.image ? element.image : "0");
      
      // Parse formula strings into tokens
      setMaterialFormulaTokens(parseFormulaToTokens(element.formula || ""));
      setLaborFormulaTokens(parseFormulaToTokens(element.labor_formula || ""));
      setMaterialFormulaInput("");
      setLaborFormulaInput("");
      
      // Clear any previous errors
      setNameError("");
      setDescriptionError("");
      setMaterialFormulaError("");
      setLaborFormulaError("");
      setMarkupError("");
    }
  }, [isOpen, element]);

  // Handle material formula input
  const handleMaterialFormulaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMaterialFormulaInput(value);
    
    // Show suggestions only if there's input
    setShowMaterialFormulaSuggestions(!!value.trim());
    
    // Update autocomplete suggestion - filter out already used variables
    const matchingParams = parameterValue.filter((p: any) => 
      p.name.toLowerCase().startsWith(value.toLowerCase()) &&
      !materialFormulaTokens.some(t => t.type === 'variable' && t.text.toLowerCase() === p.name.toLowerCase())
    );
    setActiveMaterialSuggestion(matchingParams.length > 0 ? matchingParams[0].name : null);
    
    if (materialFormulaError && value.trim()) {
      setMaterialFormulaError("");
    }
  };

  // Handle labor formula input
  const handleLaborFormulaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLaborFormulaInput(value);
    
    // Show suggestions only if there's input
    setShowLaborFormulaSuggestions(!!value.trim());
    
    // Update autocomplete suggestion - filter out already used variables
    const matchingParams = parameterValue.filter((p: any) => 
      p.name.toLowerCase().startsWith(value.toLowerCase()) &&
      !laborFormulaTokens.some(t => t.type === 'variable' && t.text.toLowerCase() === p.name.toLowerCase())
    );
    setActiveLaborSuggestion(matchingParams.length > 0 ? matchingParams[0].name : null);
    
    if (laborFormulaError && value.trim()) {
      setLaborFormulaError("");
    }
  };

  // Handle material formula input key events
  const handleMaterialFormulaInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace handling when input is empty - remove the last token
    if (e.key === "Backspace" && !materialFormulaInput && materialFormulaTokens.length > 0) {
      e.preventDefault();
      const lastToken = materialFormulaTokens[materialFormulaTokens.length - 1];
      removeMaterialFormulaToken(lastToken.id);
      // Set the input to the text of the removed token to continue editing
      setMaterialFormulaInput(lastToken.text);
      return;
    }

    // Auto-enter operators when typed
    if (["+", "-", "*", "/", "(", ")", "^"].includes(e.key)) {
      e.preventDefault();
      
      // If there's current input, add it first (if it's a number or valid variable)
      if (materialFormulaInput.trim()) {
        const value = materialFormulaInput.trim();
        if (!isNaN(Number(value))) {
          addMaterialFormulaToken(value, 'number');
        } else {
          const isKnownVariable = parameterValue.some(
            (p: any) => p.name.toLowerCase() === value.toLowerCase()
          );
          if (isKnownVariable) {
            addMaterialFormulaToken(value, 'variable');
          }
        }
      }
      
      // Then add the operator
      addMaterialFormulaToken(e.key, 'operator');
      return;
    }

    // Tab autocomplete
    if (e.key === "Tab" && activeMaterialSuggestion) {
      e.preventDefault();
      addMaterialFormulaToken(activeMaterialSuggestion, 'variable');
      return;
    }

    // Quick insert operations with keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Define shortcut keys with proper typing
      type ShortcutKey = '+' | '-' | '*' | '/' | '(' | ')' | '^';
      const shortcuts: Record<ShortcutKey, { text: string; type: 'operator' }> = {
        '+': { text: '+', type: 'operator' },
        '-': { text: '-', type: 'operator' },
        '*': { text: '*', type: 'operator' },
        '/': { text: '/', type: 'operator' },
        '(': { text: '(', type: 'operator' },
        ')': { text: ')', type: 'operator' },
        '^': { text: '^', type: 'operator' },
      };
      
      const key = e.key.toLowerCase() as ShortcutKey;
      // Check if the key exists as a property in the shortcuts object
      if (Object.prototype.hasOwnProperty.call(shortcuts, key)) {
        e.preventDefault();
        addMaterialFormulaToken(shortcuts[key].text, shortcuts[key].type);
        return;
      }
    }

    // Only Enter to create new variable (not Space)
    if (e.key === "Enter" && materialFormulaInput.trim()) {
      e.preventDefault();
      // If there's an active suggestion, use it
      if (activeMaterialSuggestion && 
          activeMaterialSuggestion.toLowerCase().startsWith(materialFormulaInput.toLowerCase())) {
        addMaterialFormulaToken(activeMaterialSuggestion, 'variable');
      } else {
        const value = materialFormulaInput.trim();
        if (["+", "-", "*", "/", "(", ")", "^"] .includes(value)) {
          addMaterialFormulaToken(value, 'operator');
        } else if (!isNaN(Number(value))) {
          addMaterialFormulaToken(value, 'number');
        } else {
          // If not in parameterValue, open add variable dialog
          const isKnownVariable = parameterValue.some(
            (p: any) => p.name.toLowerCase() === value.toLowerCase()
          );
          if (isKnownVariable) {
            addMaterialFormulaToken(value, 'variable');
          } else {
            setPendingMaterialVariable(value);
            openAddParamDialog(value);
          }
        }
      }
    } else if ((e.key === " ") && materialFormulaInput.trim()) {
      // Add operators with space or direct + key
      const value = materialFormulaInput.trim();
      if (["+", "-", "*", "/", "(", ")", "^"] .includes(value)) {
        e.preventDefault();
        addMaterialFormulaToken(value, 'operator');
      } else if (!isNaN(Number(value))) {
        e.preventDefault();
        addMaterialFormulaToken(value, 'number');
      }
    }
  };

  // Handle labor formula input key events with similar enhancements
  const handleLaborFormulaInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace handling when input is empty
    if (e.key === "Backspace" && !laborFormulaInput && laborFormulaTokens.length > 0) {
      e.preventDefault();
      const lastToken = laborFormulaTokens[laborFormulaTokens.length - 1];
      removeLaborFormulaToken(lastToken.id);
      // Set the input to the text of the removed token to continue editing
      setLaborFormulaInput(lastToken.text);
      return;
    }

    // Auto-enter operators when typed
    if (["+", "-", "*", "/", "(", ")", "^"].includes(e.key)) {
      e.preventDefault();
      
      // If there's current input, add it first (if it's a number or valid variable)
      if (laborFormulaInput.trim()) {
        const value = laborFormulaInput.trim();
        if (!isNaN(Number(value))) {
          addLaborFormulaToken(value, 'number');
        } else {
          const isKnownVariable = parameterValue.some(
            (p: any) => p.name.toLowerCase() === value.toLowerCase()
          );
          if (isKnownVariable) {
            addLaborFormulaToken(value, 'variable');
          }
        }
      }
      
      // Then add the operator
      addLaborFormulaToken(e.key, 'operator');
      return;
    }

    // Tab autocomplete
    if (e.key === "Tab" && activeLaborSuggestion) {
      e.preventDefault();
      addLaborFormulaToken(activeLaborSuggestion, 'variable');
      return;
    }

    // Quick insert operations with keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      // Define shortcut keys with proper typing
      type ShortcutKey = '+' | '-' | '*' | '/' | '(' | ')' | '^';
      const shortcuts: Record<ShortcutKey, { text: string; type: 'operator' }> = {
        '+': { text: '+', type: 'operator' },
        '-': { text: '-', type: 'operator' },
        '*': { text: '*', type: 'operator' },
        '/': { text: '/', type: 'operator' },
        '(': { text: '(', type: 'operator' },
        ')': { text: ')', type: 'operator' },
        '^': { text: '^', type: 'operator' },
      };
      
      const key = e.key.toLowerCase() as ShortcutKey;
      // Check if the key exists as a property in the shortcuts object
      if (Object.prototype.hasOwnProperty.call(shortcuts, key)) {
        e.preventDefault();
        addLaborFormulaToken(shortcuts[key].text, shortcuts[key].type);
        return;
      }
    }

    // Only Enter to create new variable (not Space)
    if (e.key === "Enter" && laborFormulaInput.trim()) {
      e.preventDefault();
      // If there's an active suggestion, use it
      if (activeLaborSuggestion && 
          activeLaborSuggestion.toLowerCase().startsWith(laborFormulaInput.toLowerCase())) {
        addLaborFormulaToken(activeLaborSuggestion, 'variable');
      } else {
        const value = laborFormulaInput.trim();
        // Detect type of token
        if (['+', '-', '*', '/', '(', ')', '^'].includes(value)) {
          addLaborFormulaToken(value, 'operator');
        } else if (!isNaN(Number(value))) {
          addLaborFormulaToken(value, 'number');
        } else {
          // Check if it's a known variable/parameter
          const isKnownVariable = parameterValue.some(
            (p: any) => p.name.toLowerCase() === value.toLowerCase()
          );
          if (isKnownVariable) {
            addLaborFormulaToken(value, 'variable');
          } else {
            setPendingLaborVariable(value);
            openAddParamDialog(value);
          }
        }
      }
    } else if ((e.key === " ") && laborFormulaInput.trim()) {
      // Add tokens with space
      const value = laborFormulaInput.trim();
      if (['+', '-', '*', '/', '(', ')', '^'].includes(value)) {
        e.preventDefault();
        addLaborFormulaToken(value, 'operator');
      } else if (!isNaN(Number(value))) {
        e.preventDefault();
        addLaborFormulaToken(value, 'number');
      }
    }
  };

  // Add material formula token
  const addMaterialFormulaToken = (text: string, type: 'variable' | 'operator' | 'number' | 'function') => {
    if (type === 'variable' && materialFormulaTokens.some(t => t.type === 'variable' && t.text === text)) {
      setMaterialFormulaInput("");
      setShowMaterialFormulaSuggestions(false);
      setActiveMaterialSuggestion(null);
      return;
    }
    const newToken: FormulaToken = {
      id: Date.now(),
      text,
      type
    };
    setMaterialFormulaTokens(prev => [...prev, newToken]);
    setMaterialFormulaInput("");
    setShowMaterialFormulaSuggestions(false);
    setActiveMaterialSuggestion(null);
  };

  // Add labor formula token
  const addLaborFormulaToken = (text: string, type: 'variable' | 'operator' | 'number' | 'function') => {
    if (type === 'variable' && laborFormulaTokens.some(t => t.type === 'variable' && t.text === text)) {
      setLaborFormulaInput("");
      setShowLaborFormulaSuggestions(false);
      setActiveLaborSuggestion(null);
      return;
    }
    const newToken: FormulaToken = {
      id: Date.now(),
      text,
      type
    };
    setLaborFormulaTokens(prev => [...prev, newToken]);
    setLaborFormulaInput("");
    setShowLaborFormulaSuggestions(false);
    setActiveLaborSuggestion(null);
  };

  // Add a function to check if a variable is still used in any formula
  const isVariableUsedInFormulas = (varName: string) => {
    const materialUses = materialFormulaTokens.some(
      t => t.type === 'variable' && t.text === varName
    );
    const laborUses = laborFormulaTokens.some(
      t => t.type === 'variable' && t.text === varName
    );
    return materialUses || laborUses;
  };

  // Modify removeMaterialFormulaToken to check if we should remove the variable
  const removeMaterialFormulaToken = (id: number) => {
    const token = materialFormulaTokens.find(t => t.id === id);
    setMaterialFormulaTokens(prev => prev.filter(token => token.id !== id));
    
    // If this was a variable token, check if it's still used in any formula
    if (token && token.type === 'variable') {
      const varName = token.text;
      // Only if it's not used in any other formula, consider removing from parameterValue
      if (!isVariableUsedInFormulas(varName)) {
        // Find the parameter in parameterValue
        const param = parameterValue.find(p => p.name === varName);
        if (param) {
          // Ask for confirmation before removing
          if (confirm(`Remove "${varName}" from variables list? It's no longer used in any formula.`)) {
            // Find and remove the variable from Your Variables
            const updatedParams = parameterValue.filter(p => p.name !== varName);
            // Call onParameterChange with the updated list
            onParameterChange(updatedParams);
          }
        }
      }
    }
  };

  // Modify removeLaborFormulaToken with similar logic
  const removeLaborFormulaToken = (id: number) => {
    const token = laborFormulaTokens.find(t => t.id === id);
    setLaborFormulaTokens(prev => prev.filter(token => token.id !== id));
    
    // If this was a variable token, check if it's still used in any formula
    if (token && token.type === 'variable') {
      const varName = token.text;
      // Only if it's not used in any other formula, consider removing from parameterValue
      if (!isVariableUsedInFormulas(varName)) {
        // Find the parameter in parameterValue
        const param = parameterValue.find(p => p.name === varName);
        if (param) {
          // Ask for confirmation before removing
          if (confirm(`Remove "${varName}" from variables list? It's no longer used in any formula.`)) {
            // Find and remove the variable from Your Variables
            const updatedParams = parameterValue.filter(p => p.name !== varName);
            // Call onParameterChange with the updated list
            onParameterChange(updatedParams);
          }
        }
      }
    }
  };

  // Get token badge styles based on type
  const getTokenBadgeStyle = (type: string) => {
    switch(type) {
      case 'variable':
        return "bg-primary/20 text-primary border-primary/30";
      case 'operator':
        return "bg-amber-500/20 text-amber-700 border-amber-500/30";
      case 'number':
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case 'function':
        return "bg-purple-500/20 text-purple-700 border-purple-500/30";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  // Get token icon based on type
  const getTokenIcon = (type: string) => {
    switch(type) {
      case 'variable':
        return <Variable className="w-3 h-3 mr-1" />;
      case 'operator':
        return <Calculator className="w-3 h-3 mr-1" />;
      case 'number':
        return <Hash className="w-3 h-3 mr-1" />;
      case 'function':
        return <FunctionIcon className="w-3 h-3 mr-1" />;
      default:
        return null;
    }
  };

  // Filter material formula suggestions
  const materialFormulaSuggestions = materialFormulaInput
    ? parameterValue.filter(
        (p: any) =>
          p.name.toLowerCase().includes(materialFormulaInput.toLowerCase()) &&
          !materialFormulaTokens.some(t => t.type === 'variable' && t.text.toLowerCase() === p.name.toLowerCase()) &&
          p.name.toLowerCase() !== materialFormulaInput.toLowerCase()
      )
    : [];

  // Filter labor formula suggestions
  const laborFormulaSuggestions = laborFormulaInput
    ? parameterValue.filter(
        (p: any) =>
          p.name.toLowerCase().includes(laborFormulaInput.toLowerCase()) &&
          !laborFormulaTokens.some(t => t.type === 'variable' && t.text.toLowerCase() === p.name.toLowerCase()) &&
          p.name.toLowerCase() !== laborFormulaInput.toLowerCase()
      )
    : [];

  const handleSave = () => {
    let hasError = false;

    if (!name.trim()) {
      setNameError("Element name is required");
      hasError = true;
    }

    if (!description.trim()) {
      setDescriptionError("Description is required");
      hasError = true;
    }

    if (materialFormulaTokens.length === 0) {
      setMaterialFormulaError("Formula is required");
      hasError = true;
    }

    if (laborFormulaTokens.length === 0) {
      setLaborFormulaError("Labor formula is required");
      hasError = true;
    }

    if (!markup.trim() || parseInt(markup) < 0) {
      setMarkupError("Valid markup percentage is required");
      hasError = true;
    }

    if (hasError) {
      return;
    }

    if (module && element) {
      const updatedElement: Element = {
        ...element,
        name: name.trim(),
        description: description.trim(),
        formula: tokensToFormulaString(materialFormulaTokens),
        labor_formula: tokensToFormulaString(laborFormulaTokens),
        image: markup
      };
      onSave(module, updatedElement);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Element</DialogTitle>
          <DialogDescription>
            Make changes to your element here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Name */}
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-left">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!nameError}
            />
            {nameError && (
              <span className="text-xs text-destructive">{nameError}</span>
            )}
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-left">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!descriptionError}
            />
            {descriptionError && (
              <span className="text-xs text-destructive">{descriptionError}</span>
            )}
          </div>

          {/* Material Formula */}
          <div className="grid gap-2">
            <Label htmlFor="materialFormula" className="text-left">
              Material Formula
            </Label>
            <div className="border rounded-md p-2 flex flex-wrap gap-2 min-h-[60px] bg-background relative">
              {materialFormulaTokens.map((token) => (
                <Badge 
                  key={token.id} 
                  variant="outline" 
                  className={`gap-1 px-2 py-1 text-sm ${getTokenBadgeStyle(token.type)}`}
                >
                  {getTokenIcon(token.type)}
                  {token.text}
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full hover:bg-gray-200 flex items-center justify-center ml-1 focus:outline-none"
                    onClick={() => removeMaterialFormulaToken(token.id)}
                    aria-label={`Remove ${token.text}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[100px]">
                <Input
                  id="materialFormulaInput"
                  ref={materialFormulaInputRef}
                  value={materialFormulaInput}
                  onChange={handleMaterialFormulaInputChange}
                  onKeyDown={handleMaterialFormulaInputKeyDown}
                  onFocus={() => setShowMaterialFormulaSuggestions(!!materialFormulaInput.trim())}
                  onBlur={() => setTimeout(() => setShowMaterialFormulaSuggestions(false), 150)}
                  placeholder={materialFormulaTokens.length ? "Add more..." : "Type formula parts..."}
                  className="border-0 shadow-none focus:outline-none focus:ring-0 p-0 h-8 text-sm flex-1 min-w-[40px]"
                  aria-invalid={!!materialFormulaError}
                />

                {/* Inline autocomplete hint */}
                {activeMaterialSuggestion && materialFormulaInput && (
                  <div className="absolute left-0 top-0 w-full pointer-events-none">
                    <div className="flex items-center h-8">
                      <div className="flex-1">
                        <span className="text-transparent">{materialFormulaInput}</span>
                        <span className="text-gray-400">{activeMaterialSuggestion.substring(materialFormulaInput.length)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Suggestions dropdown directly under input */}
                {showMaterialFormulaSuggestions && materialFormulaInput && materialFormulaSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto w-full z-20">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs font-medium text-muted-foreground">Available Variables</p>
                    </div>
                    {materialFormulaSuggestions.map((param: any) => (
                      <div
                        key={param.id}
                        className="flex items-center p-3 hover:bg-accent cursor-pointer"
                        onClick={() => addMaterialFormulaToken(param.name, 'variable')}
                        role="button"
                        tabIndex={0}
                        aria-label={`Add ${param.name} variable`}
                      >
                        <Variable className="w-4 h-4 mr-2 text-primary" />
                        <div className="font-medium">{param.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showMaterialFormulaSuggestions && materialFormulaInput && materialFormulaSuggestions.length === 0 && (
                  <div className="absolute left-0 top-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg w-full z-20">
                    <div className="flex items-center p-3 text-sm">
                      <Variable className="w-4 h-4 mr-2 text-primary" />
                      <div>
                        <span className="font-medium text-muted-foreground">No match found.</span>{" "}
                        <span className="text-primary">Press Enter to create "{materialFormulaInput}" variable</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick operations buttons for Material Formula */}
            <div className="flex flex-wrap gap-2 mt-1">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('+', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                +
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('-', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                -
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('*', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ×
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('/', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ÷
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('(', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                (
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken(')', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                )
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addMaterialFormulaToken('^', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ^
              </Button>
            </div>
            
            {materialFormulaError && (
              <span className="text-xs text-destructive">{materialFormulaError}</span>
            )}
            <p className="text-xs text-muted-foreground">
              Add variables, operators (+, -, *, /), and numbers to build your formula. Press Backspace to edit tokens.
            </p>
          </div>
          
          {/* Labor Formula */}
          <div className="grid gap-2">
            <Label htmlFor="laborFormula" className="text-left">
              Labor Formula
            </Label>
            <div className="border rounded-md p-2 flex flex-wrap gap-2 min-h-[60px] bg-background relative">
              {laborFormulaTokens.map((token) => (
                <Badge 
                  key={token.id} 
                  variant="outline" 
                  className={`gap-1 px-2 py-1 text-sm ${getTokenBadgeStyle(token.type)}`}
                >
                  {getTokenIcon(token.type)}
                  {token.text}
                  <button
                    type="button"
                    className="h-4 w-4 rounded-full hover:bg-gray-200 flex items-center justify-center ml-1 focus:outline-none"
                    onClick={() => removeLaborFormulaToken(token.id)}
                    aria-label={`Remove ${token.text}`}
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </Badge>
              ))}
              <div className="relative flex-1 min-w-[100px]">
                <Input
                  id="laborFormulaInput"
                  ref={laborFormulaInputRef}
                  value={laborFormulaInput}
                  onChange={handleLaborFormulaInputChange}
                  onKeyDown={handleLaborFormulaInputKeyDown}
                  onFocus={() => setShowLaborFormulaSuggestions(!!laborFormulaInput.trim())}
                  onBlur={() => setTimeout(() => setShowLaborFormulaSuggestions(false), 150)}
                  placeholder={laborFormulaTokens.length ? "Add more..." : "Type formula parts..."}
                  className="border-0 shadow-none focus:outline-none focus:ring-0 p-0 h-8 text-sm flex-1 min-w-[40px]"
                  aria-invalid={!!laborFormulaError}
                />

                {/* Inline autocomplete hint */}
                {activeLaborSuggestion && laborFormulaInput && (
                  <div className="absolute left-0 top-0 w-full pointer-events-none">
                    <div className="flex items-center h-8">
                      <div className="flex-1">
                        <span className="text-transparent">{laborFormulaInput}</span>
                        <span className="text-gray-400">{activeLaborSuggestion.substring(laborFormulaInput.length)}</span>
                      </div>
                    </div>
                  </div>
                )}
                {/* Suggestions dropdown directly under input */}
                {showLaborFormulaSuggestions && laborFormulaInput && laborFormulaSuggestions.length > 0 && (
                  <div className="absolute left-0 top-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto w-full z-20">
                    <div className="px-3 py-2 border-b border-gray-200">
                      <p className="text-xs font-medium text-muted-foreground">Available Variables</p>
                    </div>
                    {laborFormulaSuggestions.map((param: any) => (
                      <div
                        key={param.id}
                        className="flex items-center p-3 hover:bg-accent cursor-pointer"
                        onClick={() => addLaborFormulaToken(param.name, 'variable')}
                        role="button"
                        tabIndex={0}
                        aria-label={`Add ${param.name} variable`}
                      >
                        <Variable className="w-4 h-4 mr-2 text-primary" />
                        <div className="font-medium">{param.name}</div>
                      </div>
                    ))}
                  </div>
                )}
                {showLaborFormulaSuggestions && laborFormulaInput && laborFormulaSuggestions.length === 0 && (
                  <div className="absolute left-0 top-full mt-1 bg-card border border-gray-300 rounded-md shadow-lg w-full z-20">
                    <div className="flex items-center p-3 text-sm">
                      <Variable className="w-4 h-4 mr-2 text-primary" />
                      <div>
                        <span className="font-medium text-muted-foreground">No match found.</span>{" "}
                        <span className="text-primary">Press Enter to create "{laborFormulaInput}" variable</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Quick operations buttons for Labor Formula */}
            <div className="flex flex-wrap gap-2 mt-1">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('+', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                +
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('-', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                -
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('*', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ×
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('/', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ÷
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('(', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                (
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken(')', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                )
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => addLaborFormulaToken('^', 'operator')}
                className="h-8 px-3 text-amber-600"
              >
                ^
              </Button>
            </div>
            
            {laborFormulaError && (
              <span className="text-xs text-destructive">{laborFormulaError}</span>
            )}
            <p className="text-xs text-muted-foreground">
              Add variables, operators (+, -, *, /), and numbers to build your labor formula. Press Backspace to edit tokens.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
