import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, AlertCircle, Calendar } from "lucide-react";

interface ABCXYZSummaryProps {
  aCount: number;
  aPercentage: number;
  bCount: number;
  bPercentage: number;
  cCount: number;
  cPercentage: number;
  period: string;
}

export function ABCXYZSummary({
  aCount,
  aPercentage,
  bCount,
  bPercentage,
  cCount,
  cPercentage,
  period,
}: ABCXYZSummaryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">A등급 제품</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aCount}개</div>
          <p className="text-xs text-slate-500">전체의 {aPercentage.toFixed(1)}% (매출 상위 80%)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">B등급 제품</CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{bCount}개</div>
          <p className="text-xs text-slate-500">전체의 {bPercentage.toFixed(1)}% (매출 80-95%)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">C등급 제품</CardTitle>
          <AlertCircle className="h-4 w-4 text-slate-400" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cCount}개</div>
          <p className="text-xs text-slate-500">전체의 {cPercentage.toFixed(1)}% (매출 95-100%)</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">분석 기간</CardTitle>
          <Calendar className="h-4 w-4 text-slate-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{period}</div>
          <p className="text-xs text-slate-500">기준 데이터</p>
        </CardContent>
      </Card>
    </div>
  );
}
