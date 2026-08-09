export function LoadingScreen({ mensagem }: { mensagem: string }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-spinner" />
      <p>{mensagem}</p>
    </div>
  );
}
