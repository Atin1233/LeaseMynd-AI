export function Skeleton({
  className = "",
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "text" | "circular" | "rectangular";
}) {
  const baseClasses = "animate-pulse bg-stone-200";
  
  const variantClasses = {
    default: "",
    text: "h-4",
    circular: "rounded-full",
    rectangular: "",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      aria-label="Loading..."
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-stone-200 p-5">
      <Skeleton className="h-4 w-24 mb-3" variant="text" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" variant="text" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="bg-white border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="divide-y divide-stone-100">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-4 w-48 mb-2" variant="text" />
                <Skeleton className="h-3 w-32" variant="text" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-10 h-10" variant="circular" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-2" variant="text" />
            <Skeleton className="h-3 w-24" variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}
