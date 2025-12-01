import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type ThemeColor = "emerald" | "blue" | "purple" | "rose" | "amber" | "teal" | "indigo";
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  color: ThemeColor;
  mode: ThemeMode;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_CLASSES: Record<ThemeColor, { primary: string; gradient: string; light: string; ring: string }> = {
  emerald: {
    primary: "bg-emerald-500",
    gradient: "from-emerald-400 to-emerald-600",
    light: "bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-200",
  },
  blue: {
    primary: "bg-blue-500",
    gradient: "from-blue-400 to-blue-600",
    light: "bg-blue-50 text-blue-700",
    ring: "ring-blue-200",
  },
  purple: {
    primary: "bg-purple-500",
    gradient: "from-purple-400 to-purple-600",
    light: "bg-purple-50 text-purple-700",
    ring: "ring-purple-200",
  },
  rose: {
    primary: "bg-rose-500",
    gradient: "from-rose-400 to-rose-600",
    light: "bg-rose-50 text-rose-700",
    ring: "ring-rose-200",
  },
  amber: {
    primary: "bg-amber-500",
    gradient: "from-amber-400 to-amber-600",
    light: "bg-amber-50 text-amber-700",
    ring: "ring-amber-200",
  },
  teal: {
    primary: "bg-teal-500",
    gradient: "from-teal-400 to-teal-600",
    light: "bg-teal-50 text-teal-700",
    ring: "ring-teal-200",
  },
  indigo: {
    primary: "bg-indigo-500",
    gradient: "from-indigo-400 to-indigo-600",
    light: "bg-indigo-50 text-indigo-700",
    ring: "ring-indigo-200",
  },
};

export const getColorClasses = (color: ThemeColor) => COLOR_CLASSES[color];

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [color, setColorState] = useState<ThemeColor>(() => {
    const saved = localStorage.getItem("theme-color");
    return (saved as ThemeColor) || "emerald";
  });
  
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme-mode");
    return (saved as ThemeMode) || "light";
  });

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Определяем тёмный режим
    if (mode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setIsDark(mediaQuery.matches);
      
      const handler = (e: MediaQueryListEvent) => setIsDark(e.matches);
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setIsDark(mode === "dark");
    }
  }, [mode]);

  useEffect(() => {
    // Применяем тёмный режим к документу
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  useEffect(() => {
    // Применяем CSS переменные для цвета
    const root = document.documentElement;
    const colorMap: Record<ThemeColor, string> = {
      emerald: "16 185 129",
      blue: "59 130 246",
      purple: "168 85 247",
      rose: "244 63 94",
      amber: "245 158 11",
      teal: "20 184 166",
      indigo: "99 102 241",
    };
    root.style.setProperty("--color-primary", colorMap[color]);
  }, [color]);

  const setColor = (newColor: ThemeColor) => {
    setColorState(newColor);
    localStorage.setItem("theme-color", newColor);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("theme-mode", newMode);
  };

  return (
    <ThemeContext.Provider value={{ color, mode, setColor, setMode, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

