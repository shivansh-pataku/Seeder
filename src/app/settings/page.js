'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import styles from '../Styles/settings.module.css';
import { getGenderAvatar } from '../lib/avatar';
import { useLoading } from '../Components/LoadingContext';
import { useInkWell } from '../Components/InkWell';
import {
  User,
  Camera,
  CheckCircle,
  WarningCircle,
  Trash,
  Gear,
  X,
  Plus,
  Globe,
  Lock,
  Bell,
} from '@phosphor-icons/react';

// Supported social platforms matching profile requirements
const PLATFORMS = {
  github: { name: 'GitHub', url: 'https://github.com/' },
  linkedin: { name: 'LinkedIn', url: 'https://linkedin.com/in/' },
  twitter: { name: 'Twitter / X', url: 'https://twitter.com/' },
  instagram: { name: 'Instagram', url: 'https://instagram.com/' },
  reddit: { name: 'Reddit', url: 'https://reddit.com/u/' },
  behance: { name: 'Behance', url: 'https://behance.net/' },
  pinterest: { name: 'Pinterest', url: 'https://pinterest.com/' },
  artstation: { name: 'ArtStation', url: 'https://artstation.com/' },
};

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const { startLoading, stopLoading } = useLoading();
  const inkWell = useInkWell();

  // Active section tab in sidebar ('profile' | 'account')
  const [activeTab, setActiveTab] = useState('profile');

  // Settings State
  const [initialData, setInitialData] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState({
    checking: false,
    available: null,
    message: '',
  });
  const usernameDebounceRef = useRef(null);
  const isInitialLoadedRef = useRef(false);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('male');
  const [socialProfiles, setSocialProfiles] = useState([{ platform: 'github', username: '' }]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);

  // Status & UI
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Synchronize loading bar
  useEffect(() => {
    if (status === 'loading' || pageLoading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [status, pageLoading, startLoading, stopLoading]);

  // Load existing profile & settings data
  useEffect(() => {
    async function loadSettings() {
      if (!session?.user?.username || isInitialLoadedRef.current) return;
      isInitialLoadedRef.current = true;

      try {
        const res = await fetch(`/api/profile/${session.user.username}`);
        const data = await res.json();

        if (res.ok && data.profile) {
          const p = data.profile;
          setName(p.name || '');
          setUsername(p.username || session.user.username);
          setInitialUsername(p.username || session.user.username);
          setEmail(p.email || '');
          setBio(p.bio || '');
          setLocation(p.location || '');
          setDob(p.dob ? p.dob.substring(0, 10) : '');
          setGender(p.gender || 'male');
          setIsPrivate(p.is_private === 1 || p.is_private === true);
          setEmailNotifications(p.email_notifications !== 0 && p.email_notifications !== false);

          let initialSocial = [{ platform: 'github', username: '' }];
          if (p.socialProfiles) {
            try {
              const parsed = typeof p.socialProfiles === 'string' ? JSON.parse(p.socialProfiles) : p.socialProfiles;
              if (Array.isArray(parsed) && parsed.length > 0) {
                initialSocial = parsed;
              }
            } catch (err) {
              console.error('Failed to parse socialProfiles:', err);
            }
          }
          setSocialProfiles(initialSocial);

          setInitialData({
            name: p.name || '',
            username: p.username || session.user.username,
            bio: p.bio || '',
            location: p.location || '',
            dob: p.dob ? p.dob.substring(0, 10) : '',
            gender: p.gender || 'male',
            isPrivate: p.is_private === 1 || p.is_private === true,
            emailNotifications: p.email_notifications !== 0 && p.email_notifications !== false,
            socialProfiles: initialSocial,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        inkWell.toast({ message: 'Failed to load profile settings', type: 'error' });
      } finally {
        setPageLoading(false);
      }
    }

    if (session?.user?.username && !isInitialLoadedRef.current) {
      loadSettings();
    }
  }, [session, inkWell]);

  // Live username availability check
  useEffect(() => {
    if (!initialUsername) return;

    const trimmed = username.trim();
    if (!trimmed) {
      setUsernameStatus({ checking: false, available: false, message: 'Username cannot be empty' });
      return;
    }

    if (trimmed.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true, message: 'Current username' });
      return;
    }

    if (trimmed.length < 3) {
      setUsernameStatus({ checking: false, available: false, message: 'Minimum 3 characters required' });
      return;
    }

    if (trimmed.length > 30) {
      setUsernameStatus({ checking: false, available: false, message: 'Maximum 30 characters allowed' });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (!usernameRegex.test(trimmed)) {
      setUsernameStatus({ checking: false, available: false, message: 'Letters, numbers, dots, dashes, and underscores only' });
      return;
    }

    setUsernameStatus({ checking: true, available: null, message: 'Checking availability...' });

    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/signup/check-username?username=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (data.available) {
          setUsernameStatus({ checking: false, available: true, message: 'Username is available' });
        } else {
          setUsernameStatus({ checking: false, available: false, message: data.error || 'Username is already taken' });
        }
      } catch {
        setUsernameStatus({ checking: false, available: null, message: 'Error checking availability' });
      }
    }, 400);

    return () => {
      if (usernameDebounceRef.current) {
        clearTimeout(usernameDebounceRef.current);
      }
    };
  }, [username, initialUsername]);

  // Social profile change handlers
  const handleSocialChange = (index, field, value) => {
    const updated = [...socialProfiles];
    updated[index] = { ...updated[index], [field]: value };
    setSocialProfiles(updated);

    // Auto-append next empty row when user starts typing on the last row
    if (index === socialProfiles.length - 1 && field === 'username' && value.trim() !== '') {
      setSocialProfiles([...updated, { platform: 'github', username: '' }]);
    }
  };

  const handleAddSocial = () => {
    setSocialProfiles((prev) => [...prev, { platform: 'github', username: '' }]);
  };

  const handleRemoveSocial = (index) => {
    if (socialProfiles.length > 1) {
      setSocialProfiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setSocialProfiles([{ platform: 'github', username: '' }]);
    }
  };

  // Revert changes
  const handleCancel = () => {
    if (initialData) {
      setName(initialData.name);
      setUsername(initialData.username || initialUsername);
      setBio(initialData.bio);
      setLocation(initialData.location);
      setDob(initialData.dob);
      setGender(initialData.gender);
      setIsPrivate(initialData.isPrivate);
      setEmailNotifications(initialData.emailNotifications);
      setSocialProfiles(
        initialData.socialProfiles && initialData.socialProfiles.length > 0
          ? JSON.parse(JSON.stringify(initialData.socialProfiles))
          : [{ platform: 'github', username: '' }]
      );
    }
    setUsernameStatus({ checking: false, available: true, message: 'Current username' });
    setSaveSuccess('');
    setSaveError('');
  };

  // Save changes
  const handleSave = async (e) => {
    if (e) e.preventDefault();

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      inkWell.toast({ message: 'Username cannot be empty', type: 'error' });
      return;
    }

    if (usernameStatus.available === false) {
      inkWell.toast({ message: usernameStatus.message || 'Please choose an available username', type: 'error' });
      return;
    }

    setSaving(true);
    setSaveSuccess('');
    setSaveError('');

    try {
      const validSocialProfiles = socialProfiles
        .filter((sp) => sp && sp.username && sp.username.trim())
        .map((sp) => ({
          platform: sp.platform || 'github',
          username: sp.username.trim(),
        }));

      const targetUsername = initialUsername || session?.user?.username;
      const res = await fetch(`/api/profile/${targetUsername}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanUsername,
          name: name.trim(),
          email,
          bio: bio.trim(),
          location: location.trim(),
          dob: dob || null,
          gender,
          socialProfiles: validSocialProfiles,
          is_private: isPrivate,
          email_notifications: emailNotifications,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to save settings');
      }

      // Update session if username or gender changed
      if (typeof update === 'function') {
        try {
          await update({ username: cleanUsername, gender });
        } catch (uErr) {
          console.warn('Session update notice:', uErr);
        }
      }

      setInitialUsername(cleanUsername);
      setInitialData({
        name: name.trim(),
        username: cleanUsername,
        bio: bio.trim(),
        location: location.trim(),
        dob,
        gender,
        isPrivate,
        emailNotifications,
        socialProfiles: validSocialProfiles.length > 0 ? validSocialProfiles : [{ platform: 'github', username: '' }],
      });

      inkWell.toast({ message: 'Settings saved successfully', type: 'success' });
      setSaveSuccess('Settings and profile updated successfully!');
      setTimeout(() => setSaveSuccess(''), 4000);
    } catch (err) {
      const errMsg = err.message || 'An error occurred while saving.';
      inkWell.toast({ message: errMsg, type: 'error' });
      setSaveError(errMsg);
    } finally {
      setSaving(false);
    }
  };

  // Confirm and delete account
  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/settings/delete-account', {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      setShowDeleteModal(false);
      // Sign out and redirect to home
      signOut({ callbackUrl: '/' });
    } catch (err) {
      alert(err.message || 'Error deleting account');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (status === 'loading' || pageLoading) {
    return null;
  }

  const currentAvatarUrl = getGenderAvatar(gender);
  const bioCharCount = 400 - bio.length;

  return (
    <div className={styles.settingsContainer}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Settings</h1>
        <p className={styles.pageSubtitle}>
          Manage your author profile, preferences, and account privacy.
        </p>
      </header>

      {saveSuccess && (
        <div className={styles.statusBannerSuccess}>
          <CheckCircle size={18} weight="regular" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className={styles.statusBannerError}>
          <WarningCircle size={18} weight="regular" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Settings Layout: Left Sidebar + Right Content */}
      <div className={styles.settingsLayout}>
        {/* Left Sidebar Navigation */}
        <aside className={styles.settingsSidebar}>
          <button
            type="button"
            className={`${styles.sidebarTab} ${activeTab === 'profile' ? styles.sidebarTabActive : ''
              }`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} weight={activeTab === 'profile' ? 'fill' : 'regular'} />
            <span>Profile</span>
          </button>
          <button
            type="button"
            className={`${styles.sidebarTab} ${activeTab === 'account' ? styles.sidebarTabActive : ''
              }`}
            onClick={() => setActiveTab('account')}
          >
            <Gear size={18} weight={activeTab === 'account' ? 'fill' : 'regular'} />
            <span>Account</span>
          </button>
        </aside>

        {/* Right Main Content */}
        <main className={styles.settingsContent}>
          {activeTab === 'profile' && (
            <div className={styles.settingsCard}>
              {/* Cover Banner */}
              <div className={styles.coverBanner}>
                <div className={styles.coverBadge}>
                  <Camera size={14} weight="regular" />
                  <span>Writing Desk</span>
                </div>
              </div>

              {/* Profile Header Row with Overlapping Avatar */}
              <div className={styles.profileHeaderRow}>
                <div className={styles.avatarIdentityGroup}>
                  <div className={styles.avatarWrapper}>
                    {currentAvatarUrl ? (
                      <Image
                        src={currentAvatarUrl}
                        alt={name || username}
                        width={96}
                        height={96}
                        className={styles.avatarImage}
                      />
                    ) : (
                      <User size={48} weight="regular" className={styles.avatarPlaceholderIcon} />
                    )}
                  </div>

                  <div className={styles.headerTextGroup}>
                    <h2 className={styles.headerTitle}>Profile</h2>
                    <p className={styles.headerSubtitle}>
                      Update your photo, personal details, and social links.
                    </p>
                  </div>
                </div>
              </div>

              {/* Profile Form Body Rows */}
              <div className={styles.formBody}>
                {/* Row 1: Username (modifiable) */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label htmlFor="username" className={styles.rowLabel}>Username</label>
                    <p className={styles.rowDescription}>
                      Your unique handle on Meridain (modifiable).
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.inputWithPrefix}>
                      <span className={styles.inputPrefix}>meridain.app/</span>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                        placeholder="yourhandle"
                        className={styles.prefixInput}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                      />
                    </div>
                    {usernameStatus.message && (
                      <div
                        className={`${styles.usernameStatusBadge} ${
                          usernameStatus.checking
                            ? styles.usernameChecking
                            : usernameStatus.available
                            ? styles.usernameAvailable
                            : styles.usernameUnavailable
                        }`}
                      >
                        {usernameStatus.checking && <span>Checking availability...</span>}
                        {!usernameStatus.checking && usernameStatus.available && (
                          <>
                            <CheckCircle size={14} weight="fill" />
                            <span>{usernameStatus.message}</span>
                          </>
                        )}
                        {!usernameStatus.checking && usernameStatus.available === false && (
                          <>
                            <WarningCircle size={14} weight="fill" />
                            <span>{usernameStatus.message}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Row 2: Full Display Name */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label htmlFor="name" className={styles.rowLabel}>
                      Display Name
                    </label>
                    <p className={styles.rowDescription}>
                      Your name as it appears to readers on your stories.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Olivia Rhye"
                      className={styles.textInput}
                    />
                  </div>
                </div>

                {/* Row 3: Your Photo / Avatar & Gender Selection */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel}>Your Photo & Gender</label>
                    <p className={styles.rowDescription}>
                      Select your avatar representation and gender identity.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.photoRowContent}>
                      <div className={styles.photoPreviewWrapper}>
                        {currentAvatarUrl ? (
                          <Image
                            src={currentAvatarUrl}
                            alt={name || username}
                            width={56}
                            height={56}
                            className={styles.photoPreviewImg}
                          />
                        ) : (
                          <div className={styles.photoPreviewPlaceholder}>
                            <User size={28} weight="regular" />
                          </div>
                        )}
                      </div>

                      <div className={styles.avatarSelector}>
                        {['male', 'female', 'other'].map((opt) => {
                          const avatarSrc = getGenderAvatar(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => setGender(opt)}
                              className={`${styles.avatarOption} ${gender === opt ? styles.avatarOptionActive : ''
                                }`}
                            >
                              {avatarSrc ? (
                                <Image
                                  src={avatarSrc}
                                  alt={opt}
                                  width={20}
                                  height={20}
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <User size={18} weight="regular" />
                              )}
                              <span style={{ textTransform: 'capitalize' }}>
                                {opt === 'other' ? 'Default' : opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: '0.75rem', maxWidth: '320px' }}>
                      <select
                        id="gender"
                        value={gender || ''}
                        onChange={(e) => setGender(e.target.value)}
                        className={styles.selectInput}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Row 4: Bio */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label htmlFor="bio" className={styles.rowLabel}>
                      Your Bio
                    </label>
                    <p className={styles.rowDescription}>
                      Write a short introduction about yourself and your work.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <textarea
                      id="bio"
                      maxLength={400}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Add a short bio about what you write..."
                      className={styles.bioTextarea}
                    />
                    <div className={styles.charCounter}>
                      {bioCharCount >= 0
                        ? `${bioCharCount} characters left`
                        : `${Math.abs(bioCharCount)} characters over limit`}
                    </div>
                  </div>
                </div>

                {/* Row 5: Location & Date of Birth */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel}>Location & Birthdate</label>
                    <p className={styles.rowDescription}>
                      Where you are based and your date of birth.
                    </p>
                  </div>
                  <div
                    className={styles.rowInputCol}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                  >
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--task-editor-text-muted, #71717a)', marginBottom: '0.35rem' }}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. San Francisco, CA"
                        className={styles.textInput}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--task-editor-text-muted, #71717a)', marginBottom: '0.35rem' }}>
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className={styles.textInput}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 6: Social Profiles (Add your profiles) */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel}>Social Profiles</label>
                    <p className={styles.rowDescription}>
                      Connect your social media and external portfolio links.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.socialListContainer}>
                      {socialProfiles.map((profile, index) => (
                        <div key={index} className={styles.socialItemWrapper}>
                          <div className={styles.socialRow}>
                            <select
                              value={profile.platform}
                              onChange={(e) => handleSocialChange(index, 'platform', e.target.value)}
                              className={styles.socialPlatformSelect}
                            >
                              {Object.keys(PLATFORMS).map((key) => (
                                <option key={key} value={key}>
                                  {PLATFORMS[key].name}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Username or handle"
                              value={profile.username}
                              onChange={(e) => handleSocialChange(index, 'username', e.target.value)}
                              className={styles.socialUsernameInput}
                            />
                            {socialProfiles.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSocial(index)}
                                className={styles.removeSocialButton}
                                title="Remove profile"
                              >
                                <X size={14} weight="regular" />
                              </button>
                            )}
                          </div>
                          {profile.username && PLATFORMS[profile.platform] && (
                            <span className={styles.socialUrlPreview}>
                              {PLATFORMS[profile.platform].url}{profile.username}
                            </span>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddSocial}
                        className={styles.addSocialButton}
                      >
                        <Plus size={14} weight="regular" />
                        <span>Add Social Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row: Cancel & Save Changes */}
              <div className={styles.bottomActions}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className={styles.settingsCard}>
              {/* Simple Account Header Row */}
              <div className={styles.simpleCardHeaderRow}>
                <div className={styles.headerTextGroup}>
                  <h2 className={styles.headerTitle}>Account</h2>
                  <p className={styles.headerSubtitle}>
                    Manage your account preferences, visibility, and security.
                  </p>
                </div>
              </div>

              {/* Account Form Body Rows */}
              <div className={styles.formBody}>
                {/* Row 1: Profile Visibility */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel}>Profile Visibility</label>
                    <p className={styles.rowDescription}>
                      {isPrivate
                        ? 'Private: Your profile identity is masked as "Unknown", but your writings remain accessible.'
                        : 'Public: Your full author profile, avatar, and bio are visible to all readers.'}
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.switchRow}>
                      <span className={styles.visibilityStatus} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {isPrivate ? (
                          <Lock size={16} weight="regular" />
                        ) : (
                          <Globe size={16} weight="regular" />
                        )}
                        <span>{isPrivate ? 'Private (Anonymous writings)' : 'Public Profile'}</span>
                      </span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={!isPrivate}
                          onChange={(e) => setIsPrivate(!e.target.checked)}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 2: Email Notifications */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel}>Email Notifications</label>
                    <p className={styles.rowDescription}>
                      Receive email updates about story activity, feedback, and platform news.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.switchRow}>
                      <span className={styles.notificationStatus} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Bell size={16} weight={emailNotifications ? 'fill' : 'regular'} />
                        <span>{emailNotifications ? 'Notifications Enabled' : 'Notifications Muted'}</span>
                      </span>
                      <label className={styles.switch}>
                        <input
                          type="checkbox"
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
                        <span className={styles.slider} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Row 3: Danger Zone / Delete Account */}
                <div className={styles.formRow}>
                  <div className={styles.rowLabelCol}>
                    <label className={styles.rowLabel} style={{ color: '#ef4444' }}>
                      Danger Zone
                    </label>
                    <p className={styles.rowDescription}>
                      Permanently delete your account and all associated writings.
                    </p>
                  </div>
                  <div className={styles.rowInputCol}>
                    <div className={styles.dangerCard}>
                      <div className={styles.dangerHeader}>
                        <div>
                          <h4 className={styles.dangerTitle}>Delete Account</h4>
                          <p className={styles.dangerDesc}>
                            Once deleted, all your published stories, drafts, and account history cannot be recovered.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDeleteModal(true)}
                          className={styles.deleteButton}
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row: Cancel & Save Changes */}
              <div className={styles.bottomActions}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={styles.cancelButton}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className={styles.saveButton}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className={styles.spinner} />
                      <span>Saving...</span>
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Trash size={24} weight="regular" color="#ef4444" />
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>Delete Account</h3>
            </div>
            <p className={styles.modalDesc}>
              Are you sure you want to permanently delete your account (<strong>@{username}</strong>)? All of your writing, tasks, feedback, and profile information will be permanently removed. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className={styles.modalCancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className={styles.modalDeleteBtn}
              >
                {deleting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}