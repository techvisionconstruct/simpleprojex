"use client";
import { ContractEditor } from "@/components/features/create-contract/contract-editor";

export default function CreateContractPage() {
  return (
    <div className="h-full w-full p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Create Contract</h1>
        <ContractEditor />
    </div>
  );
}