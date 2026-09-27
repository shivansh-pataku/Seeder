// src/app/api/tasks/route.js
// Forwarding adapter delegating to modular StoryController for full backward compatibility
import { StoryController } from '../(modules)/stories/story.controller';

export async function GET(request) {
  // Legacy /api/tasks always meant user's own stories
  const url = new URL(request.url);
  url.searchParams.set('my', 'true');
  const modifiedRequest = new Request(url.toString(), {
    method: 'GET',
    headers: request.headers,
  });

  const response = await StoryController.list(modifiedRequest);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Preserve legacy response shape: { tasks: [...] }
  return new Response(JSON.stringify({ tasks: data.data.stories || [] }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(request) {
  const response = await StoryController.create(request);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ task: data.data.story, message: data.message }), {
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PUT(request) {
  const response = await StoryController.update(request);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ task: data.data.story, message: data.message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function DELETE(request) {
  const response = await StoryController.delete(request);
  const data = await response.json();

  if (!data.success) {
    return new Response(JSON.stringify({ message: data.error?.message || 'Error' }), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ deletedId: data.data?.id, message: data.message }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(request) {
  return PUT(request);
}