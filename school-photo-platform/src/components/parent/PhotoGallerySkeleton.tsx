export default function PhotoGallerySkeleton() {
  return (
    <div className="flex gap-4 pb-12">
      {[...Array(4)].map((_, colIndex) => (
        <div key={colIndex} className="flex-1 flex flex-col gap-4">
          {[...Array(3)].map((_, rowIndex) => (
            <div
              key={rowIndex}
              className="w-full rounded-xl bg-slate-200 animate-pulse"
              style={{ 
                aspectRatio: rowIndex % 2 === 0 ? '4/3' : '3/4',
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
