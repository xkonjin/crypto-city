import { test, expect } from "@playwright/test";
import {
  SCHEDULE_TEMPLATES,
  ACTIVITY_DESCRIPTIONS,
  OCCUPATIONS,
  type Occupation,
  type ScheduledActivity,
  type DailySchedule,
} from "../src/lib/npc/schedule";
import { ScheduleManager } from "../src/lib/npc/ScheduleManager";

/**
 * NPC Schedule System Tests (Issue #100)
 *
 * Tests for the NPC daily schedule system where NPCs follow routines
 * based on their occupation. This includes:
 * - Schedule types and activities
 * - Schedule templates by occupation
 * - ScheduleManager functionality
 * - Integration with game hour system
 */

// Test the schedule module exports and types
test.describe("NPC Schedule System - Module Structure", () => {
  test("should export schedule types from npc/schedule", async () => {
    // Verify that SCHEDULE_TEMPLATES exists and has expected structure
    expect(SCHEDULE_TEMPLATES).toBeDefined();
    expect(ACTIVITY_DESCRIPTIONS).toBeDefined();
    expect(OCCUPATIONS).toBeDefined();
    expect(OCCUPATIONS.length).toBeGreaterThanOrEqual(6);
  });

  test("should export ScheduleManager from npc/ScheduleManager", async () => {
    expect(ScheduleManager).toBeDefined();
    expect(typeof ScheduleManager.getCurrentActivity).toBe("function");
    expect(typeof ScheduleManager.getNextActivity).toBe("function");
    expect(typeof ScheduleManager.shouldOverrideSchedule).toBe("function");
    expect(typeof ScheduleManager.getDestinationForActivity).toBe("function");
  });
});

test.describe("NPC Schedule Templates", () => {
  test("should have schedule templates for all occupations", async () => {
    const hasAllOccupations = OCCUPATIONS.every(
      (occ) => occ in SCHEDULE_TEMPLATES
    );

    expect(Object.keys(SCHEDULE_TEMPLATES).length).toBeGreaterThanOrEqual(6);
    expect(hasAllOccupations).toBeTruthy();
  });

  test("trader schedule should have correct daily activities", async () => {
    const trader = SCHEDULE_TEMPLATES.trader;

    expect(trader.activities.length).toBeGreaterThanOrEqual(8);
    expect(
      trader.activities.some((a) => a.activity === "working")
    ).toBeTruthy();
    expect(
      trader.activities.some((a) => a.activity === "sleeping")
    ).toBeTruthy();
    expect(trader.activities.some((a) => a.activity === "lunch")).toBeTruthy();
    expect(
      trader.activities.some((a) => a.activity === "socializing")
    ).toBeTruthy();
  });

  test("activities should have valid hour ranges (0-23)", async () => {
    const allActivities: ScheduledActivity[] = [];

    Object.values(SCHEDULE_TEMPLATES).forEach((schedule) => {
      schedule.activities.forEach((activity) => {
        allActivities.push(activity);
      });
    });

    const invalidHours = allActivities.filter(
      (a) =>
        a.startHour < 0 || a.startHour > 23 || a.endHour < 0 || a.endHour > 24
    );

    expect(invalidHours.length).toBe(0);
  });

  test("activities should have valid priority levels (1-10)", async () => {
    const allActivities: ScheduledActivity[] = [];

    Object.values(SCHEDULE_TEMPLATES).forEach((schedule) => {
      schedule.activities.forEach((activity) => {
        allActivities.push(activity);
      });
    });

    const invalidPriorities = allActivities.filter(
      (a) => a.priority < 1 || a.priority > 10
    );

    expect(invalidPriorities.length).toBe(0);
  });
});

test.describe("ScheduleManager - getCurrentActivity", () => {
  test("should return sleeping activity during night hours", async () => {
    const mockNPC = {
      id: "test-npc-1",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
    };

    // Test at 3 AM
    const activity = ScheduleManager.getCurrentActivity(mockNPC, 3);

    expect(activity?.activity).toBe("sleeping");
    expect(activity?.location).toBe("home");
  });

  test("should return working activity during work hours", async () => {
    const mockNPC = {
      id: "test-npc-2",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
    };

    // Test at 10 AM (working hours for trader)
    const activity = ScheduleManager.getCurrentActivity(mockNPC, 10);

    expect(activity?.activity).toBe("working");
    expect(activity?.location).toBe("work");
  });

  test("should return lunch activity during lunch hour", async () => {
    const mockNPC = {
      id: "test-npc-3",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
    };

    // Test at 12 PM (lunch hour for trader)
    const activity = ScheduleManager.getCurrentActivity(mockNPC, 12);

    expect(activity?.activity).toBe("lunch");
    expect(activity?.location).toBe("restaurant");
  });
});

test.describe("ScheduleManager - getNextActivity", () => {
  test("should return next activity after current time", async () => {
    const mockNPC = {
      id: "test-npc-4",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
    };

    // Test at 11 AM - next should be lunch at 12
    const next = ScheduleManager.getNextActivity(mockNPC, 11);

    expect(next?.activity).toBe("lunch");
    expect(next?.startHour).toBe(12);
  });

  test("should wrap around to next day for late night hours", async () => {
    const mockNPC = {
      id: "test-npc-5",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
    };

    // Test at 11 PM - next should wrap to next day (waking_up at 6)
    const next = ScheduleManager.getNextActivity(mockNPC, 23);

    expect(next).not.toBeNull();
    // Should wrap to first activity of next day
    expect(next?.startHour).toBeLessThan(23);
  });
});

