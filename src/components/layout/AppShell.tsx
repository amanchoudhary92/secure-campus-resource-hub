"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import {
  Bookmark,
  FileText,
  Home,
  LogIn,
  LogOut,
  Search,
  ShieldCheck,
  UploadCloud,
  User,
  Users,
  WandSparkles,
  ClipboardList,
  CopyX,
  ListChecks,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/resources", label: "Resources", icon: FileText },
  { href: "/upload", label: "Upload", icon: UploadCloud },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/requests", label: "Requests", icon: ClipboardList },
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/users", label: "Users", icon: Users, adminOnly: true },
  { href: "/admin/duplicates", label: "Duplicates", icon: CopyX, adminOnly: true },
  { href: "/admin/audit", label: "Audit", icon: ListChecks, adminOnly: true },
  { href: "/profile", label: "Profile", icon: User },
];

type Profile = {
  full_name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
  branch?: string | null;
  semester?: string | null;
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [globalSearch, setGlobalSearch] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setProfile(data?.profile || null))
      .catch(() => setProfile(null));
  }, []);

  function submitGlobalSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = globalSearch.trim();
    router.push(q ? `/resources?q=${encodeURIComponent(q)}` : "/resources");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setProfile(null);
    router.push("/login");
    router.refresh();
  }

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()
    : "AC";

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-200 bg-white/90 p-5 lg:sticky lg:top-0 lg:h-screen">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-2xl text-white shadow-soft">📚</div>
          <div>
            <p className="text-lg font-black text-slate-950">Campus Resource Hub</p>
            <p className="text-xs text-slate-500">Share. Learn. Succeed.</p>
          </div>
        </Link>

        <nav className="space-y-2">
          {navItems.map((item) => {
            if ("adminOnly" in item && item.adminOnly && profile?.role !== "ADMIN") return null;
            const Icon = item.icon;
            const active = pathname === item.href || (item.href === "/admin" && pathname === "/admin");

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 rounded-3xl bg-gradient-to-br from-blue-600 to-teal-500 p-5 text-white shadow-soft">
          <WandSparkles className="mb-3 h-7 w-7" />
          <h3 className="font-black">Moderation Mode</h3>
          <p className="mt-2 text-sm leading-6 text-blue-50">Uploads stay pending until admin approval. Unsafe file types are blocked automatically.</p>
          <Link href="/upload" className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-black text-blue-700">Upload Resource</Link>
        </div>
      </aside>

      <main className="min-w-0">
        <header className="sticky top-0 z-20 flex flex-col gap-3 border-b border-slate-200 bg-white/85 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <form onSubmit={submitGlobalSearch} className="relative w-full max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
              placeholder="Search notes, subjects, topics or keywords..."
            />
          </form>

          <div className="flex items-center gap-3">
            {profile ? (
              <>
                <div className="grid h-11 w-11 place-items-center rounded-full bg-blue-50 font-black text-blue-700">{initials}</div>
                <div>
                  <p className="text-sm font-black text-slate-950">{profile.full_name}</p>
                  <p className="text-xs text-slate-500">{profile.role} {profile.branch ? `• ${profile.branch}` : ""}</p>
                </div>
                <button onClick={logout} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"><LogOut className="h-4 w-4" /> Logout</button>
              </>
            ) : (
              <Link href="/login" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white"><LogIn className="h-4 w-4" /> Login</Link>
            )}
          </div>
        </header>

        <div className="p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
