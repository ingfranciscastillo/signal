import UrlForm, { type UrlFormProps } from "@/components/url-form";

export default function Hero({ onAnalyze, loading, error }: UrlFormProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-16 text-center md:pt-20">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-[65%] -translate-y-[12%] text-line opacity-[0.35] md:h-[520px] md:w-[520px]"
      >
        <path
          d="M15 4C15 8 9 8 9 12C9 16 15 16 15 20"
          stroke="currentColor"
          strokeWidth={0.4}
          strokeLinecap="round"
        />
      </svg>
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-signal">
          Signal · diagnóstico de superficie web
        </p>
        <h1 className="mt-5 font-heading text-4xl font-semibold tracking-tight text-ink md:text-5xl">
          Cada URL deja un trazo.
          <br />
          Léelo.
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-mist md:text-base">
          Pega una URL y obtén un diagnóstico real: scripts, terceros, trackers
          y dependencias que normalmente permanecen ocultos.
        </p>

        <div className="mt-9">
          <UrlForm onAnalyze={onAnalyze} loading={loading} error={error} />
        </div>
      </div>
    </section>
  );
}
