"use client";

import { createContext, useContext, useState } from "react";

interface MobileSidebarContextType {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider value={{
      isOpen,
      toggle: () => setIsOpen(prev => !prev),
      close: () => setIsOpen(false),
    }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

export const useMobileSidebar = () => useContext(MobileSidebarContext);
