'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import WritingEditor from './WritingEditor';
import DeskSidebar from './DeskSidebar';
import { useLoading } from './LoadingContext';
import styles from '../Styles/desk-editor.module.css';
import {
  ArrowLeft,
  SidebarSimple,
  Globe,
  Trash,
  CornersOut,
} from '@phosphor-icons/react';

export default function WriterStudio({ initialId }) {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const { startLoading, stopLoading } = useLoading();

  const routeId = initialId || params?.id || 'new';
  const [activeId, setActiveId] = useState(routeId);

  const [stories, setStories] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'error'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [outline, setOutline] = useState([]);
  const [, setStats] = useState({ words: 0, characters: 0, readTime: 1 });
  const [loadingStory, setLoadingStory] = useState(true);

  const editorInstanceRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const latestDataRef = useRef({ title: '', content: '', isPublished: false });
  const lastSavedDataRef = useRef({ title: '', content: '', isPublished: false });
  const isSavingRef = useRef(false);

  // ─── IN-MEMORY STORY CACHE ───────────────────────────────────────────
  // A plain JavaScript object that remembers stories you've already opened.
  // Structure: { [storyId]: { title, content, isPublished } }
  //
  // - Populated when a story is first loaded from the database
  // - Updated on every keystroke so it always has the latest edits
  // - Checked before fetching — if the story is cached, switch is instant
  // - Cleared automatically on page refresh (it's just a variable in memory)
  // - Never goes stale because you're the only one editing your stories
  const storyCache = useRef({});

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

        // Fetch lightweight list (titles, status, dates — no full content)
        const listRes = await fetch('/api/tasks');
        if (!listRes.ok) throw new Error('Failed to load writings');
        const listData = await listRes.json();
        const allStories = listData.tasks || [];
        setStories(allStories);

        if (routeId === 'new') {
          // Brand new story — empty editor
          setTitle('');
          setContent('');
          setIsPublished(false);
          latestDataRef.current = { title: '', content: '', isPublished: false };
          lastSavedDataRef.current = { title: '', content: '', isPublished: false };
          setSaveStatus('saved');
        } else {
          // Fetch single story's full content from the dedicated endpoint
          const storyRes = await fetch(`/api/tasks/${routeId}`);

          if (!storyRes.ok) {
            // Story not found, redirect to new
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

            // Cache this story so switching back to it later is instant
            storyCache.current[routeId] = { title: curTitle, content: curDesc, isPublished: curPub };
          } else {
            router.push('/desk/new');
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
  const triggerSave = useCallback(async (overrides = {}) => {
    const curTitle = overrides.title !== undefined ? overrides.title : latestDataRef.current.title;
    const curContent = overrides.content !== undefined ? overrides.content : latestDataRef.current.content;
    const curPublished = overrides.isPublished !== undefined ? overrides.isPublished : latestDataRef.current.isPublished;

    // Check if there is anything to save
    const plainText = curContent ? curContent.replace(/<[^>]+>/g, ' ').trim() : '';
    const hasContent = curTitle.trim().length > 0 || plainText.length > 0;

    if (!hasContent) {
      return;
    }

    // Check if changed compared to last saved
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
        // Create new story
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

        // Transition from 'new' to real ID smoothly
        setActiveId(createdTask.id);
        window.history.replaceState(null, '', `/desk/${createdTask.id}`);
        setStories(prev => [createdTask, ...prev]);

        lastSavedDataRef.current = {
          title: createdTask.title,
          content: createdTask.description,
          isPublished: Boolean(createdTask.status),
        };

        // Cache the newly created story
        storyCache.current[createdTask.id] = {
          title: createdTask.title,
          content: createdTask.description || '',
          isPublished: Boolean(createdTask.status),
        };
      } else {
        // Update existing story
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

        setStories(prev =>
          prev.map(s => (s.id === updatedTask.id ? updatedTask : s))
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
  }, [activeId]);

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

  // Handle title changes — also updates the cache
  const handleTitleChange = (newTitle) => {
    setTitle(newTitle);
    latestDataRef.current.title = newTitle;

    // Keep cache in sync with every keystroke
    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].title = newTitle;
    }

    queueAutoSave();
  };

  // Handle content changes — also updates the cache
  const handleContentChange = (newHtml) => {
    setContent(newHtml);
    latestDataRef.current.content = newHtml;

    // Keep cache in sync with every keystroke
    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].content = newHtml;
    }

    queueAutoSave();
  };

  // Toggle publish status
  const handleTogglePublish = () => {
    const nextStatus = !isPublished;
    setIsPublished(nextStatus);
    latestDataRef.current.isPublished = nextStatus;

    // Keep cache in sync
    if (activeId !== 'new' && storyCache.current[activeId]) {
      storyCache.current[activeId].isPublished = nextStatus;
    }

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    triggerSave({ isPublished: nextStatus });
  };

  // ─── SWITCH STORY FROM SIDEBAR (NO PAGE NAVIGATION) ──────────────────
  // Instead of router.push() which destroys and rebuilds the entire page,
  // we swap the data in-place. The editor component stays mounted — only
  // the title, content, and isPublished state change.
  //
  // Flow:
  // 1. Save current story's edits to cache
  // 2. Flush any pending auto-save to database
  // 3. Check if target story is in cache → instant if yes, fetch if no
  // 4. Update state (title, content, isPublished, activeId)
  // 5. Update URL silently with history.replaceState (no navigation)
  const handleSelectStory = async (storyId) => {
    if (String(storyId) === String(activeId)) return;

    // Step 1: Save current story's latest edits to cache
    if (activeId !== 'new') {
      storyCache.current[activeId] = {
        title: latestDataRef.current.title,
        content: latestDataRef.current.content,
        isPublished: latestDataRef.current.isPublished,
      };
    }

    // Step 2: Flush any pending auto-save for the current story
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await triggerSave();

    // Step 3 & 4: Load target story (from cache or database)
    const cached = storyCache.current[storyId];

    if (cached) {
      // INSTANT switch — story was previously loaded or edited
      setActiveId(String(storyId));
      setTitle(cached.title);
      setContent(cached.content);
      setIsPublished(cached.isPublished);
      latestDataRef.current = { title: cached.title, content: cached.content, isPublished: cached.isPublished };
      lastSavedDataRef.current = { title: cached.title, content: cached.content, isPublished: cached.isPublished };
      setSaveStatus('saved');
    } else {
      // Fetch from database (single row by primary key, ~30ms)
      try {
        const res = await fetch(`/api/tasks/${storyId}`);
        if (!res.ok) throw new Error('Failed to load story');
        const data = await res.json();
        const story = data.task;

        if (story) {
          const storyTitle = story.title || '';
          const storyContent = story.description || '';
          const storyPublished = Boolean(story.status);

          setActiveId(String(storyId));
          setTitle(storyTitle);
          setContent(storyContent);
          setIsPublished(storyPublished);
          latestDataRef.current = { title: storyTitle, content: storyContent, isPublished: storyPublished };
          lastSavedDataRef.current = { title: storyTitle, content: storyContent, isPublished: storyPublished };
          setSaveStatus('saved');

          // Cache it so switching back later is instant
          storyCache.current[storyId] = { title: storyTitle, content: storyContent, isPublished: storyPublished };
        }
      } catch (err) {
        console.error('Error loading story:', err);
      }
    }

    // Step 5: Update URL without triggering a page navigation
    window.history.replaceState(null, '', `/desk/${storyId}`);
  };

  // ─── NEW STORY FROM SIDEBAR (NO PAGE NAVIGATION) ─────────────────────
  const handleNewStory = async () => {
    if (activeId === 'new') return;

    // Save current story to cache
    storyCache.current[activeId] = {
      title: latestDataRef.current.title,
      content: latestDataRef.current.content,
      isPublished: latestDataRef.current.isPublished,
    };

    // Flush auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    await triggerSave();

    // Reset editor to blank state
    setActiveId('new');
    setTitle('');
    setContent('');
    setIsPublished(false);
    latestDataRef.current = { title: '', content: '', isPublished: false };
    lastSavedDataRef.current = { title: '', content: '', isPublished: false };
    setSaveStatus('saved');

    // Update URL without navigation
    window.history.replaceState(null, '', '/desk/new');
  };

  // Delete current story
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

      // Remove from cache
      delete storyCache.current[activeId];

      router.push('/desk');
    } catch (err) {
      alert('Could not delete story: ' + err.message);
    }
  };

  // Outline heading click - scroll editor to the heading's DOM element
  const handleHeadingClick = (heading) => {
    if (editorInstanceRef.current) {
      const editor = editorInstanceRef.current;

      // Focus editor and set cursor at the heading position
      editor.chain().focus().setTextSelection(heading.pos + 1).run();

      // Use native DOM scrolling — more reliable than TipTap's scrollIntoView
      // because it properly scrolls any parent container, not just the ProseMirror view
      requestAnimationFrame(() => {
        try {
          const { node } = editor.view.domAtPos(heading.pos + 1);
          const el = node instanceof HTMLElement ? node : node.parentElement;
          const headingEl = el?.closest('h1, h2, h3, h4, h5, h6') || el;
          if (headingEl instanceof HTMLElement) {
            headingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        } catch {
          // Fallback to TipTap's built-in scroll
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
      {/* Studio Top Header */}
      <header className={styles.studioHeader}>
        <div className={styles.headerLeft}>
          <Link href="/desk" className={styles.headerBtn} title="Return to Desk">
            <ArrowLeft size={15} weight="regular" />
            <span>Desk</span>
          </Link>

          <button
            type="button"
            className={`${styles.iconOnlyBtn} ${!isSidebarCollapsed ? styles.active : ''}`}
            onClick={() => setIsSidebarCollapsed(prev => !prev)}
            title={isSidebarCollapsed ? "Show stories & outline" : "Hide sidebar"}
          >
            <SidebarSimple size={15} weight="regular" />
          </button>
        </div>

        <div className={styles.headerRight}>
          {/* Draft / Published Toggle */}
          <button
            type="button"
            className={`${styles.publishToggle} ${isPublished ? styles.isPublished : styles.isDraft}`}
            onClick={handleTogglePublish}
            title={isPublished ? "Visible on your public profile" : "Private draft (only you can see this)"}
          >
            <Globe size={14} weight={isPublished ? "fill" : "regular"} />
            <span>{isPublished ? 'Published' : 'Draft'}</span>
          </button>

          {/* Zen mode toggle */}
          <button
            type="button"
            className={`${styles.iconOnlyBtn} ${zenMode ? styles.active : ''}`}
            onClick={() => setZenMode(prev => !prev)}
            title={zenMode ? "Exit Zen Mode" : "Distraction-Free Zen Mode"}
          >
            <CornersOut size={15} weight={zenMode ? "fill" : "regular"} />
          </button>

          {/* Delete button */}
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

      {/* Studio Workspace: Collapsible Sidebar + Writing Canvas */}
      <div className={styles.studioBody}>
        <DeskSidebar
          stories={stories}
          activeStoryId={activeId}
          isCollapsed={isSidebarCollapsed}
          onSelectStory={handleSelectStory}
          onNewStory={handleNewStory}
          outline={outline}
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
          editorRef={editorInstanceRef}
        />
      </div>
    </div>
  );
}
