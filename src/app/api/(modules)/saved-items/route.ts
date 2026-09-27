// src/app/api/(modules)/saved-items/route.ts
import { SavedItemController } from './savedItem.controller';

export async function GET(request: Request) {
  return SavedItemController.get(request);
}

export async function POST(request: Request) {
  return SavedItemController.save(request);
}

export async function DELETE(request: Request) {
  return SavedItemController.unsave(request);
}
