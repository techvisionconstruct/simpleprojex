"use client";

import React, { useState } from "react";
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
} from "@/components/shared";
import { Module } from "./types";
import { Hammer } from "lucide-react";

interface EditModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  onSave: (updatedModule: Module) => void;
}

export function EditModuleDialog({
  isOpen,
  onClose,
  module,
  onSave,
}: EditModuleDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState("");

  React.useEffect(() => {
    if (module) {
      setName(module.name);
      setDescription(module.description);
      setNameError("");
    }
  }, [module, isOpen]);

  const handleSave = () => {
    if (!name.trim()) {
      setNameError("Trade name is required");
      return;
    }

    if (module) {
      onSave({
        ...module,
        name: name.trim(),
        description: description.trim(),
        updated_at: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-full bg-white text-black border border-gray-300 rounded-lg p-0 overflow-hidden">
        <DialogHeader className="bg-gray-50 p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Hammer className="h-5 w-5 text-gray-600" />
            <DialogTitle className="text-xl font-semibold">Edit Trade</DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 mt-1">
            Update the trade name and description for your project.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={e => { e.preventDefault(); handleSave(); }}
          className="p-6 space-y-5"
          autoComplete="off"
        >
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium block text-gray-800">Trade Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => { setName(e.target.value); if (e.target.value.trim()) setNameError(""); }}
              placeholder="e.g., Framing, Electrical, Plumbing"
              className={`h-12 text-base bg-white border border-gray-300 text-black focus:ring-2 focus:ring-black focus:border-black ${nameError ? "border-red-500" : ""}`}
              aria-invalid={!!nameError}
              aria-describedby="name-error"
            />
            {nameError && (
              <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                <span id="name-error">{nameError}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium block text-gray-800">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this trade includes and its purpose in your project"
              className="min-h-[100px] text-base bg-white border border-gray-300 text-black focus:ring-2 focus:ring-black focus:border-black resize-none"
              rows={3}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4 border-t border-gray-200 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="h-12 px-6 text-base border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="h-12 px-6 text-base bg-black text-white hover:bg-gray-900"
              disabled={!name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
