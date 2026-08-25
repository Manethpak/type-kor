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
import type { PerformanceSample } from "../../storage/types";

ChartJS.register(LinearScale, PointElement, LineElement, Filler, Tooltip);

type Theme = "saffron" | "paper";

interface ReportSpeedChartProps {
  durationMs: number;
  theme: Theme;
  timeline: PerformanceSample[];
}

const PALETTES: Record<
  Theme,
  {
    accent: string;
    accentFill: string;
    accuracy: string;
    grid: string;
    muted: string;
    surface: string;
    text: string;
    wpm: string;
  }
> = {
  saffron: {
    accent: "#e8a43a",
    accentFill: "rgba(232, 164, 58, 0.11)",
    accuracy: "#9b9d91",
    grid: "rgba(232, 227, 215, 0.09)",
    muted: "#77796e",
    surface: "#23241d",
    text: "#e8e3d7",
    wpm: "#78b994",
  },
  paper: {
    accent: "#ad5c28",
    accentFill: "rgba(173, 92, 40, 0.09)",
    accuracy: "#8e8a7d",
    grid: "rgba(41, 42, 35, 0.11)",
    muted: "#858175",
    surface: "#e4dece",
    text: "#292a23",
    wpm: "#39785b",
  },
};

export function ReportSpeedChart({ durationMs, theme, timeline }: ReportSpeedChartProps) {
  const palette = PALETTES[theme];
  const durationSeconds = Math.max(durationMs / 1_000, 1);
  const peakCpm = Math.max(...timeline.map((sample) => sample.cpm), 0);
  const peakWpm = Math.max(...timeline.map((sample) => sample.wpm ?? 0), 0);
  const endingAccuracy = timeline.at(-1)?.inputAccuracy ?? timeline.at(-1)?.accuracy ?? 100;

  const data = useMemo<ChartData<"line", { x: number; y: number }[]>>(
    () => ({
      datasets: [
        {
          label: "CPM",
          data: [
            { x: 0, y: 0 },
            ...timeline.map((sample) => ({ x: sample.elapsedMs / 1_000, y: sample.cpm })),
          ],
          yAxisID: "yCpm",
          borderColor: palette.accent,
          borderWidth: 2.5,
          backgroundColor: palette.accentFill,
          fill: true,
          pointBackgroundColor: palette.surface,
          pointBorderColor: palette.accent,
          pointBorderWidth: 1.5,
          pointHoverBackgroundColor: palette.accent,
          pointHoverBorderColor: palette.surface,
          pointHoverRadius: 5,
          pointRadius: timeline.length > 30 ? 0 : 2.5,
          tension: 0.3,
        },
        {
          label: "WPM",
          data: [
            { x: 0, y: 0 },
            ...timeline.map((sample) => ({ x: sample.elapsedMs / 1_000, y: sample.wpm ?? 0 })),
          ],
          yAxisID: "yWpm",
          borderColor: palette.wpm,
          borderWidth: 2,
          pointBackgroundColor: palette.surface,
          pointBorderColor: palette.wpm,
          pointBorderWidth: 1.5,
          pointHoverBackgroundColor: palette.wpm,
          pointHoverBorderColor: palette.surface,
          pointHoverRadius: 5,
          pointRadius: timeline.length > 30 ? 0 : 2,
          tension: 0.3,
        },
        {
          label: "Accuracy",
          data: [
            { x: 0, y: 100 },
            ...timeline.map((sample) => ({
              x: sample.elapsedMs / 1_000,
              y: sample.inputAccuracy ?? sample.accuracy,
            })),
          ],
          yAxisID: "yAccuracy",
          borderColor: palette.accuracy,
          borderDash: [5, 5],
          borderWidth: 1.5,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.2,
        },
      ],
    }),
    [palette, timeline],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 450, easing: "easeOutQuart" },
      interaction: { intersect: false, mode: "index" },
      parsing: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: palette.surface,
          borderColor: palette.grid,
          borderWidth: 1,
          bodyColor: palette.text,
          caretPadding: 8,
          padding: 11,
          titleColor: palette.muted,
          usePointStyle: true,
          callbacks: {
            title: ([item]) => (item ? `${Number(item.parsed.x).toFixed(1)} វិនាទី` : ""),
            label: (item) => {
              const value = Math.round(Number(item.parsed.y ?? 0));
              return item.dataset.label === "Accuracy"
                ? ` Accuracy  ${value}%`
                : ` ${item.dataset.label}  ${value}`;
            },
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
            maxTicksLimit: 6,
            padding: 9,
            callback: (value) => `${Number(value).toFixed(0)}s`,
          },
        },
        yCpm: {
          type: "linear",
          position: "left",
          beginAtZero: true,
          suggestedMax: Math.max(peakCpm, 1),
          border: { display: false },
          grid: { color: palette.grid, drawTicks: false },
          ticks: {
            color: palette.accent,
            font: { family: "Kantumruy Pro", size: 9, weight: 600 },
            maxTicksLimit: 5,
            padding: 9,
            precision: 0,
          },
        },
        yWpm: {
          type: "linear",
          position: "right",
          beginAtZero: true,
          suggestedMax: Math.max(peakWpm, 1),
          border: { display: false },
          grid: { display: false },
          ticks: {
            color: palette.wpm,
            font: { family: "Kantumruy Pro", size: 9, weight: 600 },
            maxTicksLimit: 5,
            padding: 9,
            precision: 0,
          },
        },
        yAccuracy: {
          type: "linear",
          display: false,
          min: 0,
          max: 100,
        },
      },
    }),
    [durationSeconds, palette, peakCpm, peakWpm],
  );

  return (
    <Line
      data={data}
      options={options}
      role="img"
      aria-label={`Typing analytics chart: peak ${peakCpm} CPM, ${peakWpm} WPM, ${endingAccuracy}% accuracy`}
    />
  );
}
