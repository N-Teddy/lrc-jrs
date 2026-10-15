import {
  ArrowSquareOut,
  DownloadSimple,
  Eye,
  FileDoc,
  FileImage,
  FilePdf,
  FileText,
  FileXls,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useState } from 'react';

export interface IDriveFilePreview {
  fileId: string;
  filename: string;
  webViewLink?: string;
  fileSize?: number;
  uploadedAt?: string;
  uploadedByName?: string;
}

interface DriveFilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file: IDriveFilePreview | null;
}

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const previewUrl = `https://drive.google.com/file/d/${file.fileId}/preview`;
  const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.fileId}`;
  const driveWebUrl =
    file.webViewLink || `https://drive.google.com/file/d/${file.fileId}/view`;

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
      return <FilePdf size={22} weight="bold" className="text-[#ba1a1a]" />;
    }
    if (['doc', 'docx'].includes(ext)) {
      return <FileDoc size={22} weight="bold" className="text-[#005fb0]" />;
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileXls size={22} weight="bold" className="text-[#2c4e37]" />;
    }
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
      return <FileImage size={22} weight="bold" className="text-[#7a5500]" />;
    }
    return <FileText size={22} weight="bold" className="text-[#57423b]" />;
  };

  const formattedSize = file.fileSize
    ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
    : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e1b19]/75 p-3 sm:p-6 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        className={`bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-5xl h-[88vh] max-h-[920px]'
        }`}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-[#e8e1dd] bg-white flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-center shrink-0">
              {getFileIcon(file.filename)}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1e1b19] truncate">
                  {file.filename}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#ffdbcf] shrink-0">
                  Google Drive Report
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8a726a] mt-0.5">
                {formattedSize && <span>{formattedSize}</span>}
                {file.uploadedByName && (
                  <>
                    <span>•</span>
                    <span>Archived by {file.uploadedByName}</span>
                  </>
                )}
                {file.uploadedAt && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Download File"
            >
              <DownloadSimple size={14} weight="bold" />
              <span className="hidden sm:inline">Download</span>
            </a>

            <a
              href={driveWebUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Open directly in Google Drive"
            >
              <ArrowSquareOut size={14} weight="bold" />
              <span className="hidden sm:inline">Open Drive</span>
            </a>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#57423b] transition-colors cursor-pointer hidden md:flex items-center justify-center"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              <Eye size={15} weight="bold" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-[#e8e1dd] text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition-colors flex items-center justify-center cursor-pointer ml-1"
              title="Close Preview (ESC)"
            >
              <X size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Preview Frame Container */}
        <div className="relative flex-1 w-full bg-[#f8f5f2] overflow-hidden flex items-center justify-center">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fff8f5]/90 z-10 gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-[#b85028] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-[#8a726a]">
                Loading Google Drive Preview...
              </p>
            </div>
          )}

          <iframe
            src={previewUrl}
            title={file.filename}
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-0"
            allow="autoplay; encrypted-media; fullscreen"
          />
        </div>
      </div>
    </div>
  );
};
