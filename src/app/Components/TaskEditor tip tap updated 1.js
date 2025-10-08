'use client';

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Highlight from '@tiptap/extension-highlight';
import styles from '../Styles/taskeditor.module.css';

export default function TaskEditor({ task, onSave, onDelete, isCreating = false, saveStatus = '' }) {
  const [title, setTitle] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSavedData, setLastSavedData] = useState({ title: '', description: '' });
  const titleRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  // TipTap Editor Configuration
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing... Use / for commands'
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight
    ],
    content: '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: styles.tiptapEditor
      }
    },
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      handleDescriptionChange(content);
    }
  });

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
      editor.commands.setContent(initialDescription);
      
      setLastSavedData({ 
        title: initialTitle, 
        description: initialDescription 
      });
      
      setTimeout(() => {
        autoResizeTextarea(titleRef.current);
      }, 0);

      if (isCreating) {
        editor.commands.focus();
      }
    }
  }, [task, isCreating, editor]);

  // Check if content changed
  const hasContentChanged = () => {
    const currentTitle = title.trim();
    const currentDescription = editor ? editor.getHTML().trim() : '';
    const lastTitle = lastSavedData.title.trim();
    const lastDescription = lastSavedData.description.trim();
    
    return currentTitle !== lastTitle || currentDescription !== lastDescription;
  };

  // Get plain text for validation
  const getPlainText = () => {
    return editor ? editor.getText().trim() : '';
  };

  // Handle description change
  const handleDescriptionChange = (content) => {
    if (onSave && task) {
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

            onSave(dataToSave);
            
            setLastSavedData({
              title: dataToSave.title,
              description: dataToSave.description
            });
          }
          setIsTyping(false);
        }, 2000);
      } else {
        setIsTyping(false);
      }
    }
  };

  // Auto-save for title changes
  useEffect(() => {
    if (onSave && task && editor) {
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

            onSave(dataToSave);
            
            setLastSavedData({
              title: dataToSave.title,
              description: dataToSave.description
            });
          }
          setIsTyping(false);
        }, 2000);
      }

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [title, task, onSave, lastSavedData, editor]);

  // Handle title change
  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    autoResizeTextarea(e.target);
  };

  // Handle Enter in title
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.commands.focus();
      }
    }
  };

  // Manual save
  const handleManualSave = () => {
    if (editor && getPlainText() && hasContentChanged() && onSave) {
      const dataToSave = {
        ...task,
        title: title.trim() || 'Untitled',
        description: editor.getHTML(),
      };

      onSave(dataToSave);
      
      setLastSavedData({
        title: dataToSave.title,
        description: dataToSave.description
      });
      
      setIsTyping(false);
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (task && onDelete && !isCreating) {
      onDelete(task.id);
    }
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
          {isCreating ? '🌱 Sowing' : '🌿 Editing Seed'}
          {hasChanges ? ' *' : ''}
        </h3>
        <div className={styles.statusContainer}>
          <div className={styles.autoSaveStatus}>
            {isTyping && canSave && hasChanges && 'Auto-save in 2s...'}
            {isTyping && !canSave && 'Add content to save'}
            {!hasChanges && !isCreating && canSave && 'All changes saved'}
            {saveStatus === 'saving' && (isCreating ? 'Sowing...' : 'Saving...')}
            {saveStatus === 'error' && 'Save failed'}
          </div>

          <div className={styles.buttonGroup}>
            <button
              className={`${styles.saveButton} ${!canSave || !hasChanges ? styles.disabled : ''}`}
              onClick={handleManualSave}
              disabled={!canSave || !hasChanges}
            >
              {!hasChanges ? 'Saved' : canSave ? (isCreating ? 'Sow Now' : 'Save') : 'Content Required'}
            </button>

            {!isCreating && (
              <button
                className={styles.deleteButton}
                onClick={handleDelete}
                title="Delete this seed"
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
        placeholder={isCreating ? "Enter title..." : "Untitled"}
        rows={1}
        style={{
          resize: 'none',
          overflow: 'hidden',
          minHeight: '3.5rem'
        }}
      />

      {/* Toolbar */}
      {editor && (
        <div className={styles.toolbar}>
          <div className={styles.toolGroup}>
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={editor.isActive('bold') ? styles.active : ''}
              title="Bold (Ctrl+B)"
            >
              B
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={editor.isActive('italic') ? styles.active : ''}
              title="Italic (Ctrl+I)"
            >
              I
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={editor.isActive('strike') ? styles.active : ''}
              title="Strikethrough"
            >
              S
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              className={editor.isActive('highlight') ? styles.active : ''}
              title="Highlight"
            >
              H
            </button>
          </div>

          <div className={styles.toolGroup}>
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

          <div className={styles.toolGroup}>
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
              ☑
            </button>
          </div>

          <div className={styles.toolGroup}>
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
              {'<>'}
            </button>
          </div>
        </div>
      )}

      {/* Editor Content */}
      <div className={styles.editorWrapper}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}