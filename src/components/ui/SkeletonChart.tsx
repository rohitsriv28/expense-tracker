export default function SkeletonChart() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="skeleton h-5 w-36 mb-2" />
          <div className="skeleton h-3 w-48" />
        </div>
        <div className="skeleton h-8 w-20 rounded-full" />
      </div>
      <div className="flex h-56 items-end gap-2">
        {[38, 62, 46, 72, 54, 88, 64, 48, 76, 58, 69, 43].map(
          (height, index) => (
            <div
              key={index}
              className="skeleton flex-1 rounded-t-md"
              style={{ height: `${height}%` }}
            />
          ),
        )}
      </div>
    </div>
  );
}
