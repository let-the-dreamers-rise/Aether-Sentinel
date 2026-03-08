export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }[size];
  const borderClass = { sm: 'border-2', md: 'border-[3px]', lg: 'border-4' }[size];
  return (
    <div className="flex items-center justify-center">
      <div className={`${sizeClass} ${borderClass} animate-spin rounded-full border-brand-500/20 border-t-brand-400`} />
    </div>
  );
}
