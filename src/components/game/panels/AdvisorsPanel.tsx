"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AdvisorIcon,
  InfoIcon,
  PowerIcon,
  WaterIcon,
  MoneyIcon,
  SafetyIcon,
  HealthIcon,
  EducationIcon,
  EnvironmentIcon,
  JobsIcon,
} from "@/components/ui/Icons";
import { Trophy, Target, MessageSquare, AlertTriangle } from "lucide-react";
import {
  ADVISORS,
  AdvisorState,
  AdvisorAdvice,
  AdvisorDebate,
  Advisor,
  loadAdvisorState,
  saveAdvisorState,
  updateAdvisorState,
  recordDebateChoice,
  getAdvisorReputation,
  getPriorityColor,
  getSpecialtyColor,
  AdvicePriority,
} from "@/lib/advisors";
import type { CryptoEconomyState } from "@/games/isocity/crypto";

// Translatable UI labels
const UI_LABELS = {
  cityAdvisors: msg("City Advisors"),
  cryptoAdvisors: msg("Crypto Advisors"),
  overallCityRating: msg("Overall City Rating"),
  ratingDescription: msg(
    "Based on happiness, health, education, safety & environment",
  ),
  noUrgentIssues: msg("No urgent issues to report!"),
  cityRunningSmoothly: msg("Your city is running smoothly."),
  advisorTeam: msg("Advisor Team"),
  debates: msg("Debates"),
  cityServices: msg("City Services"),
  reputation: msg("Reputation"),
  accuracy: msg("Accuracy"),
  specialty: msg("Specialty"),
  currentAdvice: msg("Current Advice"),
  noActiveDebate: msg("No active debate"),
  chooseSide: msg("Choose Side"),
};

const ADVISOR_ICON_MAP: Record<string, React.ReactNode> = {
  power: <PowerIcon size={18} />,
  water: <WaterIcon size={18} />,
  cash: <MoneyIcon size={18} />,
  shield: <SafetyIcon size={18} />,
  hospital: <HealthIcon size={18} />,
  education: <EducationIcon size={18} />,
  environment: <EnvironmentIcon size={18} />,
  planning: <AdvisorIcon size={18} />,
  jobs: <JobsIcon size={18} />,
};

// Advisor portraits with emoji avatars and background colors
const ADVISOR_PORTRAITS: Record<string, { emoji: string; bgColor: string }> = {
  power: { emoji: "⚡", bgColor: "bg-amber-500/80" },
  water: { emoji: "💧", bgColor: "bg-blue-500/80" },
  cash: { emoji: "💰", bgColor: "bg-emerald-500/80" },
  shield: { emoji: "🛡️", bgColor: "bg-indigo-500/80" },
  hospital: { emoji: "🏥", bgColor: "bg-rose-500/80" },
  education: { emoji: "📚", bgColor: "bg-purple-500/80" },
  environment: { emoji: "🌳", bgColor: "bg-green-500/80" },
  planning: { emoji: "🏗️", bgColor: "bg-slate-500/80" },
  jobs: { emoji: "💼", bgColor: "bg-orange-500/80" },
};

// Specialty display names
const SPECIALTY_LABELS: Record<string, string> = {
  risk: "Risk",
  yield: "Yield",
  growth: "Growth",
  stability: "Stability",
};

// Priority badge component
function PriorityBadge({ priority }: { priority: AdvicePriority }) {
  const color = getPriorityColor(priority);
  return (
    <Badge
      data-testid="advice-priority"
      variant={priority === "critical" || priority === "high" ? "destructive" : "secondary"}
      className="text-[10px]"
      style={{ borderColor: color }}
    >
      {priority}
    </Badge>
  );
}

