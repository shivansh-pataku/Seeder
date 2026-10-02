// src/app/api/profile/[username]/route.js
// Modular delegate to ProfileController
import { ProfileController } from '../../(modules)/profile/profile.controller';

export async function GET(request, { params }) {
  const { username } = await params;
  return ProfileController.get(request, username);
}

export async function PATCH(request, { params }) {
  const { username } = await params;
  return ProfileController.update(request, username);
}