import {
  type IDriveFileVaultItem,
  type IDriveFolderOption,
  useActivitiesQuery,
  useAuth,
  useCreateDriveFolderMutation,
  useDeleteDriveFileMutation,
  useDeleteDriveFolderMutation,
  useDriveFilesQuery,
  useDriveFoldersQuery,
  useRenameDriveFolderMutation,
  useTownContext,
  useTranslation,
  useUploadStandaloneDriveFilesMutation,
} from '@jrs/client-core';
import { type IActivity, UserRole } from '@jrs/shared';
import {
  ArrowSquareOut,
  CalendarBlank,
  CaretDown,
  CaretRight,
  CircleNotch,
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
  FolderPlus,
  FolderSimple,
  HardDrives,
  MagnifyingGlass,
  PencilSimple,
  Trash,
  TreeStructure,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import {
  AppSkeletonTheme,
  CustomSelect,
  type SelectOption,
} from '../../components';
import {
  DriveFilePreviewModal,
  type IDriveFilePreview,
} from '../activities/components/DriveFilePreviewModal';

interface IFolderTreeNode extends IDriveFolderOption {
  children: IFolderTreeNode[];
  level: number;
}

// Recursively flatten tree roots in depth-first order to preserve hierarchy
function flattenFolderTree(nodes: IFolderTreeNode[]): IFolderTreeNode[] {
  const list: IFolderTreeNode[] = [];
  for (const node of nodes) {
    list.push(node);
    if (node.children?.length) {
      list.push(...flattenFolderTree(node.children));
    }
  }
  return list;
}

export const DriveExplorerFeature: React.FC = () => {
  const { t } = useTranslation(['drive', 'common']);
  const { activeTown } = useTownContext();
  const { user } = useAuth();
  const isPrivileged = user?.role === UserRole.AP || user?.role === UserRole.PC;

  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<
    'ALL' | 'PDF' | 'DOC' | 'SHEET' | 'IMAGE'
  >('ALL');
  const [previewFile, setPreviewFile] = useState<IDriveFilePreview | null>(
    null,
  );

  // Expanded tree nodes
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    new Set(['root', 'ALL']),
  );

  // Standalone Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [uploadSummary, setUploadSummary] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const uploadFileInputRef = useRef<HTMLInputElement>(null);

  // Folder CRUD States
  const [folderModalState, setFolderModalState] = useState<{
    mode: 'create' | 'rename';
    folder?: IDriveFolderOption;
    parentId?: string;
  } | null>(null);
  const [folderNameInput, setFolderNameInput] = useState('');
  const [folderParentIdInput, setFolderParentIdInput] = useState('');
  const [isFolderSubmitting, setIsFolderSubmitting] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<IDriveFolderOption | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // File Deletion State
  const [deleteFileTarget, setDeleteFileTarget] =
    useState<IDriveFileVaultItem | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Mutations
  const uploadStandaloneMutation = useUploadStandaloneDriveFilesMutation();
  const deleteFileMutation = useDeleteDriveFileMutation();
  const createFolderMutation = useCreateDriveFolderMutation();
  const renameFolderMutation = useRenameDriveFolderMutation();
  const deleteFolderMutation = useDeleteDriveFolderMutation();

  // Queries
  const { data: folders = [], isLoading: isFoldersLoading } =
    useDriveFoldersQuery();
  const { data: driveVaultFiles = [], isLoading: isDriveFilesLoading } =
    useDriveFilesQuery(selectedFolderId);
  const { data: activitiesResponse, isLoading: isActivitiesLoading } =
    useActivitiesQuery({
      limit: 150,
      townId: activeTown?.id,
    });

  const activities: IActivity[] = useMemo(() => {
    return activitiesResponse?.items || [];
  }, [activitiesResponse]);

  // Combine live Drive API files with database activity reports
  const allReports: IDriveFileVaultItem[] = useMemo(() => {
    const list: IDriveFileVaultItem[] = [...driveVaultFiles];
    const existingFileIds = new Set(list.map((f) => f.fileId));

    for (const act of activities) {
      const actReports = act.reports || [];
      if (actReports.length > 0) {
        for (const rep of actReports) {
          if (!existingFileIds.has(rep.fileId)) {
            list.push({
              fileId: rep.fileId,
              filename: rep.filename,
              webViewLink: rep.webViewLink,
              fileSize: rep.fileSize,
              uploadedAt: rep.uploadedAt,
              folderId: rep.folderId,
              activityId: act.id,
              activityTitle: act.title,
              activityDate: act.startDate,
              uploadedByName: rep.uploadedByName,
              summary: rep.summary,
            });
            existingFileIds.add(rep.fileId);
          }
        }
      } else if (
        act.report?.fileId &&
        !existingFileIds.has(act.report.fileId)
      ) {
        list.push({
          fileId: act.report.fileId,
          filename: act.report.filename,
          webViewLink: act.report.webViewLink,
          fileSize: act.report.fileSize,
          uploadedAt: act.report.uploadedAt,
          folderId: act.report.folderId,
          activityId: act.id,
          activityTitle: act.title,
          activityDate: act.startDate,
          uploadedByName: act.report.uploadedByName,
          summary: act.report.summary,
        });
        existingFileIds.add(act.report.fileId);
      }
    }
    return list;
  }, [driveVaultFiles, activities]);

  // Helper: map folderId to folder path & name
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) {
      map.set(f.id, f.path || f.name);
    }
    return map;
  }, [folders]);

  // Build hierarchical tree structure from flat folder list
  const { treeRoots, allFolderDescendantsMap } = useMemo(() => {
    const folderById = new Map<string, IDriveFolderOption>();
    for (const f of folders) {
      folderById.set(f.id, f);
    }

    const childrenByParent = new Map<string, IDriveFolderOption[]>();
    const roots: IDriveFolderOption[] = [];

    for (const f of folders) {
      if (f.parentId && folderById.has(f.parentId) && f.parentId !== f.id) {
        const list = childrenByParent.get(f.parentId) || [];
        list.push(f);
        childrenByParent.set(f.parentId, list);
      } else {
        roots.push(f);
      }
    }

    const buildTree = (
      item: IDriveFolderOption,
      level: number,
    ): IFolderTreeNode => {
      const childItems = childrenByParent.get(item.id) || [];
      return {
        ...item,
        level,
        children: childItems.map((c) => buildTree(c, level + 1)),
      };
    };

    const tree = roots.map((r) => buildTree(r, 0));

    // Compute descendant folder IDs map for each folder
    const descendantsMap = new Map<string, Set<string>>();
    const getDescendants = (node: IFolderTreeNode): Set<string> => {
      const set = new Set<string>();
      for (const child of node.children) {
        set.add(child.id);
        const childDescendants = getDescendants(child);
        for (const cd of childDescendants) {
          set.add(cd);
        }
      }
      descendantsMap.set(node.id, set);
      return set;
    };

    for (const r of tree) {
      getDescendants(r);
    }

    return { treeRoots: tree, allFolderDescendantsMap: descendantsMap };
  }, [folders]);

  // Options for Create Folder Modal (Parent Folder in tree hierarchy order)
  const parentFolderOptions: SelectOption[] = useMemo(() => {
    const flatTree = flattenFolderTree(treeRoots);
    const rootId = folders[0]?.id || '';

    return flatTree.map((node) => {
      const isRoot =
        node.id === 'root' ||
        node.id === 'mock-root' ||
        node.id === rootId ||
        node.level === 0;

      return {
        value: isRoot ? '' : node.id,
        label: isRoot ? 'JRs (Root)' : node.name,
        selectedLabel: isRoot ? 'JRs (Root)' : node.path || node.name,
        description: isRoot ? 'Top-level root directory' : undefined,
        level: node.level,
        icon: isRoot ? FolderOpen : Folder,
      };
    });
  }, [treeRoots, folders]);

  // Options for Upload Files Modal (Destination Folder in tree hierarchy order)
  const uploadFolderOptions: SelectOption[] = useMemo(() => {
    const flatTree = flattenFolderTree(treeRoots);
    const rootId = folders[0]?.id || '';

    return flatTree.map((node) => {
      const isRoot =
        node.id === 'root' ||
        node.id === 'mock-root' ||
        node.id === rootId ||
        node.level === 0;

      return {
        value: isRoot ? '' : node.id,
        label: isRoot ? 'Default JRs Root Folder' : node.name,
        selectedLabel: isRoot
          ? 'Default JRs Root Folder'
          : node.path || node.name,
        description: isRoot ? 'Top-level root directory' : undefined,
        level: node.level,
        icon: isRoot ? FolderOpen : Folder,
      };
    });
  }, [treeRoots, folders]);

  // Count files per folder (including files in child subfolders)
  const fileCountsMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of folders) {
      const descendants = allFolderDescendantsMap.get(f.id) || new Set();
      const count = allReports.filter(
        (r) =>
          r.folderId === f.id || (r.folderId && descendants.has(r.folderId)),
      ).length;
      map.set(f.id, count);
    }
    return map;
  }, [folders, allReports, allFolderDescendantsMap]);

  // Toggle folder expansion
  const toggleFolderExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedFolderIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Determine allowed folder IDs for selected filter
  const targetFolderIds = useMemo(() => {
    if (selectedFolderId === 'ALL') return null;
    const set = new Set<string>([selectedFolderId]);
    const descendants = allFolderDescendantsMap.get(selectedFolderId);
    if (descendants) {
      for (const d of descendants) {
        set.add(d);
      }
    }
    return set;
  }, [selectedFolderId, allFolderDescendantsMap]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return allReports.filter((rep) => {
      if (targetFolderIds) {
        if (!rep.folderId || !targetFolderIds.has(rep.folderId)) {
          return false;
        }
      }

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = rep.filename.toLowerCase().includes(query);
        const matchesSummary =
          rep.summary?.toLowerCase().includes(query) ?? false;
        const matchesActivity =
          rep.activityTitle?.toLowerCase().includes(query) ?? false;
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
  }, [allReports, targetFolderIds, searchTerm, fileTypeFilter]);

  // Aggregate stats
  const totalSizeBytes = useMemo(() => {
    return allReports.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  }, [allReports]);

  const getFileIcon = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return <FilePdf size={22} weight="duotone" className="text-[#ba1a1a]" />;
    }
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      return <FileDoc size={22} weight="duotone" className="text-[#026aa7]" />;
    }
    if (
      lower.endsWith('.xls') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.csv')
    ) {
      return <FileXls size={22} weight="duotone" className="text-[#2c4e37]" />;
    }
    if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)$/i)) {
      return (
        <FileImage size={22} weight="duotone" className="text-[#6750a4]" />
      );
    }
    return <FileText size={22} weight="duotone" className="text-[#57423b]" />;
  };

  const isLoading =
    isActivitiesLoading || isFoldersLoading || isDriveFilesLoading;

  // Handlers for Standalone File Upload
  const handleOpenUploadModal = () => {
    setUploadFiles([]);
    setUploadSummary('');
    setUploadError(null);
    setUploadFolderId(selectedFolderId !== 'ALL' ? selectedFolderId : '');
    setIsUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      setUploadError('Please select at least one file to upload.');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);

      const formData = new FormData();
      for (const file of uploadFiles) {
        formData.append('files', file);
      }
      if (uploadFolderId) {
        formData.append('folderId', uploadFolderId);
      }
      if (uploadSummary.trim()) {
        formData.append('summary', uploadSummary.trim());
      }

      await uploadStandaloneMutation.mutateAsync({ formData });
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      setUploadSummary('');
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to upload files.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Handlers for Folder CRUD
  const handleOpenCreateFolderModal = (parentId?: string) => {
    setFolderNameInput('');
    setFolderParentIdInput(
      parentId || (selectedFolderId !== 'ALL' ? selectedFolderId : ''),
    );
    setFolderError(null);
    setFolderModalState({ mode: 'create', parentId });
  };

  const handleOpenRenameFolderModal = (folder: IDriveFolderOption) => {
    setFolderNameInput(folder.name);
    setFolderError(null);
    setFolderModalState({ mode: 'rename', folder });
  };

  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) {
      setFolderError('Folder name cannot be empty.');
      return;
    }

    try {
      setIsFolderSubmitting(true);
      setFolderError(null);

      if (folderModalState?.mode === 'create') {
        await createFolderMutation.mutateAsync({
          name: folderNameInput.trim(),
          parentId: folderParentIdInput || undefined,
        });
      } else if (
        folderModalState?.mode === 'rename' &&
        folderModalState.folder
      ) {
        await renameFolderMutation.mutateAsync({
          id: folderModalState.folder.id,
          name: folderNameInput.trim(),
        });
      }

      setFolderModalState(null);
      setFolderNameInput('');
    } catch (err: any) {
      setFolderError(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to process folder request.',
      );
    } finally {
      setIsFolderSubmitting(false);
    }
  };

  const handleDeleteFolderConfirm = async () => {
    if (!deleteFolderTarget) return;

    try {
      setIsDeletingFolder(true);
      await deleteFolderMutation.mutateAsync(deleteFolderTarget.id);
      if (selectedFolderId === deleteFolderTarget.id) {
        setSelectedFolderId('ALL');
      }
      setDeleteFolderTarget(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete folder.',
      );
    } finally {
      setIsDeletingFolder(false);
    }
  };

  // Handlers for File Deletion
  const handleDeleteFileConfirm = async () => {
    if (!deleteFileTarget) return;

    try {
      setIsDeletingFile(true);
      await deleteFileMutation.mutateAsync(deleteFileTarget.fileId);
      setDeleteFileTarget(null);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to delete file.',
      );
    } finally {
      setIsDeletingFile(false);
    }
  };

  // Render a recursive folder tree node
  const renderTreeNode = (node: IFolderTreeNode) => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedFolderIds.has(node.id);
    const isSelected = selectedFolderId === node.id;
    const count = fileCountsMap.get(node.id) || 0;
    const isRootNode =
      node.id === 'root' ||
      node.id === 'mock-root' ||
      node.id === folders[0]?.id;

    return (
      <div key={node.id} className="flex flex-col group/tree">
        <div
          style={{ paddingLeft: `${node.level * 12 + 6}px` }}
          className={`flex items-center justify-between py-1 pr-1.5 rounded-md text-xs font-semibold transition-all select-none ${
            isSelected
              ? 'bg-[#b85028] text-white shadow-2xs'
              : 'hover:bg-[#faf2ee] text-[#57423b]'
          }`}
          title={node.path || node.name}
        >
          <div className="flex items-center gap-1 min-w-0 flex-1">
            {/* Expand / Collapse Chevron */}
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleFolderExpand(node.id, e)}
                className={`p-1 rounded hover:bg-black/10 transition-transform cursor-pointer shrink-0 ${
                  isSelected ? 'text-white' : 'text-[#8a726a]'
                }`}
                title={isExpanded ? 'Collapse subfolders' : 'Expand subfolders'}
              >
                {isExpanded ? (
                  <CaretDown size={12} weight="bold" />
                ) : (
                  <CaretRight size={12} weight="bold" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            {/* Folder Select Action */}
            <button
              type="button"
              onClick={() => setSelectedFolderId(node.id)}
              className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer py-1"
            >
              {isSelected || isExpanded ? (
                <FolderOpen
                  size={15}
                  weight="fill"
                  className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#b85028]'}`}
                />
              ) : (
                <Folder
                  size={15}
                  weight="bold"
                  className={`shrink-0 ${isSelected ? 'text-white' : 'text-[#8a726a]'}`}
                />
              )}
              <span className="truncate">{node.name}</span>
            </button>
          </div>

          {/* Action buttons (Rename, Delete) & Count */}
          <div className="flex items-center gap-1 shrink-0 ml-1">
            {isPrivileged && !isRootNode && (
              <div className="opacity-0 group-hover/tree:opacity-100 transition-opacity flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenRenameFolderModal(node);
                  }}
                  className={`p-1 rounded hover:bg-black/15 transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'text-[#8a726a] hover:text-[#1e1b19]'
                  }`}
                  title="Rename folder"
                >
                  <PencilSimple size={12} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteFolderTarget(node);
                  }}
                  className={`p-1 rounded hover:bg-black/15 transition-colors cursor-pointer ${
                    isSelected
                      ? 'text-white'
                      : 'text-[#8a726a] hover:text-[#ba1a1a]'
                  }`}
                  title="Delete folder"
                >
                  <Trash size={12} weight="bold" />
                </button>
              </div>
            )}

            {count > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 font-bold ${
                  isSelected
                    ? 'bg-white/20 text-white'
                    : 'bg-[#faf2ee] text-[#8a726a]'
                }`}
              >
                {count}
              </span>
            )}
          </div>
        </div>

        {/* Recursive Children with Tree Indentation */}
        {hasChildren && isExpanded && (
          <div className="flex flex-col border-l border-[#e8e1dd]/60 ml-3.5 my-0.5">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 1. Header & KPI Metrics */}
      <div className="bg-white rounded-md border border-[#e8e1dd] shadow-xs p-5 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-[#f4ece9]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <HardDrives size={22} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold text-[#1e1b19] tracking-tight">
                  {t('drive:title', 'Google Drive File Explorer')}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#ffdbcf]/60 text-[#812901] border border-[#ffb59c]/50">
                  {t('drive:documentVault', 'Document Vault')}
                </span>
              </div>
              <p className="text-xs text-[#8a726a] mt-0.5">
                {t(
                  'drive:subtitle',
                  'Browse Google Drive folder hierarchies, inspect activity reports, and manage fellowship documents across all hubs.',
                )}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar & Direct Upload Action */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="px-3 py-1.5 rounded-md bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#486b52] animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#8a726a] uppercase tracking-wider">
                  {t('drive:metrics.documentsIndexed', 'Documents Indexed')}
                </span>
                <span className="text-xs font-bold text-[#1e1b19]">
                  {allReports.length} {t('drive:metrics.files', 'files')}
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-md bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#8a726a] uppercase tracking-wider">
                  {t('drive:metrics.totalSpace', 'Total Drive Space')}
                </span>
                <span className="text-xs font-bold text-[#b85028]">
                  {(totalSizeBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-md bg-[#faf2ee]/70 border border-[#e8e1dd] flex items-center gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] font-bold text-[#8a726a] uppercase tracking-wider">
                  {t('drive:metrics.foldersMapped', 'Folders Mapped')}
                </span>
                <span className="text-xs font-bold text-[#1e1b19]">
                  {folders.length} {t('drive:metrics.paths', 'paths')}
                </span>
              </div>
            </div>

            {isPrivileged && (
              <button
                type="button"
                onClick={handleOpenUploadModal}
                className="h-9 px-3.5 rounded-md bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ml-auto sm:ml-0"
              >
                <CloudArrowUp size={16} weight="bold" />
                <span>Upload Files</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Search & File Format Filter Bar */}
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex items-center gap-2.5 px-3 h-9 rounded-md bg-[#faf2ee] border border-[#e8e1dd] focus-within:ring-2 focus-within:ring-[#b85028]/20 focus-within:border-[#b85028] focus-within:bg-white transition-all w-full sm:w-80 md:w-96 flex-initial">
            <MagnifyingGlass
              size={15}
              weight="bold"
              className="text-[#8a726a] shrink-0"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t(
                'drive:filters.searchPlaceholder',
                'Search by file name, summary, activity, or author...',
              )}
              className="bg-transparent text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none w-full pr-6"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 text-[#8a726a] hover:text-[#1e1b19] p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X size={13} weight="bold" />
              </button>
            )}
          </div>

          {/* Type Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {(
              [
                { id: 'ALL', label: t('drive:formats.all', 'All Files') },
                { id: 'PDF', label: t('drive:formats.pdf', 'PDFs') },
                { id: 'DOC', label: t('drive:formats.doc', 'Word Docs') },
                {
                  id: 'SHEET',
                  label: t('drive:formats.sheet', 'Spreadsheets'),
                },
                { id: 'IMAGE', label: t('drive:formats.image', 'Images') },
              ] as const
            ).map((filter) => {
              const active = fileTypeFilter === filter.id;
              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setFileTypeFilter(filter.id)}
                  className={`h-9 px-3 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#b85028] text-white shadow-2xs font-bold'
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-start">
        {/* Left Column: Google Drive Hierarchy Tree */}
        <div className="lg:col-span-1 bg-white rounded-md border border-[#e8e1dd] shadow-xs p-3.5 flex flex-col gap-2.5 sticky top-20">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#f4ece9]">
            <div className="flex items-center gap-1.5">
              <TreeStructure
                size={16}
                weight="bold"
                className="text-[#b85028]"
              />
              <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                Drive Hierarchy
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              {isPrivileged && (
                <button
                  type="button"
                  onClick={() => handleOpenCreateFolderModal()}
                  className="px-2 py-0.5 rounded-md bg-[#fff2ee] hover:bg-[#ffdbcf] text-[#b85028] text-[11px] font-bold border border-[#ffdbcf] flex items-center gap-1 transition-colors cursor-pointer"
                  title="Create new Google Drive folder"
                >
                  <FolderPlus size={13} weight="bold" />
                  <span>New</span>
                </button>
              )}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd]">
                {folders.length}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 max-h-[600px] overflow-y-auto pr-1">
            {/* "All Vault Documents" Root */}
            <button
              type="button"
              onClick={() => setSelectedFolderId('ALL')}
              className={`w-full flex items-center justify-between p-2 rounded-md text-xs font-semibold text-left transition-all cursor-pointer ${
                selectedFolderId === 'ALL'
                  ? 'bg-[#b85028] text-white shadow-2xs font-bold'
                  : 'hover:bg-[#faf2ee] text-[#1e1b19]'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {selectedFolderId === 'ALL' ? (
                  <FolderOpen size={15} weight="fill" />
                ) : (
                  <FolderSimple
                    size={15}
                    weight="bold"
                    className="text-[#8a726a]"
                  />
                )}
                <span className="truncate">All Vault Documents</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded ${
                  selectedFolderId === 'ALL'
                    ? 'bg-white/20 text-white font-bold'
                    : 'bg-[#faf2ee] text-[#8a726a]'
                }`}
              >
                {allReports.length}
              </span>
            </button>

            {/* Hierarchical Folder Tree */}
            <div className="flex flex-col gap-0.5 mt-1 pt-1 border-t border-[#f4ece9]">
              {isFoldersLoading ? (
                <AppSkeletonTheme>
                  <div className="space-y-1.5 p-1">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-1"
                      >
                        <div className="flex items-center gap-2">
                          <Skeleton width={16} height={16} borderRadius={4} />
                          <Skeleton width={95} height={13} />
                        </div>
                        <Skeleton width={20} height={14} borderRadius={4} />
                      </div>
                    ))}
                  </div>
                </AppSkeletonTheme>
              ) : (
                treeRoots.map((node) => renderTreeNode(node))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Files Grid */}
        <div className="lg:col-span-3 flex flex-col gap-3.5">
          {/* Breadcrumb & Filter Status Header */}
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-xs font-medium text-[#8a726a]">
              <span>Viewing:</span>
              <span className="font-bold text-[#1e1b19]">
                {selectedFolderId === 'ALL'
                  ? 'All Vault Documents'
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
            <AppSkeletonTheme>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-md bg-white border border-[#e8e1dd] shadow-2xs flex flex-col justify-between gap-3 min-h-[160px]"
                  >
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <Skeleton width={38} height={38} borderRadius={6} />
                        <Skeleton width={75} height={18} borderRadius={4} />
                      </div>
                      <div>
                        <Skeleton width="85%" height={15} />
                        <Skeleton width="55%" height={12} className="mt-1" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2.5 border-t border-[#f4ece9]">
                      <Skeleton width={60} height={12} />
                      <Skeleton width={70} height={26} borderRadius={4} />
                    </div>
                  </div>
                ))}
              </div>
            </AppSkeletonTheme>
          ) : filteredReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredReports.map((rep) => (
                <div
                  key={`${rep.activityId || 'drive'}-${rep.fileId}`}
                  className="p-4 rounded-md bg-white border border-[#e8e1dd] hover:border-[#b85028]/40 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="w-10 h-10 rounded-md bg-[#faf2ee] flex items-center justify-center shrink-0 border border-[#e8e1dd]">
                        {getFileIcon(rep.filename)}
                      </div>

                      {rep.folderId && folderMap.has(rep.folderId) && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-[#faf2ee] text-[#8a726a] border border-[#e8e1dd] truncate max-w-[140px]">
                          {folderMap.get(rep.folderId)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4
                        className="font-bold text-xs text-[#1e1b19] line-clamp-1 group-hover:text-[#b85028] transition-colors"
                        title={rep.filename}
                      >
                        {rep.filename}
                      </h4>

                      {/* Associated Activity Badge (if attached) */}
                      {rep.activityTitle && (
                        <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#8a726a]">
                          <CalendarBlank size={12} weight="bold" />
                          <span className="truncate font-semibold text-[#57423b]">
                            {rep.activityTitle}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-1 text-[11px] text-[#8a726a] flex-wrap mt-1">
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
                      <div className="p-2.5 rounded-md bg-[#faf2ee]/40 border border-[#f4ece9] text-[11px] text-[#57423b] leading-relaxed line-clamp-2">
                        {rep.summary}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 pt-2.5 border-t border-[#f4ece9]">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewFile({
                          fileId: rep.fileId,
                          filename: rep.filename,
                          mimeType: rep.mimeType,
                          webViewLink: rep.webViewLink,
                          fileSize: rep.fileSize,
                          uploadedAt: rep.uploadedAt,
                          uploadedByName: rep.uploadedByName,
                        })
                      }
                      className="flex-1 py-1.5 px-3 rounded-md bg-[#b85028] hover:bg-[#9c421f] text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                    >
                      <Eye size={14} weight="bold" />
                      <span>Preview</span>
                    </button>

                    {rep.webViewLink && (
                      <button
                        type="button"
                        onClick={() => {
                          const target = rep.webViewLink;
                          if (!target) return;
                          openUrl(target).catch(() => {
                            window.open(
                              target,
                              '_blank',
                              'noopener,noreferrer',
                            );
                          });
                        }}
                        className="p-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                        title="Open in Google Drive (External Browser)"
                      >
                        <ArrowSquareOut size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const target = `http://localhost:3500/api/activities/report/drive-file/${rep.fileId}/download`;
                        openUrl(target).catch(() => {
                          window.open(target, '_blank', 'noopener,noreferrer');
                        });
                      }}
                      className="p-1.5 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] border border-[#e8e1dd] text-[#1e1b19] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                      title="Download file"
                    >
                      <DownloadSimple size={15} />
                    </button>

                    {isPrivileged && (
                      <button
                        type="button"
                        onClick={() => setDeleteFileTarget(rep)}
                        className="p-1.5 rounded-md bg-[#faf2ee] hover:bg-[#ffebeb] border border-[#e8e1dd] hover:border-[#ffb4ab] text-[#ba1a1a] transition-all flex items-center justify-center shadow-2xs cursor-pointer"
                        title="Delete document from Drive"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-md bg-white border border-[#e8e1dd] shadow-xs flex flex-col items-center justify-center text-center gap-2.5">
              <div className="w-10 h-10 rounded-md bg-[#faf2ee] text-[#b85028] flex items-center justify-center">
                <CloudArrowUp size={24} weight="duotone" />
              </div>
              <h4 className="text-sm font-bold text-[#1e1b19]">
                No Documents Found
              </h4>
              <p className="text-xs text-[#8a726a] max-w-sm">
                No activity reports or Google Drive documents match the selected
                folder or search query.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4. Standalone File Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-[#e8e1dd] shadow-lg max-w-lg w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-[#fff2ee] text-[#b85028] flex items-center justify-center">
                  <CloudArrowUp size={20} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1e1b19]">
                    Upload Files to Google Drive
                  </h3>
                  <p className="text-xs text-[#8a726a]">
                    Add past activity reports or fellowship archives directly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-md bg-[#ffdad6]/40 border border-[#ffb4ab] text-xs text-[#ba1a1a] flex items-center gap-2">
                <WarningCircle size={16} weight="bold" className="shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              {/* Destination Folder Selector */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-destination-folder"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Destination Google Drive Folder
                </label>
                <CustomSelect
                  id="upload-destination-folder"
                  value={uploadFolderId}
                  onChange={(val) => setUploadFolderId(val)}
                  options={uploadFolderOptions}
                  placeholder="Select destination folder..."
                  variant="form"
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* File Dropzone / Picker */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-files-input"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Files to Upload
                </label>
                <input
                  id="upload-files-input"
                  ref={uploadFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      setUploadFiles(Array.from(e.target.files));
                    }
                  }}
                />

                <div
                  onClick={() => uploadFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#e8e1dd] hover:border-[#b85028] rounded-md p-5 flex flex-col items-center justify-center gap-2 text-center bg-[#faf2ee]/50 hover:bg-[#fff2ee]/40 transition-colors cursor-pointer"
                >
                  <UploadSimple
                    size={28}
                    weight="duotone"
                    className="text-[#b85028]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#b85028]">
                      Click to browse files
                    </span>{' '}
                    <span className="text-xs text-[#8a726a]">
                      or select multiple documents
                    </span>
                  </div>
                  <span className="text-[10px] text-[#8a726a]">
                    Supports PDF, Word (.docx), Excel (.xlsx), Images (max 25MB
                    each)
                  </span>
                </div>

                {/* Selected Files List */}
                {uploadFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-2 max-h-36 overflow-y-auto">
                    {uploadFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(f.name)}
                          <span className="truncate font-semibold text-[#1e1b19]">
                            {f.name}
                          </span>
                          <span className="text-[10px] text-[#8a726a] shrink-0">
                            ({(f.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="p-1 rounded text-[#8a726a] hover:text-[#ba1a1a] cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Summary */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-summary-notes"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Summary / Archival Notes (Optional)
                </label>
                <textarea
                  id="upload-summary-notes"
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  placeholder="e.g. Minutes and resolutions from the national leadership retreat..."
                  rows={2}
                  className="p-2.5 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-semibold text-[#57423b] border border-[#e8e1dd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="px-4 py-2 rounded-md bg-[#b85028] hover:bg-[#9c421f] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isUploading && (
                    <CircleNotch size={14} className="animate-spin" />
                  )}
                  <span>
                    Upload {uploadFiles.length > 0 ? uploadFiles.length : ''}{' '}
                    {uploadFiles.length === 1 ? 'File' : 'Files'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Create / Rename Folder Modal */}
      {folderModalState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-[#e8e1dd] shadow-lg max-w-md w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#f4ece9]">
              <div className="flex items-center gap-2">
                <FolderPlus
                  size={20}
                  weight="duotone"
                  className="text-[#b85028]"
                />
                <h3 className="text-base font-bold text-[#1e1b19]">
                  {folderModalState.mode === 'create'
                    ? 'Create New Google Drive Folder'
                    : 'Rename Folder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderModalState(null)}
                className="p-1 rounded-md text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {folderError && (
              <div className="p-3 rounded-md bg-[#ffdad6]/40 border border-[#ffb4ab] text-xs text-[#ba1a1a] flex items-center gap-2">
                <WarningCircle size={16} weight="bold" className="shrink-0" />
                <span>{folderError}</span>
              </div>
            )}

            <form onSubmit={handleFolderSubmit} className="flex flex-col gap-4">
              {folderModalState.mode === 'create' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="create-folder-parent"
                    className="text-xs font-bold text-[#57423b]"
                  >
                    Parent Folder
                  </label>
                  <CustomSelect
                    id="create-folder-parent"
                    value={folderParentIdInput}
                    onChange={(val) => setFolderParentIdInput(val)}
                    options={parentFolderOptions}
                    placeholder="Select parent folder..."
                    variant="form"
                    size="sm"
                    className="w-full"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="create-folder-name"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Folder Name
                </label>
                <input
                  id="create-folder-name"
                  type="text"
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="e.g. 2026 Retreats"
                  className="h-9 px-3 rounded-md bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] outline-none focus:border-[#b85028]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setFolderModalState(null)}
                  className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-semibold text-[#57423b] border border-[#e8e1dd] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFolderSubmitting || !folderNameInput.trim()}
                  className="px-4 py-2 rounded-md bg-[#b85028] hover:bg-[#9c421f] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  {isFolderSubmitting && (
                    <CircleNotch size={14} className="animate-spin" />
                  )}
                  <span>
                    {folderModalState.mode === 'create'
                      ? 'Create Folder'
                      : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Delete Folder Confirmation Modal */}
      {deleteFolderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-[#e8e1dd] shadow-lg max-w-sm w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <Trash size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1e1b19]">
                  Delete Folder?
                </h3>
                <p className="text-xs text-[#8a726a]">
                  This action removes the folder from Google Drive
                </p>
              </div>
            </div>

            <p className="text-xs text-[#57423b] leading-relaxed">
              Are you sure you want to delete folder{' '}
              <strong className="text-[#1e1b19]">
                "{deleteFolderTarget.name}"
              </strong>
              ? Subfolders and files inside may also be affected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4ece9]">
              <button
                type="button"
                onClick={() => setDeleteFolderTarget(null)}
                className="px-3.5 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-semibold text-[#57423b] border border-[#e8e1dd] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFolderConfirm}
                disabled={isDeletingFolder}
                className="px-4 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isDeletingFolder && (
                  <CircleNotch size={14} className="animate-spin" />
                )}
                <span>Delete Folder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete File Confirmation Modal */}
      {deleteFileTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-md border border-[#e8e1dd] shadow-lg max-w-sm w-full p-6 flex flex-col gap-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <Trash size={22} weight="duotone" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1e1b19]">
                  Delete Document?
                </h3>
                <p className="text-xs text-[#8a726a]">
                  Remove file from Google Drive & report index
                </p>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#faf2ee] border border-[#e8e1dd] flex flex-col gap-1">
              <span className="text-xs font-bold text-[#1e1b19] line-clamp-2">
                {deleteFileTarget.filename}
              </span>
              {deleteFileTarget.activityTitle && (
                <span className="text-[11px] text-[#8a726a]">
                  Activity: {deleteFileTarget.activityTitle}
                </span>
              )}
            </div>

            <p className="text-xs text-[#57423b] leading-relaxed">
              Are you sure you want to delete this document? If it is attached
              to an activity report, it will also be unlinked. This action
              cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#f4ece9]">
              <button
                type="button"
                onClick={() => setDeleteFileTarget(null)}
                className="px-3.5 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-semibold text-[#57423b] border border-[#e8e1dd] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteFileConfirm}
                disabled={isDeletingFile}
                className="px-4 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                {isDeletingFile && (
                  <CircleNotch size={14} className="animate-spin" />
                )}
                <span>Delete File</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Document In-App Preview Modal */}
      <DriveFilePreviewModal
        isOpen={Boolean(previewFile)}
        onClose={() => setPreviewFile(null)}
        file={previewFile}
      />
    </div>
  );
};
