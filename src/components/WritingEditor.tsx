'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import {
  TextB,
  TextItalic,
  TextUnderline,
  TextStrikethrough,
  Highlighter,
  TextHOne,
  TextHTwo,
  TextHThree,
  ListBullets,
  ListNumbers,
  CheckSquare,
  Quotes,
  Code,
  Minus,
  LinkSimple,
  ArrowUUpLeft,
  ArrowUUpRight,
  X,
} from '@phosphor-icons/react';
import styles from '@/app/Styles/desk-editor.module.css';
import typographyStyles from '@/app/Styles/story-typography.module.css';
import { OutlineItem, EditorStats } from '@/types';

export interface WritingEditorProps {
  title?: string;
  content?: string;
  onTitleChange?: (title: string) => void;
  onContentChange?: (content: string) => void;
  onOutlineChange?: (outline: OutlineItem[]) => void;
  onStatsChange?: (stats: EditorStats) => void;
  activeHeadingPos?: number | null;
  onActiveHeadingChange?: (pos: number | null) => void;
  editorRef?: React.MutableRefObject<Editor | null>;
  onCanvasClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

export default function WritingEditor({
  title = '',
  content = '',
  onTitleChange,
  onContentChange,
  onOutlineChange,
  onStatsChange,
  activeHeadingPos,
  onActiveHeadingChange,
  editorRef,
  onCanvasClick,
}: WritingEditorProps) {
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setSelectionTick] = useState(0);
  const headingsRef = useRef<OutlineItem[]>([]);
  const activeHeadingPosRef = useRef<number | null>(activeHeadingPos ?? null);
  activeHeadingPosRef.current = activeHeadingPos ?? null;
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkSelectionRange, setLinkSelectionRange] = useState<{ from: number; to: number } | null>(null);

  const [wordCount, setWordCount] = useState(() => {
    if (!content) return 0;
    const plain = content.replace(/<[^>]+>/g, ' ').trim();
    return plain ? plain.split(/\s+/).filter(Boolean).length : 0;
  });

  // Auto-resize title textarea to fit text without scrollbar
  const autoResizeTitle = useCallback(() => {
    if (titleTextareaRef.current) {
      titleTextareaRef.current.style.height = 'auto';
      titleTextareaRef.current.style.height = `${titleTextareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTitle();
  }, [title, autoResizeTitle]);

  // Extract H1, H2, H3 headings for outline
  const extractHeadings = useCallback((editorInstance: Editor | null): OutlineItem[] => {
    if (!editorInstance) return [];
    const headings: OutlineItem[] = [];
    editorInstance.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const text = node.textContent.trim();
        if (text) {
          headings.push({
            level: node.attrs.level,
            text,
            pos,
          });
        }
      }
    });
    return headings;
  }, []);

  const handleHeadingsExtracted = useCallback(
    (headings: OutlineItem[]) => {
      headingsRef.current = headings;
      if (onOutlineChange) {
        onOutlineChange(headings);
      }
    },
    [onOutlineChange]
  );

  // Configure TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({
        placeholder: 'Tell your story... Type "/" for commands or format using the toolbar above.',
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Highlight.configure({ multicolor: true }),
      TextStyle,
      Color.configure({ types: ['textStyle'] }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: `${styles.customLink} custom-link` },
      }),
      CharacterCount,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: content || '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `${styles.tiptapEditor} ${typographyStyles.storyContent}`,
      },
      transformPastedHTML(html) {
        if (!html) return html;
        // Strip hardcoded colors & background styling to ensure pasted text adapts seamlessly to dark/light themes
        return html
          .replace(/(style="[^"]*?)color\s*:\s*[^;"]+;?/gi, '$1')
          .replace(/(style="[^"]*?)background-color\s*:\s*[^;"]+;?/gi, '$1')
          .replace(/(style="[^"]*?)background\s*:\s*[^;"]+;?/gi, '$1')
          .replace(/<font\b[^>]*color=[^>]*>/gi, '')
          .replace(/<\/font>/gi, '');
      },
    },
    onCreate: ({ editor: ed }) => {
      const headings = extractHeadings(ed);
      handleHeadingsExtracted(headings);
      if (headings.length > 0 && onActiveHeadingChange) {
        onActiveHeadingChange(headings[0].pos ?? null);
      }
      const text = ed.getText().trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      setWordCount(words);
      if (onStatsChange) {
        const characters = text.length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        onStatsChange({ words, characters, readTime });
      }
    },
    onSelectionUpdate: ({ editor: ed }) => {
      setSelectionTick((t) => t + 1);
      if (!headingsRef.current || headingsRef.current.length === 0) return;
      const cursorPos = ed.state.selection.from;
      const headings = headingsRef.current;

      let activePos: number | null = headings[0].pos ?? null;
      for (let i = 0; i < headings.length; i++) {
        const item = headings[i];
        if (item.pos !== undefined && item.pos <= cursorPos) {
          activePos = item.pos;
        } else {
          break;
        }
      }

      if (activePos !== null && activePos !== activeHeadingPosRef.current) {
        activeHeadingPosRef.current = activePos;
        if (onActiveHeadingChange) onActiveHeadingChange(activePos);
      }
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1);
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (onContentChange) onContentChange(html);

      // Extract outline
      const headings = extractHeadings(ed);
      handleHeadingsExtracted(headings);

      // Compute statistics purely from typed content in editor
      const text = ed.getText().trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      setWordCount(words);

      if (onStatsChange) {
        const characters = text.length;
        const readTime = Math.max(1, Math.ceil(words / 200));
        onStatsChange({ words, characters, readTime });
      }
    },
  });

  // Update active heading from scroll position in canvasWrapper
  const updateActiveHeadingFromScroll = useCallback(() => {
    if (!editor || !headingsRef.current || headingsRef.current.length === 0) return;

    const container = canvasWrapperRef.current;
    if (!container) return;

    const headings = headingsRef.current;
    const containerRect = container.getBoundingClientRect();
    const READING_OFFSET = 120; // Reading threshold below sticky toolbar

    // 1. If scrolled to near the bottom of canvasWrapper
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 40) {
      const lastHeading = headings[headings.length - 1];
      if (lastHeading?.pos !== undefined && lastHeading.pos !== activeHeadingPosRef.current) {
        activeHeadingPosRef.current = lastHeading.pos;
        if (onActiveHeadingChange) onActiveHeadingChange(lastHeading.pos);
      }
      return;
    }

    // 2. Find the last heading whose top has reached or passed the reading line
    let activePos: number | null = headings[0].pos ?? null;

    for (let i = 0; i < headings.length; i++) {
      const item = headings[i];
      if (item.pos === undefined) continue;

      try {
        const { node } = editor.view.domAtPos(item.pos + 1);
        const el = node instanceof HTMLElement ? node : node?.parentElement;
        const headingEl = el?.closest('h1, h2, h3, h4, h5, h6') || el;

        if (headingEl instanceof HTMLElement) {
          const rect = headingEl.getBoundingClientRect();
          const relTop = rect.top - containerRect.top;

          if (relTop <= READING_OFFSET) {
            activePos = item.pos;
          } else {
            break;
          }
        }
      } catch {
        // Fallback
      }
    }

    if (activePos !== null && activePos !== activeHeadingPosRef.current) {
      activeHeadingPosRef.current = activePos;
      if (onActiveHeadingChange) onActiveHeadingChange(activePos);
    }
  }, [editor, onActiveHeadingChange]);

  // Attach scroll listener to canvasWrapper to track active heading as user scrolls
  useEffect(() => {
    const container = canvasWrapperRef.current;
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveHeadingFromScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [updateActiveHeadingFromScroll]);

  // Expose editor instance
  useEffect(() => {
    if (editorRef) {
      editorRef.current = editor;
    }
  }, [editor, editorRef]);

  // Synchronize content when switching stories
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (editor && content !== prevContentRef.current) {
      // Only set content if it truly came from an external story switch
      if (editor.getHTML() !== content) {
        editor.commands.setContent(content || '', { emitUpdate: false });
        const headings = extractHeadings(editor);
        handleHeadingsExtracted(headings);
        if (headings.length > 0 && onActiveHeadingChange) {
          onActiveHeadingChange(headings[0].pos ?? null);
        }
        const text = editor.getText().trim();
        const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
        setWordCount(words);
        if (onStatsChange) {
          const characters = text.length;
          const readTime = Math.max(1, Math.ceil(words / 200));
          onStatsChange({ words, characters, readTime });
        }
      }
      prevContentRef.current = content;
    }
  }, [content, editor, extractHeadings, handleHeadingsExtracted, onActiveHeadingChange, onStatsChange]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.commands.focus('start');
      }
    }
  };

  const openLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    const previousUrl = editor.getAttributes('link').href || '';

    setLinkUrl(previousUrl);
    setLinkText(selectedText);
    setLinkSelectionRange({ from, to });
    setIsLinkModalOpen(true);
  };

  const handleApplyLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editor) return;

    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setIsLinkModalOpen(false);
      return;
    }

    const formattedUrl = /^(https?:\/\/|mailto:|\/)/i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    if (linkSelectionRange) {
      const currentSelectedText = editor.state.doc.textBetween(
        linkSelectionRange.from,
        linkSelectionRange.to,
        ' '
      );
      if (linkText && linkText !== currentSelectedText) {
        editor
          .chain()
          .focus()
          .setTextSelection(linkSelectionRange)
          .insertContent({
            type: 'text',
            text: linkText,
            marks: [{ type: 'link', attrs: { href: formattedUrl } }],
          })
          .run();
        setIsLinkModalOpen(false);
        return;
      }
    }

    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: formattedUrl })
      .run();

    setIsLinkModalOpen(false);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsLinkModalOpen(false);
  };

  if (!editor) return null;

  return (
    <div
      className={styles.canvasWrapper}
      ref={canvasWrapperRef}
      onClick={onCanvasClick}
    >
      <div className={styles.canvasInner}>
        {/* Floating/Sticky Formatting Toolbar */}
        <div className={styles.toolbarContainer}>
          {/* Text Styles */}
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('bold') ? styles.active : ''}`}
              title="Bold (Ctrl+B)"
            >
              <TextB size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('italic') ? styles.active : ''}`}
              title="Italic (Ctrl+I)"
            >
              <TextItalic size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('underline') ? styles.active : ''}`}
              title="Underline (Ctrl+U)"
            >
              <TextUnderline size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('strike') ? styles.active : ''}`}
              title="Strikethrough"
            >
              <TextStrikethrough size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('highlight') ? styles.active : ''}`}
              title="Highlight"
            >
              <Highlighter size={15} weight="regular" />
            </button>
          </div>

          {/* Headings */}
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 1 }) ? styles.active : ''}`}
              title="Heading 1"
            >
              <TextHOne size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 2 }) ? styles.active : ''}`}
              title="Heading 2"
            >
              <TextHTwo size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`${styles.toolbarBtn} ${editor.isActive('heading', { level: 3 }) ? styles.active : ''}`}
              title="Heading 3"
            >
              <TextHThree size={15} weight="regular" />
            </button>
          </div>

          {/* Lists */}
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('bulletList') ? styles.active : ''}`}
              title="Bullet List"
            >
              <ListBullets size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('orderedList') ? styles.active : ''}`}
              title="Numbered List"
            >
              <ListNumbers size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('taskList') ? styles.active : ''}`}
              title="Task List"
            >
              <CheckSquare size={15} weight="regular" />
            </button>
          </div>

          {/* Quotes & Code */}
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('blockquote') ? styles.active : ''}`}
              title="Quote"
            >
              <Quotes size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`${styles.toolbarBtn} ${editor.isActive('codeBlock') ? styles.active : ''}`}
              title="Code Block"
            >
              <Code size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              className={styles.toolbarBtn}
              title="Divider"
            >
              <Minus size={15} weight="regular" />
            </button>
          </div>

          {/* Links & History */}
          <div className={styles.toolbarGroup}>
            <button
              type="button"
              onClick={openLinkModal}
              className={`${styles.toolbarBtn} ${editor.isActive('link') ? styles.active : ''}`}
              title="Insert Link"
            >
              <LinkSimple size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className={styles.toolbarBtn}
              title="Undo (Ctrl+Z)"
            >
              <ArrowUUpLeft size={15} weight="regular" />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className={styles.toolbarBtn}
              title="Redo (Ctrl+Y)"
            >
              <ArrowUUpRight size={15} weight="regular" />
            </button>
          </div>
        </div>

        {/* Story Headline (Auto-expanding) */}
        <textarea
          ref={titleTextareaRef}
          className={styles.titleTextarea}
          placeholder="Title of your story..."
          value={title}
          onChange={(e) => {
            if (onTitleChange) onTitleChange(e.target.value);
            autoResizeTitle();
          }}
          onKeyDown={handleTitleKeyDown}
          rows={1}
        />

        {/* TipTap Canvas */}
        <div className={styles.editorWrapper}>
          <EditorContent editor={editor} className={typographyStyles.storyContent} />
        </div>

        {/* Live Word Count Indicator */}
        <div className={styles.editorStatusBar}>
          <span className={styles.liveWordCount}>
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>

        {/* Custom Hyperlink Modal Dialog */}
        {isLinkModalOpen && (
          <div
            className={styles.linkModalOverlay}
            onClick={() => setIsLinkModalOpen(false)}
          >
            <div
              className={styles.linkModalDialog}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.linkModalHeader}>
                <h3 className={styles.linkModalTitle}>
                  {editor.getAttributes('link').href ? 'Edit Hyperlink' : 'Insert Hyperlink'}
                </h3>
                <button
                  type="button"
                  className={styles.linkModalCloseBtn}
                  onClick={() => setIsLinkModalOpen(false)}
                  aria-label="Close"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleApplyLink}>
                <div className={styles.linkModalBody}>
                  <div className={styles.linkFieldGroup}>
                    <label className={styles.linkFieldLabel}>Display Text</label>
                    <input
                      type="text"
                      className={styles.linkFieldInput}
                      placeholder="Text to display..."
                      value={linkText}
                      onChange={(e) => setLinkText(e.target.value)}
                    />
                  </div>

                  <div className={styles.linkFieldGroup}>
                    <label className={styles.linkFieldLabel}>Link Destination (URL)</label>
                    <input
                      type="text"
                      className={styles.linkFieldInput}
                      placeholder="https://example.com"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className={styles.linkModalFooter}>
                  {editor.getAttributes('link').href && (
                    <button
                      type="button"
                      className={`${styles.linkModalBtn} ${styles.linkModalBtnDanger}`}
                      onClick={handleRemoveLink}
                    >
                      Remove Link
                    </button>
                  )}
                  <div className={styles.linkModalActionsRight}>
                    <button
                      type="button"
                      className={styles.linkModalBtn}
                      onClick={() => setIsLinkModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`${styles.linkModalBtn} ${styles.linkModalBtnPrimary}`}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
