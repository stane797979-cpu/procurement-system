"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductMovementSummary } from "@/server/actions/inventory-movement";

interface SummaryTableProps {
  products: ProductMovementSummary[];
}

type SortKey =
  | "sku"
  | "name"
  | "openingStock"
  | "totalInbound"
  | "totalOutbound"
  | "closingStock"
  | "netChange";

export function SummaryTable({ products }: SummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("sku");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "sku":
          cmp = a.productSku.localeCompare(b.productSku);
          break;
        case "name":
          cmp = a.productName.localeCompare(b.productName);
          break;
        case "openingStock":
          cmp = a.openingStock - b.openingStock;
          break;
        case "totalInbound":
          cmp = a.totalInbound - b.totalInbound;
          break;
        case "totalOutbound":
          cmp = a.totalOutbound - b.totalOutbound;
          break;
        case "closingStock":
          cmp = a.closingStock - b.closingStock;
          break;
        case "netChange":
          cmp =
            a.totalInbound -
            a.totalOutbound -
            (b.totalInbound - b.totalOutbound);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [products, sortKey, sortDir]);

  // 전체 합계
  const totals = useMemo(() => {
    return products.reduce(
      (acc, p) => ({
        openingStock: acc.openingStock + p.openingStock,
        totalInbound: acc.totalInbound + p.totalInbound,
        totalOutbound: acc.totalOutbound + p.totalOutbound,
        closingStock: acc.closingStock + p.closingStock,
      }),
      { openingStock: 0, totalInbound: 0, totalOutbound: 0, closingStock: 0 }
    );
  }, [products]);

  if (products.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-slate-400">
        해당 기간의 재고 변동이 없습니다
      </div>
    );
  }

  const SortButton = ({
    column,
    children,
    className,
  }: {
    column: SortKey;
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      className={cn("flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100", className)}
      onClick={() => handleSort(column)}
    >
      {children}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="rounded-md border overflow-auto">
      <Table className="table-fixed">
        <colgroup>
          <col style={{ width: "10%" }} />
          <col style={{ width: "30%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
          <col style={{ width: "12%" }} />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">
              <SortButton column="sku">SKU</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap">
              <SortButton column="name">제품명</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              <SortButton column="openingStock" className="ml-auto">기초재고</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              <SortButton column="totalInbound" className="ml-auto">총 입고</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              <SortButton column="totalOutbound" className="ml-auto">총 출고</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              <SortButton column="closingStock" className="ml-auto">기말재고</SortButton>
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              <SortButton column="netChange" className="ml-auto">순변동</SortButton>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedProducts.map((product) => {
            const netChange = product.totalInbound - product.totalOutbound;
            return (
              <TableRow key={product.productId}>
                <TableCell className="whitespace-nowrap font-mono text-sm">
                  {product.productSku}
                </TableCell>
                <TableCell className="whitespace-nowrap">{product.productName}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {product.openingStock.toLocaleString()}
                </TableCell>
                <TableCell className="text-right tabular-nums text-blue-600">
                  {product.totalInbound > 0
                    ? `+${product.totalInbound.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell className="text-right tabular-nums text-red-600">
                  {product.totalOutbound > 0
                    ? `-${product.totalOutbound.toLocaleString()}`
                    : "-"}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {product.closingStock.toLocaleString()}
                </TableCell>
                <TableCell
                  className={`text-right tabular-nums font-medium ${
                    netChange > 0
                      ? "text-blue-600"
                      : netChange < 0
                        ? "text-red-600"
                        : "text-slate-400"
                  }`}
                >
                  {netChange > 0 ? "+" : ""}
                  {netChange.toLocaleString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="font-semibold">
            <TableCell colSpan={2}>합계 ({products.length}개 제품)</TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.openingStock.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums text-blue-600">
              +{totals.totalInbound.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums text-red-600">
              -{totals.totalOutbound.toLocaleString()}
            </TableCell>
            <TableCell className="text-right tabular-nums">
              {totals.closingStock.toLocaleString()}
            </TableCell>
            <TableCell
              className={`text-right tabular-nums ${
                totals.totalInbound - totals.totalOutbound > 0
                  ? "text-blue-600"
                  : totals.totalInbound - totals.totalOutbound < 0
                    ? "text-red-600"
                    : "text-slate-400"
              }`}
            >
              {totals.totalInbound - totals.totalOutbound > 0 ? "+" : ""}
              {(totals.totalInbound - totals.totalOutbound).toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
