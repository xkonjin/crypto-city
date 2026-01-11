/**
 * NPC Daily Schedule System (Issue #100)
 *
 * Defines daily schedules for NPCs based on their occupation.
 * Each NPC follows a routine of activities throughout the day.
 *
 * Activity descriptions are written in the style of the Hitchhiker's Guide
 * to the Galaxy - sardonic, insightful observations about human behavior.
 */

/**
 * Activity types that NPCs can perform throughout the day
 */
export type NPCActivity =
  | "sleeping"
  | "waking_up"
  | "breakfast"
  | "commute"
  | "working"
  | "lunch"
  | "leisure"
  | "dinner"
  | "socializing";

/**
 * Occupation types for NPCs in Crypto City
 */
export type Occupation =
  | "trader"
  | "developer"
  | "miner"
  | "artist"
  | "analyst"
  | "influencer";

/**
 * Array of all occupations for iteration
 */
export const OCCUPATIONS: Occupation[] = [
  "trader",
  "developer",
  "miner",
  "artist",
  "analyst",
  "influencer",
];

/**
 * Location types where activities take place
 */
export type ActivityLocation = "home" | "work" | "restaurant" | "bar" | "any";

/**
 * A scheduled activity within a daily routine
 */
export interface ScheduledActivity {
  /** Start hour (0-23) */
  startHour: number;
  /** End hour (0-23, can be less than startHour for overnight activities) */
  endHour: number;
  /** The activity to perform */
  activity: NPCActivity;
  /** Where the activity takes place */
  location: ActivityLocation;
  /** Priority level (1-10). Higher = less flexible, harder to override */
  priority: number;
}

/**
 * A complete daily schedule for an NPC
 */
export interface DailySchedule {
  /** List of activities for the day */
  activities: ScheduledActivity[];
}

/**
 * Hitchhiker's Guide style descriptions for each activity.
 * These appear in tooltips and the city guide.
 */
export const ACTIVITY_DESCRIPTIONS: Record<NPCActivity, string> = {
  sleeping:
    "The peculiar human ritual of losing consciousness for roughly a third of their existence. Evolution's way of saying 'have you tried turning it off and on again?'",
  waking_up:
    "That brief, horrifying moment when a human becomes aware they exist and must continue doing so for approximately 16 more hours.",
  breakfast:
    "The desperate attempt to convert caffeine and carbohydrates into sufficient willpower to participate in capitalism.",
  commute:
    "The daily migration of humans from where they sleep to where they pretend to be productive. Often involves standing very close to strangers while studiously ignoring them.",
  working:
    "The thing humans do to exchange time for tokens. Somehow this seemed like a good idea.",
  lunch:
    "A brief armistice in the war against hunger, typically spent scrolling through portfolios and questioning life choices.",
  leisure:
    "The increasingly rare periods when humans attempt to remember what they enjoyed before they had responsibilities.",
  dinner:
    "Evening sustenance acquisition, often accompanied by existential contemplation of the day's trades. May involve more screen time than the surgeon general would recommend.",
  socializing:
    "Standing near other humans and making mouth noises at each other. Surprisingly important for mental health, though few can explain why.",
};

/**
 * Schedule templates for each occupation.
 * Different occupations have different daily routines.
 */