// Advisor Card Component
function AdvisorCard({
  advisor,
  advice,
  reputation,
  isActive,
  onClick,
}: {
  advisor: Advisor;
  advice: AdvisorAdvice | undefined;
  reputation: { accuracy: number; totalPredictions: number } | undefined;
  isActive: boolean;
  onClick: () => void;
}) {
  const specialtyColor = getSpecialtyColor(advisor.specialty);
  
  return (
    <Card
      data-testid="advisor-card"
      className={`p-4 cursor-pointer transition-all hover:border-primary/50 ${
        isActive ? "border-primary bg-primary/10" : "bg-card"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center text-2xl shadow-md"
          style={{ backgroundColor: `${specialtyColor}20` }}
        >
          {advisor.avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-sm">{advisor.name}</h4>
            <Badge
              data-testid="advisor-specialty"
              variant="outline"
              className="text-[10px]"
              style={{ borderColor: specialtyColor, color: specialtyColor }}
            >
              {SPECIALTY_LABELS[advisor.specialty]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
            {advisor.description}
          </p>
          {reputation && (
            <div className="flex items-center gap-2" data-testid="advisor-reputation">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span className="text-xs" data-testid="advisor-accuracy">
                {reputation.accuracy}% accuracy
              </span>
              <span className="text-xs text-muted-foreground">
                ({reputation.totalPredictions} predictions)
              </span>
            </div>
          )}
        </div>
      </div>
      {advice && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-start gap-2">
            <AlertTriangle
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: getPriorityColor(advice.priority) }}
            />
            <div className="flex-1">
              <p className="text-xs" data-testid="advisor-advice-message">
                {advice.message}
              </p>
              {advice.actionSuggestion && (
                <p
                  className="text-xs text-muted-foreground mt-1 italic"
                  data-testid="advisor-action-suggestion"
                >
                  💡 {advice.actionSuggestion}
                </p>
              )}
            </div>
            <PriorityBadge priority={advice.priority} />
          </div>
        </div>
      )}
    </Card>
  );
}

// Debate Panel Component
function DebatePanel({
  debate,
  onChoose,
}: {
  debate: AdvisorDebate | null;
  onChoose: (advisorId: string) => void;
}) {
  const m = useMessages();
  
  if (!debate) {
    return (
      <Card className="p-6 text-center bg-primary/10 border-primary/30">
        <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-sm text-muted-foreground">
          {m(UI_LABELS.noActiveDebate)}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Advisors will debate when there are conflicting strategies.
        </p>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 bg-primary/10 border-primary/30" data-testid="advisor-debate">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-primary" />
        <h4 className="font-medium text-sm">Advisor Debate</h4>
      </div>
      <p className="text-sm font-medium mb-4">{debate.topic}</p>
      <div className="space-y-3">
        {debate.positions.map((position) => {
          const advisor = ADVISORS.find((a) => a.id === position.advisorId);
          if (!advisor) return null;
          
          return (
            <div
              key={position.advisorId}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/50"
            >
              <div
                className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: `${getSpecialtyColor(advisor.specialty)}20` }}
              >
                {advisor.avatar}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{advisor.name}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  "{position.stance}"
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => onChoose(position.advisorId)}
                  data-testid="debate-choice-btn"
                >
                  <Target className="w-3 h-3 mr-1" />
                  {m(UI_LABELS.chooseSide)}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// City Services Advisors (Original implementation)
function CityServicesTab({
  advisorMessages,
  avgRating,
  grade,
  gradeColor,
}: {
  advisorMessages: { name: string; icon: string; messages: string[]; priority: string }[];
  avgRating: number;
  grade: string;
  gradeColor: string;
}) {
  const m = useMessages();
  
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4 p-4 bg-primary/10 border-primary/30">
        <div
          className={`w-16 h-16 flex items-center justify-center text-3xl font-black rounded-md ${gradeColor} bg-primary/20`}
        >
          {grade}
        </div>
        <div>
          <div className="text-foreground font-semibold">
            {m(UI_LABELS.overallCityRating)}
          </div>
          <div className="text-muted-foreground text-sm">
            {m(UI_LABELS.ratingDescription)}
          </div>
        </div>
      </Card>

      <ScrollArea className="max-h-[280px]">
        <div className="space-y-3">
          {advisorMessages.length === 0 ? (
            <Card className="text-center py-8 text-muted-foreground bg-primary/10 border-primary/30">
              <AdvisorIcon size={32} className="mx-auto mb-3 opacity-50" />
              <div className="text-sm">{m(UI_LABELS.noUrgentIssues)}</div>
              <div className="text-xs mt-1">
                {m(UI_LABELS.cityRunningSmoothly)}
              </div>
            </Card>
          ) : (
            advisorMessages.map((advisor, i) => {
              const portrait = ADVISOR_PORTRAITS[advisor.icon] || {
                emoji: "📋",
                bgColor: "bg-slate-500/80",
              };
              return (
                <Card
                  key={i}
                  className={`p-3 bg-primary/10 border-primary/30 ${
                    advisor.priority === "critical"
                      ? "border-l-2 border-l-red-500"
                      : advisor.priority === "high"
                        ? "border-l-2 border-l-amber-500"
                        : advisor.priority === "medium"
                          ? "border-l-2 border-l-yellow-500"
                          : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 flex-shrink-0 rounded-full ${portrait.bgColor} flex items-center justify-center text-lg shadow-md`}
                    >
                      {portrait.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-muted-foreground">
                          {ADVISOR_ICON_MAP[advisor.icon] || (
                            <InfoIcon size={16} />
                          )}
                        </span>
                        <span className="text-foreground font-medium text-sm">
                          {advisor.name}
                        </span>
                        <Badge
                          variant={
                            advisor.priority === "critical"
                              ? "destructive"
                              : advisor.priority === "high"
                                ? "destructive"
                                : "secondary"
                          }
                          className="ml-auto text-[10px]"
                        >
                          {advisor.priority}
                        </Badge>
                      </div>
                      {advisor.messages.map((advMsg, j) => (
                        <div
                          key={j}
                          className="text-muted-foreground text-sm leading-relaxed"
                        >
                          {advMsg}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface AdvisorsPanelProps {
  economyState?: CryptoEconomyState;
}

export function AdvisorsPanel({ economyState }: AdvisorsPanelProps) {
  const { state, setActivePanel } = useGame();
  const { advisorMessages, stats } = state;
  const m = useMessages();
  
  // Crypto advisor state
  const [advisorState, setAdvisorState] = useState<AdvisorState>(() => loadAdvisorState());
  const [selectedAdvisor, setSelectedAdvisor] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("crypto");

  // Update advisor state when game state or economy changes
  useEffect(() => {
    if (economyState) {
      const updated = updateAdvisorState(advisorState, state, economyState);
      setAdvisorState(updated);
      saveAdvisorState(updated);
    }
  }, [state.tick, economyState?.tvl]);

  // Save state on changes
  useEffect(() => {
    saveAdvisorState(advisorState);
  }, [advisorState]);

  const handleDebateChoice = useCallback((advisorId: string) => {
    if (!advisorState.activeDebate) return;
    const updated = recordDebateChoice(
      advisorState,
      advisorState.activeDebate.id,
      advisorId
    );
    setAdvisorState(updated);
  }, [advisorState]);

  const avgRating =
    (stats.happiness +
      stats.health +
      stats.education +
      stats.safety +
      stats.environment) /
    5;
  const grade =
    avgRating >= 90
      ? "A+"
      : avgRating >= 80
        ? "A"
        : avgRating >= 70
          ? "B"
          : avgRating >= 60
            ? "C"
            : avgRating >= 50
              ? "D"
              : "F";
  const gradeColor =
    avgRating >= 70
      ? "text-green-400"
      : avgRating >= 50
        ? "text-amber-400"
        : "text-red-400";

  return (
    <Dialog open={true} onOpenChange={() => setActivePanel("none")}>
      <DialogContent className="max-w-[600px] max-h-[700px]" data-testid="advisor-panel">
        <DialogHeader>
          <DialogTitle>{m(UI_LABELS.cityAdvisors)}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="crypto" role="tab">
              {m(UI_LABELS.cryptoAdvisors)}
            </TabsTrigger>
            <TabsTrigger value="debates" role="tab">
              {m(UI_LABELS.debates)}
            </TabsTrigger>
            <TabsTrigger value="city" role="tab">
              {m(UI_LABELS.cityServices)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="crypto" className="mt-4">
            <ScrollArea className="max-h-[450px]">
              <div className="space-y-3 pr-4">
                {ADVISORS.map((advisor) => {
                  const advice = advisorState.currentAdvice.find(
                    (a) => a.advisorId === advisor.id
                  );
                  const reputation = getAdvisorReputation(advisorState, advisor.id);
                  
                  return (
                    <AdvisorCard
                      key={advisor.id}
                      advisor={advisor}
                      advice={advice}
                      reputation={reputation}
                      isActive={selectedAdvisor === advisor.id}
                      onClick={() => setSelectedAdvisor(
                        selectedAdvisor === advisor.id ? null : advisor.id
                      )}
                    />
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="debates" className="mt-4">
            <DebatePanel
              debate={advisorState.activeDebate}
              onChoose={handleDebateChoice}
            />
            {advisorState.pastDebates.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Past Debates</h4>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {advisorState.pastDebates.slice(-5).reverse().map((debate) => {
                      const chosenAdvisor = ADVISORS.find(
                        (a) => a.id === debate.playerChoice
                      );
                      return (
                        <Card key={debate.id} className="p-3 bg-muted/30">
                          <p className="text-xs font-medium">{debate.topic}</p>
                          {chosenAdvisor && (
                            <p className="text-xs text-muted-foreground mt-1">
                              You sided with {chosenAdvisor.name}
                            </p>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="city" className="mt-4">
            <CityServicesTab
              advisorMessages={advisorMessages}
              avgRating={avgRating}
              grade={grade}
              gradeColor={gradeColor}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
