"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, Card, CardContent, Button } from "@/components/shared";
import { TemplateDetailsTab } from "@/components/features/create-template-page/template-details-tab";
import { TradesTab } from "@/components/features/create-template-page/trades-tab";
import { PreviewTab } from "@/components/features/create-template-page/preview-tab";
import {
  ModuleForm,
  ParameterForm,
  TemplateDetailsForm,
} from "@/components/features/create-template-page/zod-schema";
import { Check, CircleDot, HelpCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { postTemplate } from "@/api/server/templates";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CreateTemplateTour } from "@/components/features/tour-guide/create-template-tour";

export default function CreateTemplate() {
  const router = useRouter();
  const [tab, setTab] = useState("details");
  const [templateDetails, setTemplateDetails] =
    useState<TemplateDetailsForm>({
      name: "",
      description: "",
      image: undefined,
    });
  const [parameters, setParameters] = useState<ParameterForm>([]);
  const [modules, setModules] = useState<ModuleForm>([]);
  const [isTourRunning, setIsTourRunning] = useState(false);
  const tabSteps = ["details", "trades", "preview"];
  const currentStepIndex = tabSteps.indexOf(tab);
  
  // Check if the user has seen the tour
  useEffect(() => {
    const hasSeenTour = localStorage.getItem("hasSeenCreateTemplateTour") === "true";
    if (!hasSeenTour) {
      setIsTourRunning(true);
    }
  }, []);

  const startTour = () => {
    setIsTourRunning(true);
  };

  const { mutate: submitTemplate, isPending } = useMutation({
    mutationFn: postTemplate,
    onSuccess: (data) => {
      toast.success("Template created successfully", {
        position: "top-center",
        duration: 3000,
      });
      router.push(`/templates/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create template: ${error.message}`, {
        position: "top-center",
        duration: 5000,
      });
    }
  });

  const handleTabChange = (value: string) => {
    setTab(value);
  };

  return (
    <div className="w-full px-4 relative">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Template</h1>
          <p className="text-muted-foreground mt-1">
            Create a new template to standardize your project requirements
          </p>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6">
            <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
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
                    className={`flex flex-col items-center relative tab-trigger ${index === 0 ? 'details-tab-trigger' : ''} ${index === 1 ? 'trades-tab-trigger' : ''} ${index === 2 ? 'preview-tab-trigger' : ''}`}
                    data-value={step}
                    onClick={() => {
                      if (index <= currentStepIndex + 1) {
                        setTab(step);
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
                      {step.charAt(0).toUpperCase() + step.slice(1)}
                    </span>
                  </div>
                ))}
              </div>

              <TabsContent value="details" className="details-tab-content">
                <TemplateDetailsTab
                  value={templateDetails}
                  onChange={setTemplateDetails}
                  onNext={() => setTab("trades")}
                />
              </TabsContent>

              <TabsContent value="trades" className="trades-tab-content">
                <TradesTab
                  moduleValue={modules}
                  onModuleChange={setModules}
                  parameterValue={parameters}
                  onParameterChange={setParameters}
                  onPrev={() => setTab("details")}
                  onNext={() => setTab("preview")}
                />
              </TabsContent>

              <TabsContent value="preview" className="preview-tab-content">
                <PreviewTab
                  templateDetails={templateDetails}
                  parameters={parameters}
                  modules={modules}
                  isSubmitting={isPending}
                  onSubmit={() => {
                    submitTemplate({
                      name: templateDetails.name,
                      description: templateDetails.description,
                      image: templateDetails.image,
                      modules: modules,
                      parameters: parameters,
                      // template_elements: [],
                    });
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Tour guide component */}
      <CreateTemplateTour 
        isRunning={isTourRunning} 
        setIsRunning={setIsTourRunning}
        activeTab={tab}
        setActiveTab={setTab}
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
