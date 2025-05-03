import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
} from "@/components/shared";
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { Template } from "./types";

interface TemplateSelectionTabProps {
  templates: Template[];
  selectedTemplate: Template | null;
  handleTemplateSelect: (template: Template) => void;
  onBack: () => void;
  onNext: () => void;
}

export function TemplateSelectionTab({
  templates,
  selectedTemplate,
  handleTemplateSelect,
  onBack,
  onNext,
}: TemplateSelectionTabProps) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(search.toLowerCase()) ||
    template.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleNext = () => {
    if (!selectedTemplate) {
      setError("Please select a template to continue");
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Select a Template</h2>
        <p className="text-sm text-muted-foreground">
          Choose a template to use as a starting point for your proposal
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center border border-dashed rounded-lg p-8 text-center">
            <div className="text-muted-foreground">No templates found</div>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`overflow-hidden cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? "ring-2 ring-primary"
                  : "hover:border-gray-400"
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <div className="aspect-video w-full h-40 bg-muted-foreground/10 relative">
                {template.image ? (
                  <img
                    src={template.image}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
                {selectedTemplate?.id === template.id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  </div>
                )}
              </div>
              
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{template.name}</CardTitle>
              </CardHeader>
              
              <CardContent className="pb-2">
                <CardDescription className="line-clamp-2">
                  {template.description}
                </CardDescription>
              </CardContent>
              
              <CardFooter className="pt-0 flex justify-between">
                <div className="flex flex-wrap gap-1">
                  {template.modules && (
                    <Badge variant="secondary" className="text-xs">
                      {template.modules.length} Modules
                    </Badge>
                  )}
                  {template.parameters && (
                    <Badge variant="secondary" className="text-xs">
                      {template.parameters.length} Parameters
                    </Badge>
                  )}
                  {template.template_elements && (
                    <Badge variant="secondary" className="text-xs">
                      {template.template_elements.length} Elements
                    </Badge>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          size="lg"
          className="px-6 font-medium order-2 sm:order-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button 
          onClick={handleNext}
          size="lg" 
          className="px-8 font-medium order-1 sm:order-2"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
