/**
 * Telegram Channel Update Checker for Heybo
 * Allows the author to announce updates directly in https://t.me/heybo_dev
 * without requiring any custom backend servers or database maintenance.
 */

export const CURRENT_APP_VERSION = "2.0.0";
export const TELEGRAM_CHANNEL_USERNAME = "heybo_dev";
export const TELEGRAM_CHANNEL_URL = "https://t.me/heybo_dev";

export type UpdateAnnouncement = {
  hasUpdate: boolean;
  version?: string;
  headline?: string;
  messageText?: string;
  postUrl?: string;
  publishedAt?: string;
  source: "telegram" | "offline" | "cache";
};

const STORAGE_KEY_LAST_CHECK = "heybo_last_update_check";
const STORAGE_KEY_DISMISSED_VERSION = "heybo_dismissed_update_version";

/**
 * Parses raw HTML from t.me/s/heybo_dev to find the latest post text and update notices
 */
export function parseTelegramChannelHtml(html: string): UpdateAnnouncement {
  try {
    // Extract message texts from tgme_widget_message_text
    const messageMatches = [...html.matchAll(/class="[^"]*tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)];
    
    if (messageMatches.length === 0) {
      return { hasUpdate: false, source: "telegram" };
    }

    // Get the latest message (last in the stream)
    const latestRaw = messageMatches[messageMatches.length - 1][1];
    
    // Strip HTML tags for clean text
    const cleanText = latestRaw
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<[^>]+>/gi, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .trim();

    // Check if message discusses an update
    const updateTriggers = [/обновлен/i, /верси/i, /v[1-9]\.[0-9]/i, /релиз/i, /heybo v/i, /апк/i, /apk/i];
    const isUpdatePost = updateTriggers.some((re) => re.test(cleanText));

    // Try to extract version number like v2.1 or 2.1.0
    const versionMatch = cleanText.match(/(?:верси[яи]|v|heybo\s*v?)\s*([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
    const foundVersion = versionMatch ? versionMatch[1] : undefined;

    if (isUpdatePost) {
      // First line as headline
      const lines = cleanText.split("\n").filter((l) => l.trim().length > 0);
      const headline = lines[0] || "Вышло новое обновление Heybo!";

      return {
        hasUpdate: true,
        version: foundVersion || "2.1",
        headline,
        messageText: cleanText,
        postUrl: TELEGRAM_CHANNEL_URL,
        source: "telegram",
      };
    }

    return { hasUpdate: false, source: "telegram" };
  } catch {
    return { hasUpdate: false, source: "telegram" };
  }
}

/**
 * Checks for updates from public Telegram web channel via CORS proxies with fallback
 */
export async function checkForTelegramUpdates(): Promise<UpdateAnnouncement> {
  // If offline, return immediately
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { hasUpdate: false, source: "offline" };
  }

  const targetUrl = `https://t.me/s/${TELEGRAM_CHANNEL_USERNAME}`;
  
  // Try fast CORS mirrors
  const endpoints = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    `https://corsproxy.io/?url=${encodeURIComponent(targetUrl)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: "text/html" },
      });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const html = await resp.text();
        const res = parseTelegramChannelHtml(html);
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_LAST_CHECK, Date.now().toString());
        }
        return res;
      }
    } catch {}
  }

  return { hasUpdate: false, source: "telegram" };
}

/**
 * Checks if the user dismissed this version notification
 */
export function isUpdateDismissed(version: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY_DISMISSED_VERSION) === version;
}

/**
 * Dismiss an update notification
 */
export function dismissUpdate(version: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_DISMISSED_VERSION, version);
}
