import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Building2, 
  User, 
  CheckCircle2, 
  Circle, 
  Send, 
  ChevronDown, 
  ChevronUp, 
  CalendarClock,
  Sparkles,
  ArrowRightLeft,
  FileCheck
} from 'lucide-react';
import { CourtCase } from '../types';
import { getCountdownBadge, formatArabicTime, formatArabicDate, formatHijriDate } from '../utils/dateUtils';

interface AlertsBannerProps {
  urgentCases: CourtCase[];
  onOpenCaseDetails: (c: CourtCase) => void;
  onPostponeCase: (c: CourtCase) => void;
  onToggleChecklist: (caseId: string, itemId: string) => void;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  urgentCases,
  onOpenCaseDetails,
  onPostponeCase,
  onToggleChecklist,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (urgentCases.length === 0) return null;

  const handleSendWhatsApp = (c: CourtCase) => {
    if (!c.clientPhone) {
      alert('لا يوجد رقم هاتف مسجل للموكل في هذه القضية');
      return;
    }
    const cleanPhone = c.clientPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `السلام عليكم أ/ ${c.clientName}،\nتذكير بموعد جلسة القضية رقم (${c.caseNumber} لسنة ${c.caseYear})\nالمحكمة: ${c.court} - ${c.circuit}\nالموعد: ${formatArabicDate(c.sessionDate)} الساعة ${formatArabicTime(c.sessionTime)}\nالمطلوب للجلسة: ${c.demands || 'الحضور أو تقديم المستندات'}\nنرجو الالتزام بالموعد المحدد.\nمع تحيات مكتب المحاماة.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <section className="mb-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-slate-900/50 border-2 border-amber-500/40 p-4 sm:p-5 shadow-xl backdrop-blur-sm no-print">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl shadow-md font-bold animate-pulse">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-amber-400 flex items-center gap-2">
              <span>تنبيهات الجلسات الحرجة (خلال أقل من 24 ساعة)</span>
              <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-xs rounded-full font-extrabold">
                {urgentCases.length}
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              يرجى مراجعة تجهيز الحوافظ والمذكرات والتأكيد على الموكلين والشهود قبل انعقاد الجلسة
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 hover:bg-slate-800 text-slate-300 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs"
        >
          <span>{isExpanded ? 'طي التنبيهات' : 'عرض التفاصيل'}</span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Urgent Cards */}
      {isExpanded && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {urgentCases.map((c) => {
            const badge = getCountdownBadge(c.sessionDate, c.sessionTime);
            const totalChecklist = c.checklist.length;
            const completedChecklist = c.checklist.filter((i) => i.completed).length;
            const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 100;

            return (
              <div
                key={c.id}
                className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-lg hover:border-amber-400 transition"
              >
                <div>
                  {/* Top row: Case Number & Countdown */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold font-mono">
                          دعوى رقم {c.caseNumber} لسنة {c.caseYear}
                        </span>
                        <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-md">
                          {c.court}
                        </span>
                      </div>
                      <h3 
                        onClick={() => onOpenCaseDetails(c)}
                        className="text-sm font-bold text-slate-100 hover:text-amber-300 transition cursor-pointer mt-1.5 line-clamp-1"
                      >
                        {c.title}
                      </h3>
                    </div>

                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border shrink-0 ${badge.colorClass}`}>
                      <Clock className="w-3.5 h-3.5 inline ml-1" />
                      {badge.text}
                    </span>
                  </div>

                  {/* Circuit & Time & Demands */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 my-2 bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                    <div className="col-span-2 flex items-center justify-between gap-2 border-b border-slate-700/50 pb-1.5 mb-0.5">
                      <span className="font-bold text-amber-300">
                        {formatArabicDate(c.sessionDate)}
                      </span>
                      <span className="text-[11px] text-emerald-400 font-bold bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                        {formatHijriDate(c.sessionDate)} (أم القرى)
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">الدائرة / القاعة:</span>
                      <span className="font-semibold text-slate-200">{c.circuit}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">توقيت الجلسة:</span>
                      <span className="font-semibold text-amber-300">{formatArabicTime(c.sessionTime)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">المطلوب في الجلسة:</span>
                      <span className="font-medium text-slate-200 line-clamp-1">{c.demands || 'مرافعة عامة'}</span>
                    </div>
                  </div>

                  {/* Checklist Summary */}
                  {totalChecklist > 0 && (
                    <div className="mb-3 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                      <div className="flex items-center justify-between text-[11px] mb-1.5">
                        <span className="text-slate-400 flex items-center gap-1 font-medium">
                          <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                          تجهيزات الجلسة ({completedChecklist}/{totalChecklist})
                        </span>
                        <span className="text-amber-400 font-bold">{Math.round(checklistProgress)}%</span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                        <div 
                          className="bg-amber-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${checklistProgress}%` }}
                        ></div>
                      </div>

                      {/* Checklist Quick Toggles */}
                      <div className="space-y-1">
                        {c.checklist.slice(0, 3).map((item) => (
                          <button
                            key={item.id}
                            onClick={() => onToggleChecklist(c.id, item.id)}
                            className="w-full flex items-center gap-2 text-right text-[11px] text-slate-300 hover:text-white py-0.5 cursor-pointer"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            )}
                            <span className={item.completed ? 'line-through text-slate-500' : 'font-medium'}>
                              {item.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-1">
                    {c.clientPhone && (
                      <button
                        onClick={() => handleSendWhatsApp(c)}
                        title="إرسال تذكير واتساب للموكل بموعد الجلسة والطلبات"
                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>تذكير الموكل (واتساب)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onPostponeCase(c)}
                      className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>إثبات القرار / تأجيل</span>
                    </button>
                    
                    <button
                      onClick={() => onOpenCaseDetails(c)}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      تفاصيل القضية
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
