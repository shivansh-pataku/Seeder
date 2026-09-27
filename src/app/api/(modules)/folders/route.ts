// src/app/api/(modules)/folders/route.ts
import { FolderController } from './folder.controller';

export async function GET() {
  return FolderController.list();
}

export async function POST(request: Request) {
  return FolderController.create(request);
}
