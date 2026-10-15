import {
  ArrowSquareOut,
  ArrowsClockwise,
  DownloadSimple,
  Eye,
  FileDoc,
  FileImage,
  FilePdf,
  FileText,
  FileXls,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { PdfViewer } from './PdfViewer';

export interface IDriveFilePreview {
  fileId: string;
  filename: string;
  mimeType?: string;
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

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3500/api';

export const DriveFilePreviewModal: React.FC<DriveFilePreviewModalProps> = ({
  isOpen,
  onClose,
  file,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  const fileExt = useMemo(() => {
    if (!file?.filename) return '';
    const parts = file.filename.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  }, [file?.filename]);

  const isPdf = useMemo(() => {
    if (!file) return false;
    if (file.mimeType === 'application/pdf') return true;
    if (fileExt === 'pdf') return true;
    // Fallback: if filename mentions rapport or report without another extension, treat as document
    if (file.filename.toLowerCase().includes('pdf')) return true;
    return false;
  }, [file, fileExt]);

  const isImage = useMemo(() => {
    if (!file) return false;
    if (file.mimeType?.startsWith('image/')) return true;
    return ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(fileExt);
  }, [file, fileExt]);

  useEffect(() => {
    if (isOpen) {
      setHasError(false);
      // If file is neither a PDF nor an image, show the document card immediately without waiting
      if (!isPdf && !isImage) {
        setIsLoading(false);
      } else {
        setIsLoading(true);
      }

      // Safety timeout: never leave the spinner active for more than 4 seconds
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, isPdf, isImage]);

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

  // Stream & download URLs from our backend
  const streamUrl = `${API_BASE_URL}/activities/report/drive-file/${file.fileId}/stream`;
  const downloadUrl = `${API_BASE_URL}/activities/report/drive-file/${file.fileId}/download`;
  const driveWebUrl =
    file.webViewLink || `https://drive.google.com/file/d/${file.fileId}/view`;

  const handleOpenExternal = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileIcon = (filename: string, mime?: string) => {
    if (isPdf) {
      return <FilePdf size={22} weight="bold" className="text-[#ba1a1a]" />;
    }
    if (isImage) {
      return <FileImage size={22} weight="bold" className="text-[#7a5500]" />;
    }
    if (
      mime?.includes('word') ||
      ['doc', 'docx'].includes(fileExt) ||
      filename.toLowerCase().includes('rapport')
    ) {
      return <FileDoc size={22} weight="bold" className="text-[#005fb0]" />;
    }
    if (mime?.includes('sheet') || ['xls', 'xlsx', 'csv'].includes(fileExt)) {
      return <FileXls size={22} weight="bold" className="text-[#2c4e37]" />;
    }
    return <FileText size={22} weight="bold" className="text-[#57423b]" />;
  };

  const formattedSize = file.fileSize
    ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB`
    : null;

  const displayBadge = isPdf
    ? 'PDF Document'
    : isImage
      ? 'Image'
      : fileExt
        ? `${fileExt.toUpperCase()} Document`
        : 'Google Drive Document';

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
              {getFileIcon(file.filename, file.mimeType)}
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1e1b19] truncate">
                  {file.filename}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#faf2ee] text-[#b85028] border border-[#ffdbcf] shrink-0">
                  {displayBadge}
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
            <button
              type="button"
              onClick={() => handleOpenExternal(downloadUrl)}
              className="px-3 py-1.5 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Download File"
            >
              <DownloadSimple size={14} weight="bold" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenExternal(driveWebUrl)}
              className="px-3 py-1.5 rounded-lg bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Open in your default web browser where you are signed in"
            >
              <ArrowSquareOut size={14} weight="bold" />
              <span className="hidden sm:inline">Open in Browser</span>
            </button>

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

        {/* Ambient Webview Note */}
        <div className="px-4 py-2 bg-[#faf2ee] border-b border-[#e8e1dd] flex items-center justify-between gap-3 text-[11px] text-[#8a726a]">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-[#486b52]" />
            <span className="truncate">
              {isPdf
                ? 'High-Fidelity PDF Viewer • Powered by local Canvas Engine'
                : 'Direct Server Stream • Bypasses Google cross-origin restrictions'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenExternal(driveWebUrl)}
            className="text-[#b85028] font-bold hover:underline cursor-pointer shrink-0"
          >
            Open in Chrome/Browser &rarr;
          </button>
        </div>

        {/* Preview Frame Container */}
        <div className="relative flex-1 w-full bg-[#f8f5f2] overflow-hidden flex items-center justify-center">
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#fff8f5]/90 z-10 gap-3">
              <div className="w-8 h-8 rounded-full border-3 border-[#b85028] border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-[#8a726a]">
                Streaming Document Preview...
              </p>
            </div>
          )}

          {/* 1. Native Image Viewer */}
          {isImage && !hasError ? (
            <div className="w-full h-full p-4 flex items-center justify-center overflow-auto bg-[#1a1715]/95">
              <img
                src={streamUrl}
                alt={file.filename}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          ) : isPdf && !hasError ? (
            /* 2. Universal Canvas PDF Viewer (works on Linux WebKitGTK, Windows & Mac) */
            <div className="w-full h-full">
              <PdfViewer
                url={streamUrl}
                onLoaded={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
              />
            </div>
          ) : (
            /* 3. Document Card with Quick Launch Actions */
            <div className="p-8 max-w-md w-full flex flex-col items-center text-center gap-5 bg-white rounded-3xl border border-[#e8e1dd] shadow-md animate-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
                {getFileIcon(file.filename, file.mimeType)}
              </div>

              <div className="flex flex-col gap-1.5">
                <h4 className="text-base font-bold text-[#1e1b19]">
                  {file.filename}
                </h4>
                <p className="text-xs text-[#8a726a] leading-relaxed">
                  {hasError
                    ? 'The embedded document stream could not be loaded in webview. Click below to view in your default browser or download.'
                    : `This file format (${displayBadge}) can be opened directly in your default browser (Google Docs/Drive) or downloaded to your device.`}
                </p>
              </div>

              {hasError && (
                <div className="w-full p-3 rounded-xl bg-[#fff8e1] border border-[#ffe082] text-[#812901] text-xs flex items-center gap-2 text-left">
                  <WarningCircle size={18} weight="fill" className="shrink-0" />
                  <span>
                    Google prevents webview iframe embedding. Use the button
                    below to view in your browser.
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                <button
                  type="button"
                  onClick={() => handleOpenExternal(driveWebUrl)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowSquareOut size={16} weight="bold" />
                  <span>Open in Browser</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenExternal(downloadUrl)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <DownloadSimple size={16} weight="bold" />
                  <span>Download File</span>
                </button>
              </div>

              {hasError && (
                <button
                  type="button"
                  onClick={() => {
                    setHasError(false);
                    setIsLoading(true);
                  }}
                  className="text-xs text-[#8a726a] hover:text-[#1e1b19] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowsClockwise size={14} />
                  <span>Retry Preview</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
