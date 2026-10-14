import {
  useDeleteActivityReportMutation,
  useDriveFoldersQuery,
  useUploadActivityReportMutation,
} from '@jrs/client-core';
import type { IActivity } from '@jrs/shared';
import {
  ArrowSquareOut,
  CaretDown,
  CloudArrowUp,
  FileDoc,
  FilePdf,
  FileText,
  Folder,
  HardDrives,
  Trash,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';

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
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const uploadMutation = useUploadActivityReportMutation();
  const deleteMutation = useDeleteActivityReportMutation();
  const { data: driveFolders, isLoading: isFoldersLoading } =
    useDriveFoldersQuery();

  // Smart folder pre-selection based on activity properties
  useEffect(() => {
    if (driveFolders && driveFolders.length > 0 && !selectedFolderId) {
      const year = new Date(activity.startDate).getFullYear().toString();
      const titleLower = activity.title.toLowerCase();

      // Check if title has 'reunion' or 'monthly'
      const isReunion =
        titleLower.includes('reunion') ||
        titleLower.includes('réunion') ||
        titleLower.includes('monthly');
      const isConference =
        titleLower.includes('conference') || titleLower.includes('conférence');

      let matched = driveFolders.find(
        (f) =>
          isReunion &&
          f.path.includes('Rapport Reunions') &&
          f.path.includes(year),
      );

      if (!matched && isConference) {
        matched = driveFolders.find(
          (f) => f.path.includes('Conference') && f.path.includes(year),
        );
      }

      if (!matched) {
        matched = driveFolders.find((f) => f.path.includes(year));
      }

      if (matched) {
        setSelectedFolderId(matched.id);
      } else {
        setSelectedFolderId(driveFolders[0].id);
      }
    }
  }, [driveFolders, activity, selectedFolderId]);

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
      if (selectedFolderId) {
        formData.append('folderId', selectedFolderId);
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

  const handleConfirmDelete = async () => {
    try {
      await deleteMutation.mutateAsync(activity.id);
      setShowDeleteConfirm(false);
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
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleteMutation.isPending}
                    className="w-8 h-8 rounded-xl bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                    title="Remove from Google Drive"
                  >
                    <Trash size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Custom inline confirmation for deleting report */}
            {showDeleteConfirm && (
              <div className="p-3.5 rounded-2xl bg-[#fff2ee] border border-[#ffb4ab] flex flex-col gap-2 animate-in fade-in duration-150">
                <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a]">
                  <WarningCircle size={16} weight="bold" />
                  <span>Remove this report from Google Drive archive?</span>
                </div>
                <p className="text-[11px] text-[#57423b]">
                  This action will permanently delete the report file from the
                  cloud folder.
                </p>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1 rounded-lg text-xs font-bold text-[#57423b] hover:bg-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-1 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a] transition-colors cursor-pointer shadow-2xs"
                  >
                    {deleteMutation.isPending
                      ? 'Removing...'
                      : 'Confirm Remove'}
                  </button>
                </div>
              </div>
            )}

            {activity.report?.summary && (
              <p className="text-xs text-[#57423b] italic bg-white/70 p-3 rounded-xl border border-[#e8e1dd]">
                "{activity.report.summary}"
              </p>
            )}
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleUpload} className="p-6 flex flex-col gap-4">
          {/* Destination Google Drive Folder Selection */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="activity-report-folder-select"
              className="text-xs font-bold text-[#1e1b19] flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Folder size={14} weight="bold" className="text-[#b85028]" />
                <span>Destination Google Drive Folder</span>
              </span>
              {isFoldersLoading && (
                <span className="text-[10px] text-[#8a726a] animate-pulse">
                  Loading folders...
                </span>
              )}
            </label>
            <div className="relative">
              <select
                id="activity-report-folder-select"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-[#faf2ee]/70 border border-[#e8e1dd] text-xs font-semibold text-[#1e1b19] focus:outline-none focus:border-[#b85028] transition-colors cursor-pointer appearance-none"
              >
                {driveFolders && driveFolders.length > 0 ? (
                  driveFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      📁 {folder.path}
                    </option>
                  ))
                ) : (
                  <option value="">📁 JRs (Default Root)</option>
                )}
              </select>
              <CaretDown
                size={14}
                weight="bold"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a726a] pointer-events-none"
              />
            </div>
            <p className="text-[10px] text-[#8a726a]">
              Select the target subfolder to store this activity document.
            </p>
          </div>

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
