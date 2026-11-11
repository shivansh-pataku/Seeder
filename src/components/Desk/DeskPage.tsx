'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StoryDeskCard, StoryDeskItem } from '@/components/Stories';
import { useLoading } from '@/components/LoadingContext';
import { useInkWell } from '@/components/InkWell';
import * as Dialog from '@radix-ui/react-dialog';
import styles from '@/app/Styles/desk.module.css';
import { PencilSimple, MagnifyingGlass, Article } from '@phosphor-icons/react';

export interface DeskPageProps {
  initialStories?: StoryDeskItem[];
}

export default function DeskPage({ initialStories }: DeskPageProps = {}) {
  const { status } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const inkWell = useInkWell();
  const router = useRouter();

  const [stories, setStories] = useState<StoryDeskItem[]>(initialStories || []);
  const [loading, setLoading] = useState(!initialStories);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'drafts' | 'published'>('all');
  const [storyToDelete, setStoryToDelete] = useState<number | string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Synchronize loading indicator with navbar
  useEffect(() => {
    if (status === 'loading' || loading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, loading, startLoading, stopLoading]);

  // Fetch stories if initialStories was not provided
  useEffect(() => {
    if (initialStories !== undefined) return;

    async function fetchStories() {
      if (status !== 'authenticated') return;

      setLoading(true);
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch writings');
        const data = await res.json();
        setStories(data.tasks || []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [status, initialStories]);

  // Publish / Draft toggle
  const handleTogglePublish = async (storyId: number | string, currentPublished: boolean) => {
    const newStatus = !currentPublished;

    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyId, status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update story status');

      setStories(prev =>
        prev.map(story =>
          story.id === storyId ? { ...story, status: newStatus } : story
        )
      );
      inkWell.toast({
        message: newStatus ? 'Story published!' : 'Story moved to drafts.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Error toggling publish status:', err);
      inkWell.toast({
        message: 'Could not update status: ' + err.message,
        type: 'error',
      });
    }
  };

  // Trigger delete dialog
  const handleDeleteStory = (storyId: number | string) => {
    setStoryToDelete(storyId);
  };

  // Confirm delete handler
  const confirmDelete = async () => {
    if (!storyToDelete) return;
    setIsDeleting(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyToDelete }),
      });

      if (!res.ok) throw new Error('Failed to delete story');

      setStories(prev => prev.filter(story => story.id !== storyToDelete));
      inkWell.toast({
        message: 'Story deleted successfully',
        type: 'info',
      });
      setStoryToDelete(null);
    } catch (err: any) {
      console.error('Error deleting story:', err);
      inkWell.toast({
        message: 'Could not delete story: ' + err.message,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter calculations
  const draftsCount = useMemo(() => stories.filter(s => !s.status).length, [stories]);
  const publishedCount = useMemo(() => stories.filter(s => Boolean(s.status)).length, [stories]);

  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      // Status filter
      if (activeFilter === 'drafts' && story.status) return false;
      if (activeFilter === 'published' && !story.status) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = (story.title || '').toLowerCase().includes(query);
        const descMatch = (story.snippet || story.preview || story.description || '').toLowerCase().includes(query);
        return titleMatch || descMatch;
      }

      return true;
    });
  }, [stories, activeFilter, searchQuery]);

  if (status === 'loading' || (loading && stories.length === 0)) {
    return null;
  }

  return (
    <div className={styles.deskContainer}>
      {/* Desk Toolbar */}
      <div className={styles.deskToolbar}>
        <div className={styles.filterTabs}>
          <button
            type="button"
            className={`${styles.tabButton} ${activeFilter === 'all' ? styles.active : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            <span>All</span>
            <span className={styles.tabCount}>{stories.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${activeFilter === 'drafts' ? styles.active : ''}`}
            onClick={() => setActiveFilter('drafts')}
          >
            <span>Drafts</span>
            <span className={styles.tabCount}>{draftsCount}</span>
          </button>

          <button
            type="button"
            className={`${styles.tabButton} ${activeFilter === 'published' ? styles.active : ''}`}
            onClick={() => setActiveFilter('published')}
          >
            <span>Published</span>
            <span className={styles.tabCount}>{publishedCount}</span>
          </button>
        </div>

        <div className={styles.searchContainer}>
          <MagnifyingGlass size={16} weight="regular" className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search stories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Error state */}
      {error && <p style={{ color: '#ff3b30' }}>Error: {error}</p>}

      {/* Stories Grid */}
      {filteredStories.length > 0 ? (
        <section className={styles.storiesGrid}>
          {filteredStories.map(story => (
            <StoryDeskCard
              key={story.id}
              story={story}
              onSelect={(s) => router.push(`/desk/${s.id}`)}
              onTogglePublish={handleTogglePublish}
              onDelete={handleDeleteStory}
            />
          ))}
        </section>
      ) : (
        <div className={styles.emptyState}>
          <Article size={48} weight="regular" className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>
            {searchQuery
              ? 'No stories match your search'
              : activeFilter === 'drafts'
                ? 'No drafts found'
                : activeFilter === 'published'
                  ? 'No published stories yet'
                  : 'Your desk is empty'}
          </h2>
          <p className={styles.emptyDescription}>
            {searchQuery
              ? 'Try searching with different keywords or clear the search input.'
              : 'Begin crafting your ideas into articles, essays, and stories.'}
          </p>
          <Link href="/desk/new" className={styles.newStoryButton}>
            <PencilSimple size={16} weight="regular" />
            <span>Start Writing</span>
          </Link>
        </div>
      )}

      {/* Accessible Radix Delete Confirmation Dialog */}
      <Dialog.Root open={storyToDelete !== null} onOpenChange={(open) => { if (!open) setStoryToDelete(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.45)',
              backdropFilter: 'blur(2px)',
              zIndex: 2000,
            }}
          />
          <Dialog.Content
            aria-describedby="delete-story-desc"
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--foreground, #111111)',
              border: '1px solid var(--min-borders, #cccccc)',
              padding: '1.5rem',
              width: '90%',
              maxWidth: '400px',
              zIndex: 2001,
              fontFamily: 'var(--font-primary)',
              outline: 'none',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Dialog.Title style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
              Delete Story
            </Dialog.Title>
            <p id="delete-story-desc" style={{ fontSize: '0.88rem', color: 'var(--task-editor-text-muted, #666)', margin: '0.75rem 0 1.25rem' }}>
              Are you sure you want to permanently delete this story? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <Dialog.Close asChild>
                <button
                  type="button"
                  disabled={isDeleting}
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.82rem',
                    background: 'transparent',
                    border: '1px solid var(--min-borders, #cccccc)',
                    color: 'var(--foreground, #111111)',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </Dialog.Close>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                style={{
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.82rem',
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 600,
                  opacity: isDeleting ? 0.6 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
