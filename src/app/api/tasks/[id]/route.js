// src/app/api/tasks/[id]/route.js
// Backward-compatible delegating route
import { StoryController } from '../../(modules)/stories/story.controller';

export async function GET(request, { params }) {
  const { id } = await params;
  const response = await StoryController.getById(request, id);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Not found' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ task: data.data.story }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request, { params }) {
  const { id } = await params;
  const response = await StoryController.update(request, id);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ task: data.data.story }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const response = await StoryController.delete(request, id);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ deletedId: data.data?.id }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
