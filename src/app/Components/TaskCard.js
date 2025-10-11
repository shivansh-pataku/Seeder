'use client';

import styles from "../Styles/taskcard.module.css"
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

// Helper function to strip HTML and get clean text
const getPlainTextFromHTML = (html) => {
  if (!html) return '';
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, ' ')
    // Replace HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    // Clean up whitespace and line breaks
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();
};

// Helper function to get limited text for display
const getDisplayText = (html, maxLength = 150) => {
  const plainText = getPlainTextFromHTML(html);
  if (!plainText) return 'No description';
  
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...' 
    : plainText;
};

// Helper function to detect rich content
const hasRichContent = (html) => {
  if (!html) return false;
  return html.includes('<h') || html.includes('<strong') || html.includes('<em') || 
         html.includes('<ul') || html.includes('<ol') || html.includes('<blockquote') ||
         html.includes('style=') || html.includes('<a ') || html.includes('<code') ||
         html.includes('<pre') || html.includes('<mark');
};

export default function TaskCard({ task, onClick, onStatusToggle, isSelected = false, selectedStyle = 'selected' }) {
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // Convert database value (0/1) to boolean
  const isCompleted = task.status === 1 || task.status === true;

  const handleStatusClick = (e) => {
    e.stopPropagation(); // Prevent triggering the card onClick
    onStatusToggle(task.id, isCompleted);
  };

  const handleCardClick = () => {
    setShowDetails(!showDetails); // handles two states one is open and other is close
    onClick(task); // Still call the parent onClick if needed
  };

  const handleMasterAnalysis = async (e) => {
    e.stopPropagation(); // for preventing the card onClick
    setLoading(true);
    setError(null);

    // Use clean text for AI analysis instead of HTML
    const cleanTitle = task.title || 'Untitled';
    const cleanDescription = getPlainTextFromHTML(task.description) || 'No description';
    const taskText = `Note: ${cleanTitle}. Description: ${cleanDescription}`;

    try {
      const response = await fetch('/api/master.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: taskText }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze task');
      }

      setAiResult(data);
    } catch (err) {
      setError(err.message);
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get clean display text
  const displayTitle = task.title || 'Untitled';
  const displayDescription = getDisplayText(task.description, 150);
  const isRichContentFlag = hasRichContent(task.description);

  return (
    <div 
      onClick={handleCardClick} 
      className={`${styles.taskCard} ${isSelected ? styles[selectedStyle] : ''}`}
    >
      <div className={styles.tcareaA}>
        <h1 className={styles.taskTitle}>
          {displayTitle}
          {isRichContentFlag && <span className={styles.richIndicator} title="Contains rich formatting"> </span>}
        </h1>
        <button 
          className={`${styles.taskButton} ${isCompleted ? styles.completed : styles.active}`}
          onClick={handleStatusClick}
          title={`Mark as ${isCompleted ? 'Active' : 'Done'}`}
        >
          {isCompleted ? "#done" : "#active"}
        </button>
      </div>
      
      <div className={styles.tcareaB}>
        <p className={`${styles.taskDescription} ${isRichContentFlag ? styles.hasRichContent : ''}`}>
          {displayDescription}
        </p>
        <span className={styles.taskDate}>
          {new Date(task.created_at).toLocaleDateString()}
        </span>
      </div>

      {showDetails && (
        <div className={styles.master_board}>
          <div className={styles.master_head}> 
            <div>Master</div> 
            <div onClick={handleMasterAnalysis} className={styles.master_analyse}>
              {loading ? 'Analyzing...' : 'Analyse'}
            </div> 
          </div>

          <div className={styles.master_advice}>
            <h3>Master Guide</h3>
            {loading && <div className={styles.loading}>Analysing</div>}
            {error && <div className={styles.error}>Error: {error}</div>}

            {aiResult && aiResult.content && (
              <>
                <div className={styles.markdown_content}>
                  <ReactMarkdown>{aiResult.content}</ReactMarkdown>
                </div>
                <small className={styles.timestamp}>
                  Generated at: {new Date(aiResult.timestamp).toLocaleString()}
                </small>
              </>
            )}
            {!aiResult && !loading && !error && (
              <div className={styles.empty_state}>
                Click "Analyze" above for master analysis
              </div>
            )}
          </div>
        </div> 
      )}
    </div>
  );
}