"use client";

import { useEffect } from "react";

export const PREFERENCES_CHANGED_EVENT = "signbridgePreferencesChanged";

export function PreferencesSync() {
  useEffect(() => {
    const applyPreferences = () => {
      const theme = localStorage.getItem("signbridge_theme") === "dark" ? "dark" : "light";
      const fontSize = localStorage.getItem("signbridge_font_size") || "medium";
      const reducedMotion = localStorage.getItem("signbridge_reduced_motion") === "true";
      const root = document.documentElement;

      root.classList.toggle("dark", theme === "dark");
      root.dataset.fontSize = fontSize;
      root.classList.toggle("reduce-motion", reducedMotion);
    };

    applyPreferences();
    window.addEventListener(PREFERENCES_CHANGED_EVENT, applyPreferences);
    return () => window.removeEventListener(PREFERENCES_CHANGED_EVENT, applyPreferences);
  }, []);

  return null;
}
