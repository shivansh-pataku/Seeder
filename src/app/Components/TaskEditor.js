'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Trash,
  FloppyDisk,
  Palette,
  SidebarSimple,
  X,
} from '@phosphor-icons/react';
import styles from '../Styles/taskeditor.module.css';

export default function TaskEditor({ task, onSave, onDelete, onClose, isCreating = false, isSidebarCollapsed = false, onToggleSidebar }) {
  const [title, setTitle] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSavedData, setLastSavedData] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false);
  const titleRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const colorInputRef = useRef(null);

  // TipTap Editor with Full Features
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Placeholder.configure({
        placeholder: 'Enter manure (description)... Required for saving! Use / for commands, or toolbar above...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color.configure({
        types: ['textStyle'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'custom-link',
        },
      }),
      CharacterCount,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.tiptapEditor,
      },
    },
  });

  // Auto-resize textarea function
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  const getPlainText = useCallback(() => {
    return editor ? editor.getText().trim() : '';
  }, [editor]);

  const hasContentChanged = useCallback(() => {
    const currentTitle = title.trim();
    const currentDescription = editor ? editor.getHTML().trim() : '';
    const lastTitle = lastSavedData.title.trim();
    const lastDescription = lastSavedData.description.trim();

    return currentTitle !== lastTitle || currentDescription !== lastDescription;
  }, [title, editor, lastSavedData]);

  // Keep track of latest unsaved changes to avoid stale closure race conditions
  const latestDataRef = useRef({ title: '', description: '' });
  useEffect(() => {
    latestDataRef.current = {
      title: title,
      description: editor ? editor.getHTML() : ''
    };
  }, [title, editor]);

  const isSavingRef = useRef(false);

  // Thread-safe trigger save function
  const triggerSave = useCallback(async () => {
    if (!onSave || !task) return;

    const currentTitle = latestDataRef.current.title.trim();
    const currentDescription = latestDataRef.current.description.trim();
    const lastTitle = lastSavedData.title.trim();
    const lastDescription = lastSavedData.description.trim();

    const hasChanged = currentTitle !== lastTitle || currentDescription !== lastDescription;
    const isNotEmpty = currentTitle || (editor && editor.getText().trim());

    if (!hasChanged || !isNotEmpty) {
      return;
    }

    if (isSavingRef.current) {
      // Already saving, queue another save after it finishes
      return;
    }

    isSavingRef.current = true;
    setIsSaving(true);

    const dataToSave = {
      ...task,
      title: currentTitle || 'Untitled',
      description: currentDescription,
    };

    try {
      await onSave(dataToSave);
      setLastSavedData({
        title: dataToSave.title,
        description: dataToSave.description,
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      // Check if user made further edits while the save request was in-flight
      const nextTitle = latestDataRef.current.title.trim();
      const nextDescription = latestDataRef.current.description.trim();
      const savedTitle = dataToSave.title.trim();
      const savedDescription = dataToSave.description.trim();

      if (nextTitle !== savedTitle || nextDescription !== savedDescription) {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
        autoSaveTimeoutRef.current = setTimeout(() => {
          triggerSave();
        }, 3000);
      }
    }
  }, [task, onSave, lastSavedData, editor]);

  // Synchronize loading and task switching
  const lastTaskIdRef = useRef(null);
  const prevTaskRef = useRef(task);

  useEffect(() => {
    if (task && editor) {
      const initialTitle = task.title || '';
      const initialDescription = task.description || '';

      const taskIdChanged = lastTaskIdRef.current !== task.id;
      const isTransitioningFromTemp = lastTaskIdRef.current &&
        String(lastTaskIdRef.current).startsWith('temp_') &&
        !String(task.id).startsWith('temp_');

      if (taskIdChanged) {
        if (isTransitioningFromTemp) {
          // It's the same task transitioning from temporary ID to database ID.
          // Just update the reference ID and saved data, do not overwrite the editor's contents.
          lastTaskIdRef.current = task.id;
          setLastSavedData({
            title: initialTitle,
            description: initialDescription
          });
        } else {
          // User switched to a completely different task:
          // 1. Flush any unsaved changes for the previous task first
          const prevTask = prevTaskRef.current;
          if (prevTask && prevTask.id === lastTaskIdRef.current) {
            const currentTitle = title.trim();
            const currentDescription = editor.getHTML().trim();
            const lastTitle = lastSavedData.title.trim();
            const lastDescription = lastSavedData.description.trim();
            const hasChanged = currentTitle !== lastTitle || currentDescription !== lastDescription;

            if (hasChanged && (currentTitle || editor.getText().trim())) {
              const dataToSave = {
                ...prevTask,
                title: currentTitle || 'Untitled',
                description: currentDescription,
              };
              console.log('Flushing unsaved changes for task:', prevTask.id);
              onSave(dataToSave);
            }
          }

          // 2. Clear any pending timeouts
          if (autoSaveTimeoutRef.current) {
            clearTimeout(autoSaveTimeoutRef.current);
          }
          setIsTyping(false);

          // 3. Load the new task content
          setTitle(initialTitle);
          editor.commands.setContent(initialDescription, false);
          setLastSavedData({
            title: initialTitle,
            description: initialDescription
          });

          lastTaskIdRef.current = task.id;
          prevTaskRef.current = task;

          setTimeout(() => {
            autoResizeTextarea(titleRef.current);
          }, 0);

          if (isCreating) {
            setTimeout(() => {
              editor.commands.focus();
            }, 100);
          }
        }
      }
    } else if (!task) {
      lastTaskIdRef.current = null;
      prevTaskRef.current = null;
    }
  }, [task, isCreating, editor, onSave, lastSavedData, title]);

  // Debounced auto-save triggers for typing/edits
  const handleDescriptionChange = useCallback(() => {
    if (onSave && task) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      setIsTyping(true);

      autoSaveTimeoutRef.current = setTimeout(() => {
        triggerSave();
        setIsTyping(false);
      }, 3000);
    }
  }, [task, onSave, triggerSave]);

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    autoResizeTextarea(e.target);

    if (onSave && task) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      setIsTyping(true);
      autoSaveTimeoutRef.current = setTimeout(() => {
        triggerSave();
        setIsTyping(false);
      }, 3000);
    }
  };

  // Bind change listeners to TipTap editor updates
  useEffect(() => {
    if (!editor) return;

    const onUpdateHandler = () => {
      handleDescriptionChange();
    };

    editor.on('update', onUpdateHandler);

    return () => {
      editor.off('update', onUpdateHandler);
    };
  }, [editor, handleDescriptionChange]);

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.commands.focus();
      }
    }
  };

  const handleManualSave = () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    triggerSave();
    setIsTyping(false);
  };

  const handleDelete = () => {
    if (task && onDelete && !isCreating) {
      onDelete(task.id);
    }
  };

  const handleClose = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    const currentCanSave = getPlainText().length > 0;
    const currentHasChanges = hasContentChanged();

    if (currentHasChanges && currentCanSave) {
      await triggerSave();
    }

    if (onClose) {
      onClose();
    }
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!task) {
    return (
      <div className={styles.editorContainer}>
        <div className={styles.noTask}>Click &quot;Show One&quot; to create a new note</div>
      </div>
    );
  }

  const canSave = getPlainText().length > 0;
  const hasChanges = hasContentChanged();

  return (
    <div className={styles.editorContainer}>
      {/* Header */}
      <div className={styles.createHeader}>
        <div className={styles.editorToolbar}>
          {/* Layout Controls */}
          {onToggleSidebar && (
            <div className={styles.toolbarGroup}>
              <button
                onClick={onToggleSidebar}
                title={isSidebarCollapsed ? "Show list" : "Hide list"}
                className={styles.sidebarToggleButton}
              >
                <SidebarSimple size={15} weight="regular" />
              </button>
            </div>
          )}

          {onClose && (
            <div className={styles.toolbarGroup}>
              <button
                onClick={handleClose}
                title="Close editor"
              >
                <X size={15} weight="regular" />
              </button>
            </div>
          )}

          {/* Text Formatting */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? styles.active : ''}
              title="Bold (Ctrl+B)"
            >
              <TextB size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? styles.active : ''}
              title="Italic (Ctrl+I)"
            >
              <TextItalic size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? styles.active : ''}
              title="Underline (Ctrl+U)"
            >
              <TextUnderline size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? styles.active : ''}
              title="Strikethrough"
            >
              <TextStrikethrough size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? styles.active : ''}
              title="Highlight"
            >
              <Highlighter size={15} weight="regular" />
            </button>
          </div>

          {/* Headings */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
              title="Heading 1"
            >
              <TextHOne size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
              title="Heading 2"
            >
              <TextHTwo size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
              title="Heading 3"
            >
              <TextHThree size={15} weight="regular" />
            </button>
          </div>

          {/* Lists */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? styles.active : ''}
              title="Bullet List"
            >
              <ListBullets size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? styles.active : ''}
              title="Numbered List"
            >
              <ListNumbers size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? styles.active : ''}
              title="Task List"
            >
              <CheckSquare size={15} weight="regular" />
            </button>
          </div>

          {/* Blocks */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? styles.active : ''}
              title="Quote"
            >
              <Quotes size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? styles.active : ''}
              title="Code Block"
            >
              <Code size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              <Minus size={15} weight="regular" />
            </button>
          </div>

          {/* Advanced */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={setLink}
              className={editor.isActive('link') ? styles.active : ''}
              title="Add Link"
            >
              <LinkSimple size={15} weight="regular" />
            </button>
            <button
              onClick={() => colorInputRef.current?.click()}
              title="Text Color"
              className={styles.colorButton}
            >
              <Palette size={15} weight="regular" />
              <span
                className={styles.colorIndicator}
                style={{ backgroundColor: editor.getAttributes('textStyle').color || '#000000' }}
              />
            </button>
            <input
              ref={colorInputRef}
              type="color"
              onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              style={{ display: 'none' }}
            />
          </div>

          {/* Actions */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              <ArrowUUpLeft size={15} weight="regular" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              <ArrowUUpRight size={15} weight="regular" />
            </button>
          </div>

          {/* Character Count */}
          {editor.storage.characterCount && (
            <div className={styles.characterCount}>
              {editor.storage.characterCount.characters()} chars
            </div>
          )}
        </div>

        {/* Save/Delete controls */}
        <div className={styles.statusContainer}>
          <div className={styles.autoSaveStatus}>
            {isSaving ? 'Saving...' :
             isTyping && hasChanges ? 'Typing...' :
             !hasChanges && !isCreating && canSave ? 'Saved' : ''}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.saveButton} ${!canSave || !hasChanges || isSaving ? styles.disabled : ''}`}
              onClick={handleManualSave}
              disabled={!canSave || !hasChanges || isSaving}
            >
              <FloppyDisk size={13} weight="regular" style={{ marginRight: '4px' }} />
              {isSaving ? 'Saving...' :
                !hasChanges ? 'Saved' :
                  canSave ? (isCreating ? 'Sow Now' : 'Save') :
                    'Empty'}
            </button>

            {!isCreating && (
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                title="Delete this seed"
                disabled={isSaving}
              >
                <Trash size={13} weight="regular" style={{ marginRight: '4px' }} />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Title Input */}
      <textarea
        ref={titleRef}
        className={styles.titleBlock}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder={isCreating ? "Title" : "Untitled"}
        rows={1}
        style={{
          resize: 'none',
          overflow: 'hidden',
          minHeight: '3.5rem'
        }}
      />

      {/* TipTap Editor Content */}
      <div className={`${styles.editorWrapper} ${!getPlainText() ? styles.highlighted : ''}`}>
        <EditorContent editor={editor} className={styles.editorContent} />
      </div>
    </div>
  );
}