import { describe, it, expect } from 'vitest';
import { createStorySchema, updateStorySchema } from '@/app/api/(modules)/stories/story.schema';

describe('Story Schema Validation Suite', () => {
  it('should sanitize and provide defaults for valid createStory input', () => {
    const raw = {
      title: '  My New Story  ',
      description: '<p>Content here</p>',
      story_type: 'article',
      status: true,
    };

    const parsed = createStorySchema.parse(raw);
    expect(parsed.title).toBe('My New Story');
    expect(parsed.description).toBe('<p>Content here</p>');
    expect(parsed.story_type).toBe('article');
    expect(parsed.status).toBe(1);
  });

  it('should default title to "Untitled Story" if empty or omitted', () => {
    const parsed = createStorySchema.parse({});
    expect(parsed.title).toBe('Untitled Story');
    expect(parsed.story_type).toBe('article');
    expect(parsed.status).toBe(0);
  });

  it('should transform status string "published" to 1 and anything else to 0', () => {
    const published = createStorySchema.parse({ status: 'published' });
    expect(published.status).toBe(1);

    const draft = createStorySchema.parse({ status: 'draft' });
    expect(draft.status).toBe(0);
  });

  it('should validate updateStorySchema and coerce ID to number', () => {
    const parsed = updateStorySchema.parse({
      id: '42',
      title: 'Updated Title',
      status: 1,
    });

    expect(parsed.id).toBe(42);
    expect(parsed.title).toBe('Updated Title');
    expect(parsed.status).toBe(1);
  });
});
