"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// 재고회전율 데이터 타입 정의
export interface TurnoverData {
  id: string;
  sku: string;
  name: string;
  annualRevenue: number; // 연간판매액
  cogs: number; // 연간판매원가 (Cost of Goods Sold)
  avgInventoryValue: number; // 평균재고금액
  turnoverRate: number; // 재고회전율
  daysOfInventory: number; // 재고일수 (DOI)
  status: "high" | "normal" | "low" | "critical"; // 회전율 상태
}

interface InventoryTurnoverProps {
  className?: string;
}

// Mock 데이터 생성 함수
function generateMockTurnoverData(): TurnoverData[] {
  const products = [
    {
      sku: "SKU-001",
      name: "프리미엄 노트북",
      annualRevenue: 50000000,
      cogsRate: 0.7,
      avgInv: 3500000,
    },
    {
      sku: "SKU-002",
      name: "무선 이어폰",
      annualRevenue: 35000000,
      cogsRate: 0.65,
      avgInv: 1800000,
    },
    {
      sku: "SKU-003",
      name: "스마트워치",
      annualRevenue: 28000000,
      cogsRate: 0.68,
      avgInv: 3200000,
    },
    {
      sku: "SKU-004",
      name: "블루투스 스피커",
      annualRevenue: 25000000,
      cogsRate: 0.72,
      avgInv: 1400000,
    },
    { sku: "SKU-005", name: "태블릿 PC", annualRevenue: 22000000, cogsRate: 0.69, avgInv: 2500000 },
    { sku: "SKU-006", name: "USB 충전기", annualRevenue: 8000000, cogsRate: 0.55, avgInv: 600000 },
    {
      sku: "SKU-007",
      name: "노트북 거치대",
      annualRevenue: 6500000,
      cogsRate: 0.58,
      avgInv: 850000,
    },
    {
      sku: "SKU-008",
      name: "마우스 패드",
      annualRevenue: 5200000,
      cogsRate: 0.52,
      avgInv: 1100000,
    },
    { sku: "SKU-009", name: "HDMI 케이블", annualRevenue: 4800000, cogsRate: 0.5, avgInv: 350000 },
    { sku: "SKU-010", name: "키보드 커버", annualRevenue: 4200000, cogsRate: 0.54, avgInv: 500000 },
    {
      sku: "SKU-011",
      name: "화면 보호 필름",
      annualRevenue: 3800000,
      cogsRate: 0.48,
      avgInv: 900000,
    },
    { sku: "SKU-012", name: "클리닝 키트", annualRevenue: 1200000, cogsRate: 0.45, avgInv: 450000 },
    {
      sku: "SKU-013",
      name: "케이블 정리함",
      annualRevenue: 950000,
      cogsRate: 0.52,
      avgInv: 850000,
    },
    { sku: "SKU-014", name: "스티커 팩", annualRevenue: 680000, cogsRate: 0.4, avgInv: 280000 },
    { sku: "SKU-015", name: "먼지 플러그", annualRevenue: 520000, cogsRate: 0.42, avgInv: 90000 },
  ];

  return products.map((p, idx) => {
    const cogs = p.annualRevenue * p.cogsRate;
    const turnoverRate = cogs / p.avgInv;
    const daysOfInventory = 365 / turnoverRate;

    let status: TurnoverData["status"];
    if (turnoverRate >= 12) status = "high";
    else if (turnoverRate >= 6) status = "normal";
    else if (turnoverRate >= 3) status = "low";
    else status = "critical";

    return {
      id: (idx + 1).toString(),
      sku: p.sku,
      name: p.name,
      annualRevenue: p.annualRevenue,
      cogs,
      avgInventoryValue: p.avgInv,
      turnoverRate,
      daysOfInventory,
      status,
    };
  });
}

