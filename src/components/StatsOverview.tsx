import React from 'react';
import { 
  Scale, 
  ClockAlert, 
  CalendarCheck, 
  ArrowRightLeft, 
  CheckCircle2, 
  Building2 
} from 'lucide-react';
import { CourtCase } from '../types';
import { isWithin24Hours, isToday, isTomorrow } from '../utils/dateUtils';

interface StatsOverviewProps {
  cases: CourtCase[];
  onSelectFilter: (filter: any) => void;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ cases, onSelectFilter }) => {
  const activeCases = cases.filter((c) => c.status !== 'judged' && c.status !== 'struck_off' && !c.isClosed);
  const urgent24hCases = cases.filter(isWithin24Hours);
  const todayCases = cases.filter((c) => isToday(c.sessionDate) && c.status !== 'judged' && !c.isClosed);
  const postponedCases = cases.filter((c) => c.status === 'postponed');
  const judgedCases = cases.filter((c) => c.status === 'judged' || c.isClosed || c.status === 'struck_off' || Boolean(c.verdictText));

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 no-print">
      
      {/* 24h Alerts Card */}
      <div 
        onClick={() => onSelectFilter('24h')}
        className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-sm relative overflow-hidden ${
          urgent24hCases.length > 0
            ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 ring-2 ring-amber-400 shadow-amber-200'
            : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold">تنبيهات 24 ساعة</span>
          <ClockAlert className={`w-5 h-5 ${urgent24hCases.length > 0 ? 'animate-bounce' : 'text-amber-500'}`} />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono">
            {urgent24hCases.length}
          </span>
          <span className="text-[11px] font-semibold opacity-90">جلسة حرجة</span>
        </div>
      </div>

      {/* Today's Sessions */}
      <div 
        onClick={() => onSelectFilter('today')}
        className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">جلسات اليوم</span>
          <CalendarCheck className="w-5 h-5 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
            {todayCases.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">جلسة اليوم</span>
        </div>
      </div>

      {/* Total Active Cases */}
      <div 
        onClick={() => onSelectFilter('all')}
        className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">القضايا المتداولة</span>
          <Scale className="w-5 h-5 text-slate-700" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
            {activeCases.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">دعوى نشطة</span>
        </div>
      </div>

      {/* Postponed Cases */}
      <div 
        onClick={() => onSelectFilter('all')}
        className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">مؤجلة لقرارات</span>
          <ArrowRightLeft className="w-5 h-5 text-sky-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
            {postponedCases.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">جلسة مؤجلة</span>
        </div>
      </div>

      {/* Judged / Completed */}
      <div 
        onClick={() => onSelectFilter('past')}
        className="col-span-2 lg:col-span-1 bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-sm"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">محكوم فيها</span>
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
            {judgedCases.length}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">حكم نهائي</span>
        </div>
      </div>

    </div>
  );
};
