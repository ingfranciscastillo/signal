import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const THEME_INIT_SCRIPT = `
try {
  var dark = localStorage.getItem("signal-theme") !== "light";
  document.documentElement.classList.toggle("dark", dark);
} catch (e) {}
`;

const generalSans = localFont({
  src: [
    {
      path: "../../public/GeneralSans-Variable.woff2",
      weight: "200 700",
      style: "normal",
    },
    {
      path: "../../public/GeneralSans-VariableItalic.woff2",
      weight: "200 700",
      style: "italic",
    },
  ],
  variable: "--font-general-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

const TITLE = "Signal — diagnóstico de superficie web";
const DESCRIPTION =
  "Analiza cualquier URL en tiempo real: tecnologías, scripts de terceros, trackers, cookies, headers, performance y privacidad.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    locale: "es",
  },
  twitter: {
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      suppressHydrationWarning
      lang="es"
      className={`${generalSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        {children}
      </body>
    </html>
  );
}
