import dbConfig from "@/app/lib/db";
import { getCurrentUser } from "@/app/lib/getCurrentUser";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { username } = params;

  if (!username) {
    return NextResponse.json({ message: 'Username is required' }, { status: 400 });
  }

  try {
    const db = dbConfig;
    const [profile] = await db.execute(
      'SELECT email, name, bio, dob, location, socialProfiles, created_at FROM users WHERE username = ?',
      [username]
    );

    console.log('Database query executed for profile:', username);

    if (!profile || profile.length === 0) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

      const profileData = profile[0];

      // Add more detailed logging
      console.log('Raw socialProfiles from DB:', profileData.socialProfiles);
      console.log('Type of socialProfiles:', typeof profileData.socialProfiles);

      // Fix the parsing
      try {
        if (profileData.socialProfiles) {
          // Check if it's already an object/array (some MySQL drivers auto-parse JSON)
          if (typeof profileData.socialProfiles === 'string') {
            profileData.socialProfiles = JSON.parse(profileData.socialProfiles);
          }
          // If it's already parsed, use as-is
        } else {
          profileData.socialProfiles = [];
        }
        console.log('Final parsed socialProfiles:', profileData.socialProfiles);
      } catch (parseError) {
        console.error('Parse error:', parseError.message);
        console.error('Raw value that failed:', profileData.socialProfiles);
        profileData.socialProfiles = [];
      }

    // Get current authenticated user to determine ownership
    const currentUser = await getCurrentUser();
    const isOwner = currentUser && (
      currentUser.username === username || 
      currentUser.email === profileData.email
    );
    profileData.isOwner = isOwner;

    console.log('Successfully fetched profile for:', username);
    return NextResponse.json({ profile: profileData }, { status: 200 });

  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}







export async function PATCH(request, { params }) {
  const { username } = params;

  if (!username) {
    return NextResponse.json({ message: 'Username is required' }, { status: 400 });
  }

  try {
    // Get current user first for authorization
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Parse request body
    const profileData = await request.json();

    // Validate required fields
    if (!profileData.name || !profileData.email) {
      return NextResponse.json({ 
        message: 'Name and email are required' 
      }, { status: 400 });
    }

    const db = dbConfig;

    // Get the existing user data for authorization check
    const [existingUser] = await db.execute(
      'SELECT userid, username, email FROM users WHERE username = ?',
      [username]
    );

    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json({ message: 'Profile not found' }, { status: 404 });
    }

    const userData = existingUser[0];

    // Authorization: user can only update their own profile
    if (currentUser.username !== userData.username && currentUser.email !== userData.email) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }

    // Update the profile
    await db.execute(
      `UPDATE users 
       SET name = ?, email = ?, dob = ?, location = ?, bio = ?, socialProfiles = ?, updated_at = NOW()
       WHERE userid = ?`,
      [
        profileData.name,
        profileData.email,
        profileData.dob || null,
        profileData.location || null,
        profileData.bio || null,
        JSON.stringify(profileData.socialProfiles || []),
        userData.userid
      ]
    );

    console.log('Successfully updated profile for:', username);
    return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });

  } catch (error) {
    console.error('Error updating profile:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        message: 'Email already exists' 
      }, { status: 409 });
    }
    
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}