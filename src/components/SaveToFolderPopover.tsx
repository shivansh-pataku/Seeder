'use client';

import React, { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import {
  FolderSimple,
  FolderSimplePlus,
  Clock,
  Check,
  X,
} from '@phosphor-icons/react';
import { useInkWell } from '@/components/InkWell';
import {
  getUserFoldersAction,
  getStorySavedFoldersAction,
  createFolderAction,
  saveStoryToFolderAction,
  unsaveStoryFromFolderAction,
} from '@/app/actions/engagement';

export interface PopoverFolder {
  id: number;
  name: string;
  parent_id?: number | null;
}

interface SaveToFolderPopoverProps {
  storyId: number | string;
  storyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSavedChange?: (isSaved: boolean) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}

export default function SaveToFolderPopover({
  storyId,
  storyTitle,
  isOpen,
  onClose,
  onSavedChange,
  triggerRef,
  children,
}: SaveToFolderPopoverProps) {
  const inkWell = useInkWell();

  const [folders, setFolders] = useState<PopoverFolder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showAddFolderInput, setShowAddFolderInput] = useState(false);
  const [savedFolderIds, setSavedFolderIds] = useState<Set<number | 'root'>>(new Set());
  const [actionInProgress, setActionInProgress] = useState(false);

  // Synchronize state via Server Actions when popover opens
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    Promise.all([
      getUserFoldersAction(),
      getStorySavedFoldersAction(storyId),
    ])
      .then(([foldersRes, savedRes]) => {
        if (!isMounted) return;

        if (foldersRes.success && foldersRes.data?.folders) {
          setFolders(foldersRes.data.folders);
        }

        if (savedRes.success && savedRes.data) {
          const folderSet = new Set(savedRes.data.savedFolderIds);
          setSavedFolderIds(folderSet);
          if (onSavedChange) {
            onSavedChange(folderSet.size > 0);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load folders/saved state:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, storyId, onSavedChange]);

  // Toggle saving to root/Read Later or a specific folder
  const handleToggleFolder = async (folderId: number | null, folderName: string) => {
    if (actionInProgress) return;

    const folderKey = folderId === null ? 'root' : folderId;
    const isCurrentlySavedInFolder = savedFolderIds.has(folderKey);

    try {
      setActionInProgress(true);

      if (isCurrentlySavedInFolder) {
        // Optimistic UI update
        const nextSet = new Set(savedFolderIds);
        nextSet.delete(folderKey);
        setSavedFolderIds(nextSet);
        if (onSavedChange) onSavedChange(nextSet.size > 0);

        const res = await unsaveStoryFromFolderAction(storyId, folderId);
        if (res.success) {
          inkWell.toast({
            message: `Removed from "${folderName}"`,
            type: 'info',
          });
        } else {
          // Revert optimistic update
          setSavedFolderIds(new Set(savedFolderIds).add(folderKey));
          if (onSavedChange) onSavedChange(true);
          inkWell.toast({
            message: res.error || 'Failed to remove from folder',
            type: 'error',
          });
        }
      } else {
        // Optimistic UI update
        const nextSet = new Set(savedFolderIds).add(folderKey);
        setSavedFolderIds(nextSet);
        if (onSavedChange) onSavedChange(true);

        const res = await saveStoryToFolderAction(storyId, folderId);
        if (res.success) {
          inkWell.toast({
            message: `Saved to "${folderName}"`,
            type: 'success',
          });
        } else {
          // Revert optimistic update
          const revertSet = new Set(savedFolderIds);
          revertSet.delete(folderKey);
          setSavedFolderIds(revertSet);
          if (onSavedChange) onSavedChange(revertSet.size > 0);
          inkWell.toast({
            message: res.error || 'Failed to save to folder',
            type: 'error',
          });
        }
      }
    } catch {
      inkWell.toast({
        message: 'Could not update bookmark. Please try again.',
        type: 'error',
      });
    } finally {
      setActionInProgress(false);
    }
  };

  // Create new folder and immediately save story into it
  const handleCreateAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFolderName.trim();
    if (!cleanName) return;

    try {
      setCreatingFolder(true);

      const createRes = await createFolderAction(cleanName);
      if (!createRes.success || !createRes.data?.folder) {
        throw new Error(createRes.error || 'Failed to create folder');
      }

      const newFolder = createRes.data.folder;
      await saveStoryToFolderAction(storyId, newFolder.id);

      setFolders((prev) => [...prev, newFolder]);
      setSavedFolderIds((prev) => {
        const next = new Set(prev).add(newFolder.id);
        if (onSavedChange) onSavedChange(true);
        return next;
      });

      setNewFolderName('');
      setShowAddFolderInput(false);

      inkWell.toast({
        message: `Created folder and saved to "${cleanName}"`,
        type: 'success',
      });
    } catch (err: unknown) {
      inkWell.toast({
        message: (err as Error).message || 'Failed to create folder',
        type: 'error',
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const isSavedInRoot = savedFolderIds.has('root');

  return (
    <Popover.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      {children && <Popover.Trigger asChild>{children}</Popover.Trigger>}
      {triggerRef && <Popover.Anchor virtualRef={triggerRef} />}

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={16}
          style={{
            width: '260px',
            maxWidth: 'calc(100vw - 32px)',
            backgroundColor: 'var(--card-bg, #ffffff)',
            color: 'var(--foreground, #111111)',
            border: '1px solid var(--min-borders, #cccccc)',
            borderRadius: '0px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            zIndex: 1000,
            fontFamily: 'var(--font-primary)',
            textAlign: 'left',
            outline: 'none',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow */}
          <Popover.Arrow
            style={{
              fill: 'var(--card-bg, #ffffff)',
              stroke: 'var(--min-borders, #cccccc)',
              strokeWidth: 1,
            }}
          />

          {/* Popover Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderBottom: '1px solid var(--min-borders, #cccccc)',
            }}
          >
            <div style={{ minWidth: 0, paddingRight: '0.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Save
              </div>
              {storyTitle && (
                <div
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--task-editor-text-muted, #71717a)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '200px',
                    marginTop: '1px',
                  }}
                  title={storyTitle}
                >
                  {storyTitle}
                </div>
              )}
            </div>
            <Popover.Close asChild>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--task-editor-text-muted, #71717a)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                }}
                title="Close"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </Popover.Close>
          </div>

          {/* Folder Options List */}
          <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '0.35rem 0' }}>
            {/* Default Option: Read Later (Root / Unsorted) */}
            <div
              onClick={() => handleToggleFolder(null, 'Read Later')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.85rem',
                cursor: 'pointer',
                fontSize: '0.82rem',
                backgroundColor: isSavedInRoot ? 'var(--button-bg, #f3f4f6)' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={15} weight="regular" />
                <span style={{ fontWeight: isSavedInRoot ? 600 : 400 }}>Read Later</span>
              </div>
              {isSavedInRoot && <Check size={14} weight="bold" color="#16a34a" />}
            </div>

            {/* Existing Custom Folders */}
            {folders.map((folder) => {
              const isSavedHere = savedFolderIds.has(folder.id);
              return (
                <div
                  key={folder.id}
                  onClick={() => handleToggleFolder(folder.id, folder.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.85rem',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    backgroundColor: isSavedHere ? 'var(--button-bg, #f3f4f6)' : 'transparent',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                    <FolderSimple size={15} weight={isSavedHere ? 'fill' : 'regular'} />
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontWeight: isSavedHere ? 600 : 400,
                      }}
                    >
                      {folder.name}
                    </span>
                  </div>
                  {isSavedHere && <Check size={14} weight="bold" color="#16a34a" />}
                </div>
              );
            })}
          </div>

          {/* Add New Folder Section */}
          <div
            style={{
              borderTop: '1px solid var(--min-borders, #cccccc)',
              padding: '0.55rem 0.85rem',
              backgroundColor: 'var(--card-bg, #ffffff)',
            }}
          >
            {!showAddFolderInput ? (
              <button
                type="button"
                onClick={() => setShowAddFolderInput(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  padding: '0.25rem 0',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--foreground, #111111)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <FolderSimplePlus size={15} weight="regular" />
                <span>New Folder</span>
              </button>
            ) : (
              <form onSubmit={handleCreateAndSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="Folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  disabled={creatingFolder}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.78rem',
                    border: '1px solid var(--min-borders, #cccccc)',
                    borderRadius: '0px',
                    background: 'var(--background, #ffffff)',
                    color: 'var(--foreground, #111111)',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddFolderInput(false);
                      setNewFolderName('');
                    }}
                    disabled={creatingFolder}
                    style={{
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.72rem',
                      border: '1px solid var(--min-borders)',
                      background: 'transparent',
                      color: 'var(--task-editor-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingFolder || !newFolderName.trim()}
                    style={{
                      padding: '0.2rem 0.65rem',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      border: 'none',
                      backgroundColor: 'var(--foreground, #111111)',
                      color: 'var(--background, #ffffff)',
                      cursor: 'pointer',
                      opacity: creatingFolder || !newFolderName.trim() ? 0.5 : 1,
                    }}
                  >
                    {creatingFolder ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
