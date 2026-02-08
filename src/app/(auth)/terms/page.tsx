import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <Card className="border-2">
      <CardHeader>
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link href="/signup">
            <ArrowLeft className="mr-2 h-4 w-4" />
            회원가입으로 돌아가기
          </Link>
        </Button>
        <CardTitle className="text-2xl">이용약관</CardTitle>
      </CardHeader>
      <CardContent className="prose prose-sm max-w-none space-y-4 text-sm text-muted-foreground">
        <h3 className="text-base font-semibold text-foreground">제1조 (목적)</h3>
        <p>
          이 약관은 FloStok(이하 &quot;서비스&quot;)의 이용 조건 및 절차,
          회사와 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h3 className="text-base font-semibold text-foreground">제2조 (정의)</h3>
        <p>
          &quot;서비스&quot;란 AI 기반 재고 관리 및 자동 발주 추천 SaaS 플랫폼을 의미합니다.
          &quot;이용자&quot;란 서비스에 접속하여 이 약관에 따라 서비스를 이용하는 자를 말합니다.
        </p>

        <h3 className="text-base font-semibold text-foreground">제3조 (서비스 이용)</h3>
        <p>
          서비스는 회원가입 후 이용 가능하며, 무료 플랜과 유료 플랜이 제공됩니다.
          서비스의 구체적인 내용은 회사의 정책에 따라 변경될 수 있습니다.
        </p>

        <h3 className="text-base font-semibold text-foreground">제4조 (책임 제한)</h3>
        <p>
          서비스에서 제공하는 재고 분석, 발주 추천 등의 정보는 참고용이며,
          최종 의사결정은 이용자의 책임 하에 이루어져야 합니다.
        </p>

        <p className="pt-4 text-xs text-muted-foreground">
          시행일: 2026년 2월 7일
        </p>
      </CardContent>
    </Card>
  );
}
