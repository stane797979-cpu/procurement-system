"use client";

import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProducts } from "@/server/actions/products";
import { createOtherInbound } from "@/server/actions/inbound";

const INBOUND_TYPES = [
  { value: "INBOUND_RETURN", label: "반품 입고" },
  { value: "INBOUND_ADJUSTMENT", label: "조정 입고" },
  { value: "INBOUND_TRANSFER", label: "이동 입고" },
] as const;

interface OtherInboundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function OtherInboundDialog({ open, onOpenChange, onSuccess }: OtherInboundDialogProps) {
  const [productId, setProductId] = useState("");
  const [inboundType, setInboundType] = useState<string>("");
  const [quantity, setQuantity] = useState("");
  const [location, setLocation] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productOptions, setProductOptions] = useState<Array<{ id: string; sku: string; name: string }>>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const { toast } = useToast();

  // 제품 목록 로드
  useEffect(() => {
    if (open && productOptions.length === 0) {
      setIsLoadingProducts(true);
      getProducts({ limit: 500 })
        .then((result) => {
          setProductOptions(
            result.products.map((p) => ({ id: p.id, sku: p.sku, name: p.name }))
          );
        })
        .catch(console.error)
        .finally(() => setIsLoadingProducts(false));
    }
  }, [open, productOptions.length]);

  const handleSubmit = async () => {
    if (!productId || !inboundType || !quantity) return;

    setIsSubmitting(true);
    try {
      const result = await createOtherInbound({
        productId,
        inboundType: inboundType as "INBOUND_RETURN" | "INBOUND_ADJUSTMENT" | "INBOUND_TRANSFER",
        quantity: Number(quantity),
        location: location || undefined,
        lotNumber: lotNumber || undefined,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined,
      });

      if (result.success) {
        toast({
          title: "입고 처리 완료",
          description: `${INBOUND_TYPES.find((t) => t.value === inboundType)?.label} 처리가 완료되었습니다`,
        });
        handleClose();
        onSuccess();
      } else {
        toast({
          title: "입고 처리 실패",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "오류 발생",
        description: "입고 처리 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setProductId("");
    setInboundType("");
    setQuantity("");
    setLocation("");
    setLotNumber("");
    setExpiryDate("");
    setNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>기타 입고</DialogTitle>
          <DialogDescription>
            발주 외 입고(반품, 조정, 이동)를 처리합니다. 재고가 자동으로 증가합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 제품 선택 */}
          <div className="space-y-2">
            <Label>제품</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingProducts ? "로딩 중..." : "제품을 선택하세요"} />
              </SelectTrigger>
              <SelectContent>
                {productOptions.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    [{p.sku}] {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 입고 유형 */}
          <div className="space-y-2">
            <Label>입고 유형</Label>
            <Select value={inboundType} onValueChange={setInboundType}>
              <SelectTrigger>
                <SelectValue placeholder="입고 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {INBOUND_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 수량 */}
          <div className="space-y-2">
            <Label htmlFor="oi-quantity">수량</Label>
            <Input
              id="oi-quantity"
              type="number"
              min="1"
              placeholder="입고 수량"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* 적치 위치 */}
          <div className="space-y-2">
            <Label htmlFor="oi-location">적치 위치 (선택)</Label>
            <Input
              id="oi-location"
              placeholder="예: A-01-02"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* LOT 번호 */}
          <div className="space-y-2">
            <Label htmlFor="oi-lot">LOT 번호 (선택)</Label>
            <Input
              id="oi-lot"
              placeholder="LOT 번호"
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
            />
          </div>

          {/* 유통기한 */}
          <div className="space-y-2">
            <Label htmlFor="oi-expiry">유통기한 (선택)</Label>
            <Input
              id="oi-expiry"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          {/* 메모 */}
          <div className="space-y-2">
            <Label htmlFor="oi-notes">메모 (선택)</Label>
            <Textarea
              id="oi-notes"
              placeholder="입고 사유를 입력하세요"
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
            disabled={isSubmitting || !productId || !inboundType || !quantity || Number(quantity) <= 0}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            입고 처리
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
