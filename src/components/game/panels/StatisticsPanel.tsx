"use client";

import React, { useState, useRef, useEffect } from "react";
import { msg, useMessages } from "gt-next";
import { useGame } from "@/context/GameContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const UI_LABELS = {
  cityStatistics: msg("City Statistics"),
  population: msg("Population"),
  jobs: msg("Jobs"),
  treasury: msg("Treasury"),
  weekly: msg("Weekly"),
  money: msg("Money"),
  happiness: msg("Happiness"),
  demand: msg("Demand"),
  notEnoughData: msg(
    "Not enough data yet. Keep playing to see historical trends.",
  ),
  cityHealth: msg("City Health"),
  health: msg("Health"),
  education: msg("Education"),
  safety: msg("Safety"),
  environment: msg("Environment"),
  zoneDemand: msg("Zone Demand"),
  residential: msg("Residential"),
  commercial: msg("Commercial"),
  industrial: msg("Industrial"),
};

function DemandBar({
  label,
  value,
  color,
  shortLabel,
}: {
  label: string;
  value: number;
  color: string;
  shortLabel: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 text-center font-bold text-xs" style={{ color }}>
        {shortLabel}
      </span>
      <div className="flex-1 h-4 bg-muted rounded-sm overflow-hidden">
        <div
          className="h-full transition-all duration-300 rounded-sm"
          style={{
            width: `${Math.min(100, Math.max(0, value))}%`,
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
      </div>
      <span className="w-10 text-right font-mono text-xs text-muted-foreground">
        {Math.round(value)}%
      </span>
    </div>
  );
}

function HealthIndicator({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="p-2 sm:p-3">
      <div className="text-muted-foreground text-[10px] sm:text-xs mb-1">
        {label}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="font-mono tabular-nums font-semibold text-sm sm:text-base"
          style={{ color }}
        >
          {Math.round(value)}%
        </div>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${value}%`, backgroundColor: color }}
          />
        </div>
      </div>
    </Card>
  );
}

export function StatisticsPanel() {
  const { state, setActivePanel } = useGame();
  const { history, stats } = state;
  const [activeTab, setActiveTab] = useState<
    "population" | "money" | "happiness" | "demand"
  >("population");
  const m = useMessages();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    ctx.fillStyle = "#1a1f2e";
    ctx.fillRect(0, 0, width, height);

    if (activeTab === "demand") {
      drawDemandBarChart(ctx, width, height, padding, stats.demand);
      return;
    }

    if (history.length < 2) return;

    drawLineGraph(ctx, width, height, padding, history, activeTab);
  }, [history, activeTab, stats.demand]);

  return (
    <Dialog open={true} onOpenChange={() => setActivePanel("none")}>
      <DialogContent className="max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.cityStatistics)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <Card className="p-2 sm:p-3">
              <div className="text-muted-foreground text-[10px] sm:text-xs mb-1">
                {m(UI_LABELS.population)}
              </div>
              <div className="font-mono tabular-nums font-semibold text-green-400 text-sm sm:text-base truncate">
                {stats.population.toLocaleString()}
              </div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-muted-foreground text-[10px] sm:text-xs mb-1">
                {m(UI_LABELS.jobs)}
              </div>
              <div className="font-mono tabular-nums font-semibold text-blue-400 text-sm sm:text-base truncate">
                {stats.jobs.toLocaleString()}
              </div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-muted-foreground text-[10px] sm:text-xs mb-1">
                {m(UI_LABELS.treasury)}
              </div>
              <div className="font-mono tabular-nums font-semibold text-amber-400 text-sm sm:text-base truncate">
                ${stats.money.toLocaleString()}
              </div>
            </Card>
            <Card className="p-2 sm:p-3">
              <div className="text-muted-foreground text-[10px] sm:text-xs mb-1">
                {m(UI_LABELS.weekly)}
              </div>
              <div
                className={`font-mono tabular-nums font-semibold text-sm sm:text-base truncate ${stats.income - stats.expenses >= 0 ? "text-green-400" : "text-red-400"}`}
              >
                $
                {Math.floor(
                  (stats.income - stats.expenses) / 4,
                ).toLocaleString()}
              </div>
            </Card>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-2 font-medium">
              {m(UI_LABELS.cityHealth)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <HealthIndicator
                label={m(UI_LABELS.health)}
                value={stats.health}
                color="#ef4444"
              />
              <HealthIndicator
                label={m(UI_LABELS.education)}
                value={stats.education}
                color="#8b5cf6"
              />
              <HealthIndicator
                label={m(UI_LABELS.safety)}
                value={stats.safety}
                color="#3b82f6"
              />
              <HealthIndicator
                label={m(UI_LABELS.environment)}
                value={stats.environment}
                color="#22c55e"
              />
            </div>
          </div>

          <Card className="p-3">
            <div className="text-xs text-muted-foreground mb-3 font-medium">
              {m(UI_LABELS.zoneDemand)}
            </div>
            <div className="space-y-2">
              <DemandBar
                label={m(UI_LABELS.residential)}
                shortLabel="R"
                value={stats.demand.residential}
                color="#22c55e"
              />
              <DemandBar
                label={m(UI_LABELS.commercial)}
                shortLabel="C"
                value={stats.demand.commercial}
                color="#3b82f6"
              />
              <DemandBar
                label={m(UI_LABELS.industrial)}
                shortLabel="I"
                value={stats.demand.industrial}
                color="#f59e0b"
              />
            </div>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as typeof activeTab)}
          >
            <TabsList className="grid w-full grid-cols-4 h-auto">
              <TabsTrigger
                value="population"
                className="text-xs sm:text-sm py-2 px-1 sm:px-3"
              >
                {m(UI_LABELS.population)}
              </TabsTrigger>
              <TabsTrigger
                value="money"
                className="text-xs sm:text-sm py-2 px-1 sm:px-3"
              >
                {m(UI_LABELS.money)}
              </TabsTrigger>
              <TabsTrigger
                value="happiness"
                className="text-xs sm:text-sm py-2 px-1 sm:px-3"
              >
                {m(UI_LABELS.happiness)}
              </TabsTrigger>
              <TabsTrigger
                value="demand"
                className="text-xs sm:text-sm py-2 px-1 sm:px-3"
              >
                {m(UI_LABELS.demand)}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="p-4">
            {activeTab !== "demand" && history.length < 2 ? (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                {m(UI_LABELS.notEnoughData)}
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                width={536}
                height={200}
                className="w-full rounded-md"
              />
            )}
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function drawDemandBarChart(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  demand: { residential: number; commercial: number; industrial: number },
) {
  const demandData = [
    { label: "R", value: demand.residential, color: "#22c55e" },
    { label: "C", value: demand.commercial, color: "#3b82f6" },
    { label: "I", value: demand.industrial, color: "#f59e0b" },
  ];

  const barWidth = (width - padding * 2) / demandData.length - 20;
  const maxHeight = height - padding * 2;

  ctx.strokeStyle = "#2d3748";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding + maxHeight * (i / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    ctx.fillStyle = "#64748b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(`${100 - i * 25}%`, padding - 5, y + 3);
  }

  demandData.forEach((d, i) => {
    const x = padding + 20 + i * (barWidth + 20);
    const barHeight = (d.value / 100) * maxHeight;
    const y = padding + maxHeight - barHeight;

    const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);
    gradient.addColorStop(0, d.color);
    gradient.addColorStop(1, d.color + "80");

    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(d.label, x + barWidth / 2, height - 15);

    ctx.fillStyle = d.color;
    ctx.font = "bold 12px sans-serif";
    ctx.fillText(`${Math.round(d.value)}%`, x + barWidth / 2, y - 5);
  });
}

function drawLineGraph(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  history: Array<{ population: number; money: number; happiness: number }>,
  activeTab: "population" | "money" | "happiness",
) {
  let data: number[] = [];
  let color = "#10b981";

  switch (activeTab) {
    case "population":
      data = history.map((h) => h.population);
      color = "#10b981";
      break;
    case "money":
      data = history.map((h) => h.money);
      color = "#f59e0b";
      break;
    case "happiness":
      data = history.map((h) => h.happiness);
      color = "#ec4899";
      break;
  }

  if (data.length < 2) return;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  ctx.strokeStyle = "#2d3748";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padding + (height - padding * 2) * (i / 4);
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const stepX = (width - padding * 2) / (data.length - 1);

  data.forEach((val, i) => {
    const x = padding + i * stepX;
    const y = padding + (height - padding * 2) * (1 - (val - minVal) / range);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}
