interface SkeletonListProps {
  rows?: number;
}

export default function SkeletonList({ rows = 5 }: SkeletonListProps) {
  return (
    <div className="card card-flush overflow-hidden">
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-4 border-b last:border-b-0"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="skeleton h-10 w-10 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-2/3" />
            <div className="skeleton h-3 w-1/3" />
          </div>
          <div className="skeleton h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
