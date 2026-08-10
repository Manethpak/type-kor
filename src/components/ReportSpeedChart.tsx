import { useMemo } from "react";
import {
  Chart as ChartJS,
  Filler,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { PerformanceSample } from "../storage/types";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip);

type SpeedUnit = "cpm" | "wpm";
type Theme = "saffron" | "paper";

interface ReportSpeedChartProps {
  durationMs: number;
  peakSpeed: number;
  speedUnit: SpeedUnit;
  theme: Theme;
  timeline: PerformanceSample[];
}

const PALETTES: Record<Theme, { accent: string; fill: string; grid: string; muted: string; surface: string; text: string }> = {
  saffron: {
    accent: "#e8a43a",
    fill: "rgba(232, 164, 58, 0.13)",
    grid: "rgba(232, 227, 215, 0.09)",
    muted: "#66675e",
    surface: "#23241d",
    text: "#e8e3d7",
  },
  paper: {
    accent: "#ad5c28",
    fill: "rgba(173, 92, 40, 0.12)",
    grid: "rgba(41, 42, 35, 0.11)",
    muted: "#9a978b",
    surface: "#e4dece",
    text: "#292a23",
  },
};

export function ReportSpeedChart({ durationMs, peakSpeed, speedUnit, theme, timeline }: ReportSpeedChartProps) {
  const palette = PALETTES[theme];
  const durationSeconds = Math.max(durationMs / 1_000, 1);

  const data = useMemo<ChartData<"line", { x: number; y: number }[]>>(() => ({
    datasets: [{
      data: [
        { x: 0, y: 0 },
        ...timeline.map((sample) => ({
          x: sample.elapsedMs / 1_000,
          y: speedUnit === "cpm" ? sample.burstCpm : (sample.burstWpm ?? Math.round(sample.burstCpm / 5)),
        })),
      ],
      borderColor: palette.accent,
      borderWidth: 2,
      backgroundColor: palette.fill,
      fill: true,
      pointBackgroundColor: palette.surface,
      pointBorderColor: palette.accent,
      pointBorderWidth: 1.5,
      pointHoverBackgroundColor: palette.accent,
      pointHoverBorderColor: palette.surface,
      pointHoverRadius: 5,
      pointRadius: timeline.length > 30 ? 0 : 2.5,
      tension: 0.32,
    }],
  }), [palette, speedUnit, timeline]);

  const options = useMemo<ChartOptions<"line">>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 450, easing: "easeOutQuart" },
    interaction: { intersect: false, mode: "nearest" },
    parsing: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: palette.surface,
        borderColor: palette.grid,
        borderWidth: 1,
        bodyColor: palette.text,
        caretPadding: 8,
        displayColors: false,
        padding: 10,
        titleColor: palette.muted,
        callbacks: {
          title: ([item]) => item ? `${Number(item.parsed.x).toFixed(1)} វិនាទី` : "",
          label: (item) => `${Math.round(Number(item.parsed.y ?? 0))} ${speedUnit.toUpperCase()}`,
        },
      },
    },
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: durationSeconds,
        border: { display: false },
        grid: { color: palette.grid, drawTicks: false },
        ticks: {
          color: palette.muted,
          font: { family: "Kantumruy Pro", size: 9 },
          maxTicksLimit: 5,
          padding: 8,
          callback: (value) => `${Number(value).toFixed(0)}s`,
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(peakSpeed, 1),
        border: { display: false },
        grid: { color: palette.grid, drawTicks: false },
        ticks: {
          color: palette.muted,
          font: { family: "Kantumruy Pro", size: 9 },
          maxTicksLimit: 4,
          padding: 8,
          precision: 0,
        },
      },
    },
  }), [durationSeconds, palette, peakSpeed, speedUnit]);

  return (
    <Line
      data={data}
      options={options}
      role="img"
      aria-label={`Per-second typing speed chart, peak ${peakSpeed} ${speedUnit}`}
    />
  );
}
