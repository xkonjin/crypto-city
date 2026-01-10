"use client";

import React from "react";
import { msg, useMessages } from "gt-next";
import { useGame } from "@/context/GameContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AdvisorIcon,
  InfoIcon,
  MoneyIcon,
  SafetyIcon,
  HealthIcon,
  EducationIcon,
  EnvironmentIcon,
  JobsIcon,
  WaterIcon,
  PowerIcon,
} from "@/components/ui/Icons";
import type { SpecialEvent, SpecialEventChoice } from "@/types/game";

const UI_LABELS = {
  specialEvents: msg("Special Event"),
  noEvents: msg("No Active Events"),
  eventsWillAppear: msg("Random events will appear as your city grows."),
  expiresIn: msg("Expires in"),
  days: msg("days"),
  effects: msg("Effects"),
  happiness: msg("Happiness"),
  money: msg("Money"),
  population: msg("Population"),
  safety: msg("Safety"),
  health: msg("Health"),
  education: msg("Education"),
  environment: msg("Environment"),
};

const EVENT_ICON_MAP: Record<string, React.ReactNode> = {
  cash: <MoneyIcon size={28} />,
  shield: <SafetyIcon size={28} />,
  hospital: <HealthIcon size={28} />,
  education: <EducationIcon size={28} />,
  environment: <EnvironmentIcon size={28} />,
  planning: <AdvisorIcon size={28} />,
  jobs: <JobsIcon size={28} />,
  water: <WaterIcon size={28} />,
  power: <PowerIcon size={28} />,
};

const EVENT_TYPE_STYLES: Record<
  string,
  { bg: string; border: string; badge: string }
> = {
  positive: {
    bg: "bg-emerald-500/10",
    border: "border-l-4 border-l-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-400",
  },
  negative: {
    bg: "bg-red-500/10",
    border: "border-l-4 border-l-red-500",
    badge: "bg-red-500/20 text-red-400",
  },
  neutral: {
    bg: "bg-blue-500/10",
    border: "border-l-4 border-l-blue-500",
    badge: "bg-blue-500/20 text-blue-400",
  },
};

function formatEffect(value: number | undefined, label: string): string | null {
  if (!value) return null;
  const sign = value > 0 ? "+" : "";
  return `${label}: ${sign}${value}`;
}

function formatMoneyEffect(value: number | undefined): string | null {
  if (!value) return null;
  if (value > 0) return `+$${value.toLocaleString()}`;
  return `-$${Math.abs(value).toLocaleString()}`;
}

function ChoiceCard({
  choice,
  index,
  onSelect,
}: {
  choice: SpecialEventChoice;
  index: number;
  onSelect: (index: number) => void;
}) {
  const m = useMessages();
  const effects = choice.effects;

  const effectStrings = [
    formatMoneyEffect(effects.moneyChange),
    formatEffect(effects.happinessChange, m(UI_LABELS.happiness)),
    formatEffect(effects.populationChange, m(UI_LABELS.population)),
    formatEffect(effects.safetyChange, m(UI_LABELS.safety)),
    formatEffect(effects.healthChange, m(UI_LABELS.health)),
    formatEffect(effects.educationChange, m(UI_LABELS.education)),
    formatEffect(effects.environmentChange, m(UI_LABELS.environment)),
  ].filter(Boolean);

  const hasPositiveEffects =
    (effects.moneyChange && effects.moneyChange > 0) ||
    (effects.happinessChange && effects.happinessChange > 0);
  const hasNegativeEffects =
    (effects.moneyChange && effects.moneyChange < 0) ||
    (effects.happinessChange && effects.happinessChange < 0);

  const buttonVariant = hasPositiveEffects
    ? "default"
    : hasNegativeEffects
      ? "secondary"
      : "outline";

  return (
    <Card className="p-3 bg-primary/5 border-primary/20">
      <Button
        onClick={() => onSelect(index)}
        variant={buttonVariant}
        className="w-full mb-2 justify-start text-left h-auto py-2"
      >
        {choice.label}
      </Button>
      <div className="text-muted-foreground text-xs mb-2">
        {choice.description}
      </div>
      {effectStrings.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          {effectStrings.map((effect, i) => (
            <span
              key={i}
              className={
                effect?.includes("+")
                  ? "text-green-400"
                  : effect?.includes("-")
                    ? "text-red-400"
                    : "text-muted-foreground"
              }
            >
              {effect}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function EventCard({ event }: { event: SpecialEvent }) {
  const { resolveEvent } = useGame();
  const m = useMessages();

  const style = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.neutral;

  return (
    <Card className={`p-4 ${style.bg} border-primary/30 ${style.border}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 flex items-center justify-center rounded-lg bg-primary/20 text-muted-foreground">
          {EVENT_ICON_MAP[event.icon] || <InfoIcon size={28} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-foreground font-semibold text-lg">
              {event.title}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={style.badge}>{event.type}</Badge>
            <span className="text-muted-foreground text-xs">
              {m(UI_LABELS.expiresIn)} {event.expiresInDays} {m(UI_LABELS.days)}
            </span>
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-sm mb-4 leading-relaxed">
        {event.description}
      </div>

      <div className="space-y-2">
        {event.choices.map((choice, index) => (
          <ChoiceCard
            key={index}
            choice={choice}
            index={index}
            onSelect={resolveEvent}
          />
        ))}
      </div>
    </Card>
  );
}

export function EventsPanel() {
  const { state, setActivePanel } = useGame();
  const { activeEvent } = state;
  const m = useMessages();

  return (
    <Dialog open={true} onOpenChange={() => setActivePanel("none")}>
      <DialogContent className="max-w-[520px] max-h-[650px]">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.specialEvents)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activeEvent ? (
            <EventCard event={activeEvent} />
          ) : (
            <Card className="text-center py-8 text-muted-foreground bg-primary/10 border-primary/30">
              <AdvisorIcon size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm">{m(UI_LABELS.noEvents)}</div>
              <div className="text-xs mt-1">
                {m(UI_LABELS.eventsWillAppear)}
              </div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
