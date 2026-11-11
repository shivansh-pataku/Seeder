import { describe, it, expect } from 'vitest';
import { extractSnippet, calculateWordCount } from '@/app/api/(modules)/stories/story.service';

describe('Story Utilities Suite', () => {
  describe('extractSnippet', () => {
    it('should strip HTML tags and scripts cleanly', () => {
      const html = '<h1>Heading</h1><p>This is a <strong>formatted</strong> paragraph.</p>';
      const snippet = extractSnippet(html);
      expect(snippet).toBe('Heading This is a formatted paragraph.');
    });

    it('should truncate at maxLen and append ellipsis', () => {
      const longHtml = '<p>' + 'word '.repeat(100) + '</p>';
      const snippet = extractSnippet(longHtml, 50);
      expect(snippet.length).toBeLessThanOrEqual(53); // 50 chars + '...'
      expect(snippet.endsWith('...')).toBe(true);
    });

    it('should decode HTML entities into plain characters', () => {
      const html = '<p>Tom &amp; Jerry &quot;Show&quot;</p>';
      const snippet = extractSnippet(html);
      expect(snippet).toBe('Tom & Jerry "Show"');
    });

    it('should handle empty or null string gracefully', () => {
      expect(extractSnippet('')).toBe('');
    });
  });

  describe('calculateWordCount', () => {
    it('should accurately count words in formatted HTML text', () => {
      const html = '<p>The quick brown fox jumps over the lazy dog.</p>';
      const count = calculateWordCount(html);
      expect(count).toBe(9);
    });

    it('should return 0 for empty string', () => {
      expect(calculateWordCount('')).toBe(0);
    });
  });
});
