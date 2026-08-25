import PublicNavbar from "../../components/ui/PublicNavbar";
import PublicFooter from "../../components/ui/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNavbar />
      <main className="flex-1 bg-slate-50">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}