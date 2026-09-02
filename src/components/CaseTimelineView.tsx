import React from 'react';
import { 
  Calendar, 
  Clock, 
  Building2, 
  User, 
  UserCheck,
  ArrowRightLeft, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Trash2
} from 'lucide-react';
import { CourtCase } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate,
  getCountdownBadge, 
  getRelativeDayName, 
  isWithin24Hours,
  compareCasesByNearest
} from '../utils/dateUtils';

interface CaseTimelineViewProps {
  cases: CourtCase[];
  onOpenDetails: (c: CourtCase) => void;
  onPostpone: (c: CourtCase) => void;
  onDelete?: (id: string) => void;
}

export const CaseTimelineView: React.FC<CaseTimelineViewProps> = ({
  cases,
  onOpenDetails,
  onPostpone,
  onDelete,
}) => {
  // Sort cases from nearest session date/time to furthest
  const sortedCases = [...cases].sort(compareCasesByNearest);

  // Group by date
  const groupedCases: Record<string, CourtCase[]> = {};
  sortedCases.forEach((c) => {
    if (!groupedCases[c.sessionDate]) {
      groupedCases[c.sessionDate] = [];
    }
    groupedCases[c.sessionDate].push(c);
  });

  const dates = Object.keys(groupedCases);

  if (dates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        لا توجد جلسات مجدولة في هذا العرض
      </div>
    );
  }

  return (
    <div className="space-y-8 mb-8">
      {dates.map((dateStr) => {
        const dayCases = groupedCases[dateStr];
        const relativeName = getRelativeDayName(dateStr);

        return (
          <div key={dateStr} className="relative">
            
            {/* Day Header Marker */}
            <div className="sticky top-20 z-10 flex items-center gap-3 bg-slate-900 text-white px-4 py-2 rounded-xl shadow-md mb-4 max-w-fit flex-wrap">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-extrabold text-sm text-amber-400">{formatArabicDate(dateStr)}</span>
              <span className="text-emerald-400 text-xs font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50">
                {formatHijriDate(dateStr)} (أم القرى)
              </span>
              <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-xs rounded-full font-bold">
                {dayCases.length} {dayCases.length === 1 ? 'جلسة' : 'جلسات'}
              </span>
            </div>

            {/* Timeline Vertical Track */}
            <div className="border-r-2 border-slate-200 mr-4 space-y-4 pr-6">
              {dayCases.map((c) => {
                const countdown = getCountdownBadge(c.sessionDate, c.sessionTime);
                const urgent24h = isWithin24Hours(c);

                return (
                  <div 
                    key={c.id} 
                    className={`relative bg-white rounded-2xl p-4 sm:p-5 border transition hover:shadow-lg ${
                      urgent24h ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Dot on the timeline */}
                    <div 
                      className={`absolute -right-[31px] top-6 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                        urgent24h ? 'bg-amber-500 ring-4 ring-amber-200 animate-pulse' : 'bg-slate-800'
                      }`}
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 rounded-lg text-xs font-bold font-mono">
                          دعوى {c.caseNumber} / {c.caseYear}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold">
                          {c.court}
                        </span>
                        <span className="text-xs text-slate-500">
                          {c.circuit}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-xs border border-amber-200">
                          {formatArabicTime(c.sessionTime)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${countdown.colorClass}`}>
                          {countdown.text}
                        </span>
                      </div>
                    </div>

                    <h4 
                      onClick={() => onOpenDetails(c)}
                      className="font-extrabold text-slate-900 hover:text-amber-700 transition cursor-pointer text-base mb-2"
                    >
                      {c.title}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl mb-3">
                      <div>
                        <span className="text-slate-400 block text-[10px]">الموكل ({c.clientRole}):</span>
                        <span className="font-bold text-slate-800">{c.clientName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">الخصم:</span>
                        <span className="font-bold text-slate-800">{c.opponentName}</span>
                      </div>
                      {c.assignedLawyer && (
                        <div className="md:col-span-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="text-[11px] text-amber-900 font-bold">المحامي الحاضر عن الموكل:</span>
                          <span className="font-extrabold text-slate-900 text-xs">{c.assignedLawyer}</span>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <span className="text-slate-400 block text-[10px]">نوع الجلسة والمطلوب:</span>
                        <span className="font-medium text-slate-800">
                          {c.sessionStage} {c.demands ? `- ${c.demands}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      {onDelete && (
                        <button
                          onClick={() => onDelete(c.id)}
                          title="حذف القضية نهائياً"
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      )}

                      <button
                        onClick={() => onPostpone(c)}
                        className="px-3 py-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer border border-sky-200"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>تأجيل الجلسة / تدوين القرار</span>
                      </button>

                      <button
                        onClick={() => onOpenDetails(c)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>التفاصيل الكاملة</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        );
      })}
    </div>
  );
};
