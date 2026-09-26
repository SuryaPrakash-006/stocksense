import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard-service";
import { productService } from "@/services/product-service";
import { warehouseService } from "@/services/warehouse-service";
import { useAuth } from "@/features/auth/AuthContext";
import { DashboardFilterParams, LowStockItem } from "@/types/dashboard";
import { ProductCategory } from "@/types/product";
import { Location, Warehouse } from "@/types/warehouse";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpFromLine,
  ArrowUpRight,
  Boxes,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  SlidersHorizontal,
  TrendingDown,
  Truck,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
];

