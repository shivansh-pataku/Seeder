// src/app/api/(modules)/likes/route.ts
import { LikeController } from './like.controller';

export async function GET(request: Request) {
  return LikeController.get(request);
}

export async function POST(request: Request) {
  return LikeController.like(request);
}

export async function DELETE(request: Request) {
  return LikeController.unlike(request);
}
