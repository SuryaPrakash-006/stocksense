import React from "react";
import { Badge } from "@/components/ui/badge";
import {
  FileEdit,
  Clock,
  PackageCheck,
  CheckCircle2,
  Ban,
  AlertTriangle,
  AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type StatusType =
  | "DRAFT"
  | "WAITING"
  | "READY"
  | "DONE"
  | "APPLIED"
  | "CANCELED"
  | "IN_STOCK"
  | "LOW_STOCK"
  | "OUT_OF_STOCK"
  | string;

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
  size?: "sm" | "default";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  size = "default",
}) => {
  const norm = (status || "").toUpperCase();

  switch (norm) {
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-slate-100/80 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium gap-1",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <FileEdit className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Draft</span>
        </Badge>
      );

    case "WAITING":
      return (
        <Badge
          className={cn(
            "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60 font-semibold gap-1 hover:bg-amber-100",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <Clock className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3 text-amber-600"} />
          <span>Waiting</span>
        </Badge>
      );

    case "READY":
      return (
        <Badge
          className={cn(
            "bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 font-semibold gap-1 hover:bg-blue-100",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <PackageCheck className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3 text-blue-600"} />
          <span>Ready</span>
        </Badge>
      );

    case "DONE":
    case "APPLIED":
      return (
        <Badge
          className={cn(
            "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60 font-semibold gap-1 hover:bg-emerald-100",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <CheckCircle2 className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3 text-emerald-600"} />
          <span>{norm === "APPLIED" ? "Applied" : "Done"}</span>
        </Badge>
      );

    case "CANCELED":
      return (
        <Badge
          variant="outline"
          className={cn(
            "bg-slate-50 text-slate-500 border-slate-200 line-through dark:bg-slate-900 dark:text-slate-500 dark:border-slate-800 font-medium gap-1",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <Ban className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Canceled</span>
        </Badge>
      );

    case "OUT_OF_STOCK":
      return (
        <Badge
          variant="destructive"
          className={cn(
            "font-semibold gap-1",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <AlertOctagon className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Out of Stock</span>
        </Badge>
      );

    case "LOW_STOCK":
      return (
        <Badge
          className={cn(
            "bg-amber-500 hover:bg-amber-600 text-white font-semibold gap-1",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <AlertTriangle className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>Low Stock</span>
        </Badge>
      );

    case "IN_STOCK":
      return (
        <Badge
          className={cn(
            "bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1",
            size === "sm" ? "text-[10px] px-1.5 py-0" : "text-xs px-2.5 py-0.5",
            className
          )}
        >
          <CheckCircle2 className={size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3"} />
          <span>In Stock</span>
        </Badge>
      );

    default:
      return (
        <Badge variant="outline" className={className}>
          {status}
        </Badge>
      );
  }
};
