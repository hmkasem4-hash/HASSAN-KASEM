import React, { useRef, useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Download, 
  FileCheck2, 
  Eye, 
  Scale, 
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { CaseAttachment } from '../types';

interface SingleDeedUploaderProps {
  id?: string;
  label: string;
  sublabel?: string;
  file?: CaseAttachment;
  onChange: (file?: CaseAttachment) => void;
  badgeText?: string;
  badgeColorClass?: string;
  accentBorderColor?: string;
  theme?: 'dark' | 'light';
}

export const SingleDeedUploader: React.FC<SingleDeedUploaderProps> = ({
  id = `deed-uploader-${Math.random().toString(36).substr(2, 6)}`,
  label,
  sublabel = 'رفع صك الحكم بصيغة PDF أو Word أو صورة ممسوحة ضوئياً',
  file,
  onChange,
  badgeText,
  badgeColorClass = 'bg-amber-100 text-amber-900 border-amber-300',
  accentBorderColor = 'border-amber-400',
  theme = 'dark',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = (selectedFile: File) => {
    const isPdf = selectedFile.name.toLowerCase().endsWith('.pdf') || selectedFile.type.includes('pdf');
    const isWord = selectedFile.name.toLowerCase().endsWith('.doc') || 
                  selectedFile.name.toLowerCase().endsWith('.docx') || 
                  selectedFile.type.includes('word') || 
                  selectedFile.type.includes('officedocument');

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      const attachment: CaseAttachment = {
        id: `deed-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: selectedFile.name,
        size: selectedFile.size,
        type: isPdf ? 'pdf' : isWord ? 'word' : 'other',
        dataUrl: base64Data,
        uploadedAt: new Date().toISOString(),
      };
      onChange(attachment);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
  };

  const handleDownload = () => {
    if (!file?.dataUrl) return;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'مستند رقمي';
    if (bytes < 1024) return `${bytes} بايت`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} كيلوبايت`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} ميجابايت`;
  };

  const isPdf = file ? (file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf')) : false;
  const isDark = theme === 'dark';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
          <Scale className="w-3.5 h-3.5 text-amber-500" />
          <span>{label}</span>
        </label>
        {badgeText && (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColorClass}`}>
            {badgeText}
          </span>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        id={id}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {!file ? (
        <label
          htmlFor={id}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl cursor-pointer transition text-center group border-2 border-dashed ${
            isDragging 
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]' 
              : isDark
                ? 'bg-slate-900/90 hover:bg-slate-900 border-slate-700 hover:border-amber-400/80 shadow-inner'
                : 'bg-white hover:bg-slate-50 border-slate-300 hover:border-amber-500 shadow-xs'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-amber-500/10 group-hover:bg-amber-500/20 flex items-center justify-center text-amber-400 transition">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <span className={`text-xs font-bold block ${isDark ? 'text-slate-100 group-hover:text-amber-300' : 'text-slate-800 group-hover:text-amber-700'}`}>
              اضغط أو اسحب لرفع {label}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              {sublabel}
            </span>
          </div>
        </label>
      ) : (
        <div className={`flex items-center justify-between p-3 border-2 rounded-2xl ${accentBorderColor} shadow-md transition ${
          isDark ? 'bg-slate-900/95 text-white' : 'bg-white text-slate-900'
        }`}>
          <div className="flex items-center gap-2.5 overflow-hidden flex-1 pl-2">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold ${
                isPdf 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}
            >
              <span className="text-[10px] font-black">{isPdf ? 'PDF' : 'DOC'}</span>
            </div>
            <div className="overflow-hidden">
              <span className="font-extrabold truncate block text-xs" title={file.name}>
                {file.name}
              </span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span className="text-emerald-400 font-sans font-bold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  صك مرفوع ومحفوظ
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {file.dataUrl && (
              <button
                type="button"
                onClick={handleDownload}
                title="تحميل صك الحكم"
                className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl border border-amber-400/40 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>تحميل</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleRemove}
              title="إزالة هذا الصك"
              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl border border-rose-500/40 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
