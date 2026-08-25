"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import { Branch } from "../shared";

type BranchContextType = {
  selectedBranch: Branch | null;
  setSelectedBranch: (branch: Branch | null) => void;
};

const BranchContext = createContext<BranchContextType>({
  selectedBranch: null,
  setSelectedBranch: () => {},
});

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

/**
 * Hook para obtener el local seleccionado desde cualquier página del panel empresa.
 * Si selectedBranch es null → mostrar datos de todas las sedes (comportamiento por defecto).
 * Si selectedBranch tiene valor → filtrar por selectedBranch.id usando ?localId=X
 */
export function useBranch() {
  return useContext(BranchContext);
}
