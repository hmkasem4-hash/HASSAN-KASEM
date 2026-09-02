import React, { useState, useEffect } from 'react';
import { Calendar, Moon, Sparkles, Edit3, ListFilter, AlertCircle, FileText, Check } from 'lucide-react';
import { 
  HIJRI_MONTHS, 
  getHijriDateParts, 
  convertHijriToGregorian, 
  getTodayString, 
  formatHijriDate, 
  formatArabicDate,
  getHijriMonthIndex
} from '../utils/dateUtils';

interface HijriDatePickerProps {
  id?: string;
  label?: string;
  value?: string; // YYYY-MM-DD (Gregorian ISO string for standard storage)
  onChange: (dateIso: string) => void;
  required?: boolean;
  helpText?: string;
  theme?: 'dark' | 'light';
  showGregorianInput?: boolean;
}

// Convert Eastern Arabic numerals (٠-٩) to Western (0-9)
function normalizeArabicDigits(str: string): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return str.replace(/[٠-٩]/g, (w) => String(arabicNumbers.indexOf(w)));
}

export const HijriDatePicker: React.FC<HijriDatePickerProps> = ({
  id = 'hijri-deed-picker',
  label = 'تاريخ صدور الصك (بالميلادي وبتقويم أم القرى)',
  value,
  onChange,
  required = false,
  helpText = 'يتم احتساب مهلة الـ 30 يوماً للاستئناف والاعتراض تلقائياً بناءً على تاريخ الصك',
  theme = 'light',
  showGregorianInput = true,
}) => {
  const initialIso = value || getTodayString();
  const initialParts = getHijriDateParts(initialIso);
  const initialMonthIdx = getHijriMonthIndex(initialParts.monthName);

  const [currentIso, setCurrentIso] = useState<string>(initialIso);
  const [hDay, setHDay] = useState<number>(initialParts.day || 1);
  const [hMonthIdx, setHMonthIdx] = useState<number>(initialMonthIdx >= 0 ? initialMonthIdx : 0);
  const [hYear, setHYear] = useState<number>(initialParts.year || 1448);
  
  // Hijri entry mode: 'manual' (direct text typing) or 'select' (dropdown columns)
  const [hijriMode, setHijriMode] = useState<'select' | 'manual'>('select');
  const [manualText, setManualText] = useState<string>(
    `${initialParts.day || 1}/${(initialMonthIdx >= 0 ? initialMonthIdx : 0) + 1}/${initialParts.year || 1448}`
  );
  const [manualError, setManualError] = useState<string | null>(null);

  // Sync state when external value changes
  useEffect(() => {
    if (value && value !== currentIso) {
      setCurrentIso(value);
      const parts = getHijriDateParts(value);
      const safeDay = parts.day || 1;
      const mIdx = getHijriMonthIndex(parts.monthName);
      const safeMonthIdx = mIdx >= 0 ? mIdx : 0;
      const safeYear = parts.year || 1448;

      setHDay(safeDay);
      setHMonthIdx(safeMonthIdx);
      setHYear(safeYear);
      setManualText(`${safeDay}/${safeMonthIdx + 1}/${safeYear}`);
      setManualError(null);
    }
  }, [value, currentIso]);

  // Update when Hijri parts change
  const handleHijriUpdate = (newDay: number, newMonthIdx: number, newYear: number) => {
    const validDay = Math.max(1, Math.min(30, newDay || 1));
    const validMonthIdx = Math.max(0, Math.min(11, newMonthIdx || 0));
    const validYear = Math.max(1400, Math.min(1500, newYear || 1448));

    setHDay(validDay);
    setHMonthIdx(validMonthIdx);
    setHYear(validYear);
    setManualText(`${validDay}/${validMonthIdx + 1}/${validYear}`);
    setManualError(null);

    const convertedIso = convertHijriToGregorian(validYear, validMonthIdx, validDay);
    setCurrentIso(convertedIso);
    onChange(convertedIso);
  };

  // Update when Gregorian date input changes
  const handleGregorianChange = (newIsoDate: string) => {
    if (!newIsoDate) return;
    setCurrentIso(newIsoDate);
    const parts = getHijriDateParts(newIsoDate);
    const safeDay = parts.day || 1;
    const mIdx = getHijriMonthIndex(parts.monthName);
    const safeMonthIdx = mIdx >= 0 ? mIdx : 0;
    const safeYear = parts.year || 1448;

    setHDay(safeDay);
    setHMonthIdx(safeMonthIdx);
    setHYear(safeYear);
    setManualText(`${safeDay}/${safeMonthIdx + 1}/${safeYear}`);
    setManualError(null);

    onChange(newIsoDate);
  };

  // Handle manual Hijri text typing (e.g. 15/02/1448)
  const handleManualTextChange = (rawInput: string) => {
    setManualText(rawInput);
    const cleaned = normalizeArabicDigits(rawInput).trim();
    const parts = cleaned.split(/[\/\-\.\s]+/);

    if (parts.length === 3) {
      let d = parseInt(parts[0], 10);
      let m = parseInt(parts[1], 10);
      let y = parseInt(parts[2], 10);

      // If user entered YYYY/MM/DD
      if (d > 1000 && y <= 31) {
        const temp = d;
        d = y;
        y = temp;
      }

      if (d >= 1 && d <= 30 && m >= 1 && m <= 12 && y >= 1400 && y <= 1500) {
        const mIdx = m - 1;
        setHDay(d);
        setHMonthIdx(mIdx);
        setHYear(y);
        setManualError(null);
        const convertedIso = convertHijriToGregorian(y, mIdx, d);
        setCurrentIso(convertedIso);
        onChange(convertedIso);
      } else {
        setManualError('يرجى إدخال تاريخ هجري صحيح بصيغة: يوم/شهر/سنة (مثال: 15/02/1448)');
      }
    } else if (cleaned.length > 0) {
      setManualError('الصيغة المطلوبة: يوم/شهر/سنة هجرية (مثال: 15/02/1448)');
    } else {
      setManualError(null);
    }
  };

  const handleSetToday = () => {
    const todayIso = getTodayString();
    handleGregorianChange(todayIso);
  };

  const daysOptions = Array.from({ length: 30 }, (_, i) => i + 1);
  const yearsOptions = Array.from({ length: 16 }, (_, i) => 1440 + i); // 1440 - 1455

  const formattedHijri = `${hDay} ${HIJRI_MONTHS[hMonthIdx]} ${hYear} هـ`;
  const isDark = theme === 'dark';

  return (
    <div className="space-y-3">
      {/* Header & Quick Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1 border-b border-amber-200/80">
        <label htmlFor={id} className={`block text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-amber-300' : 'text-slate-900'}`}>
          <FileText className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <span>{label}</span>
          {required && <span className="text-rose-500">*</span>}
        </label>

        <div className="flex items-center gap-1.5">
          {/* Hijri mode toggle */}
          <div className={`flex items-center p-0.5 rounded-lg border text-[11px] ${
            isDark ? 'bg-slate-900 border-slate-700' : 'bg-amber-100/80 border-amber-200'
          }`}>
            <button
              type="button"
              onClick={() => setHijriMode('select')}
              className={`px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                hijriMode === 'select'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3 h-3" />
              <span>قوائم أم القرى</span>
            </button>
            <button
              type="button"
              onClick={() => setHijriMode('manual')}
              className={`px-2 py-0.5 rounded-md font-bold transition flex items-center gap-1 cursor-pointer ${
                hijriMode === 'manual'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>كتابة يدوية</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSetToday}
            className={`text-[11px] px-2.5 py-1 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer border ${
              isDark 
                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40' 
                : 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 shadow-xs font-black'
            }`}
          >
            <Sparkles className="w-3 h-3 text-slate-950" />
            <span>اليوم</span>
          </button>
        </div>
      </div>

      {/* Dual Inputs: (1) Gregorian Date Picker + (2) Hijri Umm Al-Qura Input/Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Dual Input 1: التاريخ بالميلادي */}
        {showGregorianInput && (
          <div className="md:col-span-4 space-y-1">
            <label className={`block text-[11px] font-bold flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Calendar className="w-3 h-3 text-amber-600" />
              <span>التاريخ بالميلادي:</span>
            </label>
            <input
              type="date"
              id={id}
              value={currentIso}
              onChange={(e) => handleGregorianChange(e.target.value)}
              className={`w-full text-xs font-bold font-mono rounded-xl px-3 py-2 border transition ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400' 
                  : 'bg-white border-2 border-slate-300 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 shadow-xs'
              }`}
            />
          </div>
        )}

        {/* Dual Input 2: التاريخ بتقويم أم القرى */}
        <div className={`${showGregorianInput ? 'md:col-span-8' : 'md:col-span-12'} space-y-1`}>
          <label className={`block text-[11px] font-bold flex items-center justify-between gap-1 ${isDark ? 'text-amber-300' : 'text-amber-950'}`}>
            <span className="flex items-center gap-1">
              <Moon className="w-3 h-3 text-amber-600" />
              <span>التاريخ بتقويم أم القرى:</span>
            </span>
            <span className="text-[10px] text-amber-700 font-normal">
              {hijriMode === 'manual' ? '(إدخال نصي مباشر)' : '(تحديد هجري)'}
            </span>
          </label>

          {hijriMode === 'manual' ? (
            /* Manual Hijri Text Input */
            <div className="space-y-1">
              <div className="relative">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => handleManualTextChange(e.target.value)}
                  placeholder="مثال: 15/02/1448 أو 15-2-1448"
                  dir="ltr"
                  className={`w-full text-xs font-bold font-mono rounded-xl px-3 py-2 border transition text-center tracking-wider ${
                    manualError 
                      ? 'border-rose-500 bg-rose-50 text-rose-900 focus:ring-2 focus:ring-rose-500' 
                      : isDark 
                        ? 'bg-slate-950 border-amber-500/80 text-amber-300 focus:border-amber-400 focus:ring-1 focus:ring-amber-400' 
                        : 'bg-white border-2 border-amber-400 text-slate-950 focus:ring-2 focus:ring-amber-500/50 shadow-xs'
                  }`}
                />
                <span className={`absolute left-3 top-2 text-xs font-bold font-sans pointer-events-none ${
                  isDark ? 'text-amber-400' : 'text-amber-700'
                }`}>
                  هـ
                </span>
              </div>
              {manualError && (
                <p className="text-[10px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{manualError}</span>
                </p>
              )}
            </div>
          ) : (
            /* 3-Column Dropdown Selectors */
            <div className="grid grid-cols-3 gap-1.5">
              {/* Day */}
              <div>
                <select
                  value={hDay}
                  onChange={(e) => handleHijriUpdate(parseInt(e.target.value, 10), hMonthIdx, hYear)}
                  className={`w-full text-xs font-bold font-mono rounded-xl px-2 py-2 border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' 
                      : 'bg-white border-2 border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                  }`}
                >
                  {daysOptions.map((d) => (
                    <option key={d} value={d} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month */}
              <div>
                <select
                  value={hMonthIdx}
                  onChange={(e) => handleHijriUpdate(hDay, parseInt(e.target.value, 10), hYear)}
                  className={`w-full text-xs font-bold rounded-xl px-1.5 py-2 border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-amber-300 focus:border-amber-400' 
                      : 'bg-white border-2 border-amber-400 text-amber-950 focus:border-amber-500 shadow-xs'
                  }`}
                >
                  {HIJRI_MONTHS.map((m, idx) => (
                    <option key={m} value={idx} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {idx + 1}. {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year */}
              <div>
                <select
                  value={hYear}
                  onChange={(e) => handleHijriUpdate(hDay, hMonthIdx, parseInt(e.target.value, 10))}
                  className={`w-full text-xs font-bold font-mono rounded-xl px-2 py-2 border transition cursor-pointer ${
                    isDark 
                      ? 'bg-slate-950 border-slate-700 text-white focus:border-amber-400' 
                      : 'bg-white border-2 border-slate-300 text-slate-900 focus:border-amber-500 shadow-xs'
                  }`}
                >
                  {yearsOptions.map((yr) => (
                    <option key={yr} value={yr} className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>
                      {yr} هـ
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Dual Synchronized Dates Banner */}
      <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs flex-wrap ${
        isDark 
          ? 'bg-slate-950/90 border-amber-500/40 text-slate-300' 
          : 'bg-amber-50/90 border border-amber-300 text-amber-950 shadow-2xs'
      }`}>
        <div className="flex items-center gap-1.5">
          <Moon className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <span className="text-[11px] text-slate-600">تقويم أم القرى:</span>
          <span className={`font-black ${isDark ? 'text-amber-400' : 'text-amber-900'}`}>
            {formattedHijri}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <Calendar className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="text-slate-600">الميلادي:</span>
          <span className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
            {formatArabicDate(currentIso, { includeWeekday: true, includeEra: false })}
          </span>
        </div>
      </div>

      {helpText && (
        <p className={`text-[10px] leading-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          💡 {helpText}
        </p>
      )}
    </div>
  );
};
