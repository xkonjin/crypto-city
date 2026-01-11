/**
 * ScheduleManager - NPC Schedule Management (Issue #100)
 *
 * Manages NPC daily schedules, determining what activity an NPC should
 * be doing at any given game hour, handling schedule overrides for
 * urgent needs, and providing destination locations.
 */

import {
  NPCActivity,
  ScheduledActivity,
  DailySchedule,
  ActivityLocation,
  Occupation,
  SCHEDULE_TEMPLATES,
} from "./schedule";

/**
 * Position in the game world
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * NPC needs that can trigger schedule overrides
 */
export interface NPCNeeds {
  /** Hunger level (0-100, higher = more hungry) */
  hunger: number;
  /** Energy level (0-100, higher = more tired) */
  energy: number;
  /** Social need (0-100, higher = more lonely) */
  social: number;
  /** Fun/entertainment need (0-100, higher = more bored) */
  fun: number;
}

/**
 * NPC with schedule-relevant properties
 */
export interface SchedulableNPC {
  id: string;
  occupation?: Occupation | string;
  schedule?: DailySchedule;
  needs?: NPCNeeds;
  homePosition?: Position;
  workPosition?: Position;
  currentPosition?: Position;
}

/**
 * Threshold for critical needs that override schedule
 */
const CRITICAL_NEED_THRESHOLD = 80;

/**
 * ScheduleManager namespace containing all schedule management functions
 */
export namespace ScheduleManager {
  /**
   * Check if a given hour falls within an activity's time range.
   * Handles overnight activities (e.g., sleeping from 23 to 6).
   */
  function isHourInActivityRange(
    hour: number,
    startHour: number,
    endHour: number
  ): boolean {
    // Normalize hour to 0-23 range
    const normalizedHour = ((hour % 24) + 24) % 24;

    if (startHour <= endHour) {
      // Normal range (e.g., 9-17)
      return normalizedHour >= startHour && normalizedHour < endHour;
    } else {
      // Overnight range (e.g., 23-6)
      return normalizedHour >= startHour || normalizedHour < endHour;
    }
  }

  /**
   * Get the schedule for an NPC.
   * Falls back to the default schedule for their occupation if not set.
   */
  function getNPCSchedule(npc: SchedulableNPC): DailySchedule | null {
    if (npc.schedule) {
      return npc.schedule;
    }

    if (npc.occupation && npc.occupation in SCHEDULE_TEMPLATES) {
      return SCHEDULE_TEMPLATES[npc.occupation as Occupation];
    }

    return null;
  }

  /**
   * Get the current activity for an NPC at a specific game hour.
   *
   * @param npc - The NPC to check
   * @param gameHour - The current game hour (0-23)
   * @returns The current scheduled activity, or null if none found
   */
  export function getCurrentActivity(
    npc: SchedulableNPC,
    gameHour: number
  ): ScheduledActivity | null {
    const schedule = getNPCSchedule(npc);
    if (!schedule) return null;

    // Find the activity that covers the current hour
    for (const activity of schedule.activities) {
      if (isHourInActivityRange(gameHour, activity.startHour, activity.endHour)) {
        return activity;
      }
    }

    return null;
  }

  /**
   * Get the next scheduled activity for an NPC after a specific game hour.
   *
   * @param npc - The NPC to check
   * @param gameHour - The current game hour (0-23)
   * @returns The next scheduled activity, or null if none found
   */
  export function getNextActivity(
    npc: SchedulableNPC,
    gameHour: number
  ): ScheduledActivity | null {
    const schedule = getNPCSchedule(npc);
    if (!schedule) return null;

    const normalizedHour = ((gameHour % 24) + 24) % 24;

    // Sort activities by start hour
    const sortedActivities = [...schedule.activities].sort(
      (a, b) => a.startHour - b.startHour
    );

    // Find the first activity that starts after the current hour
    for (const activity of sortedActivities) {
      if (activity.startHour > normalizedHour) {
        return activity;
      }
    }

    // If no activity found after current hour, wrap around to next day
    // Return the first activity of the day
    return sortedActivities[0] || null;
  }

