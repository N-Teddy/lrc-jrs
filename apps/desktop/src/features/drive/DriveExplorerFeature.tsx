import {
  useActivitiesQuery,
  useDriveFoldersQuery,
  useTownContext,
} from '@jrs/client-core';
import type { IActivity, IActivityReport } from '@jrs/shared';
import {
  ArrowSquareOut,
  CalendarBlank,
  CloudArrowUp,
  DownloadSimple,
  Eye,
  FileDoc,
  FileImage,
  FilePdf,
  FileText,
  FileXls,
  Folder,
  FolderOpen,
  FolderSimple,
  HardDrives,
  MagnifyingGlass,
  TreeStructure,
  X,
} from '@phosphor-icons/react';
import type React from 'react';
import { useMemo, useState } from 'react';
import {
  DriveFilePreviewModal,
  type IDriveFilePreview,
} from '../activities/components/DriveFilePreviewModal';

interface IIndexedReport extends IActivityReport {
  activityId: string;
  activityTitle: string;
  activityDate: string;
}

export const DriveExplorerFeature: React.FC = () => {
  const { activeTown } = useTownContext();
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<
    'ALL' | 'PDF' | 'DOC' | 'SHEET' | 'IMAGE'
  >('ALL');
  const [previewFile, setPreviewFile] = useState<IDriveFilePreview | null>(
    null,
  );

  // Queries
  const { data: folders = [], isLoading: isFoldersLoading } =
    useDriveFoldersQuery();
  const { data: activitiesResponse, isLoading: isActivitiesLoading } =
    useActivitiesQuery({
      limit: 150,
      townId: activeTown?.id,
    });

  const activities: IActivity[] = useMemo(() => {
    return activitiesResponse?.items || [];
  }, [activitiesResponse]);

  // Flatten and index all reports across activities
  const allReports: IIndexedReport[] = useMemo(() => {
    const list: IIndexedReport[] = [];
    for (const act of activities) {
      const actReports = act.reports || [];
      if (actReports.length > 0) {
        for (const rep of actReports) {
          list.push({
            ...rep,
            activityId: act.id,
            activityTitle: act.title,
            activityDate: act.startDate,
          });
        }
      } else if (act.report?.fileId) {
        list.push({
          ...act.report,
          activityId: act.id,
          activityTitle: act.title,
          activityDate: act.startDate,
        });
      }
    }
    return list;
  }, [activities]);

  // Helper: map folderId to folder path
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) {
      map.set(f.id, f.path || f.name);
    }
    return map;
  }, [folders]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allReports.filter((rep) => {
      // 1. Folder match
      if (selectedFolderId !== 'ALL') {
        if (rep.folderId !== selectedFolderId) return false;
      }

      // 2. Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = rep.filename.toLowerCase().includes(query);
        const matchesSummary =
          rep.summary?.toLowerCase().includes(query) ?? false;
        const matchesActivity = rep.activityTitle.toLowerCase().includes(query);
        const matchesUploader =
          rep.uploadedByName?.toLowerCase().includes(query) ?? false;
        if (
          !matchesName &&
          !matchesSummary &&
          !matchesActivity &&
          !matchesUploader
        ) {
          return false;
        }
      }

      // 3. File type match
      if (fileTypeFilter !== 'ALL') {
        const lower = rep.filename.toLowerCase();
        if (fileTypeFilter === 'PDF' && !lower.endsWith('.pdf')) return false;
        if (
          fileTypeFilter === 'DOC' &&
          !lower.endsWith('.doc') &&
          !lower.endsWith('.docx')
        )
          return false;
        if (
          fileTypeFilter === 'SHEET' &&
          !lower.endsWith('.xls') &&
          !lower.endsWith('.xlsx') &&
          !lower.endsWith('.csv')
        )
          return false;
        if (
          fileTypeFilter === 'IMAGE' &&
          !lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)
        )
          return false;
      }

      return true;
    });
  }, [allReports, selectedFolderId, searchTerm, fileTypeFilter]);

  // Aggregate stats
  const totalSizeBytes = useMemo(() => {
    return allReports.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  }, [allReports]);

  const getFileIcon = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return <FilePdf size={24} weight="duotone" className="text-[#ba1a1a]" />;
    }
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      return <FileDoc size={24} weight="duotone" className="text-[#026aa7]" />;
    }
    if (
      lower.endsWith('.xls') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.csv')
    ) {
      return <FileXls size={24} weight="duotone" className="text-[#2c4e37]" />;
    }
    if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
      return (
        <FileImage size={24} weight="duotone" className="text-[#6750a4]" />
      );
    }
    return <FileText size={24} weight="duotone" className="text-[#57423b]" />;
  };

  const isLoading = isActivitiesLoading || isFoldersLoading;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Header & KPI Metrics */}
      <div className="bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-6 sm:p-8 flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#f4ece9]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <HardDrives size={28} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#1e1b19] tracking-tight">
                  Google Drive File Explorer
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#ffdbcf]/60 text-[#812901] border border-[#ffb59c]/50">
                  Document Vault
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#8a726a] mt-1">
                Browse Google Drive folder hierarchies, inspect activity
                reports, and preview fellowship documents across all hubs.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-2.5 rounded-2xl bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#486b52] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Documents Indexed
                </span>
                <span className="text-sm font-black text-[#1e1b19]">
                  {allReports.length} files
                </span>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Total Drive Space
                </span>
                <span className="text-sm font-black text-[#b85028]">
                  {(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
                  Folders Mapped
                </span>
                <span className="text-sm font-black text-[#1e1b19]">
                  {folders.length} paths
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Search & File Format Filter Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlass
              size={18}
              weight="bold"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a726a]"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by file name, summary, activity, or author..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#faf2ee]/50 border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] focus:outline-none focus:border-[#b85028] focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8a726a] hover:text-[#1e1b19] p-0.5"
              >
                <X size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'ALL', label: 'All Files' },
                { id: 'PDF', label: 'PDFs' },
                { id: 'DOC', label: 'Word Docs' },
                { id: 'SHEET', label: 'Spreadsheets' },
                { id: 'IMAGE', label: 'Images' },
              ] as const
            ).map((filter) => {
              const active = fileTypeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFileTypeFilter(filter.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#b85028] text-white shadow-2xs'
                      : 'bg-[#faf2ee] hover:bg-[#f4ece9] text-[#57423b] border border-[#e8e1dd]'
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Main Workspace: Split View with Folder Tree & Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left Column: Google Drive Hierarchy Tree */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-[#e8e1dd] shadow-xs p-5 flex flex-col gap-3 sticky top-20">
          <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
            <div className="flex items-center gap-2">
              <TreeStructure
                size={18}
                weight="bold"
                className="text-[#b85028]"
              />
              <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                Drive Hierarchy
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd]">
              {folders.length}
            </span>
          </div>

          <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto pr-1">
            {/* "All Documents" Root */}
            <button
              type="button"
              onClick={() => setSelectedFolderId('ALL')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                selectedFolderId === 'ALL'
                  ? 'bg-[#b85028] text-white shadow-2xs'
                  : 'hover:bg-[#faf2ee] text-[#1e1b19]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedFolderId === 'ALL' ? (
                  <FolderOpen size={16} weight="fill" />
                ) : (
                  <Folder size={16} weight="bold" className="text-[#8a726a]" />
                )}
                <span className="truncate">All Documents</span>
              </div>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-md ${
                  selectedFolderId === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#faf2ee] text-[#8a726a]'
                }`}
              >
                {allReports.length}
              </span>
            </button>

            {/* Subfolders */}
            {folders.map((f) => {
              const count = allReports.filter(
                (r) => r.folderId === f.id,
              ).length;
              const isSelected = selectedFolderId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedFolderId(f.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#b85028] text-white shadow-2xs'
                      : 'hover:bg-[#faf2ee] text-[#57423b]'
                  }`}
                  title={f.path || f.name}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isSelected ? (
                      <FolderOpen size={16} weight="fill" />
                    ) : (
                      <FolderSimple
                        size={16}
                        weight="bold"
                        className="text-[#8a726a]"
                      />
                    )}
                    <span className="truncate text-left">{f.name}</span>
                  </div>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-[#faf2ee] text-[#8a726a]'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Files Grid */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Breadcrumb & Filter Status Header */}
          <div className="flex items-center justify-between gap-4 px-2">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8a726a]">
              <span>Viewing:</span>
              <span className="font-bold text-[#1e1b19]">
                {selectedFolderId === 'ALL'
                  ? 'All Documents'
                  : folderMap.get(selectedFolderId) || 'Selected Folder'}
              </span>
              <span>•</span>
              <span>
                {filteredReports.length}{' '}
                {filteredReports.length === 1 ? 'file' : 'files'}
              </span>
            </div>

            {selectedFolderId !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedFolderId('ALL')}
                className="text-xs font-bold text-[#b85028] hover:underline cursor-pointer"
              >
                Clear Folder Filter
              </button>
            )}
          </div>

          {/* Grid of Files */}
          {isLoading ? (
            <div className="p-16 rounded-3xl bg-white border border-[#e8e1dd] flex flex-col items-center justify-center text-center gap-3">
              <div className="w-10 h-10 border-3 border-[#b85028] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#8a726a]">
                Indexing Google Drive vault...
              </span>
            </div>
          ) : filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map((rep) => (
                <div
                  key={`${rep.activityId}-${rep.fileId}`}
                  className="p-5 rounded-2xl bg-white border border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#faf2ee] flex items-center justify-center shrink-0 border border-[#e8e1dd]">
                        {getFileIcon(rep.filename)}
                      </div>

                      {rep.folderId && folderMap.has(rep.folderId) && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd] truncate max-w-[140px]">
                          {folderMap.get(rep.folderId)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4
                        className="font-bold text-sm text-[#1e1b19] line-clamp-1 group-hover:text-[#b85028] transition-colors"
                        title={rep.filename}
                      >
                        {rep.filename}
                      </h4>

                      {/* Associated Activity Badge */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#8a726a]">
                        <CalendarBlank size={13} weight="bold" />
                        <span className="truncate font-semibold text-[#57423b]">
                          {rep.activityTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] text-[#8a726a] flex-wrap mt-1">
                        <span>{rep.uploadedByName || 'Coordinator'}</span>
                        <span>•</span>
                        <span>
                          {rep.uploadedAt
                            ? new Date(rep.uploadedAt).toLocaleDateString()
                            : 'Recently'}
                        </span>
                        {rep.fileSize && (
                          <>
                            <span>•</span>
                            <span>
                              {(rep.fileSize / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {rep.summary && (
                      <div className="p-3 rounded-xl bg-[#faf2ee]/40 border border-[#f4ece9] text-xs text-[#57423b] leading-relaxed line-clamp-2">
                        {rep.summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#f4ece9]">
                    <button
                      type="button"
                      onClick={() => setPreviewFile(rep)}
                      className="flex-1 py-2 px-3.5 rounded-xl bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <Eye size={15} weight="bold" />
                      <span>Preview</span>
                    </button>

                    {rep.webViewLink && (
                      <a
                        href={rep.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs"
                        title="Open in Google Drive"
                      >
                        <ArrowSquareOut size={16} />
                      </a>
                    )}

                    <a
                      href={`https://drive.google.com/uc?export=download&id=${rep.fileId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-xl bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs"
                      title="Download file"
                    >
                      <DownloadSimple size={16} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-16 rounded-3xl bg-white border border-[#e8e1dd] shadow-xs flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                <CloudArrowUp size={28} weight="duotone" />
              </div>
              <h4 className="text-base font-bold text-[#1e1b19]">
                No Documents Found
              </h4>
              <p className="text-xs text-[#8a726a] max-w-sm">
                No activity reports match the selected folder or search query.
                Try choosing another folder or clearing search filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Document In-App Preview Modal */}
      <DriveFilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
