/**
 * Dynamic Theme Matrix Engine (ThemeMatrix v2.0)
 * 150+ keywords grouped into 10 core style families.
 * Weighted voting conflict resolution, first-occurrence fallback, and direct override.
 * Preserves clean, bright, legible cards in light mode and deep OLED in dark mode.
 */

export type ThemeKey =
  | "default"
  | "minecraft"
  | "brawlstars"
  | "genshin"
  | "finance"
  | "work"
  | "media"
  | "cyberpunk"
  | "witcher"
  | "seasons"
  | "private";

export interface ThemeVisualConfig {
  key: ThemeKey;
  displayName: string;
  badgeLabel: string;
  badgeIcon: string;
  // Light Mode styling (bright, clean, readable)
  light: {
    bg: string;
    border: string;
    textTitle: string;
    textBody: string;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
  };
  // OLED Dark Mode styling
  dark: {
    bg: string;
    border: string;
    textTitle: string;
    textBody: string;
    badgeBg: string;
    badgeText: string;
    accentColor: string;
  };
}

/// Helper to match a word or phrase with Cyrillic/Latin boundaries
function makeTrigger(word: string): RegExp {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-zA-Zа-яА-ЯёЁ0-9])${escaped}(?:$|[^a-zA-Zа-яА-ЯёЁ0-9])`, "i");
}

// 150+ keywords grouped into 10 base themes with boundary protection
export const THEME_TRIGGERS: Record<Exclude<ThemeKey, "default">, RegExp[]> = {
  minecraft: [
    makeTrigger("майнкрафт"), makeTrigger("майн"), makeTrigger("minecraft"), makeTrigger("mine"),
    makeTrigger("выживание"), makeTrigger("кубы"), makeTrigger("блок"), makeTrigger("блоки"),
    makeTrigger("крипер"), makeTrigger("creeper"), makeTrigger("алмаз"), makeTrigger("алмазы"),
    makeTrigger("кирка"), makeTrigger("эндер"), makeTrigger("эндермен"), makeTrigger("обсидиан"),
    makeTrigger("незерит"), makeTrigger("крафт"), makeTrigger("верстак"), makeTrigger("редстоун"),
    makeTrigger("пещера")
  ],
  brawlstars: [
    makeTrigger("бравл"), makeTrigger("brawl"), makeTrigger("бравлер"), makeTrigger("brawler"),
    makeTrigger("кубки"), makeTrigger("трофеи"), makeTrigger("леон"), makeTrigger("кольт"),
    makeTrigger("спайк"), makeTrigger("ворон"), makeTrigger("шелли"), makeTrigger("гемграб"),
    makeTrigger("броулбол"), makeTrigger("гемы"), makeTrigger("бравлстарс"), makeTrigger("brawlstars"),
    makeTrigger("булл"), makeTrigger("эдгар"), makeTrigger("мортис"), makeTrigger("старр"),
    makeTrigger("бравлеры")
  ],
  genshin: [
    makeTrigger("геншин"), makeTrigger("genshin"), makeTrigger("примогем"), makeTrigger("примогемы"),
    makeTrigger("крутки"), makeTrigger("аниме"), makeTrigger("anime"), makeTrigger("тайтл"),
    makeTrigger("манга"), makeTrigger("вайфу"), makeTrigger("пиро"), makeTrigger("гидро"),
    makeTrigger("электро"), makeTrigger("крио"), makeTrigger("дендро"), makeTrigger("анемо"),
    makeTrigger("гео"), makeTrigger("селестия"), makeTrigger("паймон"), makeTrigger("тейват"),
    makeTrigger("хонкай")
  ],
  finance: [
    makeTrigger("деньги"), makeTrigger("инвестиции"), makeTrigger("банк"), makeTrigger("сбер"),
    makeTrigger("тинькофф"), makeTrigger("т-банк"), makeTrigger("крипта"), makeTrigger("биткоин"),
    makeTrigger("bitcoin"), makeTrigger("доход"), makeTrigger("баланс"), makeTrigger("траты"),
    makeTrigger("зарплата"), makeTrigger("бюджет"), makeTrigger("акции"), makeTrigger("дивиденды"),
    makeTrigger("депозит"), makeTrigger("расходы"), makeTrigger("накопления"), makeTrigger("капитал"),
    makeTrigger("рубли")
  ],
  work: [
    makeTrigger("работа"), makeTrigger("додо"), makeTrigger("dodo"), makeTrigger("смена"),
    makeTrigger("kwork"), makeTrigger("заказ"), makeTrigger("график"), makeTrigger("клиент"),
    makeTrigger("дедлайн"), makeTrigger("проект"), makeTrigger("отчет"), makeTrigger("менеджер"),
    makeTrigger("офис"), makeTrigger("созвон"), makeTrigger("таск"), makeTrigger("тз"),
    makeTrigger("фриланс"), makeTrigger("планерка"), makeTrigger("задачи"), makeTrigger("поставка"),
    makeTrigger("начальник")
  ],
  media: [
    makeTrigger("ютуб"), makeTrigger("youtube"), makeTrigger("ролик"), makeTrigger("видео"),
    makeTrigger("монтаж"), makeTrigger("сценарий"), makeTrigger("превью"), makeTrigger("съемка"),
    makeTrigger("тикток"), makeTrigger("tiktok"), makeTrigger("шортс"), makeTrigger("shorts"),
    makeTrigger("камера"), makeTrigger("кадр"), makeTrigger("микрофон"), makeTrigger("звук"),
    makeTrigger("стрим"), makeTrigger("stream"), makeTrigger("твич"), makeTrigger("twitch"),
    makeTrigger("рендер")
  ],
  cyberpunk: [
    makeTrigger("киберпанк"), makeTrigger("cyberpunk"), makeTrigger("неон"), makeTrigger("код"),
    makeTrigger("программист"), makeTrigger("разработка"), makeTrigger("хакер"), makeTrigger("матрица"),
    makeTrigger("глюк"), makeTrigger("glitch"), makeTrigger("терминал"), makeTrigger("скрипт"),
    makeTrigger("сервер"), makeTrigger("api"), makeTrigger("консоль"), makeTrigger("синдикат"),
    makeTrigger("нейросеть"), makeTrigger("софт"), makeTrigger("баг"), makeTrigger("баги")
  ],
  witcher: [
    makeTrigger("ведьмак"), makeTrigger("witcher"), makeTrigger("геральт"), makeTrigger("готика"),
    makeTrigger("монстр"), makeTrigger("зелье"), makeTrigger("руны"), makeTrigger("меч"),
    makeTrigger("цири"), makeTrigger("йеннифер"), makeTrigger("чудовище"), makeTrigger("бестиарий"),
    makeTrigger("знак"), makeTrigger("квен"), makeTrigger("игни"), makeTrigger("аксий"),
    makeTrigger("эликсир"), makeTrigger("серебро"), makeTrigger("нордлинг"), makeTrigger("заказчик")
  ],
  seasons: [
    makeTrigger("осень"), makeTrigger("зима"), makeTrigger("весна"), makeTrigger("лето"),
    makeTrigger("дождь"), makeTrigger("снег"), makeTrigger("листья"), makeTrigger("уют"),
    makeTrigger("погода"), makeTrigger("солнце"), makeTrigger("вечер"), makeTrigger("утро"),
    makeTrigger("кофе"), makeTrigger("чай"), makeTrigger("листопад"), makeTrigger("мороз"),
    makeTrigger("каникулы"), makeTrigger("отпуск"), makeTrigger("гроза"), makeTrigger("теплый")
  ],
  private: [
    makeTrigger("секрет"), makeTrigger("пароль"), makeTrigger("приват"), makeTrigger("18+"),
    makeTrigger("nsfw"), makeTrigger("личн"), makeTrigger("тайна"), makeTrigger("скрытно"),
    makeTrigger("пароли"), makeTrigger("код доступа"), makeTrigger("конфиденциально"),
    makeTrigger("закрыто"), makeTrigger("интим"), makeTrigger("анонимно"), makeTrigger("сейф")
  ],
};

export const THEME_CONFIGS: Record<ThemeKey, ThemeVisualConfig> = {
  default: {
    key: "default",
    displayName: "Стандарт",
    badgeLabel: "Heybo Органайзер",
    badgeIcon: "FileText",
    light: {
      bg: "bg-white",
      border: "border-slate-200/90 hover:border-slate-300",
      textTitle: "text-slate-900",
      textBody: "text-slate-600",
      badgeBg: "bg-slate-100",
      badgeText: "text-slate-700",
      accentColor: "#2E7D32",
    },
    dark: {
      bg: "bg-[#141414]",
      border: "border-white/10 hover:border-white/20",
      textTitle: "text-white",
      textBody: "text-slate-300",
      badgeBg: "bg-white/10",
      badgeText: "text-slate-300",
      accentColor: "#81C784",
    },
  },
  minecraft: {
    key: "minecraft",
    displayName: "Minecraft",
    badgeLabel: "Достижение: Minecraft",
    badgeIcon: "Pickaxe",
    light: {
      bg: "bg-[#F0FDF4]",
      border: "border-2 border-emerald-500/70 shadow-sm",
      textTitle: "text-emerald-950 font-mono",
      textBody: "text-emerald-900",
      badgeBg: "bg-emerald-100",
      badgeText: "text-emerald-800",
      accentColor: "#10B981",
    },
    dark: {
      bg: "bg-[#0b1f13]",
      border: "border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
      textTitle: "text-emerald-200 font-mono",
      textBody: "text-emerald-100/90",
      badgeBg: "bg-emerald-900/40",
      badgeText: "text-emerald-300",
      accentColor: "#34D399",
    },
  },
  brawlstars: {
    key: "brawlstars",
    displayName: "Brawl Stars",
    badgeLabel: "Brawl Stars: Кубки",
    badgeIcon: "Trophy",
    light: {
      bg: "bg-[#FFFBEB]",
      border: "border-2 border-amber-500/80 shadow-sm",
      textTitle: "text-amber-950 font-bold",
      textBody: "text-amber-900",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-800",
      accentColor: "#F59E0B",
    },
    dark: {
      bg: "bg-[#211705]",
      border: "border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      textTitle: "text-amber-200 font-bold",
      textBody: "text-amber-100/90",
      badgeBg: "bg-amber-900/40",
      badgeText: "text-amber-300",
      accentColor: "#FBBF24",
    },
  },
  genshin: {
    key: "genshin",
    displayName: "Genshin & Аниме",
    badgeLabel: "Genshin / Аниме Тайтл",
    badgeIcon: "Sparkles",
    light: {
      bg: "bg-[#FAF5FF]",
      border: "border-2 border-purple-400 shadow-sm",
      textTitle: "text-purple-950 font-semibold",
      textBody: "text-purple-900",
      badgeBg: "bg-purple-100",
      badgeText: "text-purple-800",
      accentColor: "#A855F7",
    },
    dark: {
      bg: "bg-[#180a26]",
      border: "border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.25)]",
      textTitle: "text-purple-200 font-semibold",
      textBody: "text-purple-100/90",
      badgeBg: "bg-purple-900/40",
      badgeText: "text-purple-300",
      accentColor: "#C084FC",
    },
  },
  finance: {
    key: "finance",
    displayName: "Финансы & Банк",
    badgeLabel: "Финансы & Баланс",
    badgeIcon: "DollarSign",
    light: {
      bg: "bg-[#F0FDF4]",
      border: "border-2 border-teal-600/60 shadow-sm",
      textTitle: "text-teal-950 font-semibold",
      textBody: "text-teal-900",
      badgeBg: "bg-teal-100",
      badgeText: "text-teal-800",
      accentColor: "#0D9488",
    },
    dark: {
      bg: "bg-[#071d18]",
      border: "border-2 border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.25)]",
      textTitle: "text-teal-200 font-semibold",
      textBody: "text-teal-100/90",
      badgeBg: "bg-teal-900/40",
      badgeText: "text-teal-300",
      accentColor: "#2DD4BF",
    },
  },
  work: {
    key: "work",
    displayName: "Работа & Додо",
    badgeLabel: "Работа & Дедлайн",
    badgeIcon: "Briefcase",
    light: {
      bg: "bg-[#FFF7ED]",
      border: "border-2 border-orange-500/70 shadow-sm",
      textTitle: "text-orange-950 font-semibold",
      textBody: "text-orange-900",
      badgeBg: "bg-orange-100",
      badgeText: "text-orange-800",
      accentColor: "#F97316",
    },
    dark: {
      bg: "bg-[#210f03]",
      border: "border-2 border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.25)]",
      textTitle: "text-orange-200 font-semibold",
      textBody: "text-orange-100/90",
      badgeBg: "bg-orange-900/40",
      badgeText: "text-orange-300",
      accentColor: "#FB923C",
    },
  },
  media: {
    key: "media",
    displayName: "Медиа & YouTube",
    badgeLabel: "Медиа & Ролик",
    badgeIcon: "Video",
    light: {
      bg: "bg-[#FEF2F2]",
      border: "border-2 border-rose-500/70 shadow-sm",
      textTitle: "text-rose-950 font-semibold",
      textBody: "text-rose-900",
      badgeBg: "bg-rose-100",
      badgeText: "text-rose-800",
      accentColor: "#EF4444",
    },
    dark: {
      bg: "bg-[#24080a]",
      border: "border-2 border-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.25)]",
      textTitle: "text-rose-200 font-semibold",
      textBody: "text-rose-100/90",
      badgeBg: "bg-rose-900/40",
      badgeText: "text-rose-300",
      accentColor: "#F87171",
    },
  },
  cyberpunk: {
    key: "cyberpunk",
    displayName: "Киберпанк & Неон",
    badgeLabel: "Киберпанк / Неон",
    badgeIcon: "Terminal",
    light: {
      bg: "bg-[#F0FDF4]",
      border: "border-2 border-cyan-500 shadow-sm",
      textTitle: "text-cyan-950 font-mono font-bold",
      textBody: "text-cyan-900",
      badgeBg: "bg-cyan-100",
      badgeText: "text-cyan-800",
      accentColor: "#06B6D4",
    },
    dark: {
      bg: "bg-[#041a1a]",
      border: "border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]",
      textTitle: "text-cyan-300 font-mono font-bold",
      textBody: "text-cyan-100/90",
      badgeBg: "bg-cyan-950/70",
      badgeText: "text-cyan-300",
      accentColor: "#22D3EE",
    },
  },
  witcher: {
    key: "witcher",
    displayName: "Ведьмак & Готика",
    badgeLabel: "Ведьмак & Готика",
    badgeIcon: "Flame",
    light: {
      bg: "bg-[#FDF4FF]",
      border: "border-2 border-indigo-700/60 shadow-sm",
      textTitle: "text-indigo-950 font-serif font-bold",
      textBody: "text-indigo-900",
      badgeBg: "bg-indigo-100",
      badgeText: "text-indigo-800",
      accentColor: "#4338CA",
    },
    dark: {
      bg: "bg-[#130d22]",
      border: "border-2 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]",
      textTitle: "text-indigo-200 font-serif font-bold",
      textBody: "text-indigo-100/90",
      badgeBg: "bg-indigo-950/70",
      badgeText: "text-indigo-300",
      accentColor: "#818CF8",
    },
  },
  seasons: {
    key: "seasons",
    displayName: "Сезоны & Уют",
    badgeLabel: "Атмосфера & Сезон",
    badgeIcon: "CloudSun",
    light: {
      bg: "bg-[#F0F9FF]",
      border: "border-2 border-sky-400 shadow-sm",
      textTitle: "text-sky-950 font-medium",
      textBody: "text-sky-900",
      badgeBg: "bg-sky-100",
      badgeText: "text-sky-800",
      accentColor: "#0EA5E9",
    },
    dark: {
      bg: "bg-[#081826]",
      border: "border-2 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.25)]",
      textTitle: "text-sky-200 font-medium",
      textBody: "text-sky-100/90",
      badgeBg: "bg-sky-950/70",
      badgeText: "text-sky-300",
      accentColor: "#38BDF8",
    },
  },
  private: {
    key: "private",
    displayName: "18+ Приватный сейф",
    badgeLabel: "18+ Личный Контейнер",
    badgeIcon: "Lock",
    light: {
      bg: "bg-[#FDF2F8]",
      border: "border-2 border-pink-500/70 shadow-sm",
      textTitle: "text-pink-950 font-bold",
      textBody: "text-pink-900",
      badgeBg: "bg-pink-100",
      badgeText: "text-pink-800",
      accentColor: "#EC4899",
    },
    dark: {
      bg: "bg-[#24081c]",
      border: "border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.3)]",
      textTitle: "text-pink-200 font-bold",
      textBody: "text-pink-100/90",
      badgeBg: "bg-pink-950/70",
      badgeText: "text-pink-300",
      accentColor: "#F472B6",
    },
  },
};

const OVERRIDE_ALIASES: Record<string, ThemeKey> = {
  "майнкрафт": "minecraft",
  "майн": "minecraft",
  "minecraft": "minecraft",
  "бравл": "brawlstars",
  "бравл старс": "brawlstars",
  "бравлстарс": "brawlstars",
  "brawl": "brawlstars",
  "геншин": "genshin",
  "аниме": "genshin",
  "genshin": "genshin",
  "финансы": "finance",
  "банк": "finance",
  "деньги": "finance",
  "работа": "work",
  "додо": "work",
  "медиа": "media",
  "ютуб": "media",
  "youtube": "media",
  "киберпанк": "cyberpunk",
  "неон": "cyberpunk",
  "ведьмак": "witcher",
  "готика": "witcher",
  "сезоны": "seasons",
  "уют": "seasons",
  "приват": "private",
  "18+": "private",
  "секрет": "private",
};

/**
 * Detect the dominant theme of any text:
 * 1. Explicit override check: "Оформление: [Название]" or "Тема: [Название]"
 * 2. Weighted voting: counts occurrences of keywords per theme
 * 3. Tie breaker: earliest keyword position in the text wins
 */
export function detectDominantTheme(text: string): ThemeKey {
  if (!text || typeof text !== "string") return "default";

  // 1. Explicit override check
  const overrideMatch = text.match(/(?:оформление|тема|стиль)\s*:\s*([a-zA-Zа-яА-Я0-9+ ]+)/i);
  if (overrideMatch) {
    const rawVal = overrideMatch[1].trim().toLowerCase();
    for (const [alias, themeKey] of Object.entries(OVERRIDE_ALIASES)) {
      if (rawVal.includes(alias)) {
        return themeKey;
      }
    }
  }

  // 2. Weighted vote count & earliest index tracker
  const votes: Record<ThemeKey, number> = {
    default: 0,
    minecraft: 0,
    brawlstars: 0,
    genshin: 0,
    finance: 0,
    work: 0,
    media: 0,
    cyberpunk: 0,
    witcher: 0,
    seasons: 0,
    private: 0,
  };

  const earliestIndex: Record<ThemeKey, number> = {
    default: Infinity,
    minecraft: Infinity,
    brawlstars: Infinity,
    genshin: Infinity,
    finance: Infinity,
    work: Infinity,
    media: Infinity,
    cyberpunk: Infinity,
    witcher: Infinity,
    seasons: Infinity,
    private: Infinity,
  };

  const themes = Object.keys(THEME_TRIGGERS) as (Exclude<ThemeKey, "default">)[];

  for (const theme of themes) {
    const regexes = THEME_TRIGGERS[theme];
    for (const rx of regexes) {
      // Find all matches
      const globalRx = new RegExp(rx.source, "gi");
      let m: RegExpExecArray | null;
      while ((m = globalRx.exec(text)) !== null) {
        votes[theme] += 1;
        if (m.index < earliestIndex[theme]) {
          earliestIndex[theme] = m.index;
        }
      }
    }
  }

  // Find maximum votes
  let maxVotes = 0;
  for (const theme of themes) {
    if (votes[theme] > maxVotes) {
      maxVotes = votes[theme];
    }
  }

  if (maxVotes === 0) {
    return "default";
  }

  // Filter themes that have maxVotes
  const tiedThemes = themes.filter((t) => votes[t] === maxVotes);

  if (tiedThemes.length === 1) {
    return tiedThemes[0];
  }

  // Tie breaker: theme with earliest first occurrence wins
  let earliestTheme = tiedThemes[0];
  let minIndex = earliestIndex[earliestTheme];

  for (let i = 1; i < tiedThemes.length; i++) {
    const candidate = tiedThemes[i];
    if (earliestIndex[candidate] < minIndex) {
      minIndex = earliestIndex[candidate];
      earliestTheme = candidate;
    }
  }

  return earliestTheme;
}
