import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { alertService } from "@/services/alert-service";
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertIndicatorProps {
  className?: string;
  variant?: "header" | "compact";
}

export const AlertIndicator: React.FC<AlertIndicatorProps> = ({
  className,
  variant = "header",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: summary, isLoading } = useQuery({
    queryKey: ["stockAlertsSummary"],
    queryFn: () => alertService.getSummary(),
    refetchInterval: 30000,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalAlerts = summary?.total_alerts || 0;
  const criticalCount = summary?.critical_count || 0;
  const warningCount = summary?.warning_count || 0;

  return (
    <div className={cn("relative inline-block", className)} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150",
          totalAlerts > 0
            ? criticalCount > 0
              ? "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800"
            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
        )}
        aria-label="Stock Alerts"
      >
        {totalAlerts > 0 ? (
          criticalCount > 0 ? (
            <AlertOctagon className="h-4 w-4 text-rose-600 dark:text-rose-400 animate-pulse" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          )
        ) : (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        )}

        <span className="font-semibold">
          {totalAlerts > 0
            ? `${totalAlerts} Stock Alert${totalAlerts > 1 ? "s" : ""}`
            : "Stock Healthy"}
        </span>

        {totalAlerts > 0 && (
          <span
            className={cn(
              "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-xs",
              criticalCount > 0 ? "bg-rose-600" : "bg-amber-600"
            )}
          >
            {totalAlerts}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Inventory Alerts
              </span>
            </div>
            <Link
              to="/alerts"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-1.5">
            {/* Out of Stock Row */}
            <div
              onClick={() => {
                setIsOpen(false);
                navigate("/alerts/out-of-stock");
              }}
              className="group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-rose-50/80 dark:hover:bg-rose-950/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 text-rose-600 dark:bg-rose-900/50 dark:text-rose-400">
                  <AlertOctagon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Out of Stock
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Quantity &le; 0 (Immediate restock needed)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
                  {criticalCount}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400" />
              </div>
            </div>

            {/* Low Stock Row */}
            <div
              onClick={() => {
                setIsOpen(false);
                navigate("/alerts/low-stock");
              }}
              className="group flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-amber-50/80 dark:hover:bg-amber-950/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Low Stock
                  </p>
                  <p className="text-[10px] text-slate-500">
                    0 &lt; Quantity &le; Reorder Level
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
                  {warningCount}
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/alerts");
              }}
              className="w-full text-center text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 py-1"
            >
              Open Inventory Alert Center &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
