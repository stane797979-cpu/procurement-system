"use client";

import { cn } from "@/lib/utils";

interface KPISparklineProps {
  data: number[];
  className?: string;
  color?: "green" | "blue" | "orange" | "red" | "slate";
  height?: number;
  showDots?: boolean;
}

export function KPISparkline({
  data,
  className,
  color = "blue",
  height = 32,
  showDots = false,
}: KPISparklineProps) {
  if (data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // 0으로 나누기 방지

  // SVG 경로 생성
  const width = 200;
  const padding = 4;
  const effectiveHeight = height - padding * 2;
  const effectiveWidth = width - padding * 2;
  const step = effectiveWidth / (data.length - 1 || 1);

  const points = data.map((value, index) => {
    const x = padding + index * step;
    const y = padding + effectiveHeight - ((value - min) / range) * effectiveHeight;
    return { x, y, value };
  });

  const pathD = points
    .map((point, index) => (index === 0 ? `M ${point.x} ${point.y}` : `L ${point.x} ${point.y}`))
    .join(" ");

  // 영역 채우기용 경로
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${padding} ${height} Z`;

  const colorClasses = {
    green: {
      stroke: "stroke-green-500",
      fill: "fill-green-100 dark:fill-green-950",
      dot: "fill-green-500",
    },
    blue: {
      stroke: "stroke-blue-500",
      fill: "fill-blue-100 dark:fill-blue-950",
      dot: "fill-blue-500",
    },
    orange: {
      stroke: "stroke-orange-500",
      fill: "fill-orange-100 dark:fill-orange-950",
      dot: "fill-orange-500",
    },
    red: {
      stroke: "stroke-red-500",
      fill: "fill-red-100 dark:fill-red-950",
      dot: "fill-red-500",
    },
    slate: {
      stroke: "stroke-slate-500",
      fill: "fill-slate-100 dark:fill-slate-950",
      dot: "fill-slate-500",
    },
  };

  const colors = colorClasses[color];

  return (
    <svg
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      {/* 영역 채우기 */}
      <path d={areaD} className={cn(colors.fill, "opacity-20")} />

      {/* 라인 */}
      <path
        d={pathD}
        fill="none"
        className={cn(colors.stroke)}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 점 표시 (옵션) */}
      {showDots &&
        points.map((point, index) => (
          <circle key={index} cx={point.x} cy={point.y} r={2} className={colors.dot} />
        ))}

      {/* 마지막 점은 항상 표시 */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={3}
        className={colors.dot}
      />
    </svg>
  );
}
