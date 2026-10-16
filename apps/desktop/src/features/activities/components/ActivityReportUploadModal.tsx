import {
  useDeleteActivityReportMutation,
  useDriveFoldersQuery,
  useTranslation,
  useUploadActivityReportMutation,
} from '@jrs/client-core';
import type { IActivity, IActivityReport } from '@jrs/shared';
import {
  ArrowSquareOut,
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
import { useEffect, useMemo, useRef, useState } from 'react';
import { CustomSelect, type SelectOption } from '../../../components';

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
  const { t } = useTranslation(['activities', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [summary, setSummary] = useState(activity.report?.summary || '');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reportToDelete, setReportToDelete] = useState<IActivityReport | null>(
    null,
  );

  const uploadMutation = useUploadActivityReportMutation();
  const deleteMutation = useDeleteActivityReportMutation();
  const { data: driveFolders, isLoading: isFoldersLoading } =
    useDriveFoldersQuery();

  const existingReports: IActivityReport[] =
    activity.reports && activity.reports.length > 0
      ? activity.reports
      : activity.report?.fileId
        ? [activity.report]
        : [];

  const folderOptions: SelectOption[] = useMemo(() => {
    if (!driveFolders || driveFolders.length === 0) {
      return [{ value: '', label: 'JRs (Default Root Folder)' }];
    }
    return driveFolders.map((f) => ({
      value: f.id,
      label: f.path || f.name,
      description: f.path !== f.name ? f.name : undefined,
    }));
  }, [driveFolders]);

  // Smart folder pre-selection based on activity properties
  useEffect(() => {
    if (driveFolders && driveFolders.length > 0 && !selectedFolderId) {
      const year = new Date(activity.startDate).getFullYear().toString();
      const titleLower = activity.title.toLowerCase();

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

  const handleFilesAdded = (fileList: FileList | File[]) => {
    setErrorMsg(null);
    const added: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg(
          t('activities:reportsModal.fileTooLarge', {
            name: file.name,
            defaultValue: `"${file.name}" exceeds maximum allowed limit (25 MB)`,
          }),
        );
        return;
      }
      added.push(file);
    }
    setSelectedFiles((prev) => [...prev, ...added]);
  };

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesAdded(e.target.files);
    }
    // Reset input so same file can be reselected if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMsg(
        t(
          'activities:reportsModal.selectAtLeastOne',
          'Please select at least one report file to upload',
        ),
      );
      return;
    }

    setErrorMsg(null);
    try {
      const formData = new FormData();
      for (const file of selectedFiles) {
        formData.append('files', file);
      }
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

      setSelectedFiles([]);
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
    if (!reportToDelete) return;
    try {
      await deleteMutation.mutateAsync({
        activityId: activity.id,
        fileId: reportToDelete.fileId,
      });
      setReportToDelete(null);
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Failed to remove report',
      );
    }
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FilePdf size={24} className="text-[#ba1a1a]" />;
    if (ext === 'doc' || ext === 'docx')
      return <FileDoc size={24} className="text-[#1565c0]" />;
    return <FileText size={24} className="text-[#8a726a]" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[620px] max-h-[90vh] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#f4ece9] flex items-start justify-between bg-[#fffbf9]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0">
              <HardDrives size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1e1b19]">
                {t(
                  'activities:reportsModal.title',
                  'Activity Reports & Cloud Archive',
                )}
              </h2>
              <p className="text-xs text-[#8a726a] mt-0.5 truncate max-w-sm">
                {activity.title} ({activity.town?.name})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Existing Reports Section */}
          {existingReports.length > 0 && (
            <div className="p-6 bg-[#faf2ee]/50 border-b border-[#e8e1dd] flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                {t('activities:reportsModal.syncedReports', {
                  count: existingReports.length,
                  defaultValue: `Currently Synced Reports (${existingReports.length})`,
                })}
              </span>

              <div className="flex flex-col gap-2.5 max-h-52 overflow-y-auto pr-1">
                {existingReports.map((rep) => (
                  <div
                    key={rep.fileId}
                    className="bg-white rounded-lg border border-[#e8e1dd] p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-[#b85028]/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-md bg-[#faf2ee] flex items-center justify-center shrink-0">
                        {getFileIcon(rep.filename)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-[#1e1b19] truncate">
                          {rep.filename}
                        </span>
                        <span className="text-[10px] text-[#8a726a]">
                          {rep.uploadedByName || 'Coordinator'} ·{' '}
                          {rep.uploadedAt
                            ? new Date(rep.uploadedAt).toLocaleDateString()
                            : t('activities:reportsModal.recently', 'Recently')}
                          {rep.fileSize && (
                            <> · {(rep.fileSize / 1024 / 1024).toFixed(2)} MB</>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {rep.webViewLink && (
                        <a
                          href={rep.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] text-[11px] font-bold transition-all flex items-center gap-1"
                          title="Open in Drive"
                        >
                          <span>
                            {t('activities:reportsModal.openDrive', 'Drive')}
                          </span>
                          <ArrowSquareOut size={11} />
                        </a>
                      )}
                      {isPrivileged && (
                        <button
                          type="button"
                          onClick={() => setReportToDelete(rep)}
                          className="w-7 h-7 rounded-md bg-[#ffdad6]/50 hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                          title={t(
                            'activities:reportsModal.deleteReport',
                            'Delete this report file',
                          )}
                        >
                          <Trash size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Custom Confirmation Inline Modal for deleting report file */}
              {reportToDelete && (
                <div className="p-3.5 rounded-lg bg-[#fff2ee] border border-[#ffb4ab] flex flex-col gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#ba1a1a]">
                    <WarningCircle size={16} weight="bold" />
                    <span>
                      {t('activities:reportsModal.deleteConfirmTitle', {
                        filename: reportToDelete.filename,
                        defaultValue: `Delete "${reportToDelete.filename}"?`,
                      })}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#57423b]">
                    {t(
                      'activities:reportsModal.deleteConfirmDesc',
                      'This file will be permanently removed from Google Drive and unlinked from this activity.',
                    )}
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setReportToDelete(null)}
                      className="px-3 py-1 rounded-md text-xs font-bold text-[#57423b] hover:bg-white transition-colors cursor-pointer"
                    >
                      {t('activities:reportsModal.cancel', 'Cancel')}
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      disabled={deleteMutation.isPending}
                      className="px-3 py-1 rounded-md bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a] transition-colors cursor-pointer shadow-2xs"
                    >
                      {deleteMutation.isPending
                        ? t('activities:reportsModal.deleting', 'Deleting...')
                        : t(
                            'activities:reportsModal.confirmDelete',
                            'Confirm Delete',
                          )}
                    </button>
                  </div>
                </div>
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
                  <span>
                    {t(
                      'activities:reportsModal.destFolder',
                      'Destination Google Drive Folder',
                    )}
                  </span>
                </span>
                {isFoldersLoading && (
                  <span className="text-[10px] text-[#8a726a] animate-pulse">
                    {t(
                      'activities:reportsModal.scanningFolders',
                      'Scanning folders...',
                    )}
                  </span>
                )}
              </label>
              <CustomSelect
                value={selectedFolderId}
                onChange={(val) => setSelectedFolderId(val)}
                options={folderOptions}
                variant="form"
                size="md"
                placeholder={t(
                  'activities:reportsModal.selectFolderPlaceholder',
                  'Select Destination Folder...',
                )}
              />
            </div>

            {/* Multiple File Upload Dropzone */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="activity-report-file-input"
                className="text-xs font-bold text-[#1e1b19] flex items-center justify-between"
              >
                <span>
                  {existingReports.length > 0
                    ? t(
                        'activities:reportsModal.uploadAdditional',
                        'Upload Additional Files',
                      )
                    : t(
                        'activities:reportsModal.selectReportFiles',
                        'Select Report Files',
                      )}
                </span>
                {selectedFiles.length > 0 && (
                  <span className="text-[11px] font-bold text-[#b85028]">
                    {t('activities:reportsModal.filesSelected', {
                      count: selectedFiles.length,
                      unit:
                        selectedFiles.length === 1
                          ? t('activities:reportsModal.file', 'file')
                          : t('activities:reportsModal.files', 'files'),
                      defaultValue: `${selectedFiles.length} files selected`,
                    })}
                  </span>
                )}
              </label>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  selectedFiles.length > 0
                    ? 'border-[#b85028] bg-[#fff8f5]'
                    : 'border-[#e8e1dd] hover:border-[#b85028] bg-[#faf2ee]/40'
                }`}
              >
                <input
                  id="activity-report-file-input"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-lg bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                    <CloudArrowUp size={22} weight="duotone" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#b85028]">
                      {t(
                        'activities:reportsModal.clickToChoose',
                        'Click to choose files',
                      )}
                    </span>{' '}
                    <span className="text-xs text-[#8a726a]">
                      {t(
                        'activities:reportsModal.orDragDrop',
                        'or drag & drop',
                      )}
                    </span>
                    <p className="text-[10px] text-[#8a726a] mt-0.5">
                      {t(
                        'activities:reportsModal.dropHint',
                        'Select one or multiple files: PDF, Word, Excel, or photos (up to 25MB each)',
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Selected Files Queue */}
              {selectedFiles.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                    {t(
                      'activities:reportsModal.filesToUpload',
                      'Files to upload:',
                    )}
                  </span>
                  <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                    {selectedFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="bg-white rounded-lg border border-[#e8e1dd] p-2.5 flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getFileIcon(file.name)}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs text-[#1e1b19] truncate">
                              {file.name}
                            </span>
                            <span className="text-[10px] text-[#8a726a]">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedFile(idx);
                          }}
                          className="w-6 h-6 rounded-md bg-[#faf2ee] hover:bg-[#ffdad6] text-[#8a726a] hover:text-[#ba1a1a] flex items-center justify-center cursor-pointer transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Narrative Summary */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="activity-report-summary-input"
                className="text-xs font-bold text-[#1e1b19]"
              >
                {t(
                  'activities:reportsModal.sessionNotes',
                  'Fellowship Session Notes / Summary (Optional)',
                )}
              </label>
              <textarea
                id="activity-report-summary-input"
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder={t(
                  'activities:reportsModal.sessionNotesPlaceholder',
                  'Record fellowship outcomes, key milestones, or notes for these reports...',
                )}
                className="w-full px-3.5 py-2.5 rounded-md bg-[#faf2ee]/50 border border-[#e8e1dd] text-xs text-[#1e1b19] focus:outline-none focus:border-[#b85028] transition-colors resize-none placeholder:text-[#a08a82]"
              />
            </div>

            {/* Error notice */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#ffdad6] border border-[#ffb4ab] text-xs font-bold text-[#ba1a1a] flex items-center gap-2">
                <WarningCircle size={16} weight="bold" className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-md border border-[#e8e1dd] text-xs font-bold text-[#57423b] hover:bg-[#faf2ee] transition-colors cursor-pointer"
              >
                {t('common:cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={
                  uploadMutation.isPending || selectedFiles.length === 0
                }
                className="px-5 py-2.5 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                <UploadSimple size={16} weight="bold" />
                <span>
                  {uploadMutation.isPending
                    ? t(
                        'activities:reportsModal.syncing',
                        'Syncing to Drive...',
                      )
                    : selectedFiles.length > 1
                      ? t('activities:reportsModal.uploadMultiple', {
                          count: selectedFiles.length,
                          defaultValue: `Upload ${selectedFiles.length} Reports`,
                        })
                      : t(
                          'activities:reportsModal.uploadSingle',
                          'Upload to Google Drive',
                        )}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
