"use client";

import type { Notification } from "@teachflow/database";
import { Avatar, Button, Icon, Sidebar, TopBar, type SidebarItem } from "@teachflow/ui";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { useApiClient } from "@/lib/api";
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
  const api = useApiClient();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

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

  // Polling de notificações a cada 60s
  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const data = await api.notifications.list();
        if (active) setNotifications(data);
      } catch {
        // silently ignore — sem auth ou backend fora
      }
    }
    void poll();
    const id = setInterval(poll, 60_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [api]);

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkAllRead() {
    await api.notifications.markAllRead().catch(() => null);
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

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
              {/* Sino de notificações */}
              <div ref={bellRef} className="relative">
                <button
                  className="relative flex h-8 w-8 items-center justify-center rounded-card text-inkMuted hover:bg-surface2 hover:text-ink"
                  aria-label="Notificações"
                  onClick={() => setBellOpen((o) => !o)}
                >
                  <Icon name="bell" size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {bellOpen && (
                  <div className="absolute right-0 top-10 z-50 w-80 rounded-card border border-border bg-surface shadow-lg">
                    <div className="flex items-center justify-between border-b border-border px-4 py-2">
                      <span className="text-sm font-semibold text-ink">Notificações</span>
                      {unreadCount > 0 && (
                        <button
                          className="text-xs text-accent hover:underline"
                          onClick={handleMarkAllRead}
                        >
                          Marcar todas como lidas
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-sm text-inkMuted">
                          Nenhuma notificação.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`border-b border-border px-4 py-3 last:border-0 ${!n.read_at ? "bg-surface2/60" : ""}`}
                          >
                            <p className="text-sm font-medium text-ink">{n.title}</p>
                            {n.body && (
                              <p className="mt-0.5 text-xs text-inkMuted line-clamp-2">{n.body}</p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

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
