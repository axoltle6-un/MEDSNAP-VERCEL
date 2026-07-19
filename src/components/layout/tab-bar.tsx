"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { useHasMounted } from "@/hooks/use-has-mounted";
import {
  Home, ScanLine, History, Settings as SettingsIcon, LogOut, Compass,
} from "lucide-react";
import type { Screen } from "@/lib/types";
import { LogoWordmark } from "@/components/brand/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getTranslation } from "@/lib/translations";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const TABS: { screen: Screen; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }[] = [
  { screen: "home", label: "Home", icon: Home },
  { screen: "history", label: "History", icon: History },
  { screen: "capture", label: "Scan", icon: ScanLine },
  { screen: "browse", label: "Browse", icon: Compass },
  { screen: "settings", label: "Settings", icon: SettingsIcon },
];

const HIDDEN: Screen[] = ["auth", "reset-password", "email-verification-gate", "landing", "paywall", "analyzing", "results", "result-detail", "legal-disclaimer", "legal-terms", "legal-privacy"];

export function TabBar() {
  const mounted = useHasMounted();
  const screen = useAppStore((s) => s.screen);
  const navigate = useAppStore((s) => s.navigate);

  if (!mounted || HIDDEN.includes(screen)) return null;

  return (
    <>
      <DesktopNav screen={screen} navigate={navigate} />
      <MobileTabBar screen={screen} navigate={navigate} />
    </>
  );
}

function DesktopNav({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  const { user, logout, isFirebaseEnabled } = useAuth();
  const lang = useAppStore((s) => s.settings.language);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Signed out");
      navigate("landing");
    } catch {
      toast.error("Could not sign out");
    }
  }
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/60 bg-white/80 backdrop-blur-xl md:block shadow-soft">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <button
          onClick={() => navigate("home")}
          className="transition-transform duration-200 hover:scale-105 active:scale-95"
          aria-label="Go home"
        >
          <LogoWordmark size={34} animated />
        </button>

        <nav className="flex items-center gap-1 rounded-full bg-slate-100/80 p-1 border border-slate-200/60">
          {TABS.map(tab => {
            const active = screen === tab.screen;
            const Icon = tab.icon;
            return (
              <button
                key={tab.screen}
                onClick={() => navigate(tab.screen)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-all duration-200",
                  active ? "text-white" : "text-slate-600 hover:text-slate-900"
                )}
              >
                {active && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 28 }}
                    className="absolute inset-0 rounded-full bg-primary shadow-glow"
                  />
                )}
                <Icon className="relative z-10 h-4 w-4" strokeWidth={active ? 2.5 : 2} />
                <span className="relative z-10">{getTranslation(lang, tab.screen)}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {isFirebaseEnabled && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white shadow-soft transition-transform hover:scale-105 active:scale-95">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-lifted">
                <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{user.displayName || user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("settings")} className="rounded-xl font-medium">
                  <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl text-danger font-medium">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : isFirebaseEnabled ? (
            <button
              onClick={() => navigate("auth")}
              className="rounded-full border border-border bg-white px-4 py-2 text-xs font-bold shadow-soft transition-all hover:bg-muted hover:scale-105 active:scale-95"
            >
              Sign in
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function MobileTabBar({ screen, navigate }: { screen: Screen; navigate: (s: Screen) => void }) {
  const lang = useAppStore((s) => s.settings.language);
  const left = TABS.filter(t => t.screen === "home" || t.screen === "history");
  const right = TABS.filter(t => t.screen === "browse" || t.screen === "settings");
  const scan = TABS.find(t => t.screen === "capture")!;
  const ScanIcon = scan.icon;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-white/90 backdrop-blur-xl md:hidden shadow-lifted"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigation"
    >
      <div className="relative mx-auto flex max-w-md items-stretch justify-around px-2">
        {left.map(tab => <TabBtn key={tab.screen} tab={tab} screen={screen} navigate={navigate} />)}

        <button
          onClick={() => navigate("capture")}
          className="relative flex flex-1 flex-col items-center gap-0.5 py-1 text-[11px] font-bold"
          aria-label="Scan"
        >
          <motion.span
            className="flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-primary text-white shadow-glow ring-4 ring-white"
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 450, damping: 20 }}
          >
            <ScanIcon className="h-5 w-5" strokeWidth={2.5} />
          </motion.span>
          <span className={cn(
            "-translate-y-3 font-bold",
            screen === "capture" ? "text-primary" : "text-muted-foreground"
          )}>
            {getTranslation(lang, scan.screen)}
          </span>
        </button>

        {right.map(tab => <TabBtn key={tab.screen} tab={tab} screen={screen} navigate={navigate} />)}
      </div>
    </nav>
  );
}

function TabBtn({ tab, screen, navigate }: {
  tab: { screen: Screen; label: string; icon: React.ComponentType<{ className?: string; strokeWidth?: number }> };
  screen: Screen;
  navigate: (s: Screen) => void;
}) {
  const lang = useAppStore((s) => s.settings.language);
  const active = screen === tab.screen;
  const Icon = tab.icon;
  return (
    <button
      onClick={() => navigate(tab.screen)}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors duration-200",
        active ? "text-primary" : "text-slate-500 hover:text-slate-900"
      )}
      aria-current={active ? "page" : undefined}
      aria-label={tab.label}
    >
      {active && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 28 }}
          className="absolute inset-x-1 top-1 bottom-1 rounded-2xl bg-primary/10"
        />
      )}
      <motion.div
        animate={active ? { scale: 1.12, y: -1 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 450, damping: 24 }}
        className="relative z-10"
      >
        <Icon
          className="h-5 w-5"
          strokeWidth={active ? 2.5 : 2}
        />
      </motion.div>
      <span className="relative z-10 mt-0.5">{getTranslation(lang, tab.screen)}</span>
    </button>
  );
}
