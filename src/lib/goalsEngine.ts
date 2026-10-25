/**
 * Interactive Goal Parser and Counter Engine for Heybo v2.0
 * Supports patterns:
 * - "Цель: 500/1000 кубков"
 * - "/цель: 12/20"
 * - "Цель: 1000 кубков" (converts to "Цель: 0/1000 кубков" when manipulated)
 * - "Цель: 5/10"
 */

export interface ParsedGoal {
  hasGoal: boolean;
  current: number;
  max: number;
  unit: string;
  rawMatch: string;
  isComplete: boolean;
  percent: number;
}

const FRACTION_GOAL_REGEX = /(?:цель|goal|квест):\s*(\d+)\s*\/\s*(\d+)(?:\s+([^\n\r,.;!]+))?/i;
const SLASH_COMMAND_GOAL_REGEX = /\/(?:цель|goal)\s*[:=]?\s*(\d+)\s*\/\s*(\d+)(?:\s+([^\n\r,.;!]+))?/i;
const SINGLE_NUM_GOAL_REGEX = /(?:цель|goal):\s*(\d+)\s+([а-яa-z0-9_-]+)/i;

export function parseGoalFromText(text: string): ParsedGoal | null {
  if (!text) return null;

  // 1. Try "Цель: X/Y [unit]"
  const fracMatch = text.match(FRACTION_GOAL_REGEX) || text.match(SLASH_COMMAND_GOAL_REGEX);
  if (fracMatch) {
    const current = parseInt(fracMatch[1], 10);
    const max = parseInt(fracMatch[2], 10);
    const unit = (fracMatch[3] || "").trim();
    const safeMax = max > 0 ? max : 1;
    const safeCurrent = Math.max(0, current);
    const percent = Math.min(100, Math.round((safeCurrent / safeMax) * 100));

    return {
      hasGoal: true,
      current: safeCurrent,
      max: safeMax,
      unit,
      rawMatch: fracMatch[0],
      isComplete: safeCurrent >= safeMax,
      percent,
    };
  }

  // 2. Try "Цель: 1000 кубков" -> treat 1000 as max with 0 current
  const singleMatch = text.match(SINGLE_NUM_GOAL_REGEX);
  if (singleMatch) {
    const max = parseInt(singleMatch[1], 10);
    const unit = (singleMatch[2] || "").trim();
    const safeMax = max > 0 ? max : 1;

    return {
      hasGoal: true,
      current: 0,
      max: safeMax,
      unit,
      rawMatch: singleMatch[0],
      isComplete: false,
      percent: 0,
    };
  }

  return null;
}

export function updateGoalInText(
  text: string,
  delta: number
): { updatedText: string; goal: ParsedGoal | null } {
  const goal = parseGoalFromText(text);
  if (!goal) return { updatedText: text, goal: null };

  const newCurrent = Math.max(0, goal.current + delta);
  const newPercent = Math.min(100, Math.round((newCurrent / goal.max) * 100));
  const unitSuffix = goal.unit ? ` ${goal.unit}` : "";

  // If previous match was single number "Цель: 1000 кубков", replace with fraction
  let replacement = `Цель: ${newCurrent}/${goal.max}${unitSuffix}`;

  const updatedText = text.replace(goal.rawMatch, replacement);

  return {
    updatedText,
    goal: {
      ...goal,
      current: newCurrent,
      percent: newPercent,
      isComplete: newCurrent >= goal.max,
      rawMatch: replacement,
    },
  };
}
