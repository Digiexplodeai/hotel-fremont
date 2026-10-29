"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface IntroContextType {
  isIntroActive: boolean;
  isIntroDone: boolean;
  completeIntro: () => void;
}

const IntroContext = createContext<IntroContextType>({
  isIntroActive: true,
  isIntroDone: false,
  completeIntro: () => {},
});

export function IntroProvider({ children }: { children: React.ReactNode }) {
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [isIntroDone, setIsIntroDone] = useState(false);

  useEffect(() => {
    // Disable automatic browser scroll restoration on reload so user always begins at the top (Hero)
    if (typeof window !== "undefined" && "scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }

    // Clean up any lingering storage flags from earlier versions to prevent any accidental bypass
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("fremont_preloaded");
      localStorage.removeItem("fremont_preloaded");
    }
  }, []);

  const completeIntro = useCallback(() => {
    setIsIntroActive(false);
    setIsIntroDone(true);
  }, []);

  return (
    <IntroContext.Provider value={{ isIntroActive, isIntroDone, completeIntro }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro() {
  return useContext(IntroContext);
}