test.describe("ScheduleManager - shouldOverrideSchedule", () => {
  test("should return true when NPC has critical needs", async () => {
    const mockNPC = {
      id: "test-npc-6",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
      needs: {
        hunger: 95, // Critical hunger
        energy: 50,
        social: 50,
        fun: 50,
      },
    };

    const shouldOverride = ScheduleManager.shouldOverrideSchedule(mockNPC);

    expect(shouldOverride).toBeTruthy();
  });

  test("should return false when NPC has normal needs", async () => {
    const mockNPC = {
      id: "test-npc-7",
      occupation: "trader" as Occupation,
      schedule: SCHEDULE_TEMPLATES.trader,
      needs: {
        hunger: 30,
        energy: 50,
        social: 50,
        fun: 50,
      },
    };

    const shouldOverride = ScheduleManager.shouldOverrideSchedule(mockNPC);

    expect(shouldOverride).toBeFalsy();
  });
});

test.describe("ScheduleManager - getDestinationForActivity", () => {
  test("should return home location for sleeping activity", async () => {
    const mockNPC = {
      id: "test-npc-8",
      homePosition: { x: 10, y: 20 },
      workPosition: { x: 30, y: 40 },
    };

    const destination = ScheduleManager.getDestinationForActivity(
      mockNPC,
      "sleeping"
    );

    expect(destination?.x).toBe(10);
    expect(destination?.y).toBe(20);
  });

  test("should return work location for working activity", async () => {
    const mockNPC = {
      id: "test-npc-9",
      homePosition: { x: 10, y: 20 },
      workPosition: { x: 30, y: 40 },
    };

    const destination = ScheduleManager.getDestinationForActivity(
      mockNPC,
      "working"
    );

    expect(destination?.x).toBe(30);
    expect(destination?.y).toBe(40);
  });
});

test.describe("Activity Descriptions - Hitchhiker's Guide Style", () => {
  test("should have sardonic description for 'working' activity", async () => {
    expect("working" in ACTIVITY_DESCRIPTIONS).toBeTruthy();

    const workingDescription = ACTIVITY_DESCRIPTIONS.working;
    // Should contain Hitchhiker's Guide style humor about exchanging time for tokens
    expect(workingDescription.toLowerCase()).toContain("time");
    expect(workingDescription.toLowerCase()).toContain("token");
  });

  test("should have sardonic description for 'socializing' activity", async () => {
    expect("socializing" in ACTIVITY_DESCRIPTIONS).toBeTruthy();

    const socializingDescription = ACTIVITY_DESCRIPTIONS.socializing;
    // Should contain humor about humans making mouth noises
    expect(socializingDescription.toLowerCase()).toContain("human");
  });

  test("should have descriptions for all activity types", async () => {
    const expectedActivities = [
      "sleeping",
      "waking_up",
      "breakfast",
      "commute",
      "working",
      "lunch",
      "leisure",
      "dinner",
      "socializing",
    ];

    const missingDescriptions = expectedActivities.filter(
      (activity) => !(activity in ACTIVITY_DESCRIPTIONS)
    );

    expect(missingDescriptions.length).toBe(0);
    expect(Object.keys(ACTIVITY_DESCRIPTIONS).length).toBeGreaterThanOrEqual(9);
  });
});

test.describe("Different Occupation Schedules", () => {
  test("developer should have late start compared to trader", async () => {
    const traderWakeUp = SCHEDULE_TEMPLATES.trader.activities.find(
      (a) => a.activity === "waking_up"
    );
    const developerWakeUp = SCHEDULE_TEMPLATES.developer.activities.find(
      (a) => a.activity === "waking_up"
    );

    // Developers typically start later
    expect((developerWakeUp?.startHour || 0) > (traderWakeUp?.startHour || 0)).toBeTruthy();
  });

  test("miner should have more work hours than artist", async () => {
    const calculateWorkHours = (schedule: DailySchedule) => {
      return schedule.activities
        .filter((a) => a.activity === "working")
        .reduce((total, a) => {
          const hours =
            a.endHour > a.startHour
              ? a.endHour - a.startHour
              : 24 - a.startHour + a.endHour;
          return total + hours;
        }, 0);
    };

    const minerWorkHours = calculateWorkHours(SCHEDULE_TEMPLATES.miner);
    const artistWorkHours = calculateWorkHours(SCHEDULE_TEMPLATES.artist);

    // Miners should work at least as much as artists
    expect(minerWorkHours >= artistWorkHours).toBeTruthy();
  });

  test("influencer should have more socializing time", async () => {
    const calculateSocialHours = (schedule: DailySchedule) => {
      return schedule.activities
        .filter((a) => a.activity === "socializing")
        .reduce((total, a) => {
          const hours =
            a.endHour > a.startHour
              ? a.endHour - a.startHour
              : 24 - a.startHour + a.endHour;
          return total + hours;
        }, 0);
    };

    const influencerSocialHours = calculateSocialHours(
      SCHEDULE_TEMPLATES.influencer
    );
    const analystSocialHours = calculateSocialHours(SCHEDULE_TEMPLATES.analyst);

    // Influencers should socialize more than analysts
    expect(influencerSocialHours > analystSocialHours).toBeTruthy();
  });
});

test.describe("Schedule Coverage", () => {
  test("every hour of the day should have an activity for each occupation", async () => {
    const gaps: { occupation: string; hour: number }[] = [];

    for (const occupation of OCCUPATIONS) {
      const schedule = SCHEDULE_TEMPLATES[occupation];
      if (!schedule) continue;

      const mockNPC = {
        id: `test-${occupation}`,
        occupation: occupation,
        schedule,
      };

      for (let hour = 0; hour < 24; hour++) {
        const activity = ScheduleManager.getCurrentActivity(mockNPC, hour);
        if (!activity) {
          gaps.push({ occupation, hour });
        }
      }
    }

    expect(gaps.length).toBe(0);
  });
});
