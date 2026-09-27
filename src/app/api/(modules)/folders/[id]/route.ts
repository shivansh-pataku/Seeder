// src/app/api/(modules)/folders/[id]/route.ts
import { FolderController } from '../folder.controller';

interface RouteProps {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: RouteProps) {
  const { id } = await params;
  return FolderController.delete(request, id);
}
