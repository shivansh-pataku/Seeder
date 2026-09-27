'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FolderSimple,
  FolderSimplePlus,
  Clock,
  Check,
  X,
} from '@phosphor-icons/react';
import { useInkWell } from '@/app/Components/InkWell';
import { folderCache, CachedFolder } from '@/app/lib/folderCache';

interface SaveToFolderPopoverProps {
  storyId: number | string;
  storyTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSavedChange?: (isSaved: boolean) => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export default function SaveToFolderPopover({
  storyId,
  storyTitle,
  isOpen,
  onClose,
  onSavedChange,
  triggerRef,
}: SaveToFolderPopoverProps) {
  const inkWell = useInkWell();
  const popoverRef = useRef<HTMLDivElement>(null);

  const [folders, setFolders] = useState<CachedFolder[]>(() => folderCache.getCachedFolders() || []);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showAddFolderInput, setShowAddFolderInput] = useState(false);
  const [savedFolderIds, setSavedFolderIds] = useState<Set<number | 'root'>>(() => new Set(folderCache.getStorySavedFolders(storyId)));
  const [actionInProgress, setActionInProgress] = useState(false);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        (!triggerRef?.current || !triggerRef.current.contains(target))
      ) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Synchronize state from folderCache and subscribe to updates
  useEffect(() => {
    const syncFromCache = () => {
      const cached = folderCache.getCachedFolders();
      if (cached) setFolders(cached);
      const storySaved = folderCache.getStorySavedFolders(storyId);
      setSavedFolderIds(new Set(storySaved));
      if (onSavedChange) {
        onSavedChange(storySaved.size > 0);
      }
    };

    syncFromCache();
    const unsubscribe = folderCache.subscribe(syncFromCache);
    return () => unsubscribe();
  }, [storyId, onSavedChange]);

  // Ensure freshest data in background when opened
  useEffect(() => {
    if (!isOpen) return;
    folderCache.getOrFetchFolders();
    folderCache.getOrFetchSavedState(storyId);
  }, [isOpen, storyId]);

  if (!isOpen) return null;

  // Toggle saving to root/Read Later or a specific folder
  const handleToggleFolder = async (folderId: number | null, folderName: string) => {
    if (actionInProgress) return;

    const folderKey = folderId === null ? 'root' : folderId;
    const isCurrentlySavedInFolder = savedFolderIds.has(folderKey);

    try {
      setActionInProgress(true);

      if (isCurrentlySavedInFolder) {
        // Unsave from this folder
        const res = await fetch('/api/saved-items', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityId: storyId,
            entityType: 'story',
            folderId,
          }),
        });

        if (res.ok) {
          folderCache.updateStorySavedInFolder(storyId, folderId, false);
          if (onSavedChange) onSavedChange(folderCache.isStorySaved(storyId));

          inkWell.toast({
            message: `Removed from "${folderName}"`,
            type: 'info',
          });
        }
      } else {
        // Save into this folder
        const res = await fetch('/api/saved-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entityId: storyId,
            entityType: 'story',
            folderId,
          }),
        });

        if (res.status === 401) {
          inkWell.toast({
            message: 'Please sign in to save stories.',
            type: 'warning',
          });
          return;
        }

        if (res.ok) {
          folderCache.updateStorySavedInFolder(storyId, folderId, true);
          if (onSavedChange) onSavedChange(true);

          inkWell.toast({
            message: `Saved to "${folderName}"`,
            type: 'success',
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

      // 1. Create the new folder
      const folderRes = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName }),
      });

      const folderData = await folderRes.json();
      if (!folderRes.ok || !folderData.success) {
        throw new Error(folderData.error?.message || 'Failed to create folder');
      }

      const newFolder = folderData.data.folder;

      // 2. Save story into the newly created folder
      await fetch('/api/saved-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: storyId,
          entityType: 'story',
          folderId: newFolder.id,
        }),
      });

      // Update global cache immediately
      folderCache.addFolder(newFolder);
      folderCache.updateStorySavedInFolder(storyId, newFolder.id, true);
      if (onSavedChange) onSavedChange(true);

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
    <>
      <style>{`
        @keyframes popoverFadeInUp {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      <div
        ref={popoverRef}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          bottom: 'calc(100% + 10px)',
          right: '0',
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
          cursor: 'default',
          animation: 'popoverFadeInUp 0.18s ease-out forwards',
        }}
      >
        {/* Speech Bubble Arrow / Tail pointing down to bookmark button */}
        <div
          style={{
            position: 'absolute',
            bottom: '-6px',
            right: '8px',
            width: '10px',
            height: '10px',
            backgroundColor: 'var(--card-bg, #ffffff)',
            borderRight: '1px solid var(--min-borders, #cccccc)',
            borderBottom: '1px solid var(--min-borders, #cccccc)',
            transform: 'rotate(45deg)',
            zIndex: 1001,
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
          >
            <X size={14} />
          </button>
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
      </div>
    </>
  );
}
