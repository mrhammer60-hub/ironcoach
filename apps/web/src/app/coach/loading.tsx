export default function CoachLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5"
          >
            <div className="w-9 h-9 rounded-[9px] bg-[#1a1a26] animate-pulse mb-3" />
            <div className="h-7 w-16 bg-[#1a1a26] rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-[#1a1a26] rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-4 bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-xl"
          >
            <div className="w-8 h-8 rounded-full bg-[#1a1a26] animate-pulse" />
            <div className="flex-1">
              <div className="h-3.5 w-32 bg-[#1a1a26] rounded animate-pulse mb-1.5" />
              <div className="h-3 w-20 bg-[#1a1a26] rounded animate-pulse" />
            </div>
            <div className="h-5 w-14 rounded-full bg-[#1a1a26] animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
