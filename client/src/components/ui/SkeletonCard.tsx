interface SkeletonCardProps {
  lines?: number;
}

export default function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="card animate-enter">
      <div className="flex items-center justify-between mb-5">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-9 w-9 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-36 mb-4" />
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton h-3"
            style={{ width: `${90 - index * 18}%` }}
          />
        ))}
      </div>
    </div>
  );
}
