'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import DeskSidebar from './Desk/DeskSidebar';
import { useLoading } from './LoadingContext';
import styles from '@/app/Styles/desk-editor.module.css';
import {
  ArrowLeft,
  SidebarSimple,
  Globe,
  Trash,
  CornersOut,
} from '@phosphor-icons/react';
import { OutlineItem, EditorStats, SaveStatus } from '@/types';
import type { DeskStory } from './Desk/DeskStoriesTab';
import type { Editor } from '@tiptap/react';

const WritingEditor = dynamic(() => import('./WritingEditor'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        color: 'var(--task-editor-text-muted, #888)',
        fontSize: '0.95rem',
      }}
    >
      Loading studio editor...
    </div>
  ),
});

export interface WriterStudioProps {
  initialId?: string;
}

interface CachedStory {
  title: string;
  content: string;
  isPublished: boolean;
}

export default function WriterStudio({ initialId }: WriterStudioProps) {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { startLoading, stopLoading } = useLoading();

  const routeId = initialId || (params?.id as string) || 'new';
  const [activeId, setActiveId] = useState<string>(routeId);

  const [stories, setStories] = useState<DeskStory[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [, setSaveStatus] = useState<SaveStatus>('saved');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [outline, setOutline] = useState<OutlineItem[]>([]);
  const [activeHeadingPos, setActiveHeadingPos] = useState<number | null>(null);
  const [, setStats] = useState<EditorStats>({ words: 0, characters: 0, readTime: 1 });
  const [loadingStory, setLoadingStory] = useState(true);

  const editorInstanceRef = useRef<Editor | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestDataRef = useRef<{ title: string; content: string; isPublished: boolean }>({
    title: '',
    content: '',
    isPublished: false,
  });
  const lastSavedDataRef = useRef<{ title: string; content: string; isPublished: boolean }>({
    title: '',
    content: '',
    isPublished: false,
  });
  const isSavingRef = useRef(false);

  // In-memory story cache
  const storyCache = useRef<Record<string, CachedStory>>({});

  // Synchronize loading indicator with navbar
  useEffect(() => {
    if (status === 'loading' || loadingStory) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, loadingStory, startLoading, stopLoading]);

  // Fetch lightweight story list for sidebar + current story's full content
  useEffect(() => {
    async function loadData() {
      if (status !== 'authenticated') return;

      try {
        setLoadingStory(true);

        const listRes = await fetch('/api/tasks');
        if (!listRes.ok) throw new Error('Failed to load writings');
        const listData = await listRes.json();
        const allStories: DeskStory[] = listData.tasks || [];
        setStories(allStories);

        // Pre-populate in-memory cache with all user stories from the list
        allStories.forEach((s) => {
          storyCache.current[String(s.id)] = {
            title: s.title || '',
            content: s.description || '',
            isPublished: Boolean(s.status),
          };
        });

        if (routeId === 'new') {
          setTitle('');
          setContent('');
          setIsPublished(false);
          latestDataRef.current = { title: '', content: '', isPublished: false };
          lastSavedDataRef.current = { title: '', content: '', isPublished: false };
          setSaveStatus('saved');
        } else {
          // If story was already returned in the initial list, load it from cache immediately (0ms)
          const existing = allStories.find((s) => String(s.id) === routeId);
          if (existing) {
            const curTitle = existing.title || '';
            const curDesc = existing.description || '';
            const curPub = Boolean(existing.status);

            setTitle(curTitle);
            setContent(curDesc);
            setIsPublished(curPub);
            latestDataRef.current = { title: curTitle, content: curDesc, isPublished: curPub };
            lastSavedDataRef.current = { title: curTitle, content: curDesc, isPublished: curPub };
            setSaveStatus('saved');
          } else {
            const storyRes = await fetch(`/api/tasks/${routeId}`);

            if (!storyRes.ok) {
              router.push('/desk/new');
              return;
            }

            const storyData = await storyRes.json();
            const current = storyData.task;

            if (current) {
              const curTitle = current.title || '';
              const curDesc = current.description || '';
              const curPub = Boolean(current.status);

              setTitle(curTitle);
              setContent(curDesc);
              setIsPublished(curPub);
              latestDataRef.current = { title: curTitle, content: curDesc, isPublished: curPub };
              lastSavedDataRef.current = { title: curTitle, content: curDesc, isPublished: curPub };
              setSaveStatus('saved');

              storyCache.current[routeId] = { title: curTitle, content: curDesc, isPublished: curPub };
            } else {
              router.push('/desk/new');
            }
          }
        }
      } catch (err) {
        console.error('Error loading story:', err);
      } finally {
        setLoadingStory(false);
      }
    }

    loadData();
  }, [routeId, status, router]);

  // Trigger Save function
  const triggerSave = useCallback(
    async (overrides: Partial<CachedStory> = {}) => {
      const curTitle = overrides.title !== undefined ? overrides.title : latestDataRef.current.title;
      const curContent = overrides.content !== undefined ? overrides.content : latestDataRef.current.content;
      const curPublished =
        overrides.isPublished !== undefined ? overrides.isPublished : latestDataRef.current.isPublished;

      const plainText = curContent ? curContent.replace(/<[^>]+>/g, ' ').trim() : '';
      const hasContent = curTitle.trim().length > 0 || plainText.length > 0;

      if (!hasContent) {
        return;
      }

      const changed =
        curTitle.trim() !== lastSavedDataRef.current.title.trim() ||
        curContent.trim() !== lastSavedDataRef.current.content.trim() ||
        curPublished !== lastSavedDataRef.current.isPublished;

      if (!changed) {
        return;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setSaveStatus('saving');

      try {
        const isNewDraft = activeId === 'new';

        if (isNewDraft) {
          const res = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: curTitle.trim() || 'Untitled Story',
              description: curContent,
              status: curPublished,
            }),
          });

          if (!res.ok) throw new Error('Failed to create story');
          const data = await res.json();
          const createdTask = data.task;

          setActiveId(String(createdTask.id));
          window.history.replaceState(null, '', `/desk/${createdTask.id}`);
          setStories((prev) => [createdTask, ...prev]);

          lastSavedDataRef.current = {
            title: createdTask.title,
            content: createdTask.description,
            isPublished: Boolean(createdTask.status),
          };

          storyCache.current[String(createdTask.id)] = {
            title: createdTask.title,
            content: createdTask.description || '',
            isPublished: Boolean(createdTask.status),
          };
        } else {
          const res = await fetch('/api/tasks', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: activeId,
              title: curTitle.trim() || 'Untitled Story',
              description: curContent,
              status: curPublished,
            }),
          });

          if (!res.ok) throw new Error('Failed to update story');
          const data = await res.json();
          const updatedTask = data.task;

          setStories((prev) =>
            prev.map((s) => (String(s.id) === String(updatedTask.id) ? updatedTask : s))
          );

          lastSavedDataRef.current = {
            title: updatedTask.title,
            content: updatedTask.description,
            isPublished: Boolean(updatedTask.status),
          };
        }

        setSaveStatus('saved');
      } catch (err) {
        console.error('Save error:', err);
        setSaveStatus('error');
      } finally {
        isSavingRef.current = false;
      }
    },
    [activeId]
  );

  // Queue debounced auto-save
  const queueAutoSave = useCallback(() => {
    setSaveStatus('saving');
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerSave();
    }, 1000);
  }, [triggerSave]);

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    latestDataRef.current.title = newTitle;

    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].title = newTitle;
    }

    queueAutoSave();
  };

  const handleContentChange = (newHtml: string) => {
    setContent(newHtml);
    latestDataRef.current.content = newHtml;

    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].content = newHtml;
    }

    queueAutoSave();
  };

  const handleTogglePublish = () => {
    const nextStatus = !isPublished;
    setIsPublished(nextStatus);
    latestDataRef.current.isPublished = nextStatus;

    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].isPublished = nextStatus;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    triggerSave({ isPublished: nextStatus });
  };

  const handleSelectStory = (storyId: string | number) => {
    const targetIdStr = String(storyId);
    if (targetIdStr === String(activeId)) return;

    // 1. Instantly snapshot current story's content in memory cache
    if (activeId !== 'new') {
      storyCache.current[activeId] = {
        title: latestDataRef.current.title,
        content: latestDataRef.current.content,
        isPublished: latestDataRef.current.isPublished,
      };
    }

    // 2. Clear auto-save timer and trigger background save without blocking UI
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    triggerSave();

    // 3. Instant 0ms switch from in-memory cache or stories array
    let targetStory = storyCache.current[targetIdStr];
    if (!targetStory) {
      const found = stories.find((s) => String(s.id) === targetIdStr);
      if (found) {
        targetStory = {
          title: found.title || '',
          content: found.description || '',
          isPublished: Boolean(found.status),
        };
        storyCache.current[targetIdStr] = targetStory;
      }
    }

    if (targetStory) {
      setActiveId(targetIdStr);
      setTitle(targetStory.title);
      setContent(targetStory.content);
      setIsPublished(targetStory.isPublished);
      latestDataRef.current = { ...targetStory };
      lastSavedDataRef.current = { ...targetStory };
      setSaveStatus('saved');
      window.history.replaceState(null, '', `/desk/${targetIdStr}`);
      return;
    }

    // 4. Fallback if not yet in cache
    fetch(`/api/tasks/${targetIdStr}`)
      .then((res) => res.json())
      .then((data) => {
        const story = data.task;
        if (story) {
          const loaded = {
            title: story.title || '',
            content: story.description || '',
            isPublished: Boolean(story.status),
          };
          storyCache.current[targetIdStr] = loaded;
          setActiveId(targetIdStr);
          setTitle(loaded.title);
          setContent(loaded.content);
          setIsPublished(loaded.isPublished);
          latestDataRef.current = { ...loaded };
          lastSavedDataRef.current = { ...loaded };
          setSaveStatus('saved');
          window.history.replaceState(null, '', `/desk/${targetIdStr}`);
        }
      })
      .catch((err) => console.error('Error switching story:', err));
  };

  const handleNewStory = () => {
    if (activeId === 'new') return;

    storyCache.current[activeId] = {
      title: latestDataRef.current.title,
      content: latestDataRef.current.content,
      isPublished: latestDataRef.current.isPublished,
    };

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    triggerSave();

    setActiveId('new');
    setTitle('');
    setContent('');
    setIsPublished(false);
    latestDataRef.current = { title: '', content: '', isPublished: false };
    lastSavedDataRef.current = { title: '', content: '', isPublished: false };
    setSaveStatus('saved');

    window.history.replaceState(null, '', '/desk/new');
  };

  const handleDeleteStory = async () => {
    if (activeId === 'new') {
      router.push('/desk');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this story?');
    if (!confirmed) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: activeId }),
      });

      if (!res.ok) throw new Error('Failed to delete story');

      delete storyCache.current[activeId];
      router.push('/desk');
    } catch (err: any) {
      alert('Could not delete story: ' + err.message);
    }
  };

  const handleHeadingClick = (heading: OutlineItem) => {
    if (editorInstanceRef.current && heading.pos !== undefined) {
      setActiveHeadingPos(heading.pos);
      const editor = editorInstanceRef.current;
      editor.chain().focus().setTextSelection(heading.pos + 1).run();

      requestAnimationFrame(() => {
        try {
          const { node } = editor.view.domAtPos((heading.pos || 0) + 1);
          const el = node instanceof HTMLElement ? node : node.parentElement;
          const headingEl = el?.closest('h1, h2, h3, h4, h5, h6') || el;
          if (headingEl instanceof HTMLElement) {
            headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } catch {
          editor.commands.scrollIntoView();
        }
      });
    }
  };

  if (status === 'loading' || loadingStory) {
    return null;
  }

  return (
    <div className={`${styles.studioContainer} ${zenMode ? styles.zenMode : ''}`}>
      <header className={styles.studioHeader}>
        <div className={styles.headerLeft}>
          <Link href="/desk" className={styles.headerBtn} title="Return to Desk">
            <ArrowLeft size={15} weight="regular" />
            <span>Desk</span>
          </Link>

          <button
            type="button"
            className={`${styles.iconOnlyBtn} ${!isSidebarCollapsed ? styles.active : ''}`}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
            title={isSidebarCollapsed ? 'Show stories & outline' : 'Hide sidebar'}
          >
            <SidebarSimple size={15} weight="regular" />
          </button>
        </div>

        <div className={styles.headerRight}>
          <button
            type="button"
            className={`${styles.publishToggle} ${isPublished ? styles.isPublished : styles.isDraft}`}
            onClick={handleTogglePublish}
            title={isPublished ? 'Visible on your public profile' : 'Private draft (only you can see this)'}
          >
            <Globe size={14} weight={isPublished ? 'fill' : 'regular'} />
            <span>{isPublished ? 'Published' : 'Draft'}</span>
          </button>

          <button
            type="button"
            className={`${styles.iconOnlyBtn} ${zenMode ? styles.active : ''}`}
            onClick={() => setZenMode((prev) => !prev)}
            title={zenMode ? 'Exit Zen Mode' : 'Distraction-Free Zen Mode'}
          >
            <CornersOut size={15} weight={zenMode ? 'fill' : 'regular'} />
          </button>

          <button
            type="button"
            className={`${styles.iconOnlyBtn} ${styles.deleteBtn}`}
            onClick={handleDeleteStory}
            title="Delete this story"
          >
            <Trash size={15} weight="regular" />
          </button>
        </div>
      </header>

      <div className={`${styles.studioBody} ${isSidebarCollapsed ? styles.sidebarCollapsed : ''}`}>
        <DeskSidebar
          stories={stories}
          activeStoryId={activeId}
          isCollapsed={isSidebarCollapsed}
          onSelectStory={handleSelectStory}
          onNewStory={handleNewStory}
          outline={outline}
          activeHeadingPos={activeHeadingPos}
          onHeadingClick={handleHeadingClick}
          currentTitle={title}
          currentContent={content}
        />

        <WritingEditor
          title={title}
          content={content}
          onTitleChange={handleTitleChange}
          onContentChange={handleContentChange}
          onOutlineChange={setOutline}
          onStatsChange={setStats}
          activeHeadingPos={activeHeadingPos}
          onActiveHeadingChange={setActiveHeadingPos}
          editorRef={editorInstanceRef}
        />
      </div>
    </div>
  );
}
