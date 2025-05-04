"use client";

import React, { useState, useEffect } from "react";
import { getProposalById } from "@/api/client/proposals";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent, Button } from "@/components/shared";
import { ProposalDetails } from "@/components/features/proposal-page/proposal-details";
import { ContractDetails } from "@/components/features/proposal-page/contract-details";
import { ProposalDetailedLoader } from "@/components/features/proposal-page/loader-detailed";
import { toast } from "sonner";

export default function ProposalById() {
  const { id } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("proposal");

  useEffect(() => {
    if (pathname.includes("/contract")) {
      setActiveTab("contract");
    } else {
      setActiveTab("proposal");
    }
  }, [pathname]);

  const proposalQuery = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => getProposalById(Number(id)),
    retry: 1,
  });

  // Handle success and error separately with useEffect
  useEffect(() => {
    if (proposalQuery.data) {
      console.log("Proposal data loaded:", proposalQuery.data);
    }
    
    if (proposalQuery.error) {
      console.error("Error fetching proposal:", proposalQuery.error);
      toast.error("Failed to load proposal data. Please try again.");
    }
  }, [proposalQuery.data, proposalQuery.error]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);

    if (value === "proposal") {
      router.push(`/proposals/${id}`);
    } else if (value === "contract") {
      router.push(`/proposals/${id}/contract`);
    }
  };

  const handleRetryFetch = () => {
    proposalQuery.refetch();
  };

  if (proposalQuery.isLoading) {
    return <ProposalDetailedLoader />;
  }

  if (proposalQuery.isError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center p-8 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800/30">
          <div className="text-red-500 flex items-center gap-2 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Error loading proposal details.</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            There was a problem fetching the proposal data. This could be due to a network issue or the proposal may not exist.
          </p>
          <Button onClick={handleRetryFetch}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full mb-4">
        <TabsTrigger value="proposal" className="flex-1">
          Proposal Details
        </TabsTrigger>
        <TabsTrigger value="contract" className="flex-1">
          Contract Details
        </TabsTrigger>
      </TabsList>
      <TabsContent value="proposal">
        {proposalQuery.data && <ProposalDetails proposal={proposalQuery.data} />}
      </TabsContent>
      <TabsContent value="contract">
        {proposalQuery.data && <ContractDetails proposal={proposalQuery.data} />}
      </TabsContent>
    </Tabs>
  );
}
