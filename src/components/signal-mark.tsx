interface SignalMarkProps {
  className?: string;
}

// La "S" de Signal trazada con la misma gramática visual del grafo: 3 nodos
// (uno hueco, uno apagado, uno señalado) unidos por la curva de graph-edges.tsx.
export default function SignalMark({ className }: SignalMarkProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M15 4C15 8 9 8 9 12C9 16 15 16 15 20"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <circle cx={15} cy={4} r={1.8} stroke="currentColor" strokeWidth={1.6} />
      <circle cx={9} cy={12} r={1.3} fill="currentColor" opacity={0.55} />
      <circle cx={15} cy={20} r={2.4} fill="currentColor" />
    </svg>
  );
}
