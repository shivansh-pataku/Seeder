// src/app/api/(modules)/stories/route.ts
import { StoryController } from './story.controller';

export async function GET(request: Request) {
  return StoryController.list(request);
}

export async function POST(request: Request) {
  return StoryController.create(request);
}

export async function PUT(request: Request) {
  return StoryController.update(request);
}

export async function DELETE(request: Request) {
  return StoryController.delete(request);
}
