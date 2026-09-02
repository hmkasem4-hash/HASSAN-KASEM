import { CourtCase } from '../types';

// Arabic Hijri month names in Umm al-Qura
export const HIJRI_MONTHS = [
  'محرم',
  'صفر',
  'ربيع الأول',
  'ربيع الآخر',
  'جمادى الأولى',
  'جمادى الآخرة',
  'رجب',
  'شعبان',
  'رمضان',
  'شوال',
  'ذو القعدة',
  'ذو الحجة',
];

export const GREGORIAN_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

/**
 * Convert Eastern Arabic numerals (٠-٩) to Latin digits (0-9)
 */
export function easternToLatinDigits(str: string): string {
  const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => eastern.indexOf(w).toString());
}

/**
 * Convert Latin digits (0-9) to Eastern Arabic numerals (٠-٩)
 */
export function latinToEasternDigits(num: number | string): string {
  const str = String(num);
  const eastern = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[0-9]/g, (w) => eastern[parseInt(w, 10)]);
}

/**
 * Parse YYYY-MM-DD string into a safe Date object
 */
export function parseDateString(dateStr?: string | null): Date {
  if (!dateStr || typeof dateStr !== 'string') {
    return new Date();
  }
  const clean = dateStr.trim();
  if (!clean) return new Date();
  const parts = clean.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = parseInt(parts[1], 10) || 1;
  const day = parseInt(parts[2], 10) || 1;
  return new Date(year, month - 1, day);
}

/**
 * Format a Date or date string into Umm al-Qura (تقويم أم القرى) Hijri string.
 * Example: "3 صفر 1448 هـ" or "الخميس، 3 صفر 1448 هـ"
 */
export function formatHijriDate(
  dateInput?: string | Date | null,
  options?: {
    includeWeekday?: boolean;
    useEasternDigits?: boolean;
    includeEra?: boolean;
  }
): string {
  try {
    if (!dateInput) return '';
    const date = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) return '';

    const { includeWeekday = false, useEasternDigits = false, includeEra = true } = options || {};

    const intlFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      weekday: includeWeekday ? 'long' : undefined,
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let formatted = intlFormatter.format(date);

    if (!useEasternDigits) {
      formatted = easternToLatinDigits(formatted);
    }

    if (includeEra && !formatted.includes('هـ')) {
      formatted += ' هـ';
    }

    return formatted;
  } catch (e) {
    console.warn('Error formatting Hijri date with Umm al-Qura:', e);
    return '';
  }
}

/**
 * Extract parsed Umm al-Qura parts (day, monthName, year)
 */
export function getHijriDateParts(dateInput?: string | Date | null): {
  day: number;
  dayEastern: string;
  monthName: string;
  year: number;
  yearEastern: string;
  formatted: string;
  isFirstDayOfMonth: boolean;
} {
  try {
    if (!dateInput) {
      return {
        day: 1,
        dayEastern: '١',
        monthName: '',
        year: 1448,
        yearEastern: '١٤٤٨',
        formatted: '',
        isFirstDayOfMonth: false,
      };
    }
    const date = typeof dateInput === 'string' ? parseDateString(dateInput) : dateInput;
    if (!date || isNaN(date.getTime())) {
      return {
        day: 1,
        dayEastern: '١',
        monthName: '',
        year: 1448,
        yearEastern: '١٤٤٨',
        formatted: '',
        isFirstDayOfMonth: false,
      };
    }
    const partsFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const parts = partsFormatter.formatToParts(date);
    let dayStr = '1';
    let monthName = '';
    let yearStr = '1448';

    for (const p of parts) {
      if (p.type === 'day') dayStr = easternToLatinDigits(p.value);
      if (p.type === 'month') monthName = p.value;
      if (p.type === 'year') yearStr = easternToLatinDigits(p.value);
    }

    const day = parseInt(dayStr, 10) || 1;
    const year = parseInt(yearStr, 10) || 1448;

    return {
      day,
      dayEastern: latinToEasternDigits(day),
      monthName,
      year,
      yearEastern: latinToEasternDigits(year),
      formatted: `${day} ${monthName} ${year} هـ`,
      isFirstDayOfMonth: day === 1,
    };
  } catch {
    return {
      day: 1,
      dayEastern: '١',
      monthName: '',
      year: 1448,
      yearEastern: '١٤٤٨',
      formatted: '',
      isFirstDayOfMonth: false,
    };
  }
}