  /**
   * Check if an NPC's urgent needs should override their current schedule.
   * Critical needs (hunger, energy, etc.) can force an NPC to deviate
   * from their routine.
   *
   * @param npc - The NPC to check
   * @returns True if schedule should be overridden, false otherwise
   */
  export function shouldOverrideSchedule(npc: SchedulableNPC): boolean {
    if (!npc.needs) return false;

    // Check if any need exceeds the critical threshold
    return (
      npc.needs.hunger >= CRITICAL_NEED_THRESHOLD ||
      npc.needs.energy >= CRITICAL_NEED_THRESHOLD ||
      npc.needs.social >= CRITICAL_NEED_THRESHOLD ||
      npc.needs.fun >= CRITICAL_NEED_THRESHOLD
    );
  }

  /**
   * Get the urgent activity an NPC should do when their schedule is overridden.
   *
   * @param npc - The NPC to check
   * @returns The urgent activity type, or null if no urgent need
   */
  export function getUrgentActivity(npc: SchedulableNPC): NPCActivity | null {
    if (!npc.needs) return null;

    // Priority order: energy > hunger > social > fun
    if (npc.needs.energy >= CRITICAL_NEED_THRESHOLD) {
      return "sleeping";
    }
    if (npc.needs.hunger >= CRITICAL_NEED_THRESHOLD) {
      // Return appropriate meal based on hypothetical time
      return "dinner";
    }
    if (npc.needs.social >= CRITICAL_NEED_THRESHOLD) {
      return "socializing";
    }
    if (npc.needs.fun >= CRITICAL_NEED_THRESHOLD) {
      return "leisure";
    }

    return null;
  }

  /**
   * Get the destination position for an NPC based on their current activity.
   *
   * @param npc - The NPC to get destination for
   * @param activity - The activity type to find destination for
   * @returns The position the NPC should go to, or null if unknown
   */
  export function getDestinationForActivity(
    npc: SchedulableNPC,
    activity: NPCActivity | string
  ): Position | null {
    switch (activity) {
      case "sleeping":
      case "waking_up":
        return npc.homePosition || null;

      case "working":
        return npc.workPosition || null;

      case "breakfast":
      case "dinner":
        // Prefer home for breakfast, but could be restaurant
        return npc.homePosition || null;

      case "lunch":
        // Lunch is typically at a restaurant - return work position as fallback
        // In a full implementation, this would find the nearest restaurant
        return npc.workPosition || npc.homePosition || null;

      case "commute":
        // During commute, destination depends on the next activity
        // For simplicity, return null (needs more context)
        return npc.currentPosition || null;

      case "leisure":
      case "socializing":
        // Social activities are at various locations
        // In a full implementation, this would find nearby amenities
        return npc.homePosition || null;

      default:
        return null;
    }
  }

  /**
   * Get the preferred location type for an activity.
   *
   * @param activity - The activity to check
   * @returns The preferred location type
   */
  export function getLocationForActivity(
    activity: NPCActivity
  ): ActivityLocation {
    switch (activity) {
      case "sleeping":
      case "waking_up":
        return "home";

      case "working":
        return "work";

      case "lunch":
      case "dinner":
        return "restaurant";

      case "socializing":
        return "bar";

      case "breakfast":
        return "home";

      case "commute":
      case "leisure":
      default:
        return "any";
    }
  }

  /**
   * Calculate the duration of an activity in hours.
   *
   * @param activity - The scheduled activity
   * @returns Duration in hours
   */
  export function getActivityDuration(activity: ScheduledActivity): number {
    if (activity.endHour >= activity.startHour) {
      return activity.endHour - activity.startHour;
    } else {
      // Overnight activity
      return 24 - activity.startHour + activity.endHour;
    }
  }

  /**
   * Check if an NPC is currently at their expected location.
   *
   * @param npc - The NPC to check
   * @param gameHour - The current game hour
   * @returns True if NPC is where they should be
   */
  export function isAtExpectedLocation(
    npc: SchedulableNPC,
    gameHour: number
  ): boolean {
    if (!npc.currentPosition) return false;

    const currentActivity = getCurrentActivity(npc, gameHour);
    if (!currentActivity) return true; // No expectation

    const expectedDestination = getDestinationForActivity(
      npc,
      currentActivity.activity
    );
    if (!expectedDestination) return true; // No specific location required

    // Check if current position matches expected (with some tolerance)
    const tolerance = 2; // Allow 2 tile tolerance
    return (
      Math.abs(npc.currentPosition.x - expectedDestination.x) <= tolerance &&
      Math.abs(npc.currentPosition.y - expectedDestination.y) <= tolerance
    );
  }
}

// Re-export types for convenience
export type { NPCActivity, ScheduledActivity, DailySchedule, ActivityLocation };
