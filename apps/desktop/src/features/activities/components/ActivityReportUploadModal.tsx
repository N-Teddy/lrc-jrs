import {
  useDeleteActivityReportMutation,
  useUploadActivityReportMutation,
} from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  ArrowSquareOut,
  CloudArrowUp,
  FileDoc,
  FilePdf,
  FileText,
  HardDrives,
  Trash,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useRef, useState } from 'react';

interface ActivityReportUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: IActivity;
  onSuccess?: () => void;
  isPrivileged: boolean;
}

export const ActivityReportUploadModal: React.FC<
  ActivityReportUploadModalProps
> = ({ isOpen, onClose, activity, onSuccess, isPrivileged }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summary, setSummary] = useState(activity.report?.summary || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const uploadMutation = useUploadActivityReportMutation();
  const deleteMutation = useDeleteActivityReportMutation();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds maximum allowed limit (25 MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files?.[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds maximum allowed limit (25 MB)');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg('Please select a report document or image to upload');
      return;
    }

    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (summary.trim()) {
        formData.append('summary', summary.trim());
      }

      await uploadMutation.mutateAsync({
        activityId: activity.id,
        formData,
      });

      setSelectedFile(null);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          err.message ||
          'Failed to upload report to Google Drive',
      );
    }
  };

  const handleDelete = async () => {
    if (
      !confirm('Are you sure you want to remove this report from Google Drive?')
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(activity.id);
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to remove report',
      );
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={28} className="text-[#ba1a1a]" />;
    if (ext === 'doc' || ext === 'docx')
      return <FileDoc size={28} className="text-[#1565c0]" />;
    return <FileText size={28} className="text-[#8a726a]" />;
  };

  const hasExistingReport = Boolean(activity.report?.fileId);

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[560px] bg-white rounded-3xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <HardDrives size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                {hasExistingReport
                  ? 'Activity Report & Google Drive Archive'
                  : 'Upload Activity Report'}
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5 truncate max-w-sm">
                {activity.title} ({activity.town?.name})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing Report Card */}
        {hasExistingReport && (
          <div className="p-6 bg-[#faf2ee]/60 border-b border-[#e8e1dd] flex flex-col gap-3">
            <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
              Current Synced Report
            </span>
            <div className="bg-white rounded-2xl border border-[#e8e1dd] p-4 flex items-center justify-between gap-4 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#faf2ee] flex items-center justify-center shrink-0">
                  {getFileIcon(activity.report?.filename || '')}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs text-[#1e1b19] truncate">
                    {activity.report?.filename}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-[#8a726a] mt-0.5">
                    <span>
                      Uploaded{' '}
                      {activity.report?.uploadedAt
                        ? new Date(
                            activity.report.uploadedAt,
                          ).toLocaleDateString()
                        : ''}
                    </span>
                    {activity.report?.uploadedByName && (
                      <>
                        <span>•</span>
                        <span>{activity.report.uploadedByName}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activity.report?.webViewLink && (
                  <a
                    href={activity.report.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <span>View in Drive</span>
                    <ArrowSquareOut size={13} />
                  </a>
                )}
                {isPrivileged && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 rounded-xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove from Google Drive"
                  >
                    <Trash size={15} />
                  </button>
                )}
              </div>
            </div>

            {activity.report?.summary && (
              <p className="text-xs text-[#57423b] italic bg-white/70 p-3 rounded-xl border border-[#e8e1dd]">
                "{activity.report.summary}"
              </p>
            )}
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="activity-report-file-input"
              className="text-xs font-bold text-[#1e1b19]"
            >
              {hasExistingReport ? 'Replace Report File' : 'Report Attachment'}
            </label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-[#b85028] bg-[#fff8f5]'
                  : 'border-[#e8e1dd] hover:border-[#b85028] bg-[#faf2ee]/40'
              }`}
            >
              <input
                id="activity-report-file-input"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                onChange={handleFileChange}
                className="hidden"
              />
              {selectedFile ? (
                <div className="flex items-center gap-3">
                  {getFileIcon(selectedFile.name)}
                  <div className="text-left">
                    <p className="text-xs font-bold text-[#1e1b19]">
                      {selectedFile.name}
                    </p>
                    <p className="text-[10px] text-[#8a726a]">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready
                      to upload
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                    <CloudArrowUp size={22} weight="duotone" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#b85028]">
                      Click to choose file
                    </span>{' '}
                    <span className="text-xs text-[#8a726a]">
                      or drag & drop
                    </span>
                    <p className="text-[10px] text-[#8a726a] mt-0.5">
                      PDF, Word, Excel, or high-res images (up to 25MB)
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Narrative Summary */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="activity-report-summary-input"
              className="text-xs font-bold text-[#1e1b19]"
            >
              Fellowship Session Notes / Summary (Optional)
            </label>
            <textarea
              id="activity-report-summary-input"
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Record fellowship outcomes, key milestones, spiritual highlights, or special visitor notes..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#faf2ee]/50 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028] transition-colors resize-none placeholder:text-[#a08a82]"
            />
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-[#ffdad6] border border-[#ffb4ab] text-xs font-bold text-[#ba1a1a] flex items-center gap-2">
              <WarningCircle size={16} weight="bold" className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !selectedFile}
              className="px-5 py-2.5 rounded-xl bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
            >
              <UploadSimple size={16} weight="bold" />
              <span>
                {uploadMutation.isPending
                  ? 'Syncing to Drive...'
                  : hasExistingReport
                    ? 'Update in Google Drive'
                    : 'Upload to Google Drive'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
