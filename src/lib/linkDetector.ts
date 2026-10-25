export type DetectedLink = {
  url: string;
  platform: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description?: string;
};

const PLATFORM_RULES: Array<{
  pattern: RegExp;
  platform: string;
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  getDescription?: (url: string) => string;
}> = [
  {
    pattern: /(?:youtube\.com\/(?:watch\?v=|shorts\/|channel\/|@)|youtu\.be\/)([\w-]+)/i,
    platform: "youtube",
    label: "YouTube",
    color: "#FF0000",
    bgColor: "#FFF0F0",
    icon: "▶",
    getDescription: (url) => {
      const m = url.match(/(?:watch\?v=|shorts\/|youtu\.be\/)([\w-]+)/);
      if (url.includes("/shorts/")) return "YouTube Shorts";
      if (url.includes("/@") || url.includes("/channel/")) return "YouTube канал";
      return m ? "Видео на YouTube" : "YouTube";
    },
  },
  {
    pattern: /t\.me\/([^\s/?]+)/i,
    platform: "telegram",
    label: "Telegram",
    color: "#2AABEE",
    bgColor: "#E8F5FF",
    icon: "✈",
    getDescription: (url) => {
      const m = url.match(/t\.me\/([^\s/?]+)/);
      if (!m) return "Telegram";
      const slug = m[1];
      if (slug.startsWith("+")) return "Telegram группа (приглашение)";
      return `@${slug}`;
    },
  },
  {
    pattern: /(?:github\.com)\/([^\s/?]+\/[^\s/?]+)/i,
    platform: "github",
    label: "GitHub",
    color: "#1a1a1a",
    bgColor: "#F0F0F0",
    icon: "⌥",
    getDescription: (url) => {
      const m = url.match(/github\.com\/([^/]+)(?:\/([^/\s?]+))?/);
      if (!m) return "GitHub";
      if (m[2]) return `Репозиторий ${m[1]}/${m[2]}`;
      return `GitHub профиль @${m[1]}`;
    },
  },
  {
    pattern: /instagram\.com\/([^\s/?]+)/i,
    platform: "instagram",
    label: "Instagram",
    color: "#E1306C",
    bgColor: "#FFF0F5",
    icon: "◉",
    getDescription: (url) => {
      if (url.includes("/p/") || url.includes("/reel/")) return "Instagram пост";
      const m = url.match(/instagram\.com\/([^/\s?]+)/);
      return m ? `@${m[1]}` : "Instagram";
    },
  },
  {
    pattern: /open\.spotify\.com\/(track|album|playlist|artist|episode)\/([^\s?]+)/i,
    platform: "spotify",
    label: "Spotify",
    color: "#1DB954",
    bgColor: "#F0FFF4",
    icon: "♫",
    getDescription: (url) => {
      if (url.includes("/track/")) return "Трек на Spotify";
      if (url.includes("/album/")) return "Альбом на Spotify";
      if (url.includes("/playlist/")) return "Плейлист на Spotify";
      if (url.includes("/artist/")) return "Артист на Spotify";
      return "Spotify";
    },
  },
  {
    pattern: /(?:vk\.com|vkontakte\.ru)\/([^\s/?]+)/i,
    platform: "vk",
    label: "ВКонтакте",
    color: "#0077FF",
    bgColor: "#EFF5FF",
    icon: "В",
    getDescription: (url) => {
      if (url.includes("/video")) return "Видео ВКонтакте";
      if (url.includes("/wall") || url.includes("?w=wall")) return "Запись ВКонтакте";
      const m = url.match(/vk\.com\/([^/\s?]+)/);
      return m ? `vk.com/${m[1]}` : "ВКонтакте";
    },
  },
  {
    pattern: /(?:twitter\.com|x\.com)\/([^\s/?]+)/i,
    platform: "twitter",
    label: "X (Twitter)",
    color: "#1a1a1a",
    bgColor: "#F7F7F7",
    icon: "𝕏",
    getDescription: (url) => {
      if (url.includes("/status/")) return "Твит";
      const m = url.match(/(?:twitter|x)\.com\/([^/\s?]+)/);
      return m && m[1] !== "i" ? `@${m[1]}` : "X (Twitter)";
    },
  },
  {
    pattern: /tiktok\.com\/@([^\s/?]+)/i,
    platform: "tiktok",
    label: "TikTok",
    color: "#010101",
    bgColor: "#F5F5F5",
    icon: "♪",
    getDescription: (url) => {
      if (url.includes("/video/")) return "Видео TikTok";
      const m = url.match(/tiktok\.com\/@([^/\s?]+)/);
      return m ? `@${m[1]}` : "TikTok";
    },
  },
  {
    pattern: /(?:drive\.google\.com|docs\.google\.com)/i,
    platform: "google",
    label: "Google Drive",
    color: "#4285F4",
    bgColor: "#EEF4FF",
    icon: "▲",
    getDescription: (url) => {
      if (url.includes("docs.google.com/document")) return "Google Документ";
      if (url.includes("docs.google.com/spreadsheet")) return "Google Таблица";
      if (url.includes("docs.google.com/presentation")) return "Google Презентация";
      return "Google Drive";
    },
  },
  {
    pattern: /figma\.com\/(file|design|proto)\/([^\s/?]+)/i,
    platform: "figma",
    label: "Figma",
    color: "#F24E1E",
    bgColor: "#FFF3F0",
    icon: "◈",
    getDescription: () => "Дизайн в Figma",
  },
];

const URL_REGEX = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/gi;

export function extractLinks(text: string): DetectedLink[] {
  if (!text) return [];
  const urls = text.match(URL_REGEX) ?? [];
  const seen = new Set<string>();
  const results: DetectedLink[] = [];

  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);

    let matched = false;
    for (const rule of PLATFORM_RULES) {
      if (rule.pattern.test(url)) {
        results.push({
          url,
          platform: rule.platform,
          label: rule.label,
          color: rule.color,
          bgColor: rule.bgColor,
          icon: rule.icon,
          description: rule.getDescription ? rule.getDescription(url) : undefined,
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      try {
        const host = new URL(url).hostname.replace("www.", "");
        results.push({
          url,
          platform: "link",
          label: host,
          color: "#616161",
          bgColor: "#F5F5F5",
          icon: "↗",
          description: "Ссылка",
        });
      } catch {
        results.push({
          url,
          platform: "link",
          label: url,
          color: "#616161",
          bgColor: "#F5F5F5",
          icon: "↗",
          description: "Ссылка",
        });
      }
    }
  }

  return results;
}
