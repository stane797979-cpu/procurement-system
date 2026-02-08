import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <Card className="border-2">
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/signup">
            <ArrowLeft className="mr-2 h-4 w-4" />
            회원가입으로 돌아가기
          </Link>
        </Button>
        <CardTitle className="text-2xl">개인정보처리방침</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
        <h3 className="text-base font-semibold text-foreground">1. 수집하는 개인정보</h3>
        <p>
          회원가입 시: 이메일, 이름, 조직명<br />
          서비스 이용 시: 재고 데이터, 발주 기록, 판매 데이터
        </p>

        <h3 className="text-base font-semibold text-foreground">2. 개인정보 이용 목적</h3>
        <p>
          회원 관리 및 본인 확인, 서비스 제공 및 개선,
          AI 기반 재고 분석 및 발주 추천 제공
        </p>

        <h3 className="text-base font-semibold text-foreground">3. 개인정보 보유 기간</h3>
        <p>
          회원 탈퇴 시까지 보유하며, 탈퇴 후 즉시 파기합니다.
          단, 관련 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
        </p>

        <h3 className="text-base font-semibold text-foreground">4. 개인정보 제3자 제공</h3>
        <p>
          이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다.
        </p>

        <h3 className="text-base font-semibold text-foreground">5. 문의</h3>
        <p>
          개인정보 관련 문의: logisglobalceo@gmail.com
        </p>

        <p className="pt-4 text-xs text-muted-foreground">
          시행일: 2026년 2월 7일
        </p>
      </CardContent>
    </Card>
  );
}
