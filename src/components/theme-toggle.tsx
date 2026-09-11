"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "@phosphor-icons/react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(
    () =>
      (typeof window !== "undefined"
        ? localStorage.getItem("signal-theme")
        : null) !== "light",
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("signal-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-mist transition-colors hover:border-ink hover:text-ink"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
