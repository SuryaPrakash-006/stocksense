import React from "react";
import { useHealth } from "@/hooks/use-health";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Database,
  RefreshCw,
  Clock,
  CheckCircle2,
  XCircle,
  Cpu,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const HealthPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useHealth();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System & Infrastructure Health
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time diagnostics across Frontend, FastAPI Backend, and PostgreSQL database.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          <span>Refresh Diagnostics</span>
        </Button>
      </div>

      {/* Main Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Frontend Status */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Frontend Client
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                Online
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              React + Vite + TypeScript
            </p>
          </CardContent>
        </Card>

        {/* Backend API Status */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Backend API
            </CardTitle>
            <Server className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading
                  ? "Checking..."
                  : isError
                  ? "Unreachable"
                  : data?.status === "healthy"
                  ? "Operational"
                  : "Degraded"}
              </div>
              {isLoading ? (
                <Badge variant="secondary">Connecting</Badge>
              ) : isError ? (
                <Badge variant="destructive">Offline</Badge>
              ) : data?.status === "healthy" ? (
                <Badge variant="success">Healthy</Badge>
              ) : (
                <Badge variant="warning">Degraded</Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data ? `FastAPI v${data.version} (${data.environment})` : "FastAPI 0.110+"}
            </p>
          </CardContent>
        </Card>

        {/* PostgreSQL Database Status */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              PostgreSQL Database
            </CardTitle>
            <Database className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mt-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading
                  ? "Checking..."
                  : isError || !data?.database.connected
                  ? "Disconnected"
                  : "Connected"}
              </div>
              {isLoading ? (
                <Badge variant="secondary">Testing</Badge>
              ) : isError || !data?.database.connected ? (
                <Badge variant="destructive">Error</Badge>
              ) : (
                <Badge variant="success">
                  {data.database.latency_ms} ms
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {data?.database.connected
                ? `SQLAlchemy 2.0 AsyncPool · ${data.database.latency_ms}ms roundtrip`
                : data?.database.error || "Awaiting database response"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Diagnostics Details */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            System Connectivity & Configuration Details
          </CardTitle>
          <CardDescription>
            Live parameters retrieved from the running FastAPI backend and PostgreSQL session.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-500">
              <RefreshCw className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm">Querying backend health endpoint...</p>
            </div>
          ) : isError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-6 dark:border-rose-900/50 dark:bg-rose-950/20">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-rose-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                    Failed to connect to FastAPI Backend
                  </h4>
                  <p className="text-xs text-rose-700 dark:text-rose-300">
                    {error instanceof Error ? error.message : "Network error. Ensure the backend server is running on port 8000."}
                  </p>
                  <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 font-mono bg-white dark:bg-slate-900 p-3 rounded border">
                    Check if uvicorn is running: <br />
                    <code>uvicorn app.main:app --reload --port 8000</code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <Cpu className="h-4 w-4 text-primary" />
                  <span>Backend Metadata</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Application Name:</span>
                    <span className="font-semibold">{data?.project_name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Environment:</span>
                    <span className="font-semibold uppercase">{data?.environment}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">API Version:</span>
                    <span className="font-mono">{data?.version}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Server Time (UTC):</span>
                    <span className="font-mono">{new Date(data?.timestamp || "").toISOString()}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>PostgreSQL Pool Status</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Database Engine:</span>
                    <span className="font-semibold">PostgreSQL 16+</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Session Driver:</span>
                    <span className="font-mono">asyncpg (SQLAlchemy 2.0)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500">Ping Query:</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">SELECT 1</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Query Latency:</span>
                    <span className="font-semibold">{data?.database.latency_ms} ms</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