export function getHijriMonthIndex(monthName: string): number {
  if (!monthName) return 0;
  const clean = monthName.replace(/[^\u0621-\u064A\s]/g, '').trim();
  const index = HIJRI_MONTHS.findIndex((m) => clean.includes(m) || m.includes(clean));
  if (index !== -1) return index;
  if (clean.includes('ربيع') && (clean.includes('ثاني') || clean.includes('آخر'))) return 3;
  if (clean.includes('جماد') && (clean.includes('ثاني') || clean.includes('آخر'))) return 5;
  return 0;
}

/**
 * Convert a Hijri (Umm al-Qura) date to standard Gregorian YYYY-MM-DD string.
 * Uses exact astronomical matching with Intl.DateTimeFormat
 */
export function convertHijriToGregorian(hYear: number, hMonthIndex: number, hDay: number): string {
  try {
    const safeYear = Math.max(1400, Math.min(1500, hYear || 1448));
    const safeMonthIdx = Math.max(0, Math.min(11, hMonthIndex || 0));
    const safeDay = Math.max(1, Math.min(30, hDay || 1));

    // Approximate Gregorian year
    const approxGYear = Math.round((safeYear - 1) * (354.367 / 365.2425) + 622);
    const approxGMonth = safeMonthIdx;
    const baseDate = new Date(approxGYear, approxGMonth, safeDay);

    let bestDate = baseDate;
    let minDayDiff = 999;

    // Search window within +/- 45 days
    for (let offset = -45; offset <= 45; offset++) {
      const testDate = new Date(baseDate.getTime() + offset * 86400000);
      const parts = getHijriDateParts(testDate);
      const testMonthIdx = getHijriMonthIndex(parts.monthName);

      if (parts.year === safeYear && testMonthIdx === safeMonthIdx) {
        const dayDiff = Math.abs(parts.day - safeDay);
        if (dayDiff === 0) {
          const y = testDate.getFullYear();
          const m = String(testDate.getMonth() + 1).padStart(2, '0');
          const d = String(testDate.getDate()).padStart(2, '0');
          return `${y}-${m}-${d}`;
        }
        if (dayDiff < minDayDiff) {
          minDayDiff = dayDiff;
          bestDate = testDate;
        }
      }
    }

    const y = bestDate.getFullYear();
    const m = String(bestDate.getMonth() + 1).padStart(2, '0');
    const d = String(bestDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch (err) {
    console.error('Error converting Hijri to Gregorian:', err);
    return getTodayString();
  }
}

/**
 * Format a Date or ISO string into a rich Arabic Gregorian string.
 * Example: "الخميس، 16 أغسطس 2026 م"
 */
export function formatArabicDate(
  dateStr?: string | null,
  options?: { includeWeekday?: boolean; includeEra?: boolean }
): string {
  try {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const date = parseDateString(dateStr);
    if (!date || isNaN(date.getTime())) return dateStr || '';
    const { includeWeekday = true, includeEra = true } = options || {};

    const formatted = date.toLocaleDateString('ar-EG', {
      weekday: includeWeekday ? 'long' : undefined,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const withLatinDigits = easternToLatinDigits(formatted);
    return includeEra ? `${withLatinDigits} م` : withLatinDigits;
  } catch {
    return dateStr || '';
  }
}

/**
 * Get Dual Date Representation: Gregorian + Umm al-Qura Hijri
 * Example: "16 أغسطس 2026 م (3 صفر 1448 هـ)"
 */
export function formatDualDate(
  dateStr?: string | null,
  options?: {
    includeWeekday?: boolean;
    compact?: boolean;
  }
): string {
  try {
    if (!dateStr || typeof dateStr !== 'string') return '';
    const gregorian = formatArabicDate(dateStr, {
      includeWeekday: options?.includeWeekday,
      includeEra: true,
    });
    const hijri = formatHijriDate(dateStr, {
      includeWeekday: false,
      useEasternDigits: false,
      includeEra: true,
    });

    if (!gregorian && !hijri) return '';
    if (!hijri) return gregorian;
    if (!gregorian) return hijri;

    if (options?.compact) {
      return `${gregorian} • ${hijri}`;
    }

    return `${gregorian} الموافق ${hijri} (أم القرى)`;
  } catch {
    return dateStr || '';
  }
}

/**
 * Format time in 12-hour Arabic format.
 * Example: "09:30 ص" or "02:15 م"
 */
export function formatArabicTime(timeStr?: string | null): string {
  if (!timeStr || typeof timeStr !== 'string') return '09:00 ص';
  const clean = timeStr.trim();
  if (!clean) return '09:00 ص';
  const parts = clean.split(':');
  const hoursStr = parts[0] || '9';
  const minutesStr = parts[1] || '00';
  let hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) hours = 9;
  const minutes = minutesStr;
  const period = hours >= 12 ? 'م' : 'ص';
  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;
  return `${hours.toString().padStart(2, '0')}:${minutes} ${period}`;
}

/**
 * Get date object from sessionDate (YYYY-MM-DD) and sessionTime (HH:mm)
 */
export function getSessionDateTime(sessionDate?: string | null, sessionTime?: string | null): Date {
  if (!sessionDate || typeof sessionDate !== 'string') return new Date();
  const date = parseDateString(sessionDate);
  let hours = 9;
  let mins = 0;
  if (sessionTime && typeof sessionTime === 'string') {
    const parts = sessionTime.split(':');
    const h = parseInt(parts[0], 10);
    const min = parseInt(parts[1], 10);
    if (!isNaN(h)) hours = h;
    if (!isNaN(min)) mins = min;
  }
  date.setHours(hours, mins, 0, 0);
  return date;
}

/**
 * Calculate difference in hours between now and session date/time
 */
export function getHoursRemaining(sessionDate?: string | null, sessionTime?: string | null): number {
  if (!sessionDate || typeof sessionDate !== 'string') return 999;
  const now = new Date();
  const sessionDt = getSessionDateTime(sessionDate, sessionTime);
  const diffMs = sessionDt.getTime() - now.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Check if session is within the next 24 hours (and hasn't passed more than 3 hours ago)
 */
export function isWithin24Hours(c: CourtCase): boolean {
  if (!c || !c.sessionDate) return false;
  if (c.court === 'محكمة التنفيذ' || (c.enforcement && c.enforcement.isEnforcement)) return false;
  if (c.status === 'judged' || c.status === 'struck_off' || Boolean(c.verdictText)) return false;
  const hours = getHoursRemaining(c.sessionDate, c.sessionTime);
  return hours > -3 && hours <= 24;
}

/**
 * Check if session is today
 */
export function isToday(sessionDate?: string | null): boolean {
  if (!sessionDate || typeof sessionDate !== 'string') return false;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const todayStr = `${y}-${m}-${d}`;
  return sessionDate === todayStr;
}

/**
 * Check if session is tomorrow
 */
export function isTomorrow(sessionDate?: string | null): boolean {
  if (!sessionDate || typeof sessionDate !== 'string') return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const y = tomorrow.getFullYear();
  const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const d = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${y}-${m}-${d}`;
  return sessionDate === tomorrowStr;
}

/**
 * Get humanized countdown text in Arabic
 */
export function getCountdownBadge(sessionDate?: string | null, sessionTime?: string | null): {
  text: string;
  isUrgent: boolean;
  colorClass: string;
} {
  if (!sessionDate || typeof sessionDate !== 'string') {
    return {
      text: 'غير محدد',
      isUrgent: false,
      colorClass: 'bg-slate-50 text-slate-500 border-slate-200',
    };
  }
  const hours = getHoursRemaining(sessionDate, sessionTime);

  if (hours < -4) {
    return {
      text: 'انتهى موعد الجلسة',
      isUrgent: false,
      colorClass: 'bg-slate-100 text-slate-600 border-slate-200',
    };
  }

  if (hours < 0) {
    return {
      text: 'الجلسة جارية الآن / اليوم',
      isUrgent: true,
      colorClass: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse',
    };
  }

  if (hours <= 24) {
    const totalMinutes = Math.floor(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    
    let timeStr = '';
    if (h > 0 && m > 0) {
      timeStr = `${h} س و ${m} د`;
    } else if (h > 0) {
      timeStr = `${h} ساعة`;
    } else {
      timeStr = `${m} دقيقة`;
    }

    return {
      text: `متبقي ${timeStr} ⚠️ (أقل من 24 س)`,
      isUrgent: true,
      colorClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400/40 animate-pulse',
    };
  }

  if (isTomorrow(sessionDate)) {
    return {
      text: 'غداً',
      isUrgent: false,
      colorClass: 'bg-sky-50 text-sky-700 border-sky-200',
    };
  }

  const days = Math.ceil(hours / 24);
  if (days <= 7) {
    return {
      text: `بعد ${days} أيام`,
      isUrgent: false,
      colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }

  return {
    text: `بعد ${days} يوم`,
    isUrgent: false,
    colorClass: 'bg-slate-50 text-slate-600 border-slate-200',
  };
}

/**
 * Get date relative string for today / tomorrow with dual date
 */
export function getRelativeDayName(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') return '';
  const hijri = formatHijriDate(dateStr, { includeWeekday: false });
  if (isToday(dateStr)) return `اليوم (${hijri})`;
  if (isTomorrow(dateStr)) return `غداً (${hijri})`;
  return formatDualDate(dateStr, { includeWeekday: true });
}

/**
 * Get current date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add days to date string
 */
export function addDaysToDate(dateStr?: string | null, days: number = 0): string {
  if (!dateStr || typeof dateStr !== 'string') return getTodayString();
  const date = parseDateString(dateStr);
  date.setDate(date.getDate() + days);
  const resY = date.getFullYear();
  const resM = String(date.getMonth() + 1).padStart(2, '0');
  const resD = String(date.getDate()).padStart(2, '0');
  return `${resY}-${resM}-${resD}`;
}

/**
 * Information regarding Deed issuance and the statutory 30-day appeal window
 */
export interface Deed30DayAppealInfo {
  hasDeedOrVerdict: boolean;
  deedDate: string; // The effective deed date YYYY-MM-DD
  daysElapsed: number; // Days passed since deed issuance
  remainingDays: number; // Remaining days of the 30-day window (30 - daysElapsed)
  isWithin30Days: boolean; // True if <= 30 days from deed date (status remains ACTIVE)
  isExpired: boolean; // True if > 30 days from deed date (status becomes FINISHED/منتهية)
  expiryDate: string; // deedDate + 30 days YYYY-MM-DD
  effectiveStatus: 'active' | 'judged' | 'postponed' | 'struck_off';
  isEffectiveClosed: boolean;
  statusBadgeText: string;
  statusBadgeColor: string;
  progressPercent: number; // 0 to 100% of 30 days elapsed
}

/**
 * Calculates deed issuance details and enforces the 30-day active appeal window:
 * - When a deed/judgment is issued, case remains ACTIVE for 30 days from deed date.
 * - After 30 days elapsed, it automatically converts to FINISHED/CLOSED (منتهية).
 */
export function getDeed30DayAppealInfo(c: CourtCase): Deed30DayAppealInfo {
  const hasDeedOrVerdict = Boolean(
    c.deedDate || 
    c.verdictDate || 
    c.primaryJudgmentDeedFile || 
    c.appealJudgmentDeedFile || 
    c.verdictText || 
    c.status === 'judged' || 
    c.sessionStage === 'نطق بالحكم' || 
    c.isClosed
  );

  if (!hasDeedOrVerdict) {
    return {
      hasDeedOrVerdict: false,
      deedDate: '',
      daysElapsed: 0,
      remainingDays: 0,
      isWithin30Days: false,
      isExpired: false,
      expiryDate: '',
      effectiveStatus: c.status || 'active',
      isEffectiveClosed: Boolean(c.isClosed),
      statusBadgeText: c.status === 'postponed' ? 'مؤجلة' : c.status === 'struck_off' ? 'مشطوبة' : 'سارية ومجدولة',
      statusBadgeColor: c.status === 'postponed' ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-900 border-emerald-300',
      progressPercent: 0,
    };
  }

  const effectiveDeedDate = c.deedDate || c.verdictDate || c.sessionDate || getTodayString();
  const todayStr = getTodayString();

  const deedParsed = parseDateString(effectiveDeedDate);
  const todayParsed = parseDateString(todayStr);

  const diffTime = todayParsed.getTime() - deedParsed.getTime();
  const daysElapsed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, 30 - daysElapsed);
  const isWithin30Days = daysElapsed <= 30;
  const isExpired = daysElapsed > 30;
  const expiryDate = addDaysToDate(effectiveDeedDate, 30);
  const progressPercent = Math.min(100, Math.round((daysElapsed / 30) * 100));

  // If within 30 days, effective status is ACTIVE. If > 30 days, it is FINISHED (judged).
  const isEffectiveClosed = isExpired;
  const effectiveStatus = isWithin30Days ? 'active' : 'judged';

  let statusBadgeText = '';
  let statusBadgeColor = '';

  if (isWithin30Days) {
    if (daysElapsed === 0) {
      statusBadgeText = 'نشطة (صدور الصك اليوم - متبقي 30 يوماً للاستئناف)';
      statusBadgeColor = 'bg-amber-100 text-amber-950 border-amber-400 font-bold';
    } else if (remainingDays === 0) {
      statusBadgeText = 'نشطة (اليوم الأخير لمهلة الـ 30 يوماً للاستئناف)';
      statusBadgeColor = 'bg-rose-100 text-rose-950 border-rose-400 font-black animate-pulse';
    } else {
      statusBadgeText = `نشطة (خلال مهلة الـ 30 يوماً للاستئناف - متبقي ${remainingDays} يوم)`;
      statusBadgeColor = 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold';
    }
  } else {
    statusBadgeText = 'منتهية (انقضاء مهلة الـ 30 يوماً من تاريخ الصك)';
    statusBadgeColor = 'bg-slate-100 text-slate-700 border-slate-300';
  }

  return {
    hasDeedOrVerdict,
    deedDate: effectiveDeedDate,
    daysElapsed,
    remainingDays,
    isWithin30Days,
    isExpired,
    expiryDate,
    effectiveStatus,
    isEffectiveClosed,
    statusBadgeText,
    statusBadgeColor,
    progressPercent,
  };
}

/**
 * Check if a case is effectively closed, taking into account the 30-day active deed rule
 */
export function isCaseEffectivelyClosed(c: CourtCase): boolean {
  if (c.deedDate || c.verdictDate || c.primaryJudgmentDeedFile || c.appealJudgmentDeedFile || c.verdictText || c.status === 'judged' || c.sessionStage === 'نطق بالحكم') {
    const deedInfo = getDeed30DayAppealInfo(c);
    return deedInfo.isEffectiveClosed;
  }
  return Boolean(c.isClosed || c.status === 'struck_off');
}

/**
 * Sort comparator to order court cases from nearest session to furthest.
 * 1. Active & upcoming sessions (today, tomorrow, future dates, active 30-day appeals) are ordered chronologically from nearest date/hour to furthest.
 * 2. Past / judged sessions appear after upcoming ones, ordered from most recent to older.
 */
export function compareCasesByNearest(a: CourtCase, b: CourtCase): number {
  const todayStr = getTodayString();
  const aDate = a.sessionDate || '';
  const bDate = b.sessionDate || '';
  const aTime = a.sessionTime || '09:00';
  const bTime = b.sessionTime || '09:00';

  const aIsClosed = isCaseEffectivelyClosed(a);
  const bIsClosed = isCaseEffectivelyClosed(b);

  const aIsUpcoming = !aIsClosed && aDate >= todayStr;
  const bIsUpcoming = !bIsClosed && bDate >= todayStr;

  // 1. Upcoming sessions take priority over past/finished sessions
  if (aIsUpcoming && !bIsUpcoming) return -1;
  if (!aIsUpcoming && bIsUpcoming) return 1;

  // 2. Both are upcoming: sort ascending by session date, then session time (nearest upcoming first)
  if (aIsUpcoming && bIsUpcoming) {
    if (aDate !== bDate) return aDate.localeCompare(bDate);
    return aTime.localeCompare(bTime);
  }

  // 3. Both are past: sort by nearest past date (most recent first)
  if (aDate !== bDate) return bDate.localeCompare(aDate);
  return bTime.localeCompare(aTime);
}


