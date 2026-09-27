// src/app/api/(modules)/stories/[id]/route.ts
import { StoryController } from '../story.controller';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return StoryController.getById(request, id);
}

export async function PUT(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return StoryController.update(request, id);
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return StoryController.delete(request, id);
}
