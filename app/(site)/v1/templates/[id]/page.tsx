"use client";

import React from "react";
import { getTemplateById } from "@/api/client/templates";
import { Module } from "@/types/templates";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import Image from "next/image";
import { TemplateDetailedLoader } from "@/components/features/template-page/loader-detailed";

export default function TemplatedById() {
  const { id } = useParams();  const template = useQuery({
    queryKey: ["template", id],
    queryFn: () => getTemplateById(Number(id)),
  });

  if (template.isLoading) {
    return <TemplateDetailedLoader />;
  }

  if (template.isError) {
    return (
      <div className="p-0 mx-auto">
        <div className="flex items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50">
          <div className="text-red-500 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Error loading template details. Please try again later.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-0 mx-auto">
      <div className="w-full max-w-8xl relative left-1/2 right-1/2 -translate-x-1/2 h-48 md:h-64 mb-4">
        <Image
          src={template.data?.image || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b"}
          alt={template.data?.name || "Template Image"}
          fill
          className="w-full h-full object-cover object-center rounded-2xl shadow"
          priority
        />
      </div>
      <h2 className="text-4xl font-bold mb-2 tracking-tight leading-tight">
        {template.data?.name}
      </h2>
      <p className="text-lg text-muted-foreground mb-2">
        {template.data?.description}
      </p>
      {template.data?.parameters.length > 0 && (
        <div className="mt-8 w-full">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Parameters
          </h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {(template.data.parameters as import("@/types/templates").Parameter[]).map((param) => (
              <span key={param.id} className="inline-block rounded bg-muted px-3 py-1 text-xs font-medium text-muted-foreground border">
                {param.name}: {param.value} <span className="text-[10px] text-gray-400">({param.type})</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {template.data?.modules.length > 0 && (
        <div className="mt-8 w-full">
          <h3 className="text-lg font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Modules
          </h3>
          <div className="flex flex-col gap-4">
            {template.data.modules.map((module: Module) => (
              <div key={module.id} className="rounded-lg border border-border bg-muted/40 px-4 py-3 hover:bg-accent/40 transition-colors">
                <h4 className="font-medium text-base mb-1">{module.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                {/* Template Elements for this module */}
                {(template.data.template_elements as import("@/types/templates").TemplateElement[]).filter((el) => el.module.id === module.id).length > 0 && (
                  <div className="ml-2 mt-2">
                    <div className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Elements</div>
                    <div className="flex flex-col gap-2">
                      {(template.data.template_elements as import("@/types/templates").TemplateElement[]).filter((el) => el.module.id === module.id).map((el) => (
                        <div key={el.id} className="flex items-center gap-3 p-4 rounded border bg-background">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{el.element.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{el.element.description}</div>
                          </div>
                          <div className="flex gap-2">
                            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                              Material: {el.material_cost}
                            </span>
                            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                              Labor: {el.labor_cost}
                            </span>
                            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border">
                              Markup: {el.markup ?? 0}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
