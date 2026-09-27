import dbConfig from '../../../lib/db.js';
import { getCurrentUser } from '../../../lib/getCurrentUser.js';

export async function GET(request, { params }) {
  const { username } = await params;

  if (!username) {
    return Response.json({ message: 'Username is required' }, { status: 400 });
  }

  try {
    const db = dbConfig;
    const [profile] = await db.execute(
      'SELECT userid, email, name, bio, dob, location, gender, socialProfiles, is_private, email_notifications, created_at FROM users WHERE username = ?',
      [username]
    );

    console.log('Database query executed for profile:', username);

    if (!profile || profile.length === 0) {
      return Response.json({ message: 'Profile not found' }, { status: 404 });
    }

    const profileData = profile[0];

    // Get current authenticated user to determine ownership
    const currentUser = await getCurrentUser();
    const isOwner = currentUser && (
      currentUser.username === username || 
      currentUser.email === profileData.email ||
      currentUser.id?.toString() === profileData.userid?.toString()
    );
    profileData.isOwner = isOwner;

    // Fetch published writings (status = 1) for this user
    try {
      const [stories] = await db.execute(
        `SELECT 
          id, 
          title, 
          description, 
          COALESCE(snippet, '') as snippet, 
          COALESCE(story_type, 'Article') as story_type, 
          COALESCE(reading_time_minutes, 1) as reading_time_minutes, 
          COALESCE(word_count, 0) as word_count, 
          COALESCE(likes_count, 0) as likes_count,
          created_at 
         FROM stories 
         WHERE userid = ? AND status = 1 
         ORDER BY created_at DESC`,
        [profileData.userid]
      );
      profileData.publishedStories = (stories || []).map((s) => ({
        ...s,
        snippet:
          s.snippet ||
          s.description
            ?.replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200) ||
          'No preview available.',
      }));
    } catch (storiesError) {
      console.error('Error fetching published stories for profile:', storiesError);
      profileData.publishedStories = [];
    }

    // Parse social profiles
    try {
      if (profileData.socialProfiles) {
        if (typeof profileData.socialProfiles === 'string') {
          profileData.socialProfiles = JSON.parse(profileData.socialProfiles);
        }
      } else {
        profileData.socialProfiles = [];
      }
    } catch (parseError) {
      console.error('Parse error:', parseError.message);
      profileData.socialProfiles = [];
    }

    // Mask sensitive details if private and visitor is not the owner
    if (profileData.is_private === 1 && !isOwner) {
      profileData.name = 'Unknown';
      profileData.username = 'unknown';
      profileData.email = null;
      profileData.bio = 'Unknown';
      profileData.gender = null;
      profileData.location = null;
      profileData.dob = null;
      profileData.socialProfiles = [];
      profileData.isAnonymous = true;
      profileData.userid = null;
    }

    console.log('Successfully fetched profile for:', username);
    return Response.json({ profile: profileData }, { status: 200 });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { username } = await params;

  if (!username) {
    return Response.json({ message: 'Username is required' }, { status: 400 });
  }

  try {
    // Get current user first for authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return Response.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const profileData = await request.json();

    const db = dbConfig;

    // Get the existing user data for authorization check
    const [existingUser] = await db.execute(
      'SELECT userid, username, email, name, dob, location, bio, gender, is_private, email_notifications FROM users WHERE username = ?',
      [username]
    );

    if (!existingUser || existingUser.length === 0) {
      return Response.json({ message: 'Profile not found' }, { status: 404 });
    }

    const userData = existingUser[0];

    // Authorization: user can only update their own profile
    if (
      currentUser.username !== userData.username && 
      currentUser.email !== userData.email &&
      currentUser.id?.toString() !== userData.userid?.toString()
    ) {
      return Response.json({ message: 'Unauthorized' }, { status: 403 });
    }

    const newName = profileData.name !== undefined ? profileData.name : userData.name;
    const newEmail = profileData.email !== undefined ? profileData.email : userData.email;
    const newDob = profileData.dob !== undefined ? profileData.dob : userData.dob;
    const newLocation = profileData.location !== undefined ? profileData.location : userData.location;
    const newBio = profileData.bio !== undefined ? profileData.bio : userData.bio;
    const newGender = profileData.gender !== undefined ? profileData.gender : userData.gender;
    const newSocial = profileData.socialProfiles !== undefined 
      ? JSON.stringify(profileData.socialProfiles || [])
      : JSON.stringify([]);

    const isPrivate = profileData.is_private === true || profileData.is_private === 1 ? 1 : 0;
    const emailNotifications = profileData.email_notifications === false || profileData.email_notifications === 0 ? 0 : 1;

    // Update the profile
    await db.execute(
      `UPDATE users 
       SET name = ?, email = ?, dob = ?, location = ?, bio = ?, gender = ?, socialProfiles = ?, is_private = ?, email_notifications = ?, updated_at = NOW()
       WHERE userid = ?`,
      [
        newName,
        newEmail,
        newDob || null,
        newLocation || null,
        newBio || null,
        newGender || null,
        newSocial,
        isPrivate,
        emailNotifications,
        userData.userid
      ]
    );

    console.log('Successfully updated profile for:', username);
    return Response.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return Response.json({ 
        message: 'Email already exists' 
      }, { status: 409 });
    }
    
    return Response.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}