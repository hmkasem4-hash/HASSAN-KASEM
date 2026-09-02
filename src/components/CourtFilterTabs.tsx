import React from 'react';
import { 
  Building2, 
  Clock, 
  CalendarDays, 
  LayoutGrid, 
  Table as TableIcon, 
  Calendar as CalendarIcon, 
  GitCommit,
  Filter,
  CheckCircle,
  ClockAlert,
  Stamp,
  Handshake
} from 'lucide-react';
import { CourtType, ViewMode, DateFilterType } from '../types';

interface CourtFilterTabsProps {
  selectedCourt: string;
  onSelectCourt: (court: string) => void;
  courtCounts: Record<string, number>;
  selectedDateFilter: DateFilterType;
  onSelectDateFilter: (filter: DateFilterType) => void;
  dateFilterCounts: Record<DateFilterType, number>;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  allCourts: string[];
}

export const CourtFilterTabs: React.FC<CourtFilterTabsProps> = ({
  selectedCourt,
  onSelectCourt,
  courtCounts,
  selectedDateFilter,
  onSelectDateFilter,
  dateFilterCounts,
  viewMode,
  onViewModeChange,
  allCourts,
}) => {
  return (
    <div className="space-y-4 mb-6 no-print">
      
      {/* Primary Date Status Bar & View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-sm">
        
        {/* Date Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => onSelectDateFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>جميع الجلسات</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-700 text-white">
              {dateFilterCounts.all}
            </span>
          </button>

          <button
            onClick={() => onSelectDateFilter('24h')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === '24h'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400/50'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <ClockAlert className="w-3.5 h-3.5" />
            <span>خلال 24 ساعة</span>
            {dateFilterCounts['24h'] > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-amber-600 text-white font-black animate-pulse">
                {dateFilterCounts['24h']}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectDateFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === 'today'
                ? 'bg-rose-600 text-white shadow-md'
                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>جلسات اليوم</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-200 text-rose-900">
              {dateFilterCounts.today}
            </span>
          </button>

          <button
            onClick={() => onSelectDateFilter('tomorrow')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === 'tomorrow'
                ? 'bg-sky-600 text-white shadow-md'
                : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
            }`}
          >
            <span>جلسات الغد</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-sky-200 text-sky-900">
              {dateFilterCounts.tomorrow}
            </span>
          </button>

          <button
            onClick={() => onSelectDateFilter('this_week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === 'this_week'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>هذا الأسبوع</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-emerald-200 text-emerald-900">
              {dateFilterCounts.this_week}
            </span>
          </button>

          <button
            onClick={() => onSelectDateFilter('past')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              selectedDateFilter === 'past'
                ? 'bg-slate-700 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>المنتهية / المحكوم فيها</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-200 text-slate-800">
              {dateFilterCounts.past}
            </span>
          </button>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            onClick={() => onViewModeChange('cards')}
            title="عرض البطاقات المفصلة"
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">بطاقات</span>
          </button>

          <button
            onClick={() => onViewModeChange('table')}
            title="عرض الجدول المجدول (رول)"
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span className="hidden sm:inline">جدول</span>
          </button>

          <button
            onClick={() => onViewModeChange('timeline')}
            title="تسلسل زمني للجلسات"
            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span className="hidden sm:inline">المخطط الزمني</span>
          </button>
        </div>

      </div>

      {/* Courts Filter Row (Categories) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold shrink-0 ml-1">
          <Building2 className="w-4 h-4 text-amber-600" />
          <span>المحكمة:</span>
        </div>

        <button
          onClick={() => onSelectCourt('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
            selectedCourt === 'all'
              ? 'bg-amber-600 text-white font-bold shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>كافة المحاكم</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
            selectedCourt === 'all' ? 'bg-amber-700 text-amber-100' : 'bg-slate-100 text-slate-600'
          }`}>
            {courtCounts['all'] || 0}
          </span>
        </button>

        {allCourts.map((court) => {
          const count = courtCounts[court] || 0;
          const isSelected = selectedCourt === court;
          const isEnforcement = court === 'محكمة التنفيذ';
          const isSettlement = court === 'التسوية الودية';

          return (
            <button
              key={court}
              onClick={() => onSelectCourt(court)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                isSelected
                  ? isEnforcement 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md ring-2 ring-amber-400/50'
                    : isSettlement
                    ? 'bg-teal-700 text-white font-bold shadow-sm ring-2 ring-teal-500/40'
                    : 'bg-slate-900 text-white font-bold shadow-sm'
                  : isEnforcement
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-bold'
                  : isSettlement
                  ? 'bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 font-medium'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {isEnforcement && <Stamp className="w-3.5 h-3.5 text-amber-700" />}
              {isSettlement && <Handshake className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-200' : 'text-teal-600'}`} />}
              <span>{court}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected 
                  ? isEnforcement ? 'bg-slate-950 text-amber-300 font-bold' : isSettlement ? 'bg-teal-900 text-teal-100' : 'bg-slate-800 text-slate-200' 
                  : isEnforcement ? 'bg-amber-200 text-amber-900 font-bold' : isSettlement ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

    </div>
  );
};
