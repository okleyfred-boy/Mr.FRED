import React from "react";
import { Droplet, Users, ShieldAlert, Monitor, CheckCircle, RefreshCw, Smartphone, LogIn, LogOut } from "lucide-react";

interface HeaderProps {
  currentRole: "authority" | "technician" | "citizen";
  onRoleChange: (role: "authority" | "technician" | "citizen") => void;
  isSimulating: boolean;
  onTriggerSimulation: () => void;
  serverOnline: boolean;
  user: { name: string; email: string } | null;
  onSignInClick: () => void;
  onSignOut: () => void;
}

export default function Header({
  currentRole,
  onRoleChange,
  isSimulating,
  onTriggerSimulation,
  serverOnline,
  user,
  onSignInClick,
  onSignOut
}: HeaderProps) {
  return (
    <header className="bg-[#0A3C6B] text-white border-b border-[#1E4E7E]" id="portal-header">
      {/* Top Bar with National Flag Colors Accent - Purely aesthetic and minimalist */}
      <div className="h-1 w-full flex">
        <div className="h-full flex-1 bg-red-600"></div>
        <div className="h-full flex-1 bg-yellow-400"></div>
        <div className="h-full flex-1 bg-emerald-600"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-4 gap-4">
          
          {/* Brand/Logo Section & Mobile Sign In */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/20 backdrop-blur rounded-xl border border-sky-400/30 shadow-inner flex items-center justify-center">
                <Droplet className="w-7 h-7 text-[#EA9E1A]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-display font-bold text-lg tracking-tight">GWCL Smart Water</span>
                  <span className="bg-emerald-500/15 border border-emerald-400/30 text-[10px] text-emerald-300 px-1.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    LIVE GRID
                  </span>
                </div>
                <p className="text-xs text-sky-200/80">Ghana National Water Protection & Leak Loss Portal</p>
              </div>
            </div>
            {/* Mobile Sign In / Sign Out icon button */}
            <div className="md:hidden flex items-center gap-1.5">
              {user ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono bg-[#EA9E1A]/10 text-[#EA9E1A] px-2 py-1 rounded-md border border-[#EA9E1A]/20 max-w-[80px] truncate">
                    {user.email.split("@")[0]}
                  </span>
                  <button
                    onClick={onSignOut}
                    className="p-1.5 bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 rounded-lg border border-rose-500/20 text-xs flex items-center"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={onSignInClick}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-[#EA9E1A] text-slate-950 rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* User Role Quick Switcher */}
          <div className="flex bg-slate-900/40 p-1 rounded-xl border border-white/10 w-full md:w-auto overflow-x-auto min-w-[340px] md:min-w-0">
            <button
              id="switch-btn-authority"
              onClick={() => onRoleChange("authority")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                currentRole === "authority"
                  ? "bg-[#EA9E1A] text-slate-950 shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>GWCL Authorities</span>
            </button>
            <button
              id="switch-btn-technician"
              onClick={() => onRoleChange("technician")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                currentRole === "technician"
                  ? "bg-[#EA9E1A] text-slate-950 shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Field Technicians</span>
            </button>
            <button
              id="switch-btn-citizen"
              onClick={() => onRoleChange("citizen")}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                currentRole === "citizen"
                  ? "bg-[#EA9E1A] text-slate-950 shadow-md font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Ghana Citizens</span>
            </button>
          </div>

          {/* Right Network Telemetry & Auth Section */}
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="bg-slate-900/30 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2">
              <span className="text-sky-300 font-medium">Server Connection:</span>
              <span className="font-mono text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ONLINE
              </span>
            </div>
            
            <button
              id="trigger-re-simulate"
              onClick={onTriggerSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 bg-[#EA9E1A]/10 hover:bg-[#EA9E1A]/20 border border-[#EA9E1A]/40 text-[#EA9E1A] px-3 py-1.5 rounded-lg transition font-medium text-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
              Sync Sensors
            </button>

            {/* Separator line */}
            <div className="h-6 w-px bg-white/10"></div>

            {/* Desktop Auth Controls */}
            {user ? (
              <div className="flex items-center gap-2.5" id="user-profile-badge">
                <div className="flex flex-col items-end text-right">
                  <span className="text-[11px] font-semibold text-slate-100">{user.name}</span>
                  <span className="text-[10px] text-sky-200/60 font-mono">{user.email}</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center font-bold text-sky-300 uppercase text-xs">
                  {user.name.charAt(0)}
                </div>
                <button
                  id="header-sign-out-btn"
                  onClick={onSignOut}
                  className="flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg transition font-semibold cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                id="header-sign-in-btn"
                onClick={onSignInClick}
                className="flex items-center gap-1.5 bg-[#EA9E1A] hover:bg-[#EA9E1A]/95 text-slate-950 px-3.5 py-1.5 rounded-lg transition font-bold shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
