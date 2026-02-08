"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProductMovementSummary } from "@/server/actions/inventory-movement";

interface DailyMovementTableProps {
  products: ProductMovementSummary[];
}

export function DailyMovementTable({ products }: DailyMovementTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        해당 기간의 재고 변동이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {products.map((product) => {
        // 변동이 있는 날짜만 필터링
        const activeDays = product.dailyMovements.filter(
          (d) => d.inbound > 0 || d.outbound > 0
        );

        if (activeDays.length === 0) return null;

        return (
          <div key={product.productId} className="rounded-md border">
            {/* 제품 헤더 */}
            <div className="flex items-center justify-between border-b bg-slate-50 px-4 py-2.5 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-semibold">
                  {product.productSku}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {product.productName}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>
                  입고:{" "}
                  <span className="font-medium text-blue-600">
                    +{product.totalInbound.toLocaleString()}
                  </span>
                </span>
                <span>
                  출고:{" "}
                  <span className="font-medium text-red-600">
                    -{product.totalOutbound.toLocaleString()}
                  </span>
                </span>
              </div>
            </div>

            {/* 일별 수불 테이블 */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">날짜</TableHead>
                  <TableHead className="w-[100px] text-right">
                    기초재고
                  </TableHead>
                  <TableHead className="w-[100px] text-right">입고</TableHead>
                  <TableHead className="w-[100px] text-right">출고</TableHead>
                  <TableHead className="w-[100px] text-right">
                    기말재고
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDays.map((movement) => (
                  <TableRow key={movement.date}>
                    <TableCell className="font-mono text-sm">
                      {movement.date}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {movement.openingStock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-blue-600">
                      {movement.inbound > 0
                        ? `+${movement.inbound.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-red-600">
                      {movement.outbound > 0
                        ? `-${movement.outbound.toLocaleString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {movement.closingStock.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {/* 제품 소계 행 */}
                <TableRow className="border-t-2 bg-slate-50/50 font-medium dark:bg-slate-800/30">
                  <TableCell>소계</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.openingStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-blue-600">
                    +{product.totalInbound.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-red-600">
                    -{product.totalOutbound.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {product.closingStock.toLocaleString()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );
      })}
    </div>
  );
}
