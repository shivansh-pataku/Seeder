// src/app/about/page.js - CONVERTED TO JAVASCRIPT
'use client'

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from '../Styles/about.module.css';

export default function AboutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [feedback, setFeedback] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (status !== 'authenticated') {
      setError('Please sign in to submit feedback');
      router.push('/auth/signin');
      return;
    }

    if (!feedback.trim()) {
      setError('Please enter your feedback');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Submitting feedback...');
      
      const res = await fetch('/api/about', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        credentials: 'include',
        body: JSON.stringify({ 
          feedback_text: feedback.trim() 
        }),
      });

      const data = await res.json();
      console.log('Feedback response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit feedback');
      }

      console.log('Feedback submitted successfully');
      setSubmitted(true);
      setFeedback('');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 3000);

    } catch (err) {
      console.error('Feedback error:', err.message);
      setError(err.message || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.aboutMainRow}>
      {/* Left: About */}
<div className={styles.aboutLeft}>
  <h2 className={styles.aboutTitle}>🌱 About Seeder</h2>
  
  {/* Hero Statement */}
  <div className={styles.heroStatement}>
    <p className={styles.aboutText}>
      <strong>Your Ultimate Writing Companion - Cultivate Ideas, Craft Excellence</strong><br /><br />
      <strong>Well curate your writings</strong> - notes, tasks, ideas, literature, documents, project work, daily tracks, blogs, research papers, creative writing, or anything that flows from your mind to the page.
      <br /><br />
      Seeder transforms the way you manage thoughts, tasks, and projects. Just like a gardener carefully tends to seeds, 
      Seeder helps you nurture your ideas from conception to completion. Whether you're brainstorming the next big thing 
      or organizing daily tasks, Seeder provides the perfect environment for your thoughts to flourish.
      <br /><br />
      This platform purely focuses on <strong>enhancing your writing experience</strong> and helping you <strong>interpret your ideas</strong> with precision and clarity.
    </p>
  </div>

  {/* Development Notice */}
  <div className={styles.developmentNotice}>
    <p className={styles.aboutText}>
      <em>Some advanced features are under active development and will be available soon! Until then, enjoy the core functionalities and stay tuned for exciting updates.</em>
    </p>
  </div>

  <br />

  {/* Core Features */}
  <div className={styles.featuresSection}>
    <h3 className={styles.sectionTitle}>✨ What Makes Seeder Special:</h3>
    <ul className={styles.aboutList}>
      
      {/* AI Features */}
      <li className={styles.featureItem}>
        <strong>Master AI Assistant: </strong> 
        Advanced AI that enhances, corrects, improves, and analyzes your writing. Get professional writing assistance by identifying limitations, discovering additional resources, and exploring deeper insights - regardless of your writing type (academic, creative, technical, or casual).
      </li>
      
      {/* Editor Features */}
      <li className={styles.featureItem}>
        <strong>Advanced Rich Text Editor: </strong> 
        Modern editor with comprehensive formatting options - from basic styling to tables, code blocks, task lists, links, and mathematical expressions. Everything you need for professional writing.
      </li>
      
      
      {/* Organization */}
      <li className={styles.featureItem}>
        <strong>Smart Organization: </strong> 
        Create, edit, and organize your writings with intelligent auto-save, real-time updates, tagging system, and powerful search to find your content instantly.
      </li>
      
      {/* Security */}
      <li className={styles.featureItem}>
        <strong>Seamless Authentication: </strong> 
        Secure login with NextAuth v5 Beta - your data stays protected while remaining easily accessible across all your devices.
      </li>
      
      {/* Design */}
      <li className={styles.featureItem}>
        <strong>Adaptive Interface: </strong> 
        Beautiful dark/light themes that adapt to your working style and environment. Design and theme have been kept minimal and engaging for maintaining focus on productivity and reducing writing distractions.
      </li>
      
      {/* Technical */}
      <li className={styles.featureItem}>
        <strong>Database-Powered: </strong> 
        Robust MySQL backend ensures your writings are never lost, always synchronized, and backed up securely in the cloud.
      </li>
      
      {/* Performance */}
      <li className={styles.featureItem}>
        <strong>Lightning Fast: </strong> 
        Built with Next.js 15 for instant page loads, smooth interactions, and responsive editing experience that keeps up with your thoughts.
      </li>
    </ul>
  </div>

  <br />

  {/* Inspirational Quote */}
  <div className={styles.quoteSection}>
    <blockquote className={styles.inspirationalQuote}>
      <p className={styles.aboutText}>
        <em>"Every great achievement starts with a single seed of an idea. Seeder gives you the tools to plant, 
            nurture, and harvest your potential."</em>
      </p>
    </blockquote>
  </div>

</div>

      
      
      {/* Right: Feedback & Contact */}
      <div className={styles.aboutRight}>
        <div className={styles.feedbackSection}>
          <h3>🌻 Help Seeder Grow!</h3>
          <p>
            Your feedback is the fertilizer that helps Seeder bloom. Found a bug? Have a brilliant feature idea? 
            We'd love to hear how we can make your productivity garden even more fruitful.
          </p>
          
          {/* Show authentication status */}
          {status === 'loading' && (
            <p style={{ color: '#888', fontSize: '0.9rem' }}>Loading...</p>
          )}
          
          {status === 'unauthenticated' && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#f87171', 
              padding: '0.8rem', 
              borderRadius: '0.3rem',
              margin: '0.5rem 0',
              fontSize: '0.9rem'
            }}>
              Please <a href="/auth/signin" style={{ color: '#9ab4ff' }}>sign in</a> to submit feedback
            </div>
          )}

          {error && (
            <div style={{ 
              background: 'rgba(239, 68, 68, 0.1)', 
              color: '#f87171', 
              padding: '0.8rem', 
              borderRadius: '0.3rem',
              margin: '0.5rem 0',
              fontSize: '0.9rem'
            }}>
              {error}
            </div>
          )}

          {submitted ? (
            <div style={{ 
              background: 'rgba(34, 197, 94, 0.1)', 
              color: '#4ade80', 
              padding: '1rem', 
              borderRadius: '0.3rem',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              textAlign: 'center',
              fontWeight: '500'
            }}>
              🌟 Thank you for helping Seeder grow! Your feedback has been planted and will help us bloom better features.
            </div>
          ) : (
            status === 'authenticated' && (
              <form onSubmit={handleSubmit}>
                <textarea
                  className={styles.textBox}
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Plant your thoughts here... What would make Seeder even better?"
                  required
                  disabled={loading}
                  maxLength={1000}
                  rows={4}
                />
                <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '0.5rem' }}>
                  Submitting as: {session?.user?.name || session?.user?.email} • {feedback.length}/1000 characters
                </div>
                <button 
                  className={styles.feedbackButton} 
                  type="submit"
                  disabled={loading || !feedback.trim()}
                >
                  {loading ? 'Planting...' : 'Plant Feedback'}
                </button>
              </form>
            )
          )}
        </div>
        
        <div className={styles.contactSection}>
          <h3>🌿 Get in Touch</h3>
          <p>
            Ready to cultivate something amazing together?<br />
            Email: <a href="mailto:patakushivansh@gmail.com" className={styles.contactLink}>patakushivansh@gmail.com</a>
          </p>
          <p className={styles.aboutText}>
            <small>Built with 💚 by Shivansh : Using Next.js, React, MySQL, and NextAuth v5 Beta</small>
          </p>
        </div>
      </div>
    </div>
  );
}