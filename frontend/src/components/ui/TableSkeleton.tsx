import React from "react";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 6,
  className,
}) => {
  return (
    <div className={cn("w-full animate-pulse space-y-3 p-4", className)}>
      {/* Table Header Skeleton */}
      <div className="flex gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
        {Array.from({ length: columns }).map((_, i) => (
          <div
            key={i}
            className="h-4 flex-1 rounded-md bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>

      {/* Table Rows Skeleton */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex items-center gap-4 py-2 border-b border-slate-50 dark:border-slate-800/40"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className={cn(
                "h-4 rounded-md bg-slate-100 dark:bg-slate-800/60",
                colIndex === 0
                  ? "w-1/3"
                  : colIndex === columns - 1
                  ? "w-16"
                  : "flex-1"
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
