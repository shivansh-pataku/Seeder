'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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
import styles from '../Styles/desk-editor.module.css';
import typographyStyles from '../Styles/story-typography.module.css';

export default function WritingEditor({
  title = '',
  content = '',
  onTitleChange,
  onContentChange,
  onOutlineChange,
  onStatsChange,
  editorRef,
}) {
  const titleTextareaRef = useRef(null);
  const [, setSelectionTick] = useState(0);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkSelectionRange, setLinkSelectionRange] = useState(null);

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
  const extractHeadings = useCallback((editorInstance) => {
    if (!editorInstance) return [];
    const headings = [];
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
    onSelectionUpdate: () => {
      setSelectionTick((t) => t + 1);
    },
    onTransaction: () => {
      setSelectionTick((t) => t + 1);
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      if (onContentChange) onContentChange(html);

      // Extract outline
      if (onOutlineChange) {
        onOutlineChange(extractHeadings(ed));
      }

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
        editor.commands.setContent(content || '', false);
        if (onOutlineChange) onOutlineChange(extractHeadings(editor));
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
  }, [content, editor, extractHeadings, onOutlineChange, onStatsChange]);

  const handleTitleKeyDown = (e) => {
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

  const handleApplyLink = (e) => {
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
    <div className={styles.canvasWrapper}>
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
            onTitleChange(e.target.value);
            autoResizeTitle();
          }}
          onKeyDown={handleTitleKeyDown}
          rows={1}
        />

        {/* TipTap Canvas */}
        <div className={styles.editorWrapper}>
          <EditorContent editor={editor} className={typographyStyles.storyContent} />
        </div>

        {/* Live Word Count Indicator (computed purely from typed content in editor) */}
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
