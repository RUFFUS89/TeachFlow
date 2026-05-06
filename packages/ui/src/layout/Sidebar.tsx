"use client";

import { type ReactNode } from "react";

import { cn } from "../cn";
import { Icon, type IconName } from "../primitives/Icon";

export interface SidebarItem {
  label: string;
  href: string;
  icon: IconName;
  badge?: ReactNode;
}

export interface SidebarBrand {
  name: string;
  caption?: string;
  iconColor?: string;
}

export interface SidebarProps {
  brand: SidebarBrand;
  items: SidebarItem[];
  activeHref?: string;
  collapsed?: boolean;
  onToggle?: () => void;
  footer?: ReactNode;
  /**
   * Render-prop pra renderizar cada item como um link da app
   * (ex: Next Link). Se não vier, usa <a href>.
   */
  renderLink?: (item: SidebarItem, isActive: boolean, content: ReactNode) => ReactNode;
}

function defaultRenderLink(item: SidebarItem, isActive: boolean, content: ReactNode) {
  return (
    <a
      key={item.href}
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className="block"
    >
      {content}
    </a>
  );
}

export function Sidebar({
  brand,
  items,
  activeHref,
  collapsed = false,
  onToggle,
  footer,
  renderLink = defaultRenderLink,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200",
        collapsed ? "w-16" : "w-60",
      )}
      aria-label="Navegação principal"
    >
      <div className={cn("flex items-center gap-2 px-4 py-5", collapsed && "justify-center px-0")}>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-card font-display text-base text-bg"
          style={{ backgroundColor: brand.iconColor ?? "#3D3D3A" }}
          aria-hidden
        >
          {brand.name[0]?.toUpperCase() ?? "T"}
        </span>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base text-ink">{brand.name}</span>
            {brand.caption && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-inkMuted">
                {brand.caption}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 py-2">
        {items.map((item) => {
          const isActive = activeHref === item.href || activeHref?.startsWith(`${item.href}/`);
          const content = (
            <span
              className={cn(
                "flex items-center gap-3 rounded-field px-3 py-2 text-sm transition-colors",
                isActive ? "bg-surface2 font-medium text-ink" : "text-inkSoft hover:bg-surface2",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon name={item.icon} size={18} />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="rounded-pill bg-blush px-1.5 py-0.5 text-[10px] font-medium text-blushInk">
                  {item.badge}
                </span>
              )}
            </span>
          );
          return renderLink(item, Boolean(isActive), content);
        })}
      </nav>

      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="mx-2 mb-2 flex items-center justify-center gap-2 rounded-field py-2 text-xs text-inkMuted hover:bg-surface2"
          aria-label={collapsed ? "Expandir navegação" : "Recolher navegação"}
        >
          <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={14} />
          {!collapsed && <span>Recolher</span>}
        </button>
      )}

      {footer && <div className="border-t border-border px-3 py-3">{footer}</div>}
    </aside>
  );
}
