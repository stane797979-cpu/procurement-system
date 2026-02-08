"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReorderSummaryProps {
  urgentCount: number; // 품절 + 위험
  lowCount: number; // 부족
  cautionCount: number; // 주의
  className?: string;
}

export function ReorderSummary({
  urgentCount,
  lowCount,
  cautionCount,
  className,
}: ReorderSummaryProps) {
  const cards = [
    {
      title: "긴급",
      count: urgentCount,
      description: "품절/위험",
      icon: AlertOctagon,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "부족",
      count: lowCount,
      description: "안전재고 미달",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "주의",
      count: cautionCount,
      description: "발주점 미달",
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className={cn("grid gap-4 md:grid-cols-3", className)}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <Icon className={cn("h-4 w-4", card.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.count}</div>
              <p className="text-xs text-slate-500">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
