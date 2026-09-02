import React from 'react';
import { AlertTriangle, Trash2, X, Building2, Calendar, User } from 'lucide-react';
import { CourtCase } from '../types';
import { formatArabicDate } from '../utils/dateUtils';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  caseItem: CourtCase | null;
  onClose: () => void;
  onConfirm: (caseId: string) => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  caseItem,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !caseItem) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div 
        className="bg-white rounded-2xl border-2 border-rose-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-rose-50 px-5 py-4 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-rose-950">تأكيد حذف القضية نهائياً</h3>
              <p className="text-xs text-rose-700">هذا الإجراء نهائي ولا يمكن التراجع عنه</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-700 leading-relaxed font-medium">
            هل أنت متأكد من رغبتك في حذف ملف هذه الدعوى القضائية بجميع جلساتها، وسجل القرارات، وقوائم التجهيز الخاصة بها نهائياً من التطبيق؟
          </p>

          {/* Case Summary Card */}
          <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-500 font-bold">رقم الدعوى:</span>
              <span className="font-mono font-extrabold text-slate-900 text-sm">
                {caseItem.caseNumber} لسنة {caseItem.caseYear}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>المحكمة:</span>
              </span>
              <span className="font-bold text-slate-800">{caseItem.court}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>الموكل:</span>
              </span>
              <span className="font-bold text-slate-800">{caseItem.clientName} ({caseItem.clientRole})</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ الجلسة الحالية:</span>
              </span>
              <span className="font-bold text-slate-800">{formatArabicDate(caseItem.sessionDate)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-100 px-5 py-3.5 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            إلغاء وتراجع
          </button>
          
          <button
            type="button"
            onClick={() => {
              onConfirm(caseItem.id);
              onClose();
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>نعم، حذف القضية نهائياً</span>
          </button>
        </div>
      </div>
    </div>
  );
};
