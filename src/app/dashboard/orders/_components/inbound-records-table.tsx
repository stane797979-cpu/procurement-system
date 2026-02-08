"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface InboundRecord {
  id: string;
  purchaseOrderId: string | null;
  orderNumber: string | null;
  productId: string;
  productName: string;
  productSku: string;
  date: string;
  expectedQuantity: number | null;
  receivedQuantity: number;
  acceptedQuantity: number | null;
  rejectedQuantity: number | null;
  qualityResult: string | null;
  location: string | null;
  lotNumber: string | null;
  expiryDate: string | null;
  notes: string | null;
  createdAt: Date;
}

/**
 * 유통기한 임박 여부 확인 (7일 이내)
 */
function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate) < new Date();
}

interface InboundRecordsTableProps {
  records: InboundRecord[];
  className?: string;
}

const qualityBadge = (result: string | null) => {
  switch (result) {
    case "pass":
      return <Badge className="bg-green-600">합격</Badge>;
    case "fail":
      return <Badge variant="destructive">불합격</Badge>;
    case "partial":
      return (
        <Badge variant="destructive" className="bg-orange-600">
          부분합격
        </Badge>
      );
    case "pending":
      return <Badge variant="secondary">검수대기</Badge>;
    default:
      return <Badge variant="outline">-</Badge>;
  }
};

export function InboundRecordsTable({ records, className }: InboundRecordsTableProps) {
  if (records.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-400">
        해당 기간의 입고 기록이 없습니다
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">입고일</TableHead>
            <TableHead className="whitespace-nowrap">발주번호</TableHead>
            <TableHead className="whitespace-nowrap">SKU</TableHead>
            <TableHead className="whitespace-nowrap">제품명</TableHead>
            <TableHead className="whitespace-nowrap text-right">입고수량</TableHead>
            <TableHead className="whitespace-nowrap text-right">합격수량</TableHead>
            <TableHead className="whitespace-nowrap">품질결과</TableHead>
            <TableHead className="whitespace-nowrap">적치위치</TableHead>
            <TableHead className="whitespace-nowrap">LOT번호</TableHead>
            <TableHead className="whitespace-nowrap">유통기한</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="whitespace-nowrap text-sm">{record.date}</TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">
                {record.orderNumber || "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs">{record.productSku}</TableCell>
              <TableCell className="whitespace-nowrap font-medium">{record.productName}</TableCell>
              <TableCell className="whitespace-nowrap text-right font-semibold">
                {record.receivedQuantity}
              </TableCell>
              <TableCell className="whitespace-nowrap text-right">
                {record.acceptedQuantity ?? "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap">{qualityBadge(record.qualityResult)}</TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-600">
                {record.location || "-"}
              </TableCell>
              <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                {record.lotNumber || "-"}
              </TableCell>
              <TableCell
                className={cn(
                  "text-sm",
                  isExpired(record.expiryDate) && "font-semibold text-red-600",
                  isExpiringSoon(record.expiryDate) && "font-semibold text-orange-600"
                )}
              >
                {record.expiryDate || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
