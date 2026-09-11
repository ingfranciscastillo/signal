"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  // Arranca igual que el server (dark) para no romper la hidratación; el script inline en
  // layout.tsx ya pinta el <html> correcto antes del paint, esto solo sincroniza el estado
  // de React (el ícono) con la preferencia real una vez montado.
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(localStorage.getItem("signal-theme") !== "light");
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("signal-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="grid h-9 w-9 place-items-center rounded-full border border-line text-mist transition-colors hover:border-ink hover:text-ink"
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
