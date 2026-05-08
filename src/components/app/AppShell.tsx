"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { motion } from "motion/react";
import { LayoutDashboard, Users, FileAudio, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Kbd } from "@/components/ui/kbd";
import type { AppView } from "./types";

interface AppShellProps {
  view: AppView;
  onViewChange: (view: AppView) => void;
  onOpenCommandPalette: () => void;
  sidebarOpen: boolean;
  onSidebarOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const nav = [
  { id: "dashboard" as const, label: "Přehled", icon: LayoutDashboard },
  { id: "patients" as const, label: "Pacienti", icon: Users },
  { id: "sessions" as const, label: "Relace", icon: FileAudio },
  { id: "templates" as const, label: "Šablony", icon: FileText },
];

export function AppShell({
  view,
  onViewChange,
  onOpenCommandPalette,
  sidebarOpen,
  onSidebarOpenChange,
  children,
}: AppShellProps) {
  const { user } = useUser();
  const accountName =
    user?.fullName ??
    user?.firstName ??
    user?.primaryEmailAddress?.emailAddress ??
    "Účet";

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={onSidebarOpenChange}>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="gap-3">
          <div className="flex items-center gap-2 px-2 pt-1">
            <div className="size-6 shrink-0 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18),0_1px_0_0_rgba(0,0,0,0.12)]">
              <BrandMark className="size-3.5" />
            </div>
            <span className="font-heading text-sm font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
              Medscribe
            </span>
          </div>

          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 rounded-lg border border-sidebar-border bg-background px-2.5 py-1.5 text-xs text-sidebar-foreground/75 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_0_0_rgba(0,0,0,0.04)] hover:bg-accent hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_2px_0_0_rgba(0,0,0,0.05)] active:shadow-none transition-[background-color,box-shadow] group-data-[collapsible=icon]:hidden"
          >
            <span className="flex-1 text-left">Hledat…</span>
            <Kbd className="text-sidebar-foreground/80">⌘K</Kbd>
          </button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {nav.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={
                      view === item.id ||
                      (item.id === "patients" && view === "patient") ||
                      (item.id === "sessions" && view === "review")
                    }
                    onClick={() => onViewChange(item.id)}
                    tooltip={item.label}
                    className="data-[active=true]:bg-sidebar-accent/60 data-[active=true]:border data-[active=true]:border-sidebar-border data-[active=true]:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6),0_1px_0_0_rgba(0,0,0,0.04)]"
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent/60 border border-sidebar-border px-2 py-1.5 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:border-transparent group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-0">
            <UserButton appearance={{ elements: { avatarBox: "size-7" } }} />
            <span
              className="text-sm font-medium text-sidebar-foreground/90 truncate group-data-[collapsible=icon]:hidden"
              title={accountName}
            >
              {accountName}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="overflow-hidden border border-border/80">
        <motion.div
          className="flex h-full flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-2 px-4 py-2">
            <SidebarTrigger />
          </div>
          <div className="flex-1 overflow-hidden">{children}</div>
        </motion.div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Bold M — the letterform doubles as a waveform peak */}
      <path d="M5 19 V6 L12 14 L19 6 V19" />
    </svg>
  );
}
