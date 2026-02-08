/**
 * 결제 및 구독 관리 페이지
 * - 현재 준비 중 상태
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Construction } from "lucide-react";

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">결제 및 구독</h1>
        <p className="text-muted-foreground">구독 플랜을 관리하고 결제 내역을 확인하세요</p>
      </div>

      {/* 현재 플랜 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            현재 구독 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              Free 플랜
            </Badge>
            <span className="text-sm text-muted-foreground">무료 체험 중</span>
          </div>
        </CardContent>
      </Card>

      {/* 준비 중 안내 */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Construction className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">결제 시스템 준비 중</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground/70">
            플랜 업그레이드 및 결제 기능을 준비하고 있습니다.
            현재는 무료 플랜으로 모든 기능을 이용하실 수 있습니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
