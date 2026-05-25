import React, { useState } from 'react';

// === 1. SVG BAR CHART ===
interface BarChartProps {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
}

export const SvgBarChart: React.FC<BarChartProps> = ({ data, height = 200, color = 'var(--b500)' }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartHeight = height - 40; // reserve space for text below
  const barWidth = 40;
  const gap = 24;
  const svgWidth = data.length * (barWidth + gap) + gap;

  return (
    <div className="w-full overflow-x-auto select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${height}`}
        className="w-full h-auto min-w-[300px]"
        style={{ contentVisibility: 'auto' }}
      >
        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = 10 + (1 - ratio) * (chartHeight - 10);
          return (
            <g key={idx}>
              <line
                x1={0}
                y1={y}
                x2={svgWidth}
                y2={y}
                stroke="var(--n200)"
                strokeDasharray="4 4"
                strokeWidth={1}
              />
              <text
                x={5}
                y={y - 4}
                className="text-[9px] font-mono fill-gray-400"
              >
                {Math.round(ratio * maxVal)}
              </text>
            </g>
          );
        })}

        {/* Bars */}
        {data.map((item, idx) => {
          const barHeight = (item.value / maxVal) * (chartHeight - 20) || 5;
          const x = gap + idx * (barWidth + gap);
          const y = chartHeight - barHeight;

          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="cursor-pointer"
            >
              {/* Active hover overlay background */}
              {hoveredIndex === idx && (
                <rect
                  x={x - gap / 2}
                  y={0}
                  width={barWidth + gap}
                  height={chartHeight + 10}
                  fill="var(--b50)"
                  opacity={0.5}
                  rx={4}
                />
              )}

              {/* Bar Rect */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={hoveredIndex === idx ? 'var(--p500)' : color}
                rx={6}
                className="transition-all duration-300"
              />

              {/* Bar Value text */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="text-[10px] font-mono font-bold fill-gray-700"
              >
                {item.value}
              </text>

              {/* X Axis Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 20}
                textAnchor="middle"
                className="text-[10px] font-medium fill-gray-500"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};


// === 2. SVG LINE CHART (Bezier Curve + Area Fill) ===
interface LineChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

export const SvgLineChart: React.FC<LineChartProps> = ({ data, height = 200 }) => {
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  
  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 1) * 1.1; // padding 10%
  const minVal = Math.min(...values, 0);
  
  const chartHeight = height - 40;
  const paddingX = 40;
  const svgWidth = 500;
  const usableWidth = svgWidth - paddingX * 2;
  const stepX = usableWidth / (data.length - 1);

  // Calculate pixel coordinates
  const points = data.map((d, idx) => {
    const x = paddingX + idx * stepX;
    const yVal = d.value;
    const y = chartHeight - ((yVal - minVal) / (maxVal - minVal)) * (chartHeight - 20);
    return { x, y, value: d.value, label: d.label };
  });

  // Generate Bezier path string
  let linePath = '';
  let areaPath = '';

  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + stepX / 2;
      const cpY1 = p0.y;
      const cpX2 = p1.x - stepX / 2;
      const cpY2 = p1.y;
      linePath += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    // Closed path for gradient area fill
    areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;
  }

  return (
    <div className="w-full overflow-x-auto select-none">
      <svg viewBox={`0 0 ${svgWidth} ${height}`} className="w-full h-auto min-w-[400px]">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--b500)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--b500)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = 15 + (1 - ratio) * (chartHeight - 25);
          const gridVal = minVal + ratio * (maxVal - minVal);
          return (
            <g key={idx}>
              <line
                x1={paddingX}
                y1={y}
                x2={svgWidth - paddingX}
                y2={y}
                stroke="var(--n200)"
                strokeDasharray="4 4"
              />
              <text x={5} y={y + 4} className="text-[9px] font-mono fill-gray-400">
                {formatVNDCompact(gridVal)}
              </text>
            </g>
          );
        })}

        {/* Gradient fill */}
        {areaPath && <path d={areaPath} fill="url(#areaGrad)" />}

        {/* Smooth line path */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--b600)"
            strokeWidth={3}
            strokeLinecap="round"
          />
        )}

        {/* Interactive nodes */}
        {points.map((pt, idx) => (
          <g
            key={idx}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredPoint(idx)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Pulsing expand circle */}
            {hoveredPoint === idx && (
              <circle cx={pt.x} cy={pt.y} r={10} fill="var(--b200)" opacity="0.4" />
            )}

            {/* Core anchor point */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoveredPoint === idx ? 6 : 4}
              fill="white"
              stroke="var(--b600)"
              strokeWidth={2.5}
              className="transition-all duration-150"
            />

            {/* Label below */}
            <text
              x={pt.x}
              y={chartHeight + 18}
              textAnchor="middle"
              className="text-[10px] font-medium fill-gray-500"
            >
              {pt.label}
            </text>

            {/* Value Tooltip above */}
            {hoveredPoint === idx && (
              <g>
                <rect
                  x={pt.x - 55}
                  y={pt.y - 32}
                  width={110}
                  height={22}
                  rx={4}
                  fill="var(--n900)"
                />
                <text
                  x={pt.x}
                  y={pt.y - 18}
                  textAnchor="middle"
                  fill="white"
                  className="text-[10px] font-mono font-bold"
                >
                  {formatVND(pt.value)}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// Tooltip formatter helpers
function formatVND(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(1)} Tỷ VND`;
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)} Tr VND`;
  }
  return `${value.toLocaleString('vi-VN')} đ`;
}

function formatVNDCompact(value: number): string {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `${Math.round(value / 1000000)}M`;
  return String(value);
}


// === 3. SVG DONUT CHART ===
interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
}

export const SvgDonutChart: React.FC<DonutChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  // SVG Geometry constants
  const size = 160;
  const radius = 55;
  const strokeWidth = 14;
  const radiusExpanded = 58;
  const strokeWidthExpanded = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          {data.map((item, idx) => {
            const angleRatio = item.value / (total || 1);
            const isHovered = hoveredIdx === idx;
            const itemCircumference = 2 * Math.PI * (isHovered ? radiusExpanded : radius);
            const strokeDash = angleRatio * itemCircumference;
            const strokeGap = itemCircumference - strokeDash;

            // Draw relative segments
            // Using strokeDasharray and strokeDashoffset causes overlaps if not timed. 
            // So we offset each slice based on previous percentages
            const rotationDegree = (currentOffset * 360);
            currentOffset += angleRatio;

            return (
              <circle
                key={idx}
                cx={center}
                cy={center}
                r={isHovered ? radiusExpanded : radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidthExpanded : strokeWidth}
                strokeDasharray={`${strokeDash} ${strokeGap}`}
                transform={`rotate(${rotationDegree} ${center} ${center})`}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xs font-medium text-gray-400">Tổng số</span>
          <span className="text-xl font-bold font-mono text-gray-800">
            {hoveredIdx !== null ? data[hoveredIdx].value : total}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">
            {hoveredIdx !== null ? data[hoveredIdx].label : 'Thành viên'}
          </span>
        </div>
      </div>

      {/* Legend Grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 w-full px-2 max-w-sm">
        {data.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          const pct = ((item.value / (total || 1)) * 100).toFixed(1);
          return (
            <div
              key={idx}
              className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors duration-150 ${
                isHovered ? 'bg-gray-50' : 'bg-transparent'
              }`}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-gray-700 truncate capitalize">
                  {item.label}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  {item.value} ({pct}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
