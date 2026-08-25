export function StatCard({ title, value, helper, tone, icon }: {
  title: string; value: string; helper?: string;
  tone: "blue" | "orange" | "green" | "purple"; icon: React.ReactNode;
}) {
  const tones = {
    blue:   { card: "border-blue-100",   icon: "bg-blue-50 text-blue-600",    num: "text-blue-700" },
    orange: { card: "border-orange-100", icon: "bg-orange-50 text-orange-600", num: "text-orange-700" },
    green:  { card: "border-emerald-100",icon: "bg-emerald-50 text-emerald-600",num: "text-emerald-700" },
    purple: { card: "border-violet-100", icon: "bg-violet-50 text-violet-600", num: "text-violet-700" },
  } as const;
  const t = tones[tone];
  return (
    <div className={`rounded-2xl border ${t.card} bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</div>
          <div className={`mt-3 text-3xl font-bold tracking-tight ${t.num}`}>{value}</div>
          {helper ? <div className="mt-1.5 text-xs text-slate-400 truncate">{helper}</div> : null}
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${t.icon}`}>{icon}</div>
      </div>
    </div>
  );
}
