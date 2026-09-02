import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Building2, 
  Plus,
  ArrowRightLeft,
  ExternalLink,
  Moon,
  Sun,
  Layers,
  Sparkles,
  Info,
  UserCheck
} from 'lucide-react';
import { CourtCase } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate, 
  getHijriDateParts,
  formatDualDate,
  isWithin24Hours, 
  getCountdownBadge,
  GREGORIAN_MONTHS
} from '../utils/dateUtils';

interface CalendarMonthViewProps {
  cases: CourtCase[];
  onOpenDetails: (c: CourtCase) => void;
  onPostpone: (c: CourtCase) => void;
  onAddNewCaseOnDate: (dateStr: string) => void;
}

type CalendarDisplayMode = 'dual' | 'hijri' | 'gregorian';

export const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({
  cases,
  onOpenDetails,
  onPostpone,
  onAddNewCaseOnDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('dual');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Group cases by date (sorted by session time)
  const casesByDate: Record<string, CourtCase[]> = useMemo(() => {
    const map: Record<string, CourtCase[]> = {};
    cases.forEach((c) => {
      if (!map[c.sessionDate]) {
        map[c.sessionDate] = [];
      }
      map[c.sessionDate].push(c);
    });

    // Sort cases on each day by time ascending
    Object.keys(map).forEach((dateKey) => {
      map[dateKey].sort((a, b) => (a.sessionTime || '09:00').localeCompare(b.sessionTime || '09:00'));
    });

    return map;
  }, [cases]);

  // Compute Hijri months spanned in this Gregorian month
  const hijriMonthSpan = useMemo(() => {
    const firstDayStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
    const startHijri = getHijriDateParts(firstDayStr);
    const endHijri = getHijriDateParts(lastDayStr);

    if (startHijri.monthName === endHijri.monthName) {
      return `${startHijri.monthName} ${startHijri.year} هـ`;
    }
    if (startHijri.year === endHijri.year) {
      return `${startHijri.monthName} / ${endHijri.monthName} ${startHijri.year} هـ`;
    }
    return `${startHijri.monthName} ${startHijri.year} هـ - ${endHijri.monthName} ${endHijri.year} هـ`;
  }, [year, month, daysInMonth]);

  const activeSelectedDayCases = selectedDay ? casesByDate[selectedDay] || [] : [];

  return (
    <div className="space-y-6 mb-8">
      
      {/* Calendar Header & Switcher */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 rounded-2xl font-bold shadow-md shadow-amber-500/20">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900">
                {GREGORIAN_MONTHS[month]} {year} م
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1">
                <Moon className="w-3 h-3 text-emerald-600" />
                <span>{hijriMonthSpan} (تقويم أم القرى)</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              متابعة وجدولة الجلسات بالتقويمين الميلادي وأم القرى المعتمد
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-between md:justify-end">
          
          {/* Display Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => setDisplayMode('dual')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'dual'
                  ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>مدمج (ميلادي + أم القرى)</span>
            </button>

            <button
              onClick={() => setDisplayMode('hijri')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'hijri'
                  ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-emerald-600" />
              <span>أم القرى</span>
            </button>

            <button
              onClick={() => setDisplayMode('gregorian')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'gregorian'
                  ? 'bg-white text-slate-950 shadow-xs ring-1 ring-slate-200 font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-sky-600" />
              <span>ميلادي</span>
            </button>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handleNextMonth}
              title="الشهر القادم"
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-900 rounded-lg text-xs font-bold shadow-xs transition cursor-pointer"
            >
              اليوم
            </button>
            <button
              onClick={handlePrevMonth}
              title="الشهر السابق"
              className="p-1.5 hover:bg-white text-slate-700 rounded-lg transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-3 sm:p-4">
        
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-700 border-b border-slate-100 pb-3 mb-2 bg-slate-50/70 rounded-xl py-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="py-0.5">
              {day}
            </div>
          ))}
        </div>

        {/* Month days */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {/* Empty cells before month start */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[90px] sm:min-h-[110px] bg-slate-50/40 rounded-xl p-1 opacity-30 border border-transparent" />
          ))}

          {/* Actual month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const monthStr = String(month + 1).padStart(2, '0');
            const dayStr = String(dayNum).padStart(2, '0');
            const fullDateStr = `${year}-${monthStr}-${dayStr}`;
            
            const hijriInfo = getHijriDateParts(fullDateStr);
            const dayCases = casesByDate[fullDateStr] || [];
            const hasUrgent = dayCases.some(isWithin24Hours);
            const isSelected = selectedDay === fullDateStr;

            const isToday = (() => {
              const now = new Date();
              return (
                now.getFullYear() === year &&
                now.getMonth() === month &&
                now.getDate() === dayNum
              );
            })();

            return (
              <div
                key={fullDateStr}
                onClick={() => setSelectedDay(fullDateStr)}
                className={`min-h-[90px] sm:min-h-[115px] rounded-xl p-1.5 sm:p-2 border transition-all cursor-pointer flex flex-col justify-between group ${
                  isSelected
                    ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-400 shadow-md'
                    : isToday
                    ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900/20'
                    : 'border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                }`}
              >
                <div>
                  {/* Day Numbers (Gregorian & Umm al-Qura) */}
                  <div className="flex items-start justify-between gap-1">
                    
                    {/* Primary Date Number */}
                    {displayMode === 'hijri' ? (
                      <div className="flex flex-col">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isToday
                              ? 'bg-slate-900 text-white'
                              : isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'text-emerald-950 font-black'
                          }`}
                        >
                          {hijriInfo.day}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {dayNum} م
                        </span>
                      </div>
                    ) : displayMode === 'gregorian' ? (
                      <div className="flex flex-col">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isToday
                              ? 'bg-slate-900 text-white'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-800'
                          }`}
                        >
                          {dayNum}
                        </span>
                        <span className="text-[9px] text-emerald-700 font-bold">
                          {hijriInfo.day} هـ
                        </span>
                      </div>
                    ) : (
                      /* Dual Mode */
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${
                            isToday
                              ? 'bg-slate-900 text-white'
                              : isSelected
                              ? 'bg-amber-500 text-slate-950'
                              : 'text-slate-900 font-bold'
                          }`}
                        >
                          {dayNum}
                        </span>

                        <span
                          title={`أم القرى: ${hijriInfo.day} ${hijriInfo.monthName}`}
                          className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold font-mono flex items-center gap-0.5 ${
                            hijriInfo.isFirstDayOfMonth
                              ? 'bg-emerald-600 text-white font-extrabold shadow-xs animate-pulse'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <span>{hijriInfo.day}</span>
                          <span className="text-[8px] opacity-75">هـ</span>
                        </span>
                      </div>
                    )}

                    {/* Case Count Badge */}
                    {dayCases.length > 0 && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold font-mono shrink-0 ${
                          hasUrgent
                            ? 'bg-amber-500 text-slate-950 animate-pulse ring-1 ring-amber-600'
                            : 'bg-slate-900 text-amber-300'
                        }`}
                      >
                        {dayCases.length}
                      </span>
                    )}
                  </div>

                  {/* Hijri Month Start indicator */}
                  {hijriInfo.isFirstDayOfMonth && (
                    <div className="mt-1 px-1 py-0.5 rounded bg-emerald-100/80 text-emerald-900 text-[9px] font-black truncate flex items-center gap-0.5 border border-emerald-200">
                      <Moon className="w-2.5 h-2.5 text-emerald-700 shrink-0" />
                      <span className="truncate">1 {hijriInfo.monthName}</span>
                    </div>
                  )}
                </div>

                {/* Event previews in day cell */}
                <div className="space-y-1 mt-1 overflow-hidden">
                  {dayCases.slice(0, 2).map((c) => (
                    <div
                      key={c.id}
                      className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-800 font-bold truncate border border-slate-200/80 hover:bg-slate-200 transition"
                      title={`${c.title} - ${c.court} (${formatArabicTime(c.sessionTime)})`}
                    >
                      {c.court.replace('محكمة ', '')}: {c.caseNumber}
                    </div>
                  ))}
                  {dayCases.length > 2 && (
                    <span className="text-[9px] text-amber-700 font-bold block">
                      +{dayCases.length - 2} جلسات أخرى
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Expanded Panel */}
      {selectedDay && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-5 sm:p-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <CalendarIcon className="w-4 h-4" />
                </span>
                <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                  جلسات يوم: {formatArabicDate(selectedDay)}
                </h4>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-xs rounded-full font-bold">
                  {activeSelectedDayCases.length} قضية
                </span>
              </div>

              {/* Umm al-Qura Date Indicator */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 w-fit">
                <Moon className="w-3.5 h-3.5 text-emerald-600" />
                <span>الموافق هجرياً: <strong>{formatHijriDate(selectedDay, { includeWeekday: true })} (تقويم أم القرى)</strong></span>
              </div>
            </div>

            <button
              onClick={() => onAddNewCaseOnDate(selectedDay)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>إضافة جلسة في هذا اليوم</span>
            </button>
          </div>

          {activeSelectedDayCases.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              لا توجد جلسات مسجلة في هذا اليوم. انقر على "إضافة جلسة في هذا اليوم" لجدولة قضية جديدة برول المحكمة.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeSelectedDayCases.map((c) => (
                <div 
                  key={c.id}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 flex flex-col justify-between hover:border-slate-300 hover:bg-slate-50 transition shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                      <span className="font-mono font-bold text-xs bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                        دعوى {c.caseNumber} / {c.caseYear}
                      </span>
                      <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {c.court}
                      </span>
                      <span className="font-mono text-xs text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded">
                        {formatArabicTime(c.sessionTime)}
                      </span>
                    </div>

                    <h5 
                      onClick={() => onOpenDetails(c)}
                      className="font-bold text-slate-900 hover:text-amber-700 cursor-pointer text-xs sm:text-sm line-clamp-1 mb-1"
                    >
                      {c.title}
                    </h5>

                    <p className="text-xs text-slate-600">
                      الموكل: <strong>{c.clientName}</strong> ضد <strong>{c.opponentName}</strong>
                    </p>

                    {c.assignedLawyer && (
                      <div className="text-[11px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded border border-amber-200/60 mt-1.5 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>المحامي الحاضر: <strong>{c.assignedLawyer}</strong></span>
                      </div>
                    )}

                    {c.demands && (
                      <p className="text-[11px] text-slate-500 mt-1.5 bg-white p-2 rounded border border-slate-200">
                        الطلب: {c.demands}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 mt-3 pt-2.5 border-t border-slate-200">
                    <button
                      onClick={() => onPostpone(c)}
                      className="px-2.5 py-1 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>تأجيل / قرار</span>
                    </button>

                    <button
                      onClick={() => onOpenDetails(c)}
                      className="px-2.5 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition"
                    >
                      <span>التفاصيل</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
