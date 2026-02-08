"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateOutboundRecord } from "@/server/actions/outbound";
import { useToast } from "@/hooks/use-toast";
import type { OutboundRecord } from "@/server/actions/outbound";

interface OutboundEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: OutboundRecord | null;
  onSuccess: () => void;
}

export function OutboundEditDialog({
  open,
  onOpenChange,
  record,
  onSuccess,
}: OutboundEditDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // 다이얼로그가 열릴 때 초기값 설정
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && record) {
      setQuantity(String(Math.abs(record.changeAmount)));
      setNotes(record.notes || "");
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!record) return;

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      toast({
        title: "입력 오류",
        description: "수량은 1 이상의 숫자여야 합니다",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateOutboundRecord({
        historyId: record.id,
        quantity: qty,
        notes: notes || undefined,
      });

      if (result.success) {
        toast({
          title: "수정 완료",
          description: "출고 기록이 수정되었습니다",
        });
        onOpenChange(false);
        onSuccess();
      } else {
        toast({
          title: "수정 실패",
          description: result.error || "출고 기록 수정에 실패했습니다",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("출고 수정 오류:", error);
      toast({
        title: "오류",
        description: "출고 기록 수정 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!record) return null;

  const originalQty = Math.abs(record.changeAmount);
  const newQty = parseInt(quantity, 10) || 0;
  const diff = originalQty - newQty;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>출고 기록 수정</DialogTitle>
          <DialogDescription>
            출고 수량과 비고를 수정합니다. 재고가 자동으로 보정됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제품 정보 (읽기 전용) */}
          <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">SKU: </span>
                <span className="font-mono font-medium">{record.productSku}</span>
              </div>
              <div>
                <span className="text-slate-500">날짜: </span>
                <span className="font-mono">{record.date}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">제품: </span>
                <span className="font-medium">{record.productName}</span>
              </div>
            </div>
          </div>

          {/* 수량 */}
          <div className="space-y-2">
            <Label htmlFor="outbound-qty">출고 수량</Label>
            <Input
              id="outbound-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            {diff !== 0 && newQty > 0 && (
              <p className="text-xs text-slate-500">
                {diff > 0
                  ? `재고 ${diff}개 복원 (출고 줄어듦)`
                  : `재고 ${Math.abs(diff)}개 추가 차감 (출고 늘어남)`}
              </p>
            )}
          </div>

          {/* 비고 */}
          <div className="space-y-2">
            <Label htmlFor="outbound-notes">비고</Label>
            <Textarea
              id="outbound-notes"
              placeholder="수정 사유"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            수정
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
