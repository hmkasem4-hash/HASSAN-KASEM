import React, { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle2, 
  History, 
  Sparkles,
  Scale,
  Moon,
  UserCheck
} from 'lucide-react';
import { CourtCase } from '../types';
import { getTodayString, addDaysToDate, formatArabicDate, formatHijriDate } from '../utils/dateUtils';

interface PostponeModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseItem: CourtCase | null;
  onPostponeSubmit: (
    caseId: string,
    decision: string,
    nextDate: string,
    nextTime: string,
    nextDemands: string,
    reason?: string,
    assignedLawyer?: string
  ) => void;
}

const COMMON_DECISIONS = [
  'التأجيل لتقديم المستندات والاطلاع',
  'التأجيل لإعلان الخصم بأصل الصحيفة',
  'التأجيل لورود تقرير الخبير ومناقشته',
  'التأجيل لسماع شهود الإثبات / النفي',
  'حجز الدعوى للحكم مع التصريح بمذكرات',
  'التأجيل لضم المفردات والملف الإداري',
  'التأجيل لإعادة الإعلان وعرض الصلح',
  'التأجيل لسداد أمانة الخبير القضائي',
];

export const PostponeModal: React.FC<PostponeModalProps> = ({
  isOpen,
  onClose,
  caseItem,
  onPostponeSubmit,
}) => {
  const today = getTodayString();
  const [decision, setDecision] = useState('');
  const [nextDate, setNextDate] = useState(addDaysToDate(today, 14));
  const [nextTime, setNextTime] = useState('09:30');
  const [nextDemands, setNextDemands] = useState('');
  const [reason, setReason] = useState('');
  const [assignedLawyer, setAssignedLawyer] = useState('');

  React.useEffect(() => {
    if (caseItem) {
      setAssignedLawyer(caseItem.assignedLawyer || '');
    }
  }, [caseItem]);

  if (!isOpen || !caseItem) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decision.trim() || !nextDate) {
      alert('يرجى كتابة قرار الجلسة وتحديد تاريخ الجلسة القادمة');
      return;
    }

    onPostponeSubmit(
      caseItem.id,
      decision.trim(),
      nextDate,
      nextTime,
      nextDemands.trim(),
      reason.trim(),
      assignedLawyer.trim()
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 no-print animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500 text-slate-950 rounded-xl font-bold">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                إثبات قرار وتأجيل الجلسة
              </h2>
              <p className="text-xs text-slate-400">
                دعوى رقم {caseItem.caseNumber} لسنة {caseItem.caseYear} - {caseItem.court}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Current Case Brief */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <div className="font-bold text-slate-900 text-sm mb-1">{caseItem.title}</div>
            <div className="flex items-center gap-4 text-slate-600">
              <span>الموكل: <strong>{caseItem.clientName}</strong></span>
              <span>الخصم: <strong>{caseItem.opponentName}</strong></span>
            </div>
          </div>

          {/* Quick Decision Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              قرار الجلسة الصادر اليوم <span className="text-rose-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {COMMON_DECISIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDecision(d)}
                  className="px-2 py-1 bg-slate-100 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300 text-slate-700 rounded-lg text-xs transition cursor-pointer border border-slate-200"
                >
                  {d}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              required
              value={decision}
              onChange={(e) => setDecision(e.target.value)}
              placeholder="اكتب قرار المحكمة الصادر في الجلسة بدقة..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition font-medium"
            />
          </div>

          {/* Next Date Selection */}
          <div className="space-y-3 bg-sky-50/40 p-4 rounded-2xl border border-sky-200">
            <label className="block text-xs font-black text-sky-900">
              تحديد موعد الجلسة القادمة
            </label>

            {/* Quick Presets for Next Date */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setNextDate(addDaysToDate(today, 7))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-sky-50 transition cursor-pointer"
              >
                بعد أسبوع
              </button>
              <button
                type="button"
                onClick={() => setNextDate(addDaysToDate(today, 14))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-sky-50 transition cursor-pointer"
              >
                بعد أسبوعين
              </button>
              <button
                type="button"
                onClick={() => setNextDate(addDaysToDate(today, 21))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-sky-50 transition cursor-pointer"
              >
                بعد 3 أسابيع
              </button>
              <button
                type="button"
                onClick={() => setNextDate(addDaysToDate(today, 30))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-sky-50 transition cursor-pointer"
              >
                بعد شهر
              </button>
              <button
                type="button"
                onClick={() => setNextDate(addDaysToDate(today, 60))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg font-bold text-slate-700 hover:bg-sky-50 transition cursor-pointer"
              >
                بعد شهرين
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ الجلسة القادمة <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 transition font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  توقيت الجلسة القادمة
                </label>
                <input
                  type="time"
                  value={nextTime}
                  onChange={(e) => setNextTime(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 transition"
                />
              </div>
            </div>

            {nextDate && (
              <div className="bg-white p-2.5 rounded-xl border border-sky-300 flex items-center justify-between gap-2 flex-wrap text-xs shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                  <Calendar className="w-4 h-4 text-sky-600" />
                  <span>الميلادي: {formatArabicDate(nextDate, { includeWeekday: true })}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  <Moon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>أم القرى: {formatHijriDate(nextDate)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Demands for the Next Session & Assigned Lawyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المطلوب تجهيزه للجلسة القادمة
              </label>
              <input
                type="text"
                value={nextDemands}
                onChange={(e) => setNextDemands(e.target.value)}
                placeholder="مثال: تقديم أصل إيصال الأمانة وسماع الشاهد الثاني"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>المحامي الحاضر عن الموكل</span>
                </span>
                <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-semibold">
                  الجلسة القادمة
                </span>
              </label>
              <input
                type="text"
                value={assignedLawyer}
                onChange={(e) => setAssignedLawyer(e.target.value)}
                placeholder="الأستاذ / ... (محامي الحضور)"
                className="w-full bg-amber-50/40 border border-amber-300 rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
            </div>
          </div>

          {/* Note about auto-history logging */}
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 p-2.5 rounded-xl">
            <History className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              سيتم أرشفة هذا القرار تلقائياً في السجل التاريخي لجلسات الدعوى للرجوع إليه في أي وقت.
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تثبيت القرار وتحديث الموعد</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
