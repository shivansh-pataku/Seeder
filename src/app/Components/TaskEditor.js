'use client';

import { useState, useEffect, useRef } from 'react';
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
import styles from '../Styles/taskeditor.module.css';

export default function TaskEditor({ task, onSave, onDelete, isCreating = false, saveStatus = '' }) {
  const [title, setTitle] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSavedData, setLastSavedData] = useState({ title: '', description: '' });
  const [isSaving, setIsSaving] = useState(false); // Track saving state
  const titleRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);
  const cursorPositionRef = useRef(null); // Store cursor position

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
    onUpdate: ({ editor }) => {
      // Store cursor position before handling change
      if (editor.isFocused && !isSaving) {
        cursorPositionRef.current = editor.state.selection;
      }
      
      const content = editor.getHTML();
      handleDescriptionChange(content);
    },
    onSelectionUpdate: ({ editor }) => {
      // Update cursor position when user moves cursor
      if (editor.isFocused && !isSaving) {
        cursorPositionRef.current = editor.state.selection;
      }
    },
  });

  // Function to preserve and restore cursor position
  const preserveCursorPosition = (callback) => {
    if (!editor) return;

    const currentSelection = cursorPositionRef.current || editor.state.selection;
    
    // Execute the callback
    callback();

    // Restore cursor position after a small delay
    setTimeout(() => {
      if (editor && currentSelection && !editor.isDestroyed) {
        try {
          // Create a new transaction with the preserved selection
          const tr = editor.state.tr.setSelection(currentSelection);
          editor.view.dispatch(tr);
          editor.commands.focus();
        } catch (error) {
          // If restoring exact position fails, just focus the editor
          console.log('Could not restore exact cursor position');
          editor.commands.focus();
        }
      }
    }, 10);
  };
  
  // Auto-resize textarea function
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  // Load initial task data
  useEffect(() => {
    if (task && editor) {
      const initialTitle = task.title || '';
      const initialDescription = task.description || '';
      
      setTitle(initialTitle);
      
      // Set content without triggering cursor movement
      if (initialDescription !== editor.getHTML()) {
        editor.commands.setContent(initialDescription, false); // false = don't emit update
      }
      
      setLastSavedData({ 
        title: initialTitle, 
        description: initialDescription 
      });
      
      setTimeout(() => {
        autoResizeTextarea(titleRef.current);
      }, 0);

      if (isCreating) {
        setTimeout(() => {
          editor.commands.focus();
        }, 100);
      }
    }
  }, [task, isCreating, editor]);

  // Check if current content is different from last saved
  const hasContentChanged = () => {
    const currentTitle = title.trim();
    const currentDescription = editor ? editor.getHTML().trim() : '';
    const lastTitle = lastSavedData.title.trim();
    const lastDescription = lastSavedData.description.trim();
    
    return currentTitle !== lastTitle || currentDescription !== lastDescription;
  };

  // Get plain text from editor for validation
  const getPlainText = () => {
    return editor ? editor.getText().trim() : '';
  };

  // Enhanced save function that preserves cursor
  const performSave = async (dataToSave) => {
    if (!onSave) return;

    setIsSaving(true);
    
    try {
      await onSave(dataToSave);
      
      // Update last saved data after successful save
      setLastSavedData({
        title: dataToSave.title,
        description: dataToSave.description
      });
      
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle description change from editor
  const handleDescriptionChange = (content) => {
    if (onSave && task && !isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      if ((title.trim() || getPlainText()) && hasContentChanged()) {
        setIsTyping(true);
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          if (getPlainText() && hasContentChanged()) {
            const dataToSave = {
              ...task,
              title: title.trim() || 'Untitled',
              description: content,
            };

            // Use preserveCursorPosition wrapper for auto-save
            preserveCursorPosition(() => {
              performSave(dataToSave);
            });
          }
          setIsTyping(false);
        }, 3000);
      } else {
        setIsTyping(false);
      }
    }
  };

  // Universal auto-save logic for title changes
  useEffect(() => {
    if (onSave && task && editor && !isSaving) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      if ((title.trim() || getPlainText()) && hasContentChanged()) {
        setIsTyping(true);
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          if (getPlainText() && hasContentChanged()) {
            const dataToSave = {
              ...task,
              title: title.trim() || 'Untitled',
              description: editor.getHTML(),
            };

            // Use preserveCursorPosition wrapper for auto-save
            preserveCursorPosition(() => {
              performSave(dataToSave);
            });
          }
          setIsTyping(false);
        }, 3000);
      } else {
        setIsTyping(false);
      }

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [title, task, onSave, lastSavedData, editor, isSaving]);

  // Handle title change
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    autoResizeTextarea(e.target);
  };

  // Handle Enter key in title
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.commands.focus();
      }
    }
  };

  // Manual save function
  const handleManualSave = () => {
    if (editor && getPlainText() && hasContentChanged() && onSave) {
      const dataToSave = {
        ...task,
        title: title.trim() || 'Untitled',
        description: editor.getHTML(),
      };

      // Manual save doesn't need cursor preservation since it's user-initiated
      performSave(dataToSave);
      setIsTyping(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (task && onDelete && !isCreating) {
      onDelete(task.id);
    }
  };

  // Set Link function
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

  // Add Table function
  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!task) {
    return (
      <div className={styles.editorContainer}>
        <div className={styles.noTask}>Click "Sow One" to create a new note</div>
      </div>
    );
  }

  const canSave = getPlainText().length > 0;
  const hasChanges = hasContentChanged();

  return (
    <div className={styles.editorContainer}>
      {/* Header */}
      <div className={styles.createHeader}>
        <h3 className={styles.statusS1}>
          {/* Status indicators can be re-enabled if needed */}
        </h3>

        <div className={styles.editorToolbar}>
          {/* Text Formatting */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? styles.active : ''}
              title="Bold (Ctrl+B)"
            >
              <strong>B</strong>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? styles.active : ''}
              title="Italic (Ctrl+I)"
            >
              <em>I</em>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={editor.isActive('underline') ? styles.active : ''}
              title="Underline (Ctrl+U)"
            >
              <u>U</u>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? styles.active : ''}
              title="Strikethrough"
            >
              <s>S</s>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? styles.active : ''}
              title="Highlight"
            >
              Hi
            </button>
          </div>

          {/* Headings */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={editor.isActive('heading', { level: 1 }) ? styles.active : ''}
              title="Heading 1"
            >
              H1
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={editor.isActive('heading', { level: 2 }) ? styles.active : ''}
              title="Heading 2"
            >
              H2
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={editor.isActive('heading', { level: 3 }) ? styles.active : ''}
              title="Heading 3"
            >
              H3
            </button>
          </div>

          {/* Lists */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={editor.isActive('bulletList') ? styles.active : ''}
              title="Bullet List"
            >
              • 
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={editor.isActive('orderedList') ? styles.active : ''}
              title="Numbered List"
            >
              1.
            </button>
            <button
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              className={editor.isActive('taskList') ? styles.active : ''}
              title="Task List"
            >
              M
            </button>
          </div>

          {/* Blocks */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={editor.isActive('blockquote') ? styles.active : ''}
              title="Quote"
            >
              " 
            </button>
            <button
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={editor.isActive('codeBlock') ? styles.active : ''}
              title="Code Block"
            >
              {'</>'}
            </button>
            <button
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              Br
            </button>
          </div>

          {/* Advanced */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={setLink}
              className={editor.isActive('link') ? styles.active : ''}
              title="Add Link"
            >
              L
            </button>
            <input
              type="color"
              onInput={(e) => editor.chain().focus().setColor(e.target.value).run()}
              value={editor.getAttributes('textStyle').color || '#000000'}
              title="Text Color"
              className={styles.colorInput}
            />
          </div>

          {/* Actions */}
          <div className={styles.toolbarGroup}>
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              title="Undo (Ctrl+Z)"
            >
              ↶
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              title="Redo (Ctrl+Y)"
            >
              ↷
            </button>
          </div>

          {/* Character Count */}
          {editor.storage.characterCount && (
            <div className={styles.characterCount}>
              {editor.storage.characterCount.characters()} chars
            </div>
          )}
        </div>

        <div className={styles.statusContainer}>
          <div className={styles.autoSaveStatus}>
            {/* {isSaving && 'Saving...'}
            {isTyping && !isSaving && canSave && hasChanges && 'Auto-save in 3s...'}
            {!hasChanges && !isCreating && canSave && !isSaving && 'Saved'} */}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.saveButton} ${!canSave || !hasChanges || isSaving ? styles.disabled : ''}`}
              onClick={handleManualSave}
              disabled={!canSave || !hasChanges || isSaving}
            >
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