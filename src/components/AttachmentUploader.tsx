import React, { useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  Download, 
  FileCheck, 
  Eye,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { CaseAttachment } from '../types';

interface AttachmentUploaderProps {
  files: CaseAttachment[];
  onChange: (files: CaseAttachment[]) => void;
  label?: string;
  acceptTypes?: string;
  maxFiles?: number;
  readOnly?: boolean;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  files = [],
  onChange,
  label = 'رفع ملفات Word أو PDF',
  acceptTypes = '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  maxFiles = 10,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newAttachments: CaseAttachment[] = [];
    const filesArray: File[] = Array.from(selectedFiles);

    filesArray.forEach((file: File) => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf');
      const isWord = file.name.toLowerCase().endsWith('.doc') || 
                    file.name.toLowerCase().endsWith('.docx') || 
                    file.type.includes('word') || 
                    file.type.includes('officedocument');

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = event.target?.result as string;
        const attachment: CaseAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          name: file.name,
          size: file.size,
          type: isPdf ? 'pdf' : isWord ? 'word' : 'other',
          dataUrl: base64Data,
          uploadedAt: new Date().toISOString(),
        };

        newAttachments.push(attachment);
        if (newAttachments.length === filesArray.length) {
          onChange([...files, ...newAttachments].slice(0, maxFiles));
        }
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  const handleDownload = (file: CaseAttachment) => {
    if (!file.dataUrl) return;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 بايت';
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptTypes}
            onChange={handleFileSelect}
            className="hidden"
            id={`file-upload-${label}`}
          />
          <label
            htmlFor={`file-upload-${label}`}
            className="flex items-center justify-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-xl cursor-pointer transition text-xs text-slate-700 font-semibold group"
          >
            <UploadCloud className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            <span>{label}</span>
            <span className="text-[10px] text-slate-400 font-mono">(PDF أو Word حتى 10MB)</span>
          </label>
        </div>
      )}

      {/* Files List */}
      {files && files.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {files.map((file) => {
            const isPdf = file.type === 'pdf' || file.name.toLowerCase().endsWith('.pdf');
            return (
              <div
                key={file.id}
                className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs shadow-2xs hover:border-slate-300 transition"
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 pl-2">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold ${
                      isPdf ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}
                  >
                    {isPdf ? (
                      <span className="text-[10px] font-black">PDF</span>
                    ) : (
                      <span className="text-[10px] font-black">DOC</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <span className="font-bold text-slate-900 truncate block text-xs" title={file.name}>
                      {file.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono block">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {file.dataUrl && (
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      title="تحميل / فتح الملف"
                      className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemove(file.id)}
                      title="حذف الملف"
                      className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
