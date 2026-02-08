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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { processInventoryTransaction } from "@/server/actions/inventory";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export interface AdjustmentTarget {
  productId: string;
  sku: string;
  name: string;
  currentStock: number;
}

interface InventoryAdjustmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: AdjustmentTarget | null;
  onSuccess: () => void;
}

export function InventoryAdjustmentDialog({
  open,
  onOpenChange,
  target,
  onSuccess,
}: InventoryAdjustmentDialogProps) {
  const [direction, setDirection] = useState<"increase" | "decrease">("increase");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const quantityNum = Number(quantity) || 0;
  const expectedStock =
    direction === "increase"
      ? (target?.currentStock ?? 0) + quantityNum
      : (target?.currentStock ?? 0) - quantityNum;

  const handleSubmit = async () => {
    if (!target || quantityNum <= 0) return;

    setIsSubmitting(true);
    try {
      const result = await processInventoryTransaction({
        productId: target.productId,
        changeType: direction === "increase" ? "INBOUND_ADJUSTMENT" : "OUTBOUND_ADJUSTMENT",
        quantity: quantityNum,
        notes: notes || undefined,
        location: location || undefined,
      });

      if (result.success) {
        toast({
          title: "재고 조정 완료",
          description: `${target.name}: ${result.stockBefore} → ${result.stockAfter}`,
        });
        handleClose();
        onSuccess();
      } else {
        toast({
          title: "재고 조정 실패",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "오류 발생",
        description: "재고 조정 처리 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDirection("increase");
    setQuantity("");
    setLocation("");
    setNotes("");
    onOpenChange(false);
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>재고 조정</DialogTitle>
          <DialogDescription>
            재고 수량을 수동으로 조정합니다. 변동 이력이 기록됩니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제품 정보 (읽기 전용) */}
          <div className="rounded-lg border bg-slate-50 p-3 dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">SKU</span>
                <p className="font-mono font-medium">{target.sku}</p>
              </div>
              <div>
                <span className="text-slate-500">제품명</span>
                <p className="font-medium">{target.name}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500">현재고</span>
                <p className="text-lg font-bold">{target.currentStock.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 조정 유형 */}
          <div className="space-y-2">
            <Label>조정 유형</Label>
            <Select
              value={direction}
              onValueChange={(v: string) => setDirection(v as "increase" | "decrease")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="increase">증가 (조정 입고)</SelectItem>
                <SelectItem value="decrease">감소 (조정 출고)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 수량 */}
          <div className="space-y-2">
            <Label htmlFor="quantity">수량</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder="조정 수량 입력"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* 예상 결과 미리보기 */}
          {quantityNum > 0 && (
            <div className="rounded-lg border bg-blue-50 p-3 dark:bg-blue-950">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                예상 결과: {target.currentStock.toLocaleString()}{" "}
                {direction === "increase" ? "+" : "−"} {quantityNum.toLocaleString()} ={" "}
                <span className="font-bold">{expectedStock.toLocaleString()}</span>
              </p>
              {direction === "decrease" && expectedStock < 0 && (
                <p className="mt-1 text-xs text-red-600">
                  재고가 부족합니다. 현재고보다 많은 수량을 출고할 수 없습니다.
                </p>
              )}
            </div>
          )}

          {/* 창고 위치 */}
          <div className="space-y-2">
            <Label htmlFor="location">창고 위치 (선택)</Label>
            <Input
              id="location"
              placeholder="예: A-01-02"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* 사유 */}
          <div className="space-y-2">
            <Label htmlFor="notes">사유 (선택)</Label>
            <Textarea
              id="notes"
              placeholder="재고 조정 사유를 입력하세요"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              quantityNum <= 0 ||
              (direction === "decrease" && expectedStock < 0)
            }
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            조정 적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
