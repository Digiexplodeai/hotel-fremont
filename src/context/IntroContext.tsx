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
    const isDev = process.env.NODE_ENV !== "production";
    const hasPreloaded = typeof window !== "undefined" ? sessionStorage.getItem("fremont_preloaded") : false;

    if (!isDev && hasPreloaded) {
      setIsIntroActive(false);
      setIsIntroDone(true);
    } else {
      setIsIntroActive(true);
      setIsIntroDone(false);
    }
  }, []);

  const completeIntro = useCallback(() => {
    setIsIntroActive(false);
    setIsIntroDone(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("fremont_preloaded", "true");
    }
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
