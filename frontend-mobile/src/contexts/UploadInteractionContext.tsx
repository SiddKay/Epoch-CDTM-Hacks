import React, { createContext, useState, useContext, ReactNode } from 'react';

interface UploadInteractionData {
  skipped?: boolean;
  accepted?: boolean;
  reason?: string;
  documentType?: string;
}

interface UploadInteractionContextType {
  interactionData: UploadInteractionData | null;
  setInteractionData: (data: UploadInteractionData | null) => void;
}

const UploadInteractionContext = createContext<
  UploadInteractionContextType | undefined
>(undefined);

export const UploadInteractionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [interactionData, setInteractionData] =
    useState<UploadInteractionData | null>(null);
  return (
    <UploadInteractionContext.Provider
      value={{ interactionData, setInteractionData }}
    >
      {children}
    </UploadInteractionContext.Provider>
  );
};

export const useUploadInteraction = (): UploadInteractionContextType => {
  const context = useContext(UploadInteractionContext);
  if (!context) {
    throw new Error(
      'useUploadInteraction must be used within an UploadInteractionProvider'
    );
  }
  return context;
};
