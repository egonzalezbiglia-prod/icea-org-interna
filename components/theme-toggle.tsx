"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "icea-theme";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = nextTheme === "dark" ? "Oscuro" : "Claro";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return (
    <button
      className="ghost-button theme-toggle"
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Cambiar a modo ${label.toLowerCase()}`}
      title={`Modo ${label.toLowerCase()}`}
    >
      {nextTheme === "dark" ? <Moon size={17} /> : <Sun size={17} />}
      <span>{label}</span>
    </button>
  );
}
