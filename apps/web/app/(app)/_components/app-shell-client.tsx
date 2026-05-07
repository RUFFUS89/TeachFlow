"use client";

import { Avatar, Button, Sidebar, TopBar, type SidebarItem } from "@teachflow/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "owner" | "admin" | "usuario";

const ITEMS_BY_ROLE: Record<Role, SidebarItem[]> = {
  owner: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Cursos", href: "/courses", icon: "course" },
    { label: "Atividades", href: "/activities", icon: "clip" },
    { label: "Filiais", href: "/branches", icon: "branch" },
    { label: "Configurações", href: "/settings", icon: "settings" },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { label: "Cursos", href: "/courses", icon: "course" },
    { label: "Atividades", href: "/activities", icon: "clip" },
    { label: "Configurações", href: "/settings", icon: "settings" },
  ],
  usuario: [
    { label: "Feed", href: "/feed", icon: "home" },
    { label: "Meus cursos", href: "/my-courses", icon: "course" },
    { label: "Minhas entregas", href: "/my-submissions", icon: "clip" },
    { label: "Perfil", href: "/profile", icon: "user" },
  ],
};

const COLLAPSE_KEY = "teachflow:sidebar-collapsed";

export interface AppShellClientProps {
  userName: string;
  avatarUrl?: string | null;
  role: Role;
  children: ReactNode;
}

export function AppShellClient({ userName, avatarUrl, role, children }: AppShellClientProps) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (typeof window !== "undefined") {
      setCollapsed(window.localStorage.getItem(COLLAPSE_KEY) === "1");
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed, hydrated]);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const items = ITEMS_BY_ROLE[role];

  return (
    <div className="flex min-h-screen bg-bg text-ink">
      <Sidebar
        brand={{ name: "TeachFlow", caption: "v0.1" }}
        items={items}
        activeHref={pathname}
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        renderLink={(item, isActive, content) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className="block"
          >
            {content}
          </Link>
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          left={
            <span className="font-mono text-xs uppercase tracking-wider text-inkMuted">
              {role.toUpperCase()}
            </span>
          }
          right={
            <>
              <Button variant="ghost" size="sm" icon="bell" aria-label="Notificações" />
              <div className="flex items-center gap-2 pl-2">
                <Avatar name={userName} src={avatarUrl ?? undefined} size="sm" />
                <span className="hidden text-xs font-medium text-ink sm:inline">{userName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  icon="logout"
                  aria-label="Sair"
                  onClick={handleSignOut}
                />
              </div>
            </>
          }
        />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
