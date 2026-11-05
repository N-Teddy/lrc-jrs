import {
  ErrorService,
  type IDriveFileVaultItem,
  type IDriveFolderOption,
  toast,
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
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowSquareOut,
  ArrowsClockwise,
  CalendarBlank,
  CaretRight,
  CircleNotch,
  CloudArrowUp,
  Eye,
  FileDoc,
  FileImage,
  FilePdf,
  FileText,
  FileXls,
  FileZip,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderSimplePlus,
  HardDrives,
  ListBullets,
  MagnifyingGlass,
  PencilSimple,
  SquaresFour,
  Trash,
  UploadSimple,
  X,
} from '@phosphor-icons/react';
import { openUrl } from '@tauri-apps/plugin-opener';
import type React from 'react';
import { useMemo, useRef, useState } from 'react';
import Skeleton from 'react-loading-skeleton';
import emptyDriveImg from '../../assets/illustrations/empty-drive.jpg';
import {
  AppSkeletonTheme,
  CustomSelect,
  EmptyState,
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

  // Selected folder ('ALL' = entire vault, or folder ID)
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<
    'ALL' | 'PDF' | 'DOC' | 'SHEET' | 'IMAGE'
  >('ALL');
  const [sortBy, setSortBy] = useState<
    'date_desc' | 'date_asc' | 'name_asc' | 'size_desc'
  >('date_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(false);

  const [previewFile, setPreviewFile] = useState<IDriveFilePreview | null>(
    null,
  );

  // Drag and drop state
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Standalone Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadFolderId, setUploadFolderId] = useState<string>('');
  const [uploadSummary, setUploadSummary] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
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

  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<IDriveFolderOption | null>(null);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);

  // File Deletion State
  const [deleteFileTarget, setDeleteFileTarget] =
    useState<IDriveFileVaultItem | null>(null);
  const [isDeletingFile, setIsDeletingFile] = useState(false);

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mutations
  const uploadStandaloneMutation = useUploadStandaloneDriveFilesMutation();
  const deleteFileMutation = useDeleteDriveFileMutation();
  const createFolderMutation = useCreateDriveFolderMutation();
  const renameFolderMutation = useRenameDriveFolderMutation();
  const deleteFolderMutation = useDeleteDriveFolderMutation();

  // Queries (fetch all vault files once to enable fast, flicker-free tree navigation)
  const {
    data: folders = [],
    isLoading: isFoldersLoading,
    refetch: refetchFolders,
  } = useDriveFoldersQuery();

  const {
    data: driveVaultFiles = [],
    isLoading: isDriveFilesLoading,
    refetch: refetchDriveFiles,
  } = useDriveFilesQuery();

  const { data: activitiesResponse } = useActivitiesQuery({
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

  // Folder lookup maps
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of folders) {
      map.set(f.id, f.name);
    }
    return map;
  }, [folders]);

  const folderDetailMap = useMemo(() => {
    const map = new Map<string, IDriveFolderOption>();
    for (const f of folders) {
      map.set(f.id, f);
    }
    return map;
  }, [folders]);

  // Build recursive tree and descendant folder lookup
  const { treeRoots, allFolderDescendantsMap } = useMemo(() => {
    const childrenMap = new Map<string, IDriveFolderOption[]>();
    const rootNodes: IDriveFolderOption[] = [];

    const rootFolderId = folders[0]?.id;

    for (const f of folders) {
      if (
        !f.parentId ||
        f.parentId === 'root' ||
        f.parentId === 'mock-root' ||
        f.id === rootFolderId
      ) {
        rootNodes.push(f);
      } else {
        const list = childrenMap.get(f.parentId) || [];
        list.push(f);
        childrenMap.set(f.parentId, list);
      }
    }

    const buildTree = (
      node: IDriveFolderOption,
      level = 0,
    ): IFolderTreeNode => {
      const directChildren = childrenMap.get(node.id) || [];
      return {
        ...node,
        level,
        children: directChildren.map((child) => buildTree(child, level + 1)),
      };
    };

    const tree = rootNodes.map((r) => buildTree(r, 0));

    // Map each folder ID to all its recursive descendant folder IDs
    const descendantsMap = new Map<string, Set<string>>();
    const getDescendants = (node: IFolderTreeNode): Set<string> => {
      const set = new Set<string>();
      if (node.children?.length) {
        for (const c of node.children) {
          set.add(c.id);
          const childDesc = getDescendants(c);
          for (const d of childDesc) {
            set.add(d);
          }
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
        label: isRoot ? 'JRS (Root)' : node.name,
        selectedLabel: isRoot ? 'JRS (Root)' : node.path || node.name,
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
        label: isRoot ? 'Default JRS Root Folder' : node.name,
        selectedLabel: isRoot
          ? 'Default JRS Root Folder'
          : node.path || node.name,
        description: isRoot ? 'Base vault directory' : undefined,
        level: node.level,
        icon: isRoot ? FolderOpen : Folder,
      };
    });
  }, [treeRoots, folders]);

  // Identify the root vault folder (mock-root, root, or folders[0])
  const rootFolder = useMemo(() => {
    return (
      folders.find(
        (f) =>
          !f.parentId ||
          f.parentId === 'root' ||
          f.parentId === 'mock-root' ||
          f.id === 'mock-root' ||
          f.id === 'root',
      ) || folders[0]
    );
  }, [folders]);

  // Direct subfolders of the currently selected folder
  const directSubfolders: IDriveFolderOption[] = useMemo(() => {
    if (
      selectedFolderId === 'ALL' ||
      (rootFolder && selectedFolderId === rootFolder.id)
    ) {
      return folders.filter((f) => {
        if (rootFolder && f.id === rootFolder.id) return false;
        return (
          !f.parentId ||
          f.parentId === 'root' ||
          f.parentId === 'mock-root' ||
          (rootFolder && f.parentId === rootFolder.id)
        );
      });
    }
    return folders.filter((f) => f.parentId === selectedFolderId);
  }, [selectedFolderId, folders, rootFolder]);

  // Count documents in each folder (direct or descendant)
  const folderCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const report of allReports) {
      if (report.folderId) {
        counts.set(report.folderId, (counts.get(report.folderId) || 0) + 1);
      }
    }
    return counts;
  }, [allReports]);

  // Calculate total documents inside a folder AND its descendant child folders
  const getAggregatedDocumentCount = (folderId: string): number => {
    const directCount = folderCounts.get(folderId) || 0;
    const descendants = allFolderDescendantsMap.get(folderId);
    if (!descendants) return directCount;
    let total = directCount;
    for (const descId of descendants) {
      total += folderCounts.get(descId) || 0;
    }
    return total;
  };

  // Determine allowed folder IDs for selected filter
  const targetFolderIds = useMemo(() => {
    if (
      selectedFolderId === 'ALL' ||
      (rootFolder && selectedFolderId === rootFolder.id)
    ) {
      return null;
    }
    if (searchTerm.trim() || includeSubfolders) {
      const set = new Set<string>([selectedFolderId]);
      const descendants = allFolderDescendantsMap.get(selectedFolderId);
      if (descendants) {
        for (const d of descendants) {
          set.add(d);
        }
      }
      return set;
    }
    return new Set<string>([selectedFolderId]);
  }, [
    selectedFolderId,
    rootFolder,
    allFolderDescendantsMap,
    searchTerm,
    includeSubfolders,
  ]);

  // Breadcrumb Trail for selected folder
  const breadcrumbTrail = useMemo(() => {
    if (
      selectedFolderId === 'ALL' ||
      (rootFolder && selectedFolderId === rootFolder.id)
    ) {
      return [{ id: 'ALL', name: t('drive:documentVault', 'Drive Vault') }];
    }
    const trail: { id: string; name: string }[] = [];
    let currId: string | undefined = selectedFolderId;
    const visited = new Set<string>();

    while (
      currId &&
      currId !== 'root' &&
      currId !== 'mock-root' &&
      currId !== rootFolder?.id &&
      !visited.has(currId)
    ) {
      visited.add(currId);
      const f = folderDetailMap.get(currId);
      if (f) {
        trail.unshift({ id: f.id, name: f.name });
        currId = f.parentId;
      } else {
        break;
      }
    }
    trail.unshift({
      id: 'ALL',
      name: t('drive:documentVault', 'Drive Vault'),
    });
    return trail;
  }, [selectedFolderId, folderDetailMap, rootFolder, t]);

  // Filtered and sorted reports
  const filteredReports = useMemo(() => {
    let result = allReports.filter((rep) => {
      // 1. Target Folder & Descendants Filter
      if (targetFolderIds) {
        if (!rep.folderId || !targetFolderIds.has(rep.folderId)) {
          return false;
        }
      }

      // 2. Search Filter
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

      // 3. File Type Filter
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
          !lower.endsWith('.jpg') &&
          !lower.endsWith('.jpeg') &&
          !lower.endsWith('.png') &&
          !lower.endsWith('.webp')
        )
          return false;
      }

      return true;
    });

    // 4. Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'date_desc') {
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        return bTime - aTime;
      }
      if (sortBy === 'date_asc') {
        const aTime = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const bTime = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return aTime - bTime;
      }
      if (sortBy === 'name_asc') {
        return a.filename.localeCompare(b.filename);
      }
      if (sortBy === 'size_desc') {
        return (b.fileSize || 0) - (a.fileSize || 0);
      }
      return 0;
    });

    return result;
  }, [allReports, targetFolderIds, searchTerm, fileTypeFilter, sortBy]);

  // Overall statistics
  const totalSizeBytes = useMemo(() => {
    return allReports.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  }, [allReports]);

  const currentFolderSizeBytes = useMemo(() => {
    return filteredReports.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
  }, [filteredReports]);

  // Helper to open file preview
  const handlePreview = (rep: IDriveFileVaultItem) => {
    setPreviewFile({
      fileId: rep.fileId,
      filename: rep.filename,
      webViewLink: rep.webViewLink,
      fileSize: rep.fileSize,
      uploadedAt: rep.uploadedAt,
    });
  };

  // Helper to open link in system browser
  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to get file type icon & color
  const getFileIconConfig = (filename: string) => {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.pdf')) {
      return {
        icon: FilePdf,
        color: 'text-[#ba1a1a]',
        bg: 'bg-[#ffdad6]/60',
        border: 'border-[#ffb4a8]',
        badge: 'PDF',
      };
    }
    if (lower.endsWith('.doc') || lower.endsWith('.docx')) {
      return {
        icon: FileDoc,
        color: 'text-[#005ea2]',
        bg: 'bg-[#e7f6f8]',
        border: 'border-[#bfe1f6]',
        badge: 'DOCX',
      };
    }
    if (
      lower.endsWith('.xls') ||
      lower.endsWith('.xlsx') ||
      lower.endsWith('.csv')
    ) {
      return {
        icon: FileXls,
        color: 'text-[#2c4e37]',
        bg: 'bg-[#c2e9ca]/60',
        border: 'border-[#a9d0b2]',
        badge: 'SHEET',
      };
    }
    if (
      lower.endsWith('.jpg') ||
      lower.endsWith('.jpeg') ||
      lower.endsWith('.png') ||
      lower.endsWith('.webp')
    ) {
      return {
        icon: FileImage,
        color: 'text-[#6f42c1]',
        bg: 'bg-[#f3e8ff]',
        border: 'border-[#e9d5ff]',
        badge: 'IMG',
      };
    }
    if (lower.endsWith('.zip') || lower.endsWith('.rar')) {
      return {
        icon: FileZip,
        color: 'text-[#812901]',
        bg: 'bg-[#ffdbcf]',
        border: 'border-[#ffb59c]',
        badge: 'ZIP',
      };
    }
    return {
      icon: FileText,
      color: 'text-[#8a726a]',
      bg: 'bg-[#faf2ee]',
      border: 'border-[#e8e1dd]',
      badge: 'DOC',
    };
  };

  // Refresh Sync Handler
  const handleRefreshSync = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchDriveFiles(), refetchFolders()]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Open standalone upload modal
  const handleOpenUploadModal = (targetFId?: string) => {
    const dest =
      targetFId || (selectedFolderId !== 'ALL' ? selectedFolderId : '');
    setUploadFolderId(dest);
    setUploadFiles([]);
    setUploadSummary('');
    setIsUploadModalOpen(true);
  };

  // Open create folder modal
  const handleOpenCreateFolderModal = (parentId?: string) => {
    setFolderModalState({
      mode: 'create',
      parentId:
        parentId || (selectedFolderId !== 'ALL' ? selectedFolderId : ''),
    });
    setFolderNameInput('');
    setFolderParentIdInput(
      parentId || (selectedFolderId !== 'ALL' ? selectedFolderId : ''),
    );
  };

  // Open rename folder modal
  const handleOpenRenameFolderModal = (folder: IDriveFolderOption) => {
    setFolderModalState({
      mode: 'rename',
      folder,
    });
    setFolderNameInput(folder.name);
    setFolderParentIdInput(folder.parentId || '');
  };

  // Drag and Drop files upload handler
  const handleDropFiles = (files: File[]) => {
    if (files.length === 0) return;
    setUploadFiles(files);
    setUploadFolderId(selectedFolderId !== 'ALL' ? selectedFolderId : '');
    setUploadSummary('');
    setIsUploadModalOpen(true);
  };

  // Submit standalone file upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadFiles.length === 0) {
      toast.error('Please select at least one file to upload.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      for (const f of uploadFiles) {
        formData.append('files', f);
      }
      if (uploadFolderId) {
        formData.append('folderId', uploadFolderId);
      }
      if (uploadSummary.trim()) {
        formData.append('summary', uploadSummary.trim());
      }

      await uploadStandaloneMutation.mutateAsync({ formData });
      toast.success('Files uploaded to Google Drive successfully.');
      setIsUploadModalOpen(false);
      setUploadFiles([]);
      setUploadSummary('');
    } catch (err: any) {
      ErrorService.handle(err);
    } finally {
      setIsUploading(false);
    }
  };

  // Submit folder create or rename
  const handleFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = folderNameInput.trim();
    if (!name) {
      toast.error('Folder name cannot be empty.');
      return;
    }

    setIsFolderSubmitting(true);

    try {
      if (folderModalState?.mode === 'create') {
        const created = await createFolderMutation.mutateAsync({
          name,
          parentId: folderParentIdInput || undefined,
        });
        if (created?.id) {
          setSelectedFolderId(created.id);
        }
        toast.success('Folder created successfully.');
      } else if (
        folderModalState?.mode === 'rename' &&
        folderModalState.folder
      ) {
        await renameFolderMutation.mutateAsync({
          id: folderModalState.folder.id,
          name,
        });
        toast.success('Folder renamed successfully.');
      }
      setFolderModalState(null);
      setFolderNameInput('');
    } catch (err: any) {
      ErrorService.handle(err);
    } finally {
      setIsFolderSubmitting(false);
    }
  };

  // Confirm delete folder
  const handleConfirmDeleteFolder = async () => {
    if (!deleteFolderTarget) return;
    setIsDeletingFolder(true);
    try {
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

  // Confirm delete file
  const handleConfirmDeleteFile = async () => {
    if (!deleteFileTarget) return;
    setIsDeletingFile(true);
    try {
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

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Hero Header & Quota Dashboard */}
      <div className="bg-gradient-to-br from-[#fff8f5] via-white to-[#fffaf7] rounded-xl border border-[#ffdbcf] shadow-sm p-6 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-[#f4ece9]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 shadow-2xs">
              <HardDrives size={28} weight="duotone" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[#1e1b19] tracking-tight">
                  {t('drive:title', 'Google Drive Document Vault')}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#ffdbcf] text-[#812901] border border-[#ffb59c]">
                  Live Synchronized
                </span>
              </div>
              <p className="text-xs text-[#8a726a] mt-0.5">
                Browse Google Drive folder hierarchies, inspect activity
                reports, and manage community documents across all hubs.
              </p>
            </div>
          </div>

          {/* Quick Actions (Upload, New Folder, Refresh) */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleRefreshSync}
              disabled={isRefreshing}
              className="h-10 px-3.5 rounded-lg bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
              title="Refresh Google Drive catalog"
            >
              <ArrowsClockwise
                size={16}
                className={`${isRefreshing ? 'animate-spin text-[#b85028]' : ''}`}
              />
              <span>Refresh</span>
            </button>

            {isPrivileged && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenCreateFolderModal()}
                  className="h-10 px-3.5 rounded-lg bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
                >
                  <FolderSimplePlus size={16} weight="bold" />
                  <span>New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenUploadModal()}
                  className="h-10 px-4 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <CloudArrowUp size={18} weight="bold" />
                  <span>Upload Documents</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Storage & Indexing KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-white border border-[#e8e1dd] shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
              Documents Indexed
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[#1e1b19]">
                {allReports.length}
              </span>
              <span className="text-[11px] text-[#8a726a]">files</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#e8e1dd] shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
              Total Storage Used
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[#b85028]">
                {(totalSizeBytes / (1024 * 1024)).toFixed(2)}
              </span>
              <span className="text-[11px] text-[#8a726a]">MB</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#e8e1dd] shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
              Active Folders
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[#1e1b19]">
                {folders.length}
              </span>
              <span className="text-[11px] text-[#8a726a]">folders</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-white border border-[#e8e1dd] shadow-2xs flex flex-col gap-1">
            <span className="text-[10px] font-bold text-[#8a726a] uppercase tracking-wider">
              Current View
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[#2c4e37]">
                {filteredReports.length}
              </span>
              <span className="text-[11px] text-[#8a726a]">
                ({(currentFolderSizeBytes / (1024 * 1024)).toFixed(1)} MB)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Full-Width Folder & Document Explorer Workspace */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDraggingOver(false);
          if (e.dataTransfer.files) {
            handleDropFiles(Array.from(e.dataTransfer.files));
          }
        }}
        className={`w-full flex flex-col gap-5 relative rounded-xl transition-all ${
          isDraggingOver
            ? 'ring-2 ring-[#b85028] ring-dashed bg-[#fff8f5]/60 p-2'
            : ''
        }`}
      >
        {/* Navigation & Breadcrumb Header Bar */}
        <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Up button + Breadcrumb Trail */}
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {selectedFolderId !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  const current = folderDetailMap.get(selectedFolderId);
                  if (
                    current?.parentId &&
                    current.parentId !== 'root' &&
                    current.parentId !== 'mock-root' &&
                    current.parentId !== rootFolder?.id
                  ) {
                    setSelectedFolderId(current.parentId);
                  } else {
                    setSelectedFolderId('ALL');
                  }
                }}
                className="h-8 px-2.5 rounded-lg bg-[#faf2ee] hover:bg-[#b85028] text-[#57423b] hover:text-white border border-[#e8e1dd] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs"
                title={t('drive:upOneLevel', 'Up')}
              >
                <ArrowLeft size={13} weight="bold" />
                <span>{t('drive:upOneLevel', 'Up')}</span>
              </button>
            )}

            {/* Breadcrumb Trail */}
            <nav className="flex items-center gap-1 flex-wrap text-xs font-semibold">
              {breadcrumbTrail.map((crumb, idx) => {
                const isLast = idx === breadcrumbTrail.length - 1;
                const isRootCrumb = idx === 0;

                return (
                  <div key={crumb.id} className="flex items-center gap-1">
                    {idx > 0 && (
                      <CaretRight
                        size={12}
                        weight="bold"
                        className="text-[#cfc4be] shrink-0"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedFolderId(crumb.id)}
                      className={`px-2 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        isLast
                          ? 'bg-[#fff2ee] text-[#b85028] font-black border border-[#ffdbcf]'
                          : 'text-[#57423b] hover:text-[#b85028] hover:bg-[#faf2ee]'
                      }`}
                    >
                      {isRootCrumb ? (
                        <HardDrives
                          size={14}
                          weight={isLast ? 'fill' : 'bold'}
                          className="shrink-0"
                        />
                      ) : (
                        <Folder
                          size={14}
                          weight={isLast ? 'fill' : 'bold'}
                          className="shrink-0"
                        />
                      )}
                      <span className="truncate max-w-[180px]">
                        {crumb.name}
                      </span>
                    </button>
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right: Quick actions for current folder */}
          <div className="flex items-center gap-2 shrink-0">
            {isPrivileged && (
              <>
                <button
                  type="button"
                  onClick={() => handleOpenCreateFolderModal()}
                  className="h-8 px-2.5 rounded-lg bg-white hover:bg-[#faf2ee] border border-[#e8e1dd] text-[#57423b] text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title={t('drive:newFolder', 'New Folder')}
                >
                  <FolderSimplePlus
                    size={14}
                    weight="bold"
                    className="text-[#b85028]"
                  />
                  <span>{t('drive:newFolder', 'New Folder')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenUploadModal()}
                  className="h-8 px-3 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  title={t('drive:uploadDocuments', 'Upload Documents')}
                >
                  <CloudArrowUp size={15} weight="bold" />
                  <span>{t('common:upload', 'Upload')}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Folders Section (Rendered when subfolders exist in this directory or loading) */}
        {isFoldersLoading ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Folder size={16} weight="fill" className="text-[#b85028]" />
              <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                {t('drive:folders', 'Folders')}
              </h3>
            </div>
            <AppSkeletonTheme>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} height={64} borderRadius={12} />
                ))}
              </div>
            </AppSkeletonTheme>
          </div>
        ) : directSubfolders.length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder size={16} weight="fill" className="text-[#b85028]" />
                <h3 className="text-xs font-bold text-[#1e1b19] uppercase tracking-wider">
                  {t('drive:folders', 'Folders')}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd]">
                  {directSubfolders.length}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {directSubfolders.map((sub) => {
                const count = getAggregatedDocumentCount(sub.id);
                return (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedFolderId(sub.id)}
                    className="group relative flex items-center justify-between p-3.5 rounded-xl border border-[#e8e1dd] bg-white hover:border-[#b85028]/40 hover:shadow-md transition-all cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center shrink-0 group-hover:bg-[#b85028] group-hover:text-white transition-colors shadow-2xs">
                        <FolderOpen size={20} weight="fill" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1e1b19] group-hover:text-[#b85028] transition-colors truncate">
                          {sub.name}
                        </span>
                        <span className="text-[11px] text-[#8a726a]">
                          {count > 0
                            ? count === 1
                              ? t('drive:itemCount_one', '1 file')
                              : t('drive:itemCount_other', '{{count}} files', {
                                  count,
                                })
                            : t('drive:empty', 'Empty')}
                        </span>
                      </div>
                    </div>

                    {isPrivileged && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-0.5 shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenCreateFolderModal(sub.id)}
                          className="p-1 rounded text-[#8a726a] hover:text-[#b85028] hover:bg-[#faf2ee] transition-colors cursor-pointer"
                          title="Add subfolder"
                        >
                          <FolderPlus size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRenameFolderModal(sub)}
                          className="p-1 rounded text-[#8a726a] hover:text-[#1e1b19] hover:bg-[#faf2ee] transition-colors cursor-pointer"
                          title="Rename folder"
                        >
                          <PencilSimple size={13} weight="bold" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteFolderTarget(sub)}
                          className="p-1 rounded text-[#8a726a] hover:text-[#ba1a1a] hover:bg-[#fff0ed] transition-colors cursor-pointer"
                          title="Delete folder"
                        >
                          <Trash size={13} weight="bold" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Files Section */}
        <div className="flex flex-col gap-3">
          {/* Section Toolbar */}
          <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a726a]"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t(
                  'drive:filters.searchPlaceholder',
                  'Search documents by name, author, activity...',
                )}
                className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8a726a] hover:text-[#1e1b19]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Type Filter Pills & Mode Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Pills */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd]">
                {(['ALL', 'PDF', 'DOC', 'SHEET', 'IMAGE'] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFileTypeFilter(type)}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                        fileTypeFilter === type
                          ? 'bg-white text-[#b85028] shadow-2xs'
                          : 'text-[#8a726a] hover:text-[#1e1b19]'
                      }`}
                    >
                      {type}
                    </button>
                  ),
                )}
              </div>

              {/* Include Subfolders Checkbox (when inside a folder that has subfolders) */}
              {selectedFolderId !== 'ALL' && directSubfolders.length > 0 && (
                <label className="flex items-center gap-1.5 text-xs text-[#57423b] font-semibold cursor-pointer select-none px-2 py-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd]">
                  <input
                    type="checkbox"
                    checked={includeSubfolders}
                    onChange={(e) => setIncludeSubfolders(e.target.checked)}
                    className="rounded border-[#e8e1dd] text-[#b85028] focus:ring-[#b85028]"
                  />
                  <span className="text-[11px]">
                    {t('drive:includeSubfolders', 'Include subfolder files')}
                  </span>
                </label>
              )}

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs font-bold text-[#57423b] outline-none cursor-pointer"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="size_desc">Largest First</option>
              </select>

              {/* View Switcher */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-[#faf2ee] border border-[#e8e1dd]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#b85028] shadow-2xs'
                      : 'text-[#8a726a] hover:text-[#1e1b19]'
                  }`}
                  title="Grid View"
                >
                  <SquaresFour size={16} weight="bold" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition-colors cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white text-[#b85028] shadow-2xs'
                      : 'text-[#8a726a] hover:text-[#1e1b19]'
                  }`}
                  title="Table View"
                >
                  <ListBullets size={16} weight="bold" />
                </button>
              </div>
            </div>
          </div>

          {/* Files Display (Grid or Table) */}
          {isDriveFilesLoading ? (
            <AppSkeletonTheme>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} height={140} borderRadius={12} />
                ))}
              </div>
            </AppSkeletonTheme>
          ) : filteredReports.length === 0 ? (
            searchTerm || fileTypeFilter !== 'ALL' ? (
              <EmptyState
                size="lg"
                imageSrc={emptyDriveImg}
                imageAlt="No documents match filters"
                title="No documents matched your criteria"
                description="Try adjusting your search terms or filters."
                primaryAction={{
                  label: 'Reset Filters',
                  icon: <ArrowCounterClockwise size={15} weight="bold" />,
                  onClick: () => {
                    setSearchTerm('');
                    setFileTypeFilter('ALL');
                  },
                }}
              />
            ) : directSubfolders.length > 0 ? (
              /* Inline friendly empty note when subfolders are present */
              <div className="bg-white rounded-xl border border-[#e8e1dd] p-8 text-center flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-[#faf2ee] text-[#8a726a] flex items-center justify-center">
                  <FolderOpen size={22} weight="duotone" />
                </div>
                <h4 className="text-xs font-bold text-[#1e1b19]">
                  {t(
                    'drive:noDirectFiles',
                    'No documents directly in this folder',
                  )}
                </h4>
                <p className="text-[11px] text-[#8a726a] max-w-sm">
                  {t(
                    'drive:noDirectFilesDesc',
                    'Navigate into one of the subfolders above to view its files, or upload a document here.',
                  )}
                </p>
                {isPrivileged && (
                  <button
                    type="button"
                    onClick={() => handleOpenUploadModal()}
                    className="mt-2 h-8 px-3.5 rounded-lg bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadSimple size={14} weight="bold" />
                    <span>{t('drive:uploadHere', 'Upload Document Here')}</span>
                  </button>
                )}
              </div>
            ) : (
              /* Full EmptyState when folder has no subfolders and no files */
              <EmptyState
                size="lg"
                imageSrc={emptyDriveImg}
                imageAlt="No documents found"
                title={t('drive:emptyFolder', 'This folder is currently empty')}
                description={t(
                  'drive:emptyFolderDesc',
                  'Upload documents or notes to populate this folder.',
                )}
                primaryAction={
                  isPrivileged
                    ? {
                        label: t('drive:uploadDocuments', 'Upload Documents'),
                        icon: <UploadSimple size={15} weight="bold" />,
                        onClick: () => handleOpenUploadModal(),
                      }
                    : undefined
                }
              />
            )
          ) : viewMode === 'grid' ? (
            /* Mode 1: Grid Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredReports.map((report) => {
                const config = getFileIconConfig(report.filename);
                const IconComponent = config.icon;
                const folderName = report.folderId
                  ? folderMap.get(report.folderId)
                  : undefined;

                return (
                  <div
                    key={report.fileId}
                    className="bg-white rounded-xl border border-[#e8e1dd] hover:border-[#ffb59c] hover:shadow-md transition-all p-4 flex flex-col justify-between gap-3 group"
                  >
                    {/* Top Row: File Icon Badge + Size + Extension */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-lg ${config.bg} ${config.border} border ${config.color} flex items-center justify-center shrink-0`}
                        >
                          <IconComponent size={20} weight="duotone" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span
                            onClick={() => handlePreview(report)}
                            className="text-xs font-bold text-[#1e1b19] group-hover:text-[#b85028] transition-colors truncate cursor-pointer"
                            title={report.filename}
                          >
                            {report.filename}
                          </span>
                          <span className="text-[11px] text-[#8a726a]">
                            {formatFileSize(report.fileSize)}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded ${config.bg} ${config.color} shrink-0`}
                      >
                        {config.badge}
                      </span>
                    </div>

                    {/* Middle: Folder & Activity Tags */}
                    <div className="flex flex-col gap-1.5 text-[11px]">
                      {folderName && (
                        <div className="flex items-center gap-1.5 text-[#57423b] bg-[#faf2ee] px-2 py-1 rounded-md w-fit max-w-full">
                          <Folder
                            size={12}
                            className="text-[#b85028] shrink-0"
                          />
                          <span className="truncate">{folderName}</span>
                        </div>
                      )}

                      {report.activityTitle && (
                        <div className="flex items-center gap-1 text-[#8a726a] truncate">
                          <CalendarBlank size={12} className="shrink-0" />
                          <span className="truncate">
                            {report.activityTitle}
                          </span>
                        </div>
                      )}

                      {report.summary && (
                        <p className="text-[#8a726a] line-clamp-2 italic text-[11px] mt-0.5">
                          "{report.summary}"
                        </p>
                      )}
                    </div>

                    {/* Bottom Row: Date & Actions */}
                    <div className="pt-2.5 border-t border-[#f4ece9] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-[#8a726a]">
                        {report.uploadedAt
                          ? new Date(report.uploadedAt).toLocaleDateString(
                              'en-GB',
                            )
                          : '—'}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handlePreview(report)}
                          className="p-1.5 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                          title="Preview document"
                        >
                          <Eye size={16} weight="bold" />
                        </button>

                        {report.webViewLink && (
                          <button
                            type="button"
                            onClick={() => {
                              if (report.webViewLink) {
                                handleOpenLink(report.webViewLink);
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-[#faf2ee] text-[#8a726a] hover:text-[#b85028] transition-colors cursor-pointer"
                            title="Open in Google Drive"
                          >
                            <ArrowSquareOut size={16} weight="bold" />
                          </button>
                        )}

                        {isPrivileged && (
                          <button
                            type="button"
                            onClick={() => setDeleteFileTarget(report)}
                            className="p-1.5 rounded-md hover:bg-[#ffdad6]/50 text-[#8a726a] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash size={16} weight="bold" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Mode 2: Table List View */
            <div className="bg-white rounded-xl border border-[#e8e1dd] shadow-xs overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#faf2ee] border-b border-[#e8e1dd] text-[11px] font-bold text-[#8a726a] uppercase tracking-wider">
                    <th className="py-3 px-4">Document</th>
                    <th className="py-3 px-3">Location</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3">Uploaded</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f4ece9] text-xs">
                  {filteredReports.map((report) => {
                    const config = getFileIconConfig(report.filename);
                    const IconComponent = config.icon;
                    const folderName = report.folderId
                      ? folderMap.get(report.folderId)
                      : undefined;

                    return (
                      <tr
                        key={report.fileId}
                        className="hover:bg-[#fffbf9] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <IconComponent
                              size={18}
                              weight="duotone"
                              className={`${config.color} shrink-0`}
                            />
                            <div className="flex flex-col min-w-0">
                              <span
                                onClick={() => handlePreview(report)}
                                className="font-bold text-[#1e1b19] hover:text-[#b85028] transition-colors truncate cursor-pointer"
                                title={report.filename}
                              >
                                {report.filename}
                              </span>
                              {report.activityTitle && (
                                <span className="text-[10px] text-[#8a726a] truncate">
                                  {report.activityTitle}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#faf2ee] text-[#57423b] border border-[#e8e1dd] truncate inline-block max-w-[140px]">
                            {folderName || 'Root Vault'}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-[#8a726a] font-mono text-[11px]">
                          {formatFileSize(report.fileSize)}
                        </td>

                        <td className="py-3 px-3 text-[#8a726a]">
                          {report.uploadedAt
                            ? new Date(report.uploadedAt).toLocaleDateString(
                                'en-GB',
                              )
                            : '—'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handlePreview(report)}
                              className="p-1 rounded text-[#8a726a] hover:text-[#b85028]"
                              title="Preview"
                            >
                              <Eye size={15} />
                            </button>
                            {report.webViewLink && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (report.webViewLink) {
                                    handleOpenLink(report.webViewLink);
                                  }
                                }}
                                className="p-1 rounded text-[#8a726a] hover:text-[#b85028]"
                                title="Open Link"
                              >
                                <ArrowSquareOut size={15} />
                              </button>
                            )}
                            {isPrivileged && (
                              <button
                                type="button"
                                onClick={() => setDeleteFileTarget(report)}
                                className="p-1 rounded text-[#8a726a] hover:text-[#ba1a1a]"
                                title="Delete"
                              >
                                <Trash size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 3. Modals */}

      {/* Standalone Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[500px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#f4ece9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
                  <CloudArrowUp size={20} weight="bold" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1e1b19]">
                    Upload Files to Google Drive
                  </h3>
                  <p className="text-[11px] text-[#8a726a]">
                    Select destination folder and files to archive into the
                    community vault.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="w-7 h-7 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={handleUploadSubmit}
              className="p-5 flex flex-col gap-4"
            >
              {/* Destination Folder Selector */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-folder-destination"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Destination Google Drive Folder
                </label>
                <CustomSelect
                  id="upload-folder-destination"
                  value={uploadFolderId}
                  onChange={(val) => setUploadFolderId(val)}
                  options={uploadFolderOptions}
                  placeholder="Select destination folder..."
                  variant="form"
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Files Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-file-picker-input"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Files to Upload
                </label>
                <input
                  id="upload-file-picker-input"
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
                  className="border-2 border-dashed border-[#e8e1dd] hover:border-[#b85028] rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-center bg-[#faf2ee]/50 hover:bg-[#fff8f5] transition-colors cursor-pointer"
                >
                  <CloudArrowUp size={28} className="text-[#b85028]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1e1b19]">
                      Click to choose files or drag and drop
                    </span>
                    <span className="text-[11px] text-[#8a726a] mt-0.5">
                      PDF, DOCX, XLSX, Images up to 25MB each
                    </span>
                  </div>
                </div>

                {uploadFiles.length > 0 && (
                  <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto mt-2">
                    {uploadFiles.map((file, idx) => (
                      <div
                        key={`${file.name}-${idx}`}
                        className="px-3 py-1.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] flex items-center justify-between text-xs"
                      >
                        <span className="truncate font-medium text-[#1e1b19]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-[#8a726a] hover:text-[#ba1a1a] ml-2"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Notes */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="upload-summary-input"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Summary / Archival Notes (Optional)
                </label>
                <textarea
                  id="upload-summary-input"
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  placeholder="e.g. Minutes and resolutions from the national leadership retreat..."
                  rows={2}
                  className="p-2.5 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] placeholder:text-[#8a726a] outline-none focus:border-[#b85028]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#57423b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || uploadFiles.length === 0}
                  className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <CircleNotch size={14} className="animate-spin" />
                  ) : (
                    <CloudArrowUp size={15} weight="bold" />
                  )}
                  <span>Upload Now</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create / Rename Folder Modal */}
      {folderModalState && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[440px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#f4ece9] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-[#fff2ee] border border-[#ffdbcf] text-[#b85028] flex items-center justify-center">
                  <FolderPlus size={20} weight="bold" />
                </div>
                <h3 className="text-sm font-bold text-[#1e1b19]">
                  {folderModalState.mode === 'create'
                    ? 'Create New Google Drive Folder'
                    : 'Rename Folder'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFolderModalState(null)}
                className="w-7 h-7 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] flex items-center justify-center text-[#8a726a] hover:text-[#1e1b19] cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <form
              onSubmit={handleFolderSubmit}
              className="p-5 flex flex-col gap-4"
            >
              {folderModalState.mode === 'create' && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="folder-parent-select"
                    className="text-xs font-bold text-[#57423b]"
                  >
                    Parent Folder
                  </label>
                  <CustomSelect
                    id="folder-parent-select"
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
                  htmlFor="folder-name-input"
                  className="text-xs font-bold text-[#57423b]"
                >
                  Folder Name
                </label>
                <input
                  id="folder-name-input"
                  type="text"
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  placeholder="e.g. 2026 Retreats"
                  className="h-9 px-3 rounded-lg bg-[#faf2ee] border border-[#e8e1dd] text-xs text-[#1e1b19] outline-none focus:border-[#b85028]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4ece9]">
                <button
                  type="button"
                  onClick={() => setFolderModalState(null)}
                  className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#57423b] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFolderSubmitting || !folderNameInput.trim()}
                  className="px-5 py-2 rounded-md bg-[#b85028] hover:bg-[#a44520] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isFolderSubmitting && (
                    <CircleNotch size={14} className="animate-spin" />
                  )}
                  <span>Save Folder</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Folder Dialog */}
      {deleteFolderTarget && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <Trash size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e1b19]">
                  Delete Google Drive Folder?
                </h3>
                <p className="text-xs text-[#8a726a] mt-0.5">
                  Are you sure you want to delete{' '}
                  <strong className="text-[#1e1b19]">
                    {deleteFolderTarget.name}
                  </strong>
                  ?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4ece9]">
              <button
                type="button"
                onClick={() => setDeleteFolderTarget(null)}
                className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#57423b] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingFolder}
                onClick={handleConfirmDeleteFolder}
                className="px-5 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeletingFolder ? 'Deleting...' : 'Delete Folder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete File Dialog */}
      {deleteFileTarget && (
        <div className="fixed inset-0 z-50 bg-[#1e1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-[420px] bg-white rounded-xl border border-[#e8e1dd] shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                <Trash size={20} weight="bold" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1e1b19]">
                  Delete Document?
                </h3>
                <p className="text-xs text-[#8a726a] mt-0.5">
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-[#1e1b19]">
                    {deleteFileTarget.filename}
                  </strong>{' '}
                  from Google Drive?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f4ece9]">
              <button
                type="button"
                onClick={() => setDeleteFileTarget(null)}
                className="px-4 py-2 rounded-md bg-[#faf2ee] hover:bg-[#f4ece9] text-xs font-bold text-[#57423b] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingFile}
                onClick={handleConfirmDeleteFile}
                className="px-5 py-2 rounded-md bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDeletingFile ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewFile && (
        <DriveFilePreviewModal
          isOpen={Boolean(previewFile)}
          onClose={() => setPreviewFile(null)}
          file={previewFile}
        />
      )}
    </div>
  );
};
