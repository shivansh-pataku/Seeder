/**
 * Helper utility to return default avatar paths based on gender identity.
 * @param {string | null | undefined} gender
 * @returns {string | null}
 */
export function getGenderAvatar(gender) {
  if (!gender || typeof gender !== 'string') return null;
  const g = gender.trim().toLowerCase();
  if (g === 'male') return '/m.jpg';
  if (g === 'female') return '/f.jpg';
  return null;
}
