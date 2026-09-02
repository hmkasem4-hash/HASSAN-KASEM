import React, { useState, useRef, useEffect } from 'react';
import { 
  Scale, 
  Plus, 
  Printer, 
  Bell, 
  Search, 
  Download, 
  Upload, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Calendar,
  Layers,
  FileSpreadsheet,
  BarChart3,
  Gavel,
  BookOpen,
  Stamp,
  Receipt,
  X
} from 'lucide-react';
import { ViewMode } from '../types';
import { formatArabicDate, formatHijriDate, getTodayString } from '../utils/dateUtils';
import { AppLogo } from './AppLogo';

interface NavbarProps {
  urgentCount: number;
  enforcementCount?: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddNewCase: () => void;
  onOpenPrintRoll: () => void;
  onOpenReports: () => void;
  onOpenJudgmentsArchive: () => void;
  onOpenLegalLibrary: () => void;
  onOpenEnforcement: () => void;
  onToggleUrgentPanel: () => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onRequestNotifications: () => void;
  hasNotificationPermission: boolean;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  urgentCount,
  enforcementCount = 0,
  searchQuery,
  onSearchChange,
  onAddNewCase,
  onOpenPrintRoll,
  onOpenReports,
  onOpenJudgmentsArchive,
  onOpenLegalLibrary,
  onOpenEnforcement,
  onToggleUrgentPanel,
  viewMode,
  onViewModeChange,
  soundEnabled,
  onToggleSound,
  onRequestNotifications,
  hasNotificationPermission,
  onExportData,
  onImportData,
}) => {
  const todayStr = getTodayString();
  const [showBackupMenu, setShowBackupMenu] = useState(false);
  const desktopSearchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  // Global hotkey '/' or 'Ctrl+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        if (window.innerWidth >= 1024) {
          desktopSearchInputRef.current?.focus();
        } else {
          mobileSearchInputRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFocusSearch = (isMobile = false) => {
    if (isMobile) {
      mobileSearchInputRef.current?.focus();
    } else {
      desktopSearchInputRef.current?.focus();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-xl no-print">
      {/* Top Notification Bar if there are Urgent 24h Sessions */}
      {urgentCount > 0 && (
        <div className="bg-amber-500 text-slate-950 font-bold px-4 py-1.5 text-xs sm:text-sm flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-950 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-950"></span>
              </span>
              <span>
                تنبيه هام: لديك <strong>{urgentCount}</strong> {urgentCount === 1 ? 'جلسة' : 'جلسات'} خلال أقل من 24 ساعة!
              </span>
            </div>
            <button
              onClick={onToggleUrgentPanel}
              className="bg-slate-950 text-amber-400 hover:bg-slate-900 px-3 py-0.5 rounded text-xs transition cursor-pointer flex items-center gap-1"
            >
              عرض وتجهيز الملفات
            </button>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <AppLogo size="md" withGlow />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-1.5">
                  إدارة المكتب القانوني
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full">
                  HK Law • النسخة الذكية
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                <span>{formatArabicDate(todayStr)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400/90 font-semibold">{formatHijriDate(todayStr)} (أم القرى)</span>
              </div>
            </div>
          </div>

          {/* Center Search bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full group">
              <input
                ref={desktopSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="ابحث برقم القضية، الموكل، الخصم، الدائرة، المحكمة، أو الصك..."
                className="w-full bg-slate-800/95 border border-slate-700 hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2 pr-10 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition shadow-inner"
              />
              <button
                type="button"
                onClick={() => handleFocusSearch(false)}
                title="تفعيل البحث والتركيز (اضغط / أو Ctrl+K)"
                className="absolute right-2.5 top-2 p-1 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
              >
                <Search className={`w-4 h-4 ${searchQuery ? 'text-amber-400' : ''}`} />
              </button>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    desktopSearchInputRef.current?.focus();
                  }}
                  title="مسح البحث"
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* 24h Alerts Toggle */}
            <button
              onClick={onToggleUrgentPanel}
              title="تنبيهات الجلسات القادمة (أقل من 24 ساعة)"
              className={`relative p-2.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                urgentCount > 0
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Bell className={`w-4 h-4 ${urgentCount > 0 ? 'text-amber-400 animate-bounce' : ''}`} />
              <span className="hidden sm:inline">تنبيهات 24س</span>
              {urgentCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-500 text-slate-950 font-bold rounded-full text-[11px]">
                  {urgentCount}
                </span>
              )}
            </button>

            {/* Enforcement & Execution Button (أيقونة التنفيذ القضائي) */}
            <button
              onClick={onOpenEnforcement}
              title="لوحة إدارة ومتابعة طلبات وسندات التنفيذ القضائي (محكمة التنفيذ)"
              className="p-2 sm:px-3 bg-gradient-to-r from-amber-500/25 via-amber-600/20 to-slate-800 hover:from-amber-500/40 hover:to-slate-700 text-amber-300 border border-amber-400/50 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-xs hover:shadow-md hover:border-amber-400 group"
            >
              <div className="p-1 bg-amber-500 text-slate-950 rounded-lg group-hover:scale-105 transition">
                <Stamp className="w-3.5 h-3.5" />
              </div>
              <span className="hidden sm:inline">طلبات التنفيذ</span>
              {enforcementCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black rounded-full text-[10px] shadow-xs">
                  {enforcementCount}
                </span>
              )}
            </button>

            {/* Judgments Archive & Flaw Analysis Button */}
            <button
              onClick={onOpenJudgmentsArchive}
              title="أرشيف الأحكام القضائية وتحليل العوار واستخلاص البيانات"
              className="p-2.5 sm:px-3 bg-gradient-to-r from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 text-amber-300 border border-amber-500/50 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <Gavel className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">أرشيف الأحكام</span>
            </button>

            {/* Legal Library & AI Drafting Button */}
            <button
              onClick={onOpenLegalLibrary}
              title="المكتبة القانونية والأنظمة واستوديو صياغة المذكرات والطعون"
              className="p-2.5 sm:px-3 bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-indigo-400" />
              <span className="hidden sm:inline">المكتبة القانونية وصياغة المذكرات</span>
            </button>

            {/* Reports Center Button */}
            <button
              onClick={onOpenReports}
              title="مركز التقارير والإحصاءات الشاملة (نشطة، غير نشطة، ساعد مدعي، ساعد مدعى عليه)"
              className="p-2.5 sm:px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline">التقارير</span>
            </button>

            {/* Print & Export Roll Button */}
            <button
              onClick={onOpenPrintRoll}
              title="طباعة وتصدير رول الجلسات اليومي للمحكمة (Word / PDF / Excel)"
              className="p-2.5 sm:px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-xs hover:border-amber-400"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline">رول الجلسات (طباعة / Word)</span>
            </button>

            {/* Backup & Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowBackupMenu(!showBackupMenu)}
                title="خيارات الحفظ والاستيراد والإشعارات"
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl transition cursor-pointer flex items-center"
              >
                <Layers className="w-4 h-4" />
              </button>

              {showBackupMenu && (
                <div 
                  className="absolute left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-right animate-in fade-in"
                  onClick={() => setShowBackupMenu(false)}
                >
                  <button
                    onClick={onExportData}
                    className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>نسخ احتياطي للبيانات (JSON)</span>
                    <Download className="w-4 h-4 text-amber-400" />
                  </button>

                  <label className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between cursor-pointer">
                    <span>استعادة نسخة احتياطية</span>
                    <Upload className="w-4 h-4 text-sky-400" />
                    <input
                      type="file"
                      accept=".json"
                      onChange={onImportData}
                      className="hidden"
                    />
                  </label>

                  <div className="border-t border-slate-700 my-1"></div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSound();
                    }}
                    className="w-full px-4 py-2 text-xs text-slate-200 hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                  >
                    <span>صوت التنبيه الذكي</span>
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-rose-400" />
                    )}
                  </button>

                  {!hasNotificationPermission && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestNotifications();
                      }}
                      className="w-full px-4 py-2 text-xs text-amber-300 hover:bg-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>تفعيل إشعارات المتصفح</span>
                      <Bell className="w-4 h-4 text-amber-400" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Add New Case Primary Button */}
            <button
              onClick={onAddNewCase}
              className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 text-xs sm:text-sm transition-all transform active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>إضافة جلسة / قضية</span>
            </button>

          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden pb-3 pt-1">
          <div className="relative w-full group">
            <input
              ref={mobileSearchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث برقم القضية، الموكل، الخصم، الدائرة، المحكمة، الصك..."
              className="w-full bg-slate-800 border border-slate-700 hover:border-amber-500/60 focus:border-amber-500 rounded-xl px-4 py-2 pr-10 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition shadow-inner"
            />
            <button
              type="button"
              onClick={() => handleFocusSearch(true)}
              title="تفعيل البحث"
              className="absolute right-2.5 top-1.5 p-1 text-slate-400 hover:text-amber-400 rounded-lg transition cursor-pointer"
            >
              <Search className={`w-4 h-4 ${searchQuery ? 'text-amber-400' : ''}`} />
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  mobileSearchInputRef.current?.focus();
                }}
                title="مسح البحث"
                className="absolute left-3 top-2 text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
