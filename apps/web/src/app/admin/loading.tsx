export default function AdminLoading() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] p-5 h-28 animate-pulse"
          />
        ))}
      </div>
      <div className="bg-[#13131c] border border-[rgba(255,255,255,0.06)] rounded-[14px] h-64 animate-pulse" />
    </div>
  );
}
