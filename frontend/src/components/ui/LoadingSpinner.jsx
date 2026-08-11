export default function LoadingSpinner({ size = 'md', text = 'Loading…' }) {
  const s = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <div className={`${s} border-2 border-surface-border border-t-brand rounded-full animate-spin`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
}
