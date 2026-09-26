import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { warehouseService } from "@/services/warehouse-service";
import { LocationType, Warehouse } from "@/types/warehouse";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertCircle,
  Building2,
  MapPin,
  Plus,
  RefreshCw,
  X,
} from "lucide-react";

export const WarehousesPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Modals
  const [isCreateWhOpen, setIsCreateWhOpen] = useState(false);
  const [isCreateLocOpen, setIsCreateLocOpen] = useState(false);
  const [selectedWhId, setSelectedWhId] = useState<string>("");

  // Create Warehouse Form State
  const [whName, setWhName] = useState("");
  const [whCode, setWhCode] = useState("");
  const [whAddress, setWhAddress] = useState("");
  const [whError, setWhError] = useState<string | null>(null);

  // Create Location Form State
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locType, setLocType] = useState<LocationType>("INTERNAL");
  const [locError, setLocError] = useState<string | null>(null);

  const {
    data: warehouses = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery<Warehouse[]>({
    queryKey: ["warehouses"],
    queryFn: () => warehouseService.listWarehouses(),
  });

  // Mutations
  const createWhMutation = useMutation({
    mutationFn: async (data: { name: string; code: string; address?: string }) => {
      return await warehouseService.createWarehouse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setIsCreateWhOpen(false);
      setWhName("");
      setWhCode("");
      setWhAddress("");
    },
  });

  const createLocMutation = useMutation({
    mutationFn: async (data: {
      warehouse_id: string;
      name: string;
      code: string;
      location_type: LocationType;
    }) => {
      const res = await apiClient.post("/warehouses/locations", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setIsCreateLocOpen(false);
      setLocName("");
      setLocCode("");
      setLocType("INTERNAL");
    },
  });

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    setWhError(null);
    if (!whName.trim() || !whCode.trim()) {
      setWhError("Name and Code are required.");
      return;
    }
    try {
      await createWhMutation.mutateAsync({
        name: whName.trim(),
        code: whCode.trim(),
        address: whAddress.trim() || undefined,
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to create warehouse.";
      setWhError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocError(null);
    if (!selectedWhId) {
      setLocError("Please select a target warehouse.");
      return;
    }
    if (!locName.trim() || !locCode.trim()) {
      setLocError("Location name and code are required.");
      return;
    }
    try {
      await createLocMutation.mutateAsync({
        warehouse_id: selectedWhId,
        name: locName.trim(),
        code: locCode.trim(),
        location_type: locType,
      });
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || "Failed to create location.";
      setLocError(typeof msg === "string" ? msg : JSON.stringify(msg));
    }
  };

  const getLocationTypeBadge = (type: string) => {
    switch (type) {
      case "INTERNAL":
        return <Badge variant="outline" className="bg-slate-50 text-slate-700 text-[10px]">Internal Storage</Badge>;
      case "RECEIVING":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 text-[10px]">Receiving Bay</Badge>;
      case "SHIPPING":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 text-[10px]">Shipping Dock</Badge>;
      case "PRODUCTION":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 text-[10px]">Production Floor</Badge>;
      case "SCRAP":
        return <Badge variant="outline" className="bg-rose-50 text-rose-700 text-[10px]">Scrap / Quarantine</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-indigo-600" />
            <span>Warehouses & Locations</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure warehouses and internal stock storage locations across facilities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-9 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRefetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setIsCreateWhOpen(true)}
            className="h-9 px-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Warehouse</span>
          </Button>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      {isLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-3 text-sm text-slate-500">Loading warehouses...</p>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Building2 className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">No Warehouses Configured</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Click "Add Warehouse" to register your company's physical storage facilities.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >
              {/* Warehouse Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                        {wh.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {wh.code}
                      </span>
                    </div>
                    {wh.address && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {wh.address}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedWhId(wh.id);
                    setIsCreateLocOpen(true);
                  }}
                  className="text-xs h-8 flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Add Location</span>
                </Button>
              </div>

              {/* Locations List */}
              <div className="p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                  Locations inside {wh.name} ({(wh.locations || []).length})
                </h3>

                {(wh.locations || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-3">No locations registered inside this warehouse.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {wh.locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {loc.name}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-slate-400">
                            Code: {loc.code}
                          </span>
                        </div>
                        <div>{getLocationTypeBadge(loc.location_type)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Warehouse Modal */}
      {isCreateWhOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add New Warehouse
              </h2>
              <button
                onClick={() => setIsCreateWhOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWarehouse} className="p-6 space-y-4">
              {whError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{whError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Warehouse Name *</Label>
                <Input
                  placeholder="e.g. Central Distribution Depot"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Warehouse Code *</Label>
                <Input
                  placeholder="e.g. WH-CENTRAL"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  className="h-9 text-sm uppercase"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Physical Address (Optional)</Label>
                <Input
                  placeholder="e.g. 100 Logistics Blvd, Dock 4"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateWhOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createWhMutation.isPending}
                  className="bg-indigo-600 text-white"
                >
                  {createWhMutation.isPending ? "Creating..." : "Create Warehouse"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {isCreateLocOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Add Location to Warehouse
              </h2>
              <button
                onClick={() => setIsCreateLocOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateLocation} className="p-6 space-y-4">
              {locError && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{locError}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Location Name *</Label>
                <Input
                  placeholder="e.g. Aisle 4 - Shelf B"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Location Code *</Label>
                <Input
                  placeholder="e.g. A4-SH-B"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  className="h-9 text-sm uppercase"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Location Type</Label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value as LocationType)}
                  className="w-full h-9 px-3 rounded-md border text-sm bg-transparent"
                >
                  <option value="INTERNAL">Internal Storage (Racks/Shelves)</option>
                  <option value="RECEIVING">Receiving Staging Area</option>
                  <option value="SHIPPING">Shipping Dispatch Dock</option>
                  <option value="PRODUCTION">Production Floor</option>
                  <option value="TRANSIT">In-Transit Buffer</option>
                  <option value="SCRAP">Scrap / Quarantine</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateLocOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createLocMutation.isPending}
                  className="bg-indigo-600 text-white"
                >
                  {createLocMutation.isPending ? "Creating..." : "Create Location"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