export const SCHEDULE_TEMPLATES: Record<Occupation, DailySchedule> = {
  /**
   * Trader - Early riser, market-focused schedule
   * Markets don't wait, so neither do traders.
   */
  trader: {
    activities: [
      {
        startHour: 6,
        endHour: 7,
        activity: "waking_up",
        location: "home",
        priority: 10,
      },
      {
        startHour: 7,
        endHour: 8,
        activity: "breakfast",
        location: "home",
        priority: 8,
      },
      {
        startHour: 8,
        endHour: 9,
        activity: "commute",
        location: "any",
        priority: 9,
      },
      {
        startHour: 9,
        endHour: 12,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 12,
        endHour: 13,
        activity: "lunch",
        location: "restaurant",
        priority: 7,
      },
      {
        startHour: 13,
        endHour: 17,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 17,
        endHour: 18,
        activity: "commute",
        location: "any",
        priority: 8,
      },
      {
        startHour: 18,
        endHour: 20,
        activity: "leisure",
        location: "any",
        priority: 5,
      },
      {
        startHour: 20,
        endHour: 21,
        activity: "dinner",
        location: "restaurant",
        priority: 7,
      },
      {
        startHour: 21,
        endHour: 23,
        activity: "socializing",
        location: "bar",
        priority: 4,
      },
      {
        startHour: 23,
        endHour: 6,
        activity: "sleeping",
        location: "home",
        priority: 10,
      },
    ],
  },

  /**
   * Developer - Late riser, flexible schedule, more coding hours
   * The classic "I'll fix this one more bug" lifestyle.
   */
  developer: {
    activities: [
      {
        startHour: 9,
        endHour: 10,
        activity: "waking_up",
        location: "home",
        priority: 8,
      },
      {
        startHour: 10,
        endHour: 11,
        activity: "breakfast",
        location: "home",
        priority: 6,
      },
      {
        startHour: 11,
        endHour: 12,
        activity: "commute",
        location: "any",
        priority: 7,
      },
      {
        startHour: 12,
        endHour: 13,
        activity: "working",
        location: "work",
        priority: 9,
      },
      {
        startHour: 13,
        endHour: 14,
        activity: "lunch",
        location: "restaurant",
        priority: 6,
      },
      {
        startHour: 14,
        endHour: 20,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 20,
        endHour: 21,
        activity: "dinner",
        location: "restaurant",
        priority: 7,
      },
      {
        startHour: 21,
        endHour: 23,
        activity: "leisure",
        location: "home",
        priority: 5,
      },
      {
        startHour: 23,
        endHour: 1,
        activity: "socializing",
        location: "bar",
        priority: 3,
      },
      {
        startHour: 1,
        endHour: 9,
        activity: "sleeping",
        location: "home",
        priority: 10,
      },
    ],
  },

  /**
   * Miner - Long work hours, physically demanding schedule
   * Proof of Work, the human edition.
   */
  miner: {
    activities: [
      {
        startHour: 5,
        endHour: 6,
        activity: "waking_up",
        location: "home",
        priority: 10,
      },
      {
        startHour: 6,
        endHour: 7,
        activity: "breakfast",
        location: "home",
        priority: 9,
      },
      {
        startHour: 7,
        endHour: 8,
        activity: "commute",
        location: "any",
        priority: 9,
      },
      {
        startHour: 8,
        endHour: 12,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 12,
        endHour: 13,
        activity: "lunch",
        location: "restaurant",
        priority: 8,
      },
      {
        startHour: 13,
        endHour: 18,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 18,
        endHour: 19,
        activity: "commute",
        location: "any",
        priority: 8,
      },
      {
        startHour: 19,
        endHour: 20,
        activity: "dinner",
        location: "home",
        priority: 9,
      },
      {
        startHour: 20,
        endHour: 21,
        activity: "leisure",
        location: "home",
        priority: 6,
      },
      {
        startHour: 21,
        endHour: 22,
        activity: "socializing",
        location: "bar",
        priority: 4,
      },
      {
        startHour: 22,
        endHour: 5,
        activity: "sleeping",
        location: "home",
        priority: 10,
      },
    ],
  },

  /**
   * Artist - Creative, irregular schedule, more leisure
   * Inspiration doesn't punch a clock.
   */
  artist: {
    activities: [
      {
        startHour: 10,
        endHour: 11,
        activity: "waking_up",
        location: "home",
        priority: 6,
      },
      {
        startHour: 11,
        endHour: 12,
        activity: "breakfast",
        location: "any",
        priority: 5,
      },
      {
        startHour: 12,
        endHour: 13,
        activity: "leisure",
        location: "any",
        priority: 4,
      },
      {
        startHour: 13,
        endHour: 17,
        activity: "working",
        location: "work",
        priority: 8,
      },
      {
        startHour: 17,
        endHour: 18,
        activity: "lunch",
        location: "restaurant",
        priority: 6,
      },
      {
        startHour: 18,
        endHour: 20,
        activity: "leisure",
        location: "any",
        priority: 5,
      },
      {
        startHour: 20,
        endHour: 21,
        activity: "dinner",
        location: "restaurant",
        priority: 6,
      },
      {
        startHour: 21,
        endHour: 24,
        activity: "socializing",
        location: "bar",
        priority: 5,
      },
      {
        startHour: 0,
        endHour: 2,
        activity: "working",
        location: "home",
        priority: 7,
      },
      {
        startHour: 2,
        endHour: 10,
        activity: "sleeping",
        location: "home",
        priority: 9,
      },
    ],
  },

  /**
   * Analyst - Data-driven, methodical schedule
   * Spreadsheets and existential dread, perfectly balanced.
   */
  analyst: {
    activities: [
      {
        startHour: 7,
        endHour: 8,
        activity: "waking_up",
        location: "home",
        priority: 9,
      },
      {
        startHour: 8,
        endHour: 9,
        activity: "breakfast",
        location: "home",
        priority: 8,
      },
      {
        startHour: 9,
        endHour: 10,
        activity: "commute",
        location: "any",
        priority: 8,
      },
      {
        startHour: 10,
        endHour: 13,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 13,
        endHour: 14,
        activity: "lunch",
        location: "restaurant",
        priority: 7,
      },
      {
        startHour: 14,
        endHour: 18,
        activity: "working",
        location: "work",
        priority: 10,
      },
      {
        startHour: 18,
        endHour: 19,
        activity: "commute",
        location: "any",
        priority: 8,
      },
      {
        startHour: 19,
        endHour: 20,
        activity: "dinner",
        location: "home",
        priority: 8,
      },
      {
        startHour: 20,
        endHour: 22,
        activity: "leisure",
        location: "home",
        priority: 6,
      },
      {
        startHour: 22,
        endHour: 23,
        activity: "socializing",
        location: "bar",
        priority: 3,
      },
      {
        startHour: 23,
        endHour: 7,
        activity: "sleeping",
        location: "home",
        priority: 10,
      },
    ],
  },

  /**
   * Influencer - Social-heavy schedule, irregular work
   * Professional existence validation through engagement metrics.
   */
  influencer: {
    activities: [
      {
        startHour: 8,
        endHour: 9,
        activity: "waking_up",
        location: "home",
        priority: 7,
      },
      {
        startHour: 9,
        endHour: 10,
        activity: "breakfast",
        location: "restaurant",
        priority: 6,
      },
      {
        startHour: 10,
        endHour: 12,
        activity: "working",
        location: "any",
        priority: 8,
      },
      {
        startHour: 12,
        endHour: 14,
        activity: "socializing",
        location: "restaurant",
        priority: 9,
      },
      {
        startHour: 14,
        endHour: 16,
        activity: "working",
        location: "any",
        priority: 7,
      },
      {
        startHour: 16,
        endHour: 18,
        activity: "leisure",
        location: "any",
        priority: 5,
      },
      {
        startHour: 18,
        endHour: 20,
        activity: "dinner",
        location: "restaurant",
        priority: 7,
      },
      {
        startHour: 20,
        endHour: 24,
        activity: "socializing",
        location: "bar",
        priority: 9,
      },
      {
        startHour: 0,
        endHour: 8,
        activity: "sleeping",
        location: "home",
        priority: 9,
      },
    ],
  },
};

/**
 * Get the default schedule for an occupation
 */
export function getScheduleForOccupation(
  occupation: Occupation
): DailySchedule {
  return SCHEDULE_TEMPLATES[occupation];
}

/**
 * Get a human-readable description of an activity
 */
export function getActivityDescription(activity: NPCActivity): string {
  return ACTIVITY_DESCRIPTIONS[activity];
}
