const MONTHS_RU: Record<string, number> = {
  янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4, июн: 5,
  июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
};

export function parseDueDate(str: string, referenceDate: Date = new Date()): Date | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  const now = new Date(referenceDate);

  if (s === "сегодня") {
    const d = new Date(now);
    d.setHours(20, 0, 0, 0);
    return d;
  }
  if (s === "завтра") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const inDays = s.match(/через (\d+)\s*(дн|ден)/);
  if (inDays) {
    const d = new Date(now);
    d.setDate(d.getDate() + parseInt(inDays[1], 10));
    d.setHours(9, 0, 0, 0);
    return d;
  }
  const ddmm = s.match(/^(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?$/);
  if (ddmm) {
    const year = ddmm[3] ? parseInt(ddmm[3], 10) : now.getFullYear();
    const d = new Date(year, parseInt(ddmm[2], 10) - 1, parseInt(ddmm[1], 10), 9, 0, 0);
    if (d > now) return d;
    d.setFullYear(d.getFullYear() + 1);
    return d;
  }
  const ruDate = s.match(/^(\d{1,2})\s+([а-я]+)(?:\s+(\d{4}))?$/);
  if (ruDate) {
    const month = MONTHS_RU[ruDate[2].slice(0, 3)];
    if (month !== undefined) {
      const year = ruDate[3] ? parseInt(ruDate[3], 10) : now.getFullYear();
      const d = new Date(year, month, parseInt(ruDate[1], 10), 9, 0, 0);
      if (d > now) return d;
      d.setFullYear(d.getFullYear() + 1);
      return d;
    }
  }
  return null;
}

export function getSmartMessage(text: string): string {
  const l = text.toLowerCase();
  if (/спорт|трени|бег|отжи|качалк|зал|фитнес|пробеж/.test(l)) return `💪 Не забудь про тренировку: «${text.slice(0, 40)}»`;
  if (/разработ|код|программ|приложен|функци|баг|деплой|git|коммит/.test(l)) return `💻 Дедлайн по разработке: «${text.slice(0, 40)}»`;
  if (/учёб|учиться|учить|экзамен|реферат|курс|лекц|задание/.test(l)) return `📚 Учёба не ждёт: «${text.slice(0, 40)}»`;
  if (/встреч|звонок|созвон|митинг/.test(l)) return `📅 Не пропусти: «${text.slice(0, 40)}»`;
  if (/купить|магазин|заказ|доставк/.test(l)) return `🛒 Не забудь: «${text.slice(0, 40)}»`;
  return `⏰ Напоминание: «${text.slice(0, 50)}»`;
}
