'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  generateKPIImprovementProposals,
  sortProposalsByPriority,
  filterProposalsByCategory,
  type KPIMetrics,
  type KPITarget,
} from '@/server/services/scm/kpi-improvement';
import { KPIImprovementCard } from './kpi-improvement-card';
import { AlertCircle, Lightbulb, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';

interface KPIImprovementSuggestionsProps {
  metrics: KPIMetrics;
  targets: KPITarget;
  className?: string;
}

export function KPIImprovementSuggestions({
  metrics,
  targets,
  className,
}: KPIImprovementSuggestionsProps) {
  // 개선 제안 생성 및 우선순위 정렬
  const proposals = useMemo(() => {
    const all = generateKPIImprovementProposals(metrics, targets);
    return sortProposalsByPriority(all);
  }, [metrics, targets]);

  // 카테고리별 필터링
  const inventoryProposals = useMemo(
    () => filterProposalsByCategory(proposals, 'inventory'),
    [proposals]
  );
  const orderProposals = useMemo(() => filterProposalsByCategory(proposals, 'order'), [proposals]);
  const costProposals = useMemo(() => filterProposalsByCategory(proposals, 'cost'), [proposals]);

  // 우선순위별 카운트
  const highPriorityCount = proposals.filter((p) => p.priority === 'high').length;
  const mediumPriorityCount = proposals.filter((p) => p.priority === 'medium').length;
  const lowPriorityCount = proposals.filter((p) => p.priority === 'low').length;

  if (proposals.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            KPI 개선 제안
          </CardTitle>
          <CardDescription>현재 KPI 현황에 기반한 맞춤형 개선 제안</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-12 dark:border-slate-700">
            <AlertCircle className="h-8 w-8 text-slate-400" />
            <p className="mt-2 text-center text-sm text-slate-500">
              모든 KPI가 목표를 달성했습니다!
            </p>
            <p className="mt-1 text-center text-xs text-slate-400">
              지속적인 개선을 통해 경쟁력을 강화하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              KPI 개선 제안
            </CardTitle>
            <CardDescription>현재 KPI 현황에 기반한 맞춤형 개선 제안</CardDescription>
          </div>

          {/* 우선순위별 요약 */}
          <div className="grid grid-cols-3 gap-2">
            {highPriorityCount > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <div className="text-center">
                  <p className="text-xs font-medium text-red-600 dark:text-red-300">긴급</p>
                  <p className="text-lg font-bold text-red-700 dark:text-red-200">
                    {highPriorityCount}개
                  </p>
                </div>
              </div>
            )}
            {mediumPriorityCount > 0 && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
                <div className="text-center">
                  <p className="text-xs font-medium text-yellow-600 dark:text-yellow-300">중간</p>
                  <p className="text-lg font-bold text-yellow-700 dark:text-yellow-200">
                    {mediumPriorityCount}개
                  </p>
                </div>
              </div>
            )}
            {lowPriorityCount > 0 && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <div className="text-center">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-300">낮음</p>
                  <p className="text-lg font-bold text-blue-700 dark:text-blue-200">
                    {lowPriorityCount}개
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              전체 ({proposals.length})
            </TabsTrigger>
            <TabsTrigger value="inventory">
              재고 ({inventoryProposals.length})
            </TabsTrigger>
            <TabsTrigger value="order">
              발주 ({orderProposals.length})
            </TabsTrigger>
            <TabsTrigger value="cost">
              비용 ({costProposals.length})
            </TabsTrigger>
          </TabsList>

          {/* 전체 제안 */}
          <TabsContent value="all" className="space-y-3">
            {proposals.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                현재 실행할 개선 제안이 없습니다.
              </div>
            ) : (
              proposals.map((proposal) => (
                <KPIImprovementCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </TabsContent>

          {/* 재고 관리 제안 */}
          <TabsContent value="inventory" className="space-y-3">
            {inventoryProposals.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                현재 실행할 재고 관리 개선 제안이 없습니다.
              </div>
            ) : (
              inventoryProposals.map((proposal) => (
                <KPIImprovementCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </TabsContent>

          {/* 발주 관리 제안 */}
          <TabsContent value="order" className="space-y-3">
            {orderProposals.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                현재 실행할 발주 관리 개선 제안이 없습니다.
              </div>
            ) : (
              orderProposals.map((proposal) => (
                <KPIImprovementCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </TabsContent>

          {/* 비용 최적화 제안 */}
          <TabsContent value="cost" className="space-y-3">
            {costProposals.length === 0 ? (
              <div className="text-center py-6 text-sm text-slate-500">
                현재 실행할 비용 최적화 개선 제안이 없습니다.
              </div>
            ) : (
              costProposals.map((proposal) => (
                <KPIImprovementCard key={proposal.id} proposal={proposal} />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* 액션 버튼 */}
        <div className="mt-6 flex gap-2 border-t pt-6 dark:border-slate-800">
          <Button className="flex-1" variant="default">
            <BarChart3 className="mr-2 h-4 w-4" />
            전체 계획 수립
          </Button>
          <Button className="flex-1" variant="outline">
            상세 분석 보기
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
