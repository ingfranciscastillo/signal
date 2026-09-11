import UrlForm, { type UrlFormProps } from "@/components/url-form";

const SCOPE = [
  "tecnologías",
  "scripts de terceros",
  "trackers",
  "fuentes externas",
  "cookies",
  "headers",
  "performance",
  "privacidad",
];

export default function Hero({ onAnalyze, loading, error }: UrlFormProps) {
  return (
    <section className="mx-auto max-w-2xl px-4 pb-16 pt-16 text-center md:pt-20">
      <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-signal">
        Signal · diagnóstico de superficie web
      </p>
      <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-ink md:text-5xl">
        Cada URL deja un trazo.
        <br />
        Léelo.
      </h1>
      <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-mist md:text-base">
        Pega una URL y obtén un diagnóstico real: scripts, terceros, trackers y
        dependencias que normalmente permanecen ocultos.
      </p>

      <div className="mt-9">
        <UrlForm onAnalyze={onAnalyze} loading={loading} error={error} />
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
          {SCOPE.join(" · ")}
        </p>
      </div>
    </section>
  );
}