// 상태 Badge 컴포넌트
function TurnoverStatusBadge({ status }: { status: TurnoverData["status"] }) {
  const config = {
    high: {
      label: "고회전",
      variant: "default" as const,
      className: "bg-green-500 hover:bg-green-600",
    },
    normal: {
      label: "정상",
      variant: "secondary" as const,
      className: "bg-blue-500 hover:bg-blue-600 text-white",
    },
    low: {
      label: "저회전",
      variant: "outline" as const,
      className: "border-orange-500 text-orange-700",
    },
    critical: { label: "위험", variant: "destructive" as const, className: "" },
  };

  const { label, variant, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}

type SortKey = "sku" | "name" | "annualRevenue" | "avgInventoryValue" | "turnoverRate" | "daysOfInventory" | "status";
type SortOrder = "asc" | "desc";

export function InventoryTurnover({ className }: InventoryTurnoverProps) {
  const data = useMemo(() => generateMockTurnoverData(), []);
  const [sortKey, setSortKey] = useState<SortKey>("turnoverRate");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // 요약 통계 계산
  const summary = useMemo(() => {
    const avgTurnoverRate = data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length;
    const avgDOI = data.reduce((sum, item) => sum + item.daysOfInventory, 0) / data.length;
    const lowTurnoverCount = data.filter(
      (item) => item.status === "low" || item.status === "critical"
    ).length;

    return {
      avgTurnoverRate: avgTurnoverRate.toFixed(1),
      avgDOI: Math.round(avgDOI),
      lowTurnoverCount,
    };
  }, [data]);

  // 정렬 처리
  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal, "ko")
          : bVal.localeCompare(aVal, "ko");
      }

      return sortOrder === "asc"
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });
    return sorted;
  }, [data, sortKey, sortOrder]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  // 재고일수 분포 계산 (차트용)
  const doiDistribution = useMemo(() => {
    const ranges = [
      { label: "0-30일", min: 0, max: 30, count: 0 },
      { label: "31-60일", min: 31, max: 60, count: 0 },
      { label: "61-90일", min: 61, max: 90, count: 0 },
      { label: "91-120일", min: 91, max: 120, count: 0 },
      { label: "120일 초과", min: 121, max: Infinity, count: 0 },
    ];

    data.forEach((item) => {
      const range = ranges.find(
        (r) => item.daysOfInventory >= r.min && item.daysOfInventory <= r.max
      );
      if (range) range.count++;
    });

    const maxCount = Math.max(...ranges.map((r) => r.count));
    return ranges.map((r) => ({ ...r, percentage: maxCount > 0 ? (r.count / maxCount) * 100 : 0 }));
  }, [data]);

  return (
    <div className={cn("space-y-6", className)}>
      {/* 요약 카드 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 재고회전율</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgTurnoverRate}회</div>
            <p className="text-muted-foreground mt-1 text-xs">연간 기준</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">평균 재고일수</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.avgDOI}일</div>
            <p className="text-muted-foreground mt-1 text-xs">재고 보유 기간</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">저회전 품목</CardTitle>
            <AlertTriangle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.lowTurnoverCount}개</div>
            <p className="text-muted-foreground mt-1 text-xs">회전율 6회 미만</p>
          </CardContent>
        </Card>
      </div>

      {/* 재고일수 분포 차트 */}
      <Card>
        <CardHeader>
          <CardTitle>재고일수 분포</CardTitle>
          <CardDescription>제품별 재고 보유 기간 분포 현황</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {doiDistribution.map((range) => (
              <div key={range.label} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{range.label}</div>
                <div className="flex-1">
                  <div className="bg-muted h-8 overflow-hidden rounded-md">
                    <div
                      className="flex h-full items-center justify-end bg-blue-500 pr-2 transition-all duration-300"
                      style={{ width: `${range.percentage}%` }}
                    >
                      {range.count > 0 && (
                        <span className="text-xs font-semibold text-white">{range.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 재고회전율 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>재고회전율 상세 현황</CardTitle>
          <CardDescription>제품별 재고회전율 및 재고일수 분석</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">
                  <button onClick={() => handleSort("sku")} className="flex items-center gap-1 hover:text-slate-900">
                    SKU
                    {sortKey === "sku" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("name")} className="flex items-center gap-1 hover:text-slate-900">
                    제품명
                    {sortKey === "name" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button onClick={() => handleSort("annualRevenue")} className="ml-auto flex items-center gap-1 hover:text-slate-900">
                    연간판매액
                    {sortKey === "annualRevenue" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button onClick={() => handleSort("avgInventoryValue")} className="ml-auto flex items-center gap-1 hover:text-slate-900">
                    평균재고금액
                    {sortKey === "avgInventoryValue" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button onClick={() => handleSort("turnoverRate")} className="ml-auto flex items-center gap-1 hover:text-slate-900">
                    회전율
                    {sortKey === "turnoverRate" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead className="text-right">
                  <button onClick={() => handleSort("daysOfInventory")} className="ml-auto flex items-center gap-1 hover:text-slate-900">
                    재고일수
                    {sortKey === "daysOfInventory" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
                <TableHead>
                  <button onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-slate-900">
                    상태
                    {sortKey === "status" ? (sortOrder === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />) : <ArrowUpDown className="h-3 w-3 text-slate-400" />}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.sku}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-right">
                    {item.annualRevenue.toLocaleString("ko-KR")}원
                  </TableCell>
                  <TableCell className="text-right">
                    {item.avgInventoryValue.toLocaleString("ko-KR")}원
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {item.turnoverRate.toFixed(1)}회
                  </TableCell>
                  <TableCell className="text-right">{Math.round(item.daysOfInventory)}일</TableCell>
                  <TableCell>
                    <TurnoverStatusBadge status={item.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 상태 기준 설명 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">재고회전율 상태 기준</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2">
              <TurnoverStatusBadge status="high" />
              <span className="text-sm">회전율 12회 이상</span>
            </div>
            <div className="flex items-center gap-2">
              <TurnoverStatusBadge status="normal" />
              <span className="text-sm">회전율 6-12회</span>
            </div>
            <div className="flex items-center gap-2">
              <TurnoverStatusBadge status="low" />
              <span className="text-sm">회전율 3-6회</span>
            </div>
            <div className="flex items-center gap-2">
              <TurnoverStatusBadge status="critical" />
              <span className="text-sm">회전율 3회 미만</span>
            </div>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            재고회전율 = 연간판매원가(COGS) / 평균재고금액 | 재고일수 = 365 / 재고회전율
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
