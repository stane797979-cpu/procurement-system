import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  ClipboardList,
  BarChart3,
  Upload,
  ShoppingCart,
  TrendingUp,
  HelpCircle,
  Mail,
} from 'lucide-react';

const guides = [
  {
    icon: Package,
    title: '재고 현황 보기',
    description: '대시보드에서 전체 재고 상태를 한눈에 확인하세요. 품절, 위험, 부족 등 7단계로 분류됩니다.',
  },
  {
    icon: Upload,
    title: '데이터 임포트',
    description: '설정 > 데이터 관리에서 Excel 파일(.xlsx)로 제품 마스터와 판매 데이터를 일괄 등록할 수 있습니다.',
  },
  {
    icon: ShoppingCart,
    title: '발주 생성',
    description: '발주 관리 메뉴에서 신규 발주서를 생성하거나, 자동 추천 발주를 확인할 수 있습니다.',
  },
  {
    icon: ClipboardList,
    title: '발주 추적',
    description: '발주 상태(초안→승인→발주→입고)를 실시간으로 추적하고, 입고 처리까지 관리합니다.',
  },
  {
    icon: BarChart3,
    title: 'ABC/XYZ 분석',
    description: '분석 메뉴에서 제품별 중요도(ABC)와 수요 변동성(XYZ)을 조합한 9등급 분석을 확인하세요.',
  },
  {
    icon: TrendingUp,
    title: '수요 예측',
    description: 'SMA, 지수평활법, Holt 방법 등 다양한 알고리즘으로 미래 수요를 예측합니다.',
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HelpCircle className="h-6 w-6" />
          도움말
        </h1>
        <p className="text-muted-foreground mt-1">
          FloStok 사용 가이드
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((guide) => {
          const Icon = guide.icon;
          return (
            <Card key={guide.title}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  {guide.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-5 w-5" />
            문의하기
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>추가 도움이 필요하시면 아래로 연락해주세요.</p>
          <p>
            이메일: <Badge variant="outline">logisglobalceo@gmail.com</Badge>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
