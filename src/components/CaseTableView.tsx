import React from 'react';
import { 
  Building2, 
  Clock, 
  Calendar, 
  ArrowRightLeft, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck,
  Printer,
  Stamp
} from 'lucide-react';
import { CourtCase } from '../types';
import { 
  formatArabicDate, 
  formatArabicTime, 
  formatHijriDate, 
  getCountdownBadge, 
  isWithin24Hours 
} from '../utils/dateUtils';

interface CaseTableViewProps {
  cases: CourtCase[];
  onOpenDetails: (c: CourtCase) => void;
  onEdit: (c: CourtCase) => void;
  onDelete: (id: string) => void;
  onPostpone: (c: CourtCase) => void;
  onOpenPrintRoll?: () => void;
}

export const CaseTableView: React.FC<CaseTableViewProps> = ({
  cases,
  onOpenDetails,
  onEdit,
  onDelete,
  onPostpone,
  onOpenPrintRoll,
}) => {
  if (cases.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
        لا توجد قضايا تطابق خيارات التصفية الحالية
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden mb-8">
      {/* Table Action Header */}
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-slate-800 text-sm">
            جدول رول القضايا والجلسات
          </span>
          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-lg text-xs font-bold font-mono">
            {cases.length} قضايا
          </span>
        </div>

        {onOpenPrintRoll && (
          <button
            onClick={onOpenPrintRoll}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة وتصدير الرول (Word / PDF)</span>
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-slate-900 text-slate-200 border-b border-slate-800 text-[11px] sm:text-xs">
              <th className="p-3 font-bold whitespace-nowrap">رقم الدعوى</th>
              <th className="p-3 font-bold whitespace-nowrap">المحكمة والدائرة</th>
              <th className="p-3 font-bold">موضوع القضية</th>
              <th className="p-3 font-bold whitespace-nowrap">اسم الموكل / الشركة</th>
              <th className="p-3 font-bold text-center whitespace-nowrap bg-slate-800 text-amber-300">صفة الشركة</th>
              <th className="p-3 font-bold whitespace-nowrap">الخصم</th>
              <th className="p-3 font-bold whitespace-nowrap">تاريخ ووقت الجلسة</th>
              <th className="p-3 font-bold">المرحلة والمطلوب</th>
              <th className="p-3 font-bold text-center whitespace-nowrap">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {cases.map((c) => {
              const countdown = getCountdownBadge(c.sessionDate, c.sessionTime);
              const urgent24h = isWithin24Hours(c);

              return (
                <tr 
                  key={c.id} 
                  className={`hover:bg-amber-50/40 transition ${
                    urgent24h ? 'bg-amber-50/30' : ''
                  }`}
                >
                  {/* Case Number */}
                  <td className="p-3 whitespace-nowrap align-top">
                    <div className="font-bold font-mono text-slate-900 text-xs sm:text-sm">
                      {c.caseNumber} / {c.caseYear}
                    </div>
                    {urgent24h ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        أقل من 24 ساعة
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 block mt-0.5">
                        {c.status === 'judged' ? 'محكوم فيها' : 'قادمة'}
                      </span>
                    )}
                  </td>

                  {/* Court & Circuit */}
                  <td className="p-3 whitespace-nowrap align-top">
                    <span className="font-bold text-slate-800 block text-xs">
                      {c.court}
                    </span>
                    <span className="text-slate-500 text-[11px] block mt-0.5">
                      {c.circuit}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="p-3 align-top max-w-xs">
                    <button
                      onClick={() => onOpenDetails(c)}
                      className="font-bold text-slate-900 hover:text-amber-700 text-right transition cursor-pointer line-clamp-2"
                    >
                      {c.title}
                    </button>
                    {c.demands && (
                      <span className="text-slate-500 text-[11px] block mt-1 line-clamp-1">
                        المطلوب: {c.demands}
                      </span>
                    )}
                  </td>

                  {/* Client / Company Name */}
                  <td className="p-3 whitespace-nowrap align-top">
                    <span className="font-bold text-slate-800 block">
                      {c.clientName}
                    </span>
                    {c.assignedLawyer && (
                      <span className="text-amber-900 text-[10px] font-bold block mt-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <UserCheck className="w-2.5 h-2.5 text-amber-700 shrink-0" />
                        <span className="truncate">المحامي: {c.assignedLawyer}</span>
                      </span>
                    )}
                  </td>

                  {/* Company Role (Separate Column) */}
                  <td className="p-3 whitespace-nowrap align-top text-center">
                    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-[11px] font-black border ${
                      c.clientRole === 'مدعي' || c.clientRole === 'طاعن' || c.clientRole === 'مستأنف'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                    }`}>
                      {c.clientRole}
                    </span>
                  </td>

                  {/* Opponent */}
                  <td className="p-3 whitespace-nowrap align-top">
                    <span className="text-slate-800 font-medium block">
                      {c.opponentName}
                    </span>
                    {c.opponentLawyer && (
                      <span className="text-slate-400 text-[10px] block">
                        دفاع: {c.opponentLawyer}
                      </span>
                    )}
                  </td>

                  {/* Session Date & Time */}
                  <td className="p-3 whitespace-nowrap align-top">
                    {c.sessionDate ? (
                      <>
                        <div className="font-bold text-slate-900 text-xs">
                          {formatArabicDate(c.sessionDate)}
                        </div>
                        <div className="text-[11px] text-emerald-800 font-semibold">
                          {formatHijriDate(c.sessionDate)} (أم القرى)
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">
                            {formatArabicTime(c.sessionTime)}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${countdown.colorClass}`}>
                            {countdown.text}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-0.5">
                        {c.verdictDate ? (
                          <>
                            <div className="text-xs font-bold text-slate-700">
                              تاريخ الحكم: {formatArabicDate(c.verdictDate)}
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              ({formatHijriDate(c.verdictDate)})
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-400 text-xs italic">لا توجد جلسة مجدولة</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Stage & Demands */}
                  <td className="p-3 align-top max-w-xs">
                    <div className="flex flex-wrap items-center gap-1 mb-1">
                      {c.judgmentType === 'final' ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[11px]">
                          ⚖️ حكم نهائي (بات)
                        </span>
                      ) : c.judgmentType === 'appealable' ? (
                        <span className="inline-block px-2 py-0.5 bg-sky-100 text-sky-900 border border-sky-300 rounded font-bold text-[11px]">
                          ⏳ حكم قابل للاستئناف
                        </span>
                      ) : c.status === 'judged' || c.isClosed ? (
                        <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[11px]">
                          ⚖️ قضية منتهية
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {c.sessionStage}
                        </span>
                      )}

                      {c.enforcement && (c.enforcement.isEnforcement || c.court === 'محكمة التنفيذ') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[11px]">
                          <Stamp className="w-3 h-3 text-amber-700" />
                          <span>تنفيذ ({c.enforcement.deedType || 'سند'})</span>
                        </span>
                      )}
                    </div>
                    {c.verdictText ? (
                      <p className="text-emerald-900 font-semibold text-[11px] line-clamp-1 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 mt-0.5">
                        المنطوق: {c.verdictText}
                      </p>
                    ) : c.previousDecision ? (
                      <p className="text-slate-500 text-[11px] line-clamp-1">
                        السابق: {c.previousDecision}
                      </p>
                    ) : null}
                  </td>

                  {/* Action Buttons */}
                  <td className="p-3 whitespace-nowrap align-top text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onPostpone(c)}
                        title="تأجيل الجلسة / تدوين القرار"
                        className="p-1.5 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-lg transition cursor-pointer border border-sky-200"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onOpenDetails(c)}
                        title="عرض كامل التفاصيل"
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onEdit(c)}
                        title="تعديل"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition cursor-pointer"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDelete(c.id)}
                        title="حذف"
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
