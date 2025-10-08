import { useState, useEffect, useRef } from 'react';
import styles from '../Styles/taskeditor.module.css';
// import AIAnalysis from './AIAnalysis';

export default function TaskEditor({ task, onSave, onDelete, isCreating = false, saveStatus = '' }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [lastSavedData, setLastSavedData] = useState({ title: '', description: '' });
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const autoSaveTimeoutRef = useRef(null);

  

// Auto-resize textarea function ////////////////////////////////////////////////////////////////////////////////////////////
  const autoResizeTextarea = (textarea) => {
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

// Load initial task data ////////////////////////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (task) {
      const initialTitle = task.title || '';
      const initialDescription = task.description || '';
      
      setTitle(initialTitle);
      setDescription(initialDescription);
      
      // Store initial data as last saved state
      setLastSavedData({ 
        title: initialTitle, 
        description: initialDescription 
      });
      
      // Auto-resize after setting content
      setTimeout(() => {
        autoResizeTextarea(titleRef.current);
        autoResizeTextarea(descriptionRef.current);
      }, 0);

      // Focus appropriately
      if (isCreating && descriptionRef.current) {
        descriptionRef.current.focus();
      }
    }
  }, [task, isCreating]);

// Check if current content is different from last saved /////////////////////////////////////////////////////////////////
  const hasContentChanged = () => {
    const currentTitle = title.trim();
    const currentDescription = description.trim();
    const lastTitle = lastSavedData.title.trim();
    const lastDescription = lastSavedData.description.trim();
    
    return currentTitle !== lastTitle || currentDescription !== lastDescription;
  };

// Universal auto-save logic with change detection ////////////////////////////////////////////////////////////////////////
  useEffect(() => {
    if (onSave && task) {
      // Clear existing timeout
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      // Only proceed if there's content AND it has changed
      if ((title.trim() || description.trim()) && hasContentChanged()) {
        setIsTyping(true);
        
        autoSaveTimeoutRef.current = setTimeout(() => {
          // Double-check changes and description requirement before saving
          if (description.trim() && hasContentChanged()) {
            const dataToSave = {
              ...task,
              title: title.trim() || 'Untitled',
              description: description.trim(),
            };

            onSave(dataToSave);
            
            // Update last saved data after successful save
            setLastSavedData({
              title: dataToSave.title,
              description: dataToSave.description
            });
          }
          setIsTyping(false);
        }, 3000); // Auto-save after 3 seconds of no typing
      } else {
        setIsTyping(false);
      }

      return () => {
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }
      };
    }
  }, [title, description, task, onSave, lastSavedData]);

// Handle title change ////////////////////////////////////////////////////////////////////////////////////////////
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    autoResizeTextarea(e.target);
  };

// Handle description change ///////////////////////////////////////////////////////////////////////////////////////
  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);
    autoResizeTextarea(e.target);
  };

// Handle Enter key in title ////////////////////////////////////////////////////////////////////////////////////////
  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (descriptionRef.current) {
        descriptionRef.current.focus();
      }
    }
  };

// Manual save function with change detection ////////////////////////////////////////////////////////////////////////
  const handleManualSave = () => {
    if (description.trim() && hasContentChanged() && onSave) {
      const dataToSave = {
        ...task,
        title: title.trim() || 'Untitled',
        description: description.trim(),
      };

      onSave(dataToSave);
      
// Update last saved data after manual save 
      setLastSavedData({
        title: dataToSave.title,
        description: dataToSave.description
      });
      
      setIsTyping(false);
    }
  };

  if (!task) {
    return (
      <div className={styles.editorContainer}>
        <div className={styles.noTask}>Click "Sow One" to create a new note</div>
      </div>
    );
  }

const canSave = description.trim().length > 0;
const hasChanges = hasContentChanged(); 

// Handle delete with confirmation //////////////////////////////////////////////////////////////////////////////////
  
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


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  return (
    <>
    <div className={styles.editorContainer}>
      <div className={styles.createHeader}>
        <h3 className={styles.statusS1}>
          {isCreating ? '🌱 Sowing' : '🌿 Editing Seed'}
          {hasChanges ? ' *' : ''}
        </h3>
        <div className={styles.statusContainer}>
          {/* Manual Save Button - only show if there are changes */}

          {/* Typing/Save Status */}
          <div className={styles.autoSaveStatus}>
            {/* {isTyping && canSave && hasChanges && 'Auto-save in 3s...'} */}
            {isTyping && canSave && hasChanges}
            {isTyping && !canSave && 'Add manure to save'}
            {/* {!hasChanges && !isCreating && canSave && 'All changes saved'} */}
            {!hasChanges && !isCreating && canSave}
            {/* {saveStatus === 'saving' && (isCreating ? 'Sowing...' : 'Saving...')} */}
            {saveStatus === 'saving' && (isCreating ? 'Sowing...' : 'Saving...')}
            {/* {saveStatus === 'saved' && (isCreating ? 'Seed sown!' : 'Saved!')} */}

            {saveStatus === 'pending' && 'Add manure to auto-save'}
            {saveStatus === 'error' && 'Save failed'}
          </div>

      <div className={styles.buttonGroup}>
          <button
            className={`${styles.saveButton} ${!canSave || !hasChanges ? styles.disabled : ''}`}
            onClick={handleManualSave}
            disabled={!canSave || !hasChanges}
          >
            {!hasChanges ? 'Saved' :
              canSave ? (isCreating ? 'Sow Now' : 'Save') :
                'Manure Required'}
          </button>

            {/* Delete Button - only show for existing tasks */}
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
    
        <textarea
        ref={titleRef}
        className={styles.titleBlock}
        value={title}
        onChange={handleTitleChange}
        onKeyDown={handleTitleKeyDown}
        placeholder={isCreating ? "Enter seed ..." : "Untitled"}
        rows={1}
        style={{
          resize: 'none',
          overflow: 'hidden',
          minHeight: '3.5rem'
        }} />
        
        <textarea
        ref={descriptionRef}
        className={`${styles.descriptionBlock} ${!description.trim() ? styles.highlighted : ''}`}
        value={description}
        onChange={handleDescriptionChange}
        placeholder="Enter manure (description)... Required for saving!" />

      {/* AI Analysis Component */}
      {/* <AIAnalysis text={`${title}\n\n${description}`} onApplyImprovement={(improvedText) => { // You can add logic here to apply AI suggestions 
      console.log('AI suggested improvement:', improvedText); }} /> */}

      {/* {!canSave && (description || title) && (
        <div className={styles.saveHint}>
          🌱 Add manure (description) to enable auto-saving
        </div>
      )} */}
      </div>
    
    </>
  );
}