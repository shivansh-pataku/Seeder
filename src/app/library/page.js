'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLoading } from '../Components/LoadingContext';
import styles from '../Styles/library.module.css';
import {
  BookmarksSimple,
  Heart,
  Folder,
  ArrowLeft,
  ArrowRight,
  BookOpen,
} from '@phosphor-icons/react';

export default function LibraryPage() {
  const { status } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('saves'); // 'saves' | 'likes'
  const [selectedFolderId, setSelectedFolderId] = useState(null); // null means all / top-level folders view

  const [folders, setFolders] = useState([]);
  const [savedStories, setSavedStories] = useState([]);
  const [likedStories, setLikedStories] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Synchronize loading indicator with navbar
  useEffect(() => {
    if (status === 'loading' || loadingData) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, loadingData, startLoading, stopLoading]);

  // Auth protection
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/library');
    }
  }, [status, router]);

  // Fetch all library data
  useEffect(() => {
    if (status !== 'authenticated') return;

    async function loadLibrary() {
      setLoadingData(true);
      try {
        const [foldersRes, savedRes, likesRes] = await Promise.all([
          fetch('/api/folders'),
          fetch('/api/saved-items'),
          fetch('/api/likes'),
        ]);

        if (foldersRes.ok) {
          const fData = await foldersRes.json();
          setFolders(fData.data?.folders || fData.folders || []);
        }

        if (savedRes.ok) {
          const sData = await savedRes.json();
          setSavedStories(sData.data?.savedStories || sData.savedStories || []);
        }

        if (likesRes.ok) {
          const lData = await likesRes.json();
          setLikedStories(lData.data?.likedStories || lData.likedStories || []);
        }
      } catch (err) {
        console.error('Failed to load library items:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadLibrary();
  }, [status]);

  // Group saved stories by folder ID
  const storiesByFolder = useMemo(() => {
    const map = { root: [] };
    folders.forEach((f) => {
      map[f.id] = [];
    });

    savedStories.forEach((item) => {
      const fId = item.folder_id;
      if (fId && map[fId]) {
        map[fId].push(item);
      } else {
        map.root.push(item);
      }
    });

    return map;
  }, [folders, savedStories]);

  const selectedFolder = useMemo(() => {
    if (!selectedFolderId) return null;
    return folders.find((f) => String(f.id) === String(selectedFolderId)) || null;
  }, [folders, selectedFolderId]);

  const storiesInActiveFolder = useMemo(() => {
    if (!selectedFolderId) return [];
    return storiesByFolder[selectedFolderId] || [];
  }, [storiesByFolder, selectedFolderId]);

  if (status === 'loading' || (loadingData && savedStories.length === 0 && likedStories.length === 0)) {
    return null;
  }

  return (
    <div className={styles.libraryContainer}>
      {/* ===================================================================
          PERMANENT SIDEBAR
          =================================================================== */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <BookOpen size={18} weight="bold" />
          <span>Your Library</span>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'saves' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('saves');
              setSelectedFolderId(null);
            }}
          >
            <div className={styles.navItemLeft}>
              <BookmarksSimple size={16} weight={activeTab === 'saves' ? 'fill' : 'regular'} />
              <span>Saves</span>
            </div>
            <span className={styles.navBadge}>{savedStories.length}</span>
          </button>

          <button
            type="button"
            className={`${styles.navItem} ${activeTab === 'likes' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('likes');
              setSelectedFolderId(null);
            }}
          >
            <div className={styles.navItemLeft}>
              <Heart size={16} weight={activeTab === 'likes' ? 'fill' : 'regular'} />
              <span>Liked Items</span>
            </div>
            <span className={styles.navBadge}>{likedStories.length}</span>
          </button>
        </nav>
      </aside>

      {/* ===================================================================
          MAIN CONTENT AREA
          =================================================================== */}
      <main className={styles.mainContent}>
        {/* VIEW 1: SAVES */}
        {activeTab === 'saves' && (
          <div>
            {/* Header / Breadcrumb */}
            <div className={styles.contentHeader}>
              {selectedFolder ? (
                <div>
                  <div className={styles.breadcrumbRow}>
                    <button
                      type="button"
                      className={styles.backBtn}
                      onClick={() => setSelectedFolderId(null)}
                    >
                      <ArrowLeft size={13} weight="bold" />
                      <span>All Folders</span>
                    </button>
                    <span>/</span>
                    <span>{selectedFolder.name}</span>
                  </div>
                  <h1 className={styles.pageTitle}>{selectedFolder.name}</h1>
                  <p className={styles.pageSubtitle}>
                    {storiesInActiveFolder.length}{' '}
                    {storiesInActiveFolder.length === 1 ? 'saved story' : 'saved stories'} in this folder.
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className={styles.pageTitle}>Saved Stories</h1>
                  <p className={styles.pageSubtitle}>
                    Articles and essays bookmarked into your reading folders.
                  </p>
                </div>
              )}
            </div>

            {/* Folder View: If a specific folder is clicked, show its contents */}
            {selectedFolder ? (
              storiesInActiveFolder.length > 0 ? (
                <div className={styles.storiesList}>
                  {storiesInActiveFolder.map((story) => (
                    <div
                      key={story.saved_item_id || story.id}
                      className={styles.storyRowCard}
                      onClick={() => router.push(`/read/${story.id}`)}
                    >
                      <div className={styles.storyRowLeft}>
                        <h3 className={styles.storyRowTitle}>{story.title || 'Untitled Story'}</h3>
                        <div className={styles.storyRowMeta}>
                          {story.name && <span>By {story.name}</span>}
                          {story.name && <span>•</span>}
                          <span>
                            {story.saved_at
                              ? new Date(story.saved_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Saved'}
                          </span>
                        </div>
                      </div>
                      <div className={styles.storyRowActions}>
                        <button type="button" className={styles.storyRowActionBtn} title="Read Story">
                          <ArrowRight size={13} weight="bold" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyCard}>
                  <Folder size={38} weight="regular" className={styles.emptyIcon} />
                  <p className={styles.emptyTitle}>Folder is Empty</p>
                  <p className={styles.emptyDesc}>
                    You have not saved any stories to this folder yet. While reading any article, click the bookmark icon and choose &quot;{selectedFolder.name}&quot;.
                  </p>
                </div>
              )
            ) : (
              /* All Folders View: Big Folder Cards UI + Root/Unsorted */
              <div>
                {folders.length > 0 && (
                  <div>
                    <h2 className={styles.sectionTitle}>
                      <Folder size={15} weight="regular" />
                      <span>Folders ({folders.length})</span>
                    </h2>

                    <div className={styles.bigFoldersGrid}>
                      {folders.map((folder) => {
                        const inFolder = storiesByFolder[folder.id] || [];
                        const previewTitles = inFolder.slice(0, 3);

                        return (
                          <div
                            key={folder.id}
                            className={styles.folderCard}
                            onClick={() => setSelectedFolderId(folder.id)}
                            title={`Open folder ${folder.name}`}
                          >
                            <div>
                              <div className={styles.folderCardTop}>
                                <div className={styles.folderHeaderLeft}>
                                  <div className={styles.folderIconWrapper}>
                                    <Folder size={20} weight="fill" />
                                  </div>
                                  <h3 className={styles.folderName}>{folder.name}</h3>
                                </div>
                                <span className={styles.folderCountBadge}>
                                  {inFolder.length} {inFolder.length === 1 ? 'story' : 'stories'}
                                </span>
                              </div>

                              {previewTitles.length > 0 ? (
                                <ul className={styles.folderPreviewList}>
                                  {previewTitles.map((item, idx) => (
                                    <li key={idx} className={styles.folderPreviewItem}>
                                      <span className={styles.folderPreviewBullet} />
                                      <span>{item.title || 'Untitled Story'}</span>
                                    </li>
                                  ))}
                                  {inFolder.length > 3 && (
                                    <li className={styles.folderPreviewItem} style={{ color: 'var(--task-editor-text-muted)' }}>
                                      <span>+ {inFolder.length - 3} more</span>
                                    </li>
                                  )}
                                </ul>
                              ) : (
                                <p className={styles.folderEmptyNotice}>Empty folder</p>
                              )}
                            </div>

                            <div className={styles.folderCardBottom}>
                              <span>Open Folder →</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* All Saved Items List */}
                <h2 className={styles.sectionTitle}>
                  <BookmarksSimple size={15} weight="regular" />
                  <span>All Saved Stories ({savedStories.length})</span>
                </h2>

                {savedStories.length > 0 ? (
                  <div className={styles.storiesList}>
                    {savedStories.map((story) => (
                      <div
                        key={story.saved_item_id || story.id}
                        className={styles.storyRowCard}
                        onClick={() => router.push(`/read/${story.id}`)}
                      >
                        <div className={styles.storyRowLeft}>
                          <h3 className={styles.storyRowTitle}>{story.title || 'Untitled Story'}</h3>
                          <div className={styles.storyRowMeta}>
                            {story.folder_name && (
                              <span style={{ color: 'var(--editor-accent)', fontWeight: 600 }}>
                                [{story.folder_name}]
                              </span>
                            )}
                            {story.name && <span>By {story.name}</span>}
                            <span>•</span>
                            <span>
                              {story.saved_at
                                ? new Date(story.saved_at).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })
                                : 'Saved'}
                            </span>
                          </div>
                        </div>
                        <div className={styles.storyRowActions}>
                          <button type="button" className={styles.storyRowActionBtn} title="Read Story">
                            <ArrowRight size={13} weight="bold" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyCard}>
                    <BookmarksSimple size={42} weight="regular" className={styles.emptyIcon} />
                    <p className={styles.emptyTitle}>No Saved Stories Yet</p>
                    <p className={styles.emptyDesc}>
                      Click the bookmark icon on any story to save it to your library and organize it into folders.
                    </p>
                    <Link href="/" className={styles.backBtn} style={{ marginTop: '0.5rem' }}>
                      Browse Stories
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: LIKED ITEMS */}
        {activeTab === 'likes' && (
          <div>
            <div className={styles.contentHeader}>
              <h1 className={styles.pageTitle}>Liked Stories</h1>
              <p className={styles.pageSubtitle}>
                Articles and essays you have liked across the platform ({likedStories.length}).
              </p>
            </div>

            {likedStories.length > 0 ? (
              <div className={styles.storiesList}>
                {likedStories.map((story) => (
                  <div
                    key={story.id}
                    className={styles.storyRowCard}
                    onClick={() => router.push(`/read/${story.id}`)}
                  >
                    <div className={styles.storyRowLeft}>
                      <h3 className={styles.storyRowTitle}>{story.title || 'Untitled Story'}</h3>
                      <div className={styles.storyRowMeta}>
                        <span style={{ color: '#e11d48', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Heart size={12} weight="fill" />
                          <span>{story.likes_count || 1}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {story.liked_at
                            ? new Date(story.liked_at).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Liked'}
                        </span>
                      </div>
                    </div>
                    <div className={styles.storyRowActions}>
                      <button type="button" className={styles.storyRowActionBtn} title="Read Story">
                        <ArrowRight size={13} weight="bold" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyCard}>
                <Heart size={42} weight="regular" className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>No Liked Stories</p>
                <p className={styles.emptyDesc}>
                  Whenever you appreciate a story, click the heart icon to add it to your personal likes.
                </p>
                <Link href="/" className={styles.backBtn} style={{ marginTop: '0.5rem' }}>
                  Explore Stories
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
