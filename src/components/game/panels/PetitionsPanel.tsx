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
} from "@/components/ui/Icons";
import type { Petition } from "@/types/game";

const UI_LABELS = {
  citizenPetitions: msg("Citizen Petitions"),
  signatures: msg("signatures"),
  noPetitions: msg("No Active Petitions"),
  citizensHappy: msg("Your citizens have no urgent requests at this time."),
  ifYouAccept: msg("If you accept:"),
  ifYouReject: msg("If you reject:"),
  acceptPetition: msg("Accept Petition"),
  rejectPetition: msg("Reject Petition"),
  happiness: msg("Happiness"),
  cost: msg("Cost"),
  expiresIn: msg("Expires in"),
  days: msg("days"),
};

const PETITION_ICON_MAP: Record<string, React.ReactNode> = {
  cash: <MoneyIcon size={24} />,
  shield: <SafetyIcon size={24} />,
  hospital: <HealthIcon size={24} />,
  education: <EducationIcon size={24} />,
  environment: <EnvironmentIcon size={24} />,
  planning: <AdvisorIcon size={24} />,
  jobs: <JobsIcon size={24} />,
};

function formatHappinessChange(change: number): string {
  if (change > 0) return `+${change}`;
  return `${change}`;
}

function formatMoneyChange(change: number): string {
  if (change === 0) return "No cost";
  if (change > 0) return `+$${change}`;
  return `-$${Math.abs(change)}`;
}

function PetitionCard({ petition }: { petition: Petition }) {
  const { acceptPetition, rejectPetition } = useGame();
  const m = useMessages();

  const urgencyColor =
    petition.urgency === "high"
      ? "text-red-400"
      : petition.urgency === "medium"
        ? "text-amber-400"
        : "text-blue-400";
  const urgencyBorder =
    petition.urgency === "high"
      ? "border-l-2 border-l-red-500"
      : petition.urgency === "medium"
        ? "border-l-2 border-l-amber-500"
        : "";

  return (
    <Card className={`p-4 bg-primary/10 border-primary/30 ${urgencyBorder}`}>
      <div className="flex items-start gap-4 mb-4">
        <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/20 text-muted-foreground">
          {PETITION_ICON_MAP[petition.icon] || <InfoIcon size={24} />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-foreground font-semibold">
              {petition.title}
            </span>
            <Badge
              variant={
                petition.urgency === "high" ? "destructive" : "secondary"
              }
              className={`text-[10px] ${urgencyColor}`}
            >
              {petition.urgency}
            </Badge>
          </div>
          <div className="text-muted-foreground text-xs">
            {petition.signatures.toLocaleString()} {m(UI_LABELS.signatures)} •{" "}
            {m(UI_LABELS.expiresIn)} {petition.expiresInDays}{" "}
            {m(UI_LABELS.days)}
          </div>
        </div>
      </div>

      <div className="text-muted-foreground text-sm mb-4 leading-relaxed">
        {petition.description}
      </div>

      <div className="text-foreground text-sm font-medium mb-2 italic">
        &ldquo;{petition.request}&rdquo;
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
        <Card className="p-3 bg-green-500/10 border-green-500/30">
          <div className="text-green-400 text-xs font-medium mb-1">
            {m(UI_LABELS.ifYouAccept)}
          </div>
          <div className="text-muted-foreground text-xs">
            {petition.acceptEffect.description}
          </div>
          <div className="flex gap-3 mt-2 text-xs">
            <span className="text-green-400">
              {m(UI_LABELS.happiness)}:{" "}
              {formatHappinessChange(petition.acceptEffect.happinessChange)}
            </span>
            <span
              className={
                petition.acceptEffect.moneyChange < 0
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {m(UI_LABELS.cost)}:{" "}
              {formatMoneyChange(petition.acceptEffect.moneyChange)}
            </span>
          </div>
        </Card>

        <Card className="p-3 bg-red-500/10 border-red-500/30">
          <div className="text-red-400 text-xs font-medium mb-1">
            {m(UI_LABELS.ifYouReject)}
          </div>
          <div className="text-muted-foreground text-xs">
            {petition.rejectEffect.description}
          </div>
          <div className="mt-2 text-xs">
            <span className="text-red-400">
              {m(UI_LABELS.happiness)}:{" "}
              {formatHappinessChange(petition.rejectEffect.happinessChange)}
            </span>
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={() => acceptPetition()}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {m(UI_LABELS.acceptPetition)}
        </Button>
        <Button
          onClick={() => rejectPetition()}
          variant="destructive"
          className="flex-1"
        >
          {m(UI_LABELS.rejectPetition)}
        </Button>
      </div>
    </Card>
  );
}

export function PetitionsPanel() {
  const { state, setActivePanel } = useGame();
  const { activePetition } = state;
  const m = useMessages();

  return (
    <Dialog open={true} onOpenChange={() => setActivePanel("none")}>
      <DialogContent className="max-w-[500px] max-h-[600px]">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.citizenPetitions)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {activePetition ? (
            <PetitionCard petition={activePetition} />
          ) : (
            <Card className="text-center py-8 text-muted-foreground bg-primary/10 border-primary/30">
              <AdvisorIcon size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm">{m(UI_LABELS.noPetitions)}</div>
              <div className="text-xs mt-1">{m(UI_LABELS.citizensHappy)}</div>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
