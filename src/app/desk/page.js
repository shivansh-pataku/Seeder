'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import WritingCard from '../Components/WritingCard';
import { useLoading } from '../Components/LoadingContext';
import styles from '../Styles/desk.module.css';
import { PencilSimple, MagnifyingGlass, Article } from '@phosphor-icons/react';

export default function DeskPage() {
  const { status } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const router = useRouter();

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'drafts' | 'published'

  // Synchronize loading indicator with navbar
  useEffect(() => {
    if (status === 'loading' || loading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, loading, startLoading, stopLoading]);

  // Fetch stories
  useEffect(() => {
    async function fetchStories() {
      if (status !== 'authenticated') return;

      setLoading(true);
      try {
        const res = await fetch('/api/tasks');
        if (!res.ok) throw new Error('Failed to fetch writings');
        const data = await res.json();
        setStories(data.tasks || []);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchStories();
  }, [status]);

  // Publish / Draft toggle
  const handleTogglePublish = async (storyId, currentPublished) => {
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
    } catch (err) {
      console.error('Error toggling publish status:', err);
      alert('Could not update status: ' + err.message);
    }
  };

  // Delete story
  const handleDeleteStory = async (storyId) => {
    const confirmed = window.confirm('Are you sure you want to delete this story? This cannot be undone.');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: storyId }),
      });

      if (!res.ok) throw new Error('Failed to delete story');

      setStories(prev => prev.filter(story => story.id !== storyId));
    } catch (err) {
      console.error('Error deleting story:', err);
      alert('Could not delete story: ' + err.message);
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
      {/* Desk Header */}
      {/* <header className={styles.deskHeader}>
        <div className={styles.deskTitleSection}>
          <h1 className={styles.deskTitle}>Author&apos;s Desk</h1>
          <p className={styles.deskSubtitle}>
            Your personal writing workspace. Draft private essays or publish stories to your public profile.
          </p>
        </div>

        <Link href="/desk/new" className={styles.newStoryButton}>
          <PencilSimple size={16} weight="regular" />
          <span>Write Story</span>
        </Link>
      </header> */}

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
            <WritingCard
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
    </div>
  );
}
