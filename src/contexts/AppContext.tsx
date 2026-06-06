import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { DemoRole } from '@/types';

interface AppContextValue {
  role: DemoRole | null;
  setRole: (role: DemoRole) => void;
  isGoverno: boolean;
}

const AppContext = createContext<AppContextValue>({
  role: null,
  setRole: () => {},
  isGoverno: false,
});

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<DemoRole | null>(null);

  return (
    <AppContext.Provider value={{ role, setRole, isGoverno: role === 'GOVERNO_DEFESA_CIVIL' }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
