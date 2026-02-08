'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ImprovementProposal } from '@/server/services/scm/kpi-improvement';
import {
  ChevronDown,
  ChevronUp,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORY_ROUTES: Record<string, string> = {
  inventory: '/dashboard/inventory',
  order: '/dashboard/orders',
  cost: '/dashboard/analytics',
};

interface KPIImprovementCardProps {
  proposal: ImprovementProposal;
  className?: string;
}

export function KPIImprovementCard({ proposal, className }: KPIImprovementCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();

  const priorityConfig = {
    high: {
      label: '높음',
      color: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-900',
      textColor: 'text-red-700 dark:text-red-300',
      badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      icon: AlertCircle,
    },
    medium: {
      label: '중간',
      color: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-900',
      textColor: 'text-yellow-700 dark:text-yellow-300',
      badgeColor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
      icon: TrendingUp,
    },
    low: {
      label: '낮음',
      color: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-900',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: CheckCircle2,
    },
  };

  const categoryConfig = {
    inventory: {
      label: '재고 관리',
      icon: '📦',
      color: 'bg-purple-50 dark:bg-purple-950',
    },
    order: {
      label: '발주 관리',
      icon: '📋',
      color: 'bg-green-50 dark:bg-green-950',
    },
    cost: {
      label: '비용 최적화',
      icon: '💰',
      color: 'bg-indigo-50 dark:bg-indigo-950',
    },
  };

  const config = priorityConfig[proposal.priority];
  const catConfig = categoryConfig[proposal.kpiCategory];
  const PriorityIcon = config.icon;

  return (
    <Card
      className={cn(
        'border transition-all hover:shadow-md',
        config.color,
        isExpanded && 'ring-2 ring-offset-2',
        className
      )}
    >
      <CardHeader
        className="cursor-pointer pb-3 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="space-y-2">
          {/* 헤더: 제목과 카테고리 배지 */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 flex-shrink-0" />
                <CardTitle className="text-base">{proposal.title}</CardTitle>
              </div>
              <CardDescription className="text-xs text-slate-600 dark:text-slate-400">
                {proposal.description}
              </CardDescription>
            </div>

            {/* 우선순위 배지 */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium', config.badgeColor)}>
                <PriorityIcon className="h-3 w-3" />
                {config.label}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-4">
          {/* 카테고리 및 영향 KPI */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">{catConfig.icon}</span>
              <div>
                <p className="text-xs font-medium text-slate-500">카테고리</p>
                <p className="text-sm font-semibold">{catConfig.label}</p>
              </div>
            </div>
          </div>

          {/* 영향을 받는 KPI */}
          <div className="space-y-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">영향 KPI</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {proposal.affectedKPIs.map((kpi) => (
                <span
                  key={kpi}
                  className="inline-block rounded-full bg-white px-2 py-1 text-xs text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                >
                  {kpi}
                </span>
              ))}
            </div>
          </div>

          {/* 예상 효과 */}
          <div className="space-y-2 rounded-lg bg-green-50 p-3 dark:bg-green-950">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs font-medium text-green-600 dark:text-green-400">예상 효과</p>
            </div>
            <p className="text-sm font-semibold text-green-700 dark:text-green-300">
              {proposal.estimatedImpact}
            </p>
          </div>

          {/* 구현 기간 */}
          <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
            <Clock className="h-4 w-4 flex-shrink-0 text-slate-600 dark:text-slate-400" />
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">구현 기간</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {proposal.timeToImplement}
              </p>
            </div>
          </div>

          {/* 실행 단계 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">실행 단계</p>
            <ol className="space-y-1">
              {proposal.actionSteps.map((step, index) => (
                <li key={index} className="text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 액션 버튼 */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => router.push(CATEGORY_ROUTES[proposal.kpiCategory] || '/dashboard/analytics')}
            >
              실행 계획 수립
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => router.push('/dashboard/analytics')}
            >
              상세 보기
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
