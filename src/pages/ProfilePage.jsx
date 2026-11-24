/* src/pages/ProfilePage.jsx */
import { useState, useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { supabase } from '../lib/supabase.js'
import {
  User, MapPin, GraduationCap, Briefcase,
  CreditCard, CheckCircle2, Edit3, RotateCcw,
  ShieldCheck, Save, X, Camera, Upload, Trash2, Database,
  KeyRound, Eye, EyeOff, AlertCircle
} from 'lucide-react'
import styles from './ProfilePage.module.css'

function getEmptyProfile(userName = '') {
  return {
    name: userName || '',
    role: 'WORKING STUDENT',
    age: '',
    residence: '',
    studentType: '',
    rate: '',
    university: '',
    course: '',
    photo: null,
  }
}

export default function ProfilePage() {
  const { user, isCloud, updateProfile, changePassword } = useApp()
  const fileInputRef = useRef(null)

  const storageKey = `ws_profile_${user?.id || user?.email || 'user'}`

  const [profile, setProfile] = useState(() => {
    // Clear out any old legacy mock profile if present
    try {
      const oldLegacy = localStorage.getItem('ws_student_profile_data')
      if (oldLegacy && oldLegacy.includes('Kenneth B.Mantica')) {
        localStorage.removeItem('ws_student_profile_data')
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.name === 'Kenneth B.Mantica' || !parsed.name) {
          parsed.name = user?.name || ''
        }
        return { ...getEmptyProfile(user?.name), ...parsed }
      }
    } catch (e) {
      console.warn('Failed loading profile from localStorage', e)
    }
    return getEmptyProfile(user?.name)
  })

  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile)
  const [saveAlert, setSaveAlert] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)
  const [pwSubmitting, setPwSubmitting] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // Keep Full Name synced with logged-in user's name
  useEffect(() => {
    if (user?.name) {
      setProfile(prev => {
        if (!prev.name || prev.name === 'Kenneth B.Mantica') {
          return { ...prev, name: user.name }
        }
        return prev
      })
      setFormData(prev => {
        if (!prev.name || prev.name === 'Kenneth B.Mantica') {
          return { ...prev, name: user.name }
        }
        return prev
      })
    }
  }, [user?.name])

  // Sync from Supabase profile columns if available
  useEffect(() => {
    if (user) {
      setProfile(prev => {
        const next = {
          ...prev,
          name: user.name || prev.name,
          role: user.role_title || prev.role || 'WORKING STUDENT',
          age: user.age !== null && user.age !== undefined ? user.age : prev.age,
          residence: user.residence !== null && user.residence !== undefined ? user.residence : prev.residence,
          studentType: user.student_classification !== null && user.student_classification !== undefined ? user.student_classification : prev.studentType,
          rate: user.monthly_rate !== null && user.monthly_rate !== undefined ? user.monthly_rate : prev.rate,
          university: user.school !== null && user.school !== undefined ? user.school : prev.university,
          course: user.degree_program !== null && user.degree_program !== undefined ? user.degree_program : prev.course,
          photo: user.avatar_url || prev.photo,
        }
        if (user.profile_data && typeof user.profile_data === 'object') {
          Object.assign(next, user.profile_data)
        }
        if (next.name === 'Kenneth B.Mantica') {
          next.name = user.name || ''
        }
        return next
      })
      setFormData(prev => {
        const next = {
          ...prev,
          name: user.name || prev.name,
          role: user.role_title || prev.role || 'WORKING STUDENT',
          age: user.age !== null && user.age !== undefined ? user.age : prev.age,
          residence: user.residence !== null && user.residence !== undefined ? user.residence : prev.residence,
          studentType: user.student_classification !== null && user.student_classification !== undefined ? user.student_classification : prev.studentType,
          rate: user.monthly_rate !== null && user.monthly_rate !== undefined ? user.monthly_rate : prev.rate,
          university: user.school !== null && user.school !== undefined ? user.school : prev.university,
          course: user.degree_program !== null && user.degree_program !== undefined ? user.degree_program : prev.course,
          photo: user.avatar_url || prev.photo,
        }
        if (user.profile_data && typeof user.profile_data === 'object') {
          Object.assign(next, user.profile_data)
        }
        if (next.name === 'Kenneth B.Mantica') {
          next.name = user.name || ''
        }
        return next
      })
    }
  }, [user])

  useEffect(() => {
    setFormData(profile)
  }, [profile])

  // --- Photo Upload & Supabase Integration Handler ---
  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
      processImageFile(file)
    }
    e.target.value = ''
  }

  async function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, WEBP).')
      return
    }

    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async (event) => {
      const img = new Image()
      img.onload = async () => {
        const maxDim = 800
        let { width, height } = img
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width)
            width = maxDim
          } else {
            width = Math.round((width * maxDim) / height)
            height = maxDim
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88)

        let finalPhotoUrl = compressedDataUrl

        if (isCloud && supabase) {
          try {
            canvas.toBlob(async (blob) => {
              if (blob) {
                const fileName = `${user?.id || 'user'}_${Date.now()}.jpg`
                const { data: uploadData, error: uploadErr } = await supabase.storage
                  .from('pictures')
                  .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    upsert: true
                  })

                if (!uploadErr && uploadData) {
                  const { data: { publicUrl } } = supabase.storage
                    .from('pictures')
                    .getPublicUrl(fileName)
                  if (publicUrl) {
                    finalPhotoUrl = publicUrl
                    if (updateProfile) {
                      await updateProfile({ avatar_url: publicUrl })
                    }
                  }
                } else if (user?.id && updateProfile) {
                  await updateProfile({ avatar_url: compressedDataUrl })
                }
              }
            }, 'image/jpeg', 0.88)
          } catch (e) {
            console.warn('Supabase storage upload note:', e)
          }
        }

        setProfile(prev => {
          const next = { ...prev, photo: finalPhotoUrl }
          try {
            localStorage.setItem(storageKey, JSON.stringify(next))
          } catch (err) {}
          return next
        })

        setFormData(prev => ({ ...prev, photo: finalPhotoUrl }))
        setIsUploading(false)
        setSaveAlert(
          isCloud
            ? 'Profile picture updated'
            : 'Profile picture updated successfully!'
        )
        setTimeout(() => setSaveAlert(''), 4000)
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  async function handleRemoveCustomPhoto() {
    setProfile(prev => {
      const next = { ...prev, photo: null }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch (err) {}
      return next
    })
    setFormData(prev => ({ ...prev, photo: null }))

    if (isCloud && user?.id && updateProfile) {
      await updateProfile({ avatar_url: null })
    }

    setSaveAlert('Profile photo removed.')
    setTimeout(() => setSaveAlert(''), 4000)
  }

  async function handleSave(e) {
    e.preventDefault()
    setProfile(formData)
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData))
    } catch (err) {
      console.error(err)
    }

    if (isCloud && user?.id && updateProfile) {
      await updateProfile({
        name: formData.name,
        role_title: formData.role || 'WORKING STUDENT',
        age: formData.age || '',
        residence: formData.residence || '',
        student_classification: formData.studentType || '',
        monthly_rate: formData.rate || '',
        school: formData.university || '',
        degree_program: formData.course || '',
        avatar_url: formData.photo || null,
        profile_data: formData,
      })
    }

    setIsEditing(false)
    setSaveAlert(
      isCloud
        ? 'Profile details updated'
        : 'Profile details updated successfully!'
    )
    setTimeout(() => setSaveAlert(''), 4000)
  }

  async function handleReset() {
    if (window.confirm('Clear all profile details and reset to blank?')) {
      const empty = getEmptyProfile(user?.name)
      setProfile(empty)
      setFormData(empty)
      try {
        localStorage.removeItem(storageKey)
        localStorage.removeItem('ws_student_profile_data')
      } catch (err) {}

      if (isCloud && user?.id && updateProfile) {
        await updateProfile({
          name: user?.name || '',
          role_title: 'WORKING STUDENT',
          age: '',
          residence: '',
          student_classification: '',
          monthly_rate: '',
          school: '',
          degree_program: '',
          avatar_url: null,
          profile_data: null,
        })
      }

      setIsEditing(false)
      setSaveAlert('Profile reset.')
      setTimeout(() => setSaveAlert(''), 4000)
    }
  }

  // --- Change Password Submit Handler ---
  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (!currentPassword) {
      setPwError('Please enter your current password.')
      return
    }

    if (!newPassword) {
      setPwError('Please enter a new password.')
      return
    }

    if (newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.')
      return
    }

    if (!/[A-Z]/.test(newPassword)) {
      setPwError('New password must contain at least one uppercase letter (A-Z).')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.')
      return
    }

    if (currentPassword === newPassword) {
      setPwError('New password must be different from your current password.')
      return
    }

    setPwSubmitting(true)
    const res = await changePassword(currentPassword, newPassword)
    setPwSubmitting(false)

    if (res.success) {
      setPwSuccess('Password successfully updated!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(''), 5000)
    } else {
      setPwError(res.error || 'Failed to update password. Check your current password.')
    }
  }

  const displayName = profile.name || user?.name || ''
  const hasDetails = Boolean(profile.age || profile.residence || profile.studentType || profile.rate)

  return (
    <div className={styles.page}>
      {/* Hidden file input for uploading picture */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/png, image/jpeg, image/jpg, image/webp"
        style={{ display: 'none' }}
        aria-label="Upload profile picture"
      />

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Profile</h1>
          <p className={styles.subtitle}>
            Working student identity credentials, security settings, and personal details.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload a new profile picture"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <Camera size={15} color="var(--brand)" />
            {isUploading ? 'Uploading...' : 'Change Photo'}
          </button>

          {!isEditing ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <Edit3 size={15} /> Edit Details
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsEditing(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <X size={15} /> Cancel
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            title="Clear all details"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
          >
            <RotateCcw size={15} /> Reset
          </button>
        </div>
      </div>

      {saveAlert && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--study-bg)',
          color: 'var(--study-text)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          fontWeight: 600,
          fontSize: 14,
          border: '1px solid #86efac',
        }}>
          <CheckCircle2 size={18} />
          <span>{saveAlert}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      <div className={styles.profileLayout}>
        {/* Left Column: ID Card */}
        <div className={styles.idCardWrapper}>
          <div className={styles.idCard}>
            {/* Top Header Badge */}
            <div className={styles.cardBadge}>
              {profile.role || 'WORKING STUDENT'}
            </div>

            {/* Student Photo Frame */}
            <div
              className={styles.photoContainer}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click()
                }
              }}
              tabIndex={0}
              role="button"
              aria-label="Click to change profile picture"
              title="Click to change photo"
            >
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={displayName}
                  className={styles.photo}
                />
              ) : (
                <div className={styles.photoPlaceholder}>
                  <User size={52} color="#94a3b8" />
                  <span className={styles.photoPlaceholderText}>Upload Photo</span>
                </div>
              )}

              {/* Hover overlay with Camera icon */}
              <div className={styles.photoOverlay}>
                <Camera size={26} />
                <span className={styles.photoOverlayText}>
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </span>
                <span className={styles.photoOverlayHint}>
                  {isCloud ? 'Upload Picture' : 'Click to select image'}
                </span>
              </div>
            </div>

            {/* Card Content: Full Name is the user's name, details blank unless filled */}
            <div className={styles.cardContent}>
              <h2 className={styles.cardName}>{displayName}</h2>

              <div className={styles.cardDetails}>
                {profile.age && (
                  <p className={styles.cardDetailLine}>{profile.age} years old</p>
                )}
                {profile.residence && (
                  <p className={styles.cardDetailLine}>Residence of {profile.residence}</p>
                )}
                {profile.studentType && (
                  <p className={styles.cardDetailLine}>{profile.studentType}</p>
                )}
                {profile.rate && (
                  <p className={styles.cardDetailLine}>{profile.rate}</p>
                )}
                {!hasDetails && (
                  <div className={styles.cardEmptyDetails} />
                )}
              </div>

              <div className={styles.cardWatermark}>
                <span className={styles.cardChip}>WS-ID • Active</span>
                <span className={styles.cardVerified}>
                  <ShieldCheck size={14} /> Verified Student
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Information Panels & Change Password */}
        <div className={styles.contentArea}>
          {isEditing ? (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  <Edit3 size={18} color="var(--brand)" /> Edit Profile Information
                </h3>
              </div>

              <form onSubmit={handleSave} className={styles.formGrid}>
                {/* Photo uploader box inside edit mode */}
                <div className={styles.formPhotoSection}>
                  <div className={styles.formPhotoThumb}>
                    {formData.photo ? (
                      <img src={formData.photo} alt="Thumbnail preview" />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#334155' }}>
                        <User size={30} color="#94a3b8" />
                      </div>
                    )}
                  </div>
                  <div className={styles.formPhotoControls}>
                    <div className={styles.formPhotoTitle}>Profile Photo</div>
                    <div className={styles.formPhotoHint}>
                      Upload a photo for your Working Student card (PNG, JPG, or WEBP).
                    </div>
                    <div className={styles.formPhotoBtnRow}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
                      >
                        <Upload size={14} /> Select Picture
                      </button>

                      {formData.photo && (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, photo: null }))
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#ef4444' }}
                        >
                          <Trash2 size={14} /> Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={user?.name || 'Enter full name'}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Card Role Title</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="WORKING STUDENT"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Age</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.age}
                    onChange={e => setFormData({ ...formData, age: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Residence / Location</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.residence}
                    onChange={e => setFormData({ ...formData, residence: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Student Classification</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.studentType}
                    onChange={e => setFormData({ ...formData, studentType: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Monthly Hours / Rate</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>School / College</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.university}
                    onChange={e => setFormData({ ...formData, university: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Degree Program</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={formData.course}
                    onChange={e => setFormData({ ...formData, course: e.target.value })}
                    placeholder=""
                  />
                </div>

                <div className={styles.formActions}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <Save size={15} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <h3 className={styles.panelTitle}>
                  <User size={18} color="var(--brand)" /> Profile Overview
                </h3>
                <span className={styles.badgeWork}>{profile.role || 'WORKING STUDENT'}</span>
              </div>

              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>
                    <User size={15} color="var(--brand)" /> {displayName || '—'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Age & Classification</span>
                  <span className={styles.infoValue}>
                    <GraduationCap size={15} color="#3b82f6" />{' '}
                    {profile.age || profile.studentType
                      ? [profile.age ? `${profile.age} years old` : '', profile.studentType]
                          .filter(Boolean)
                          .join(' • ')
                      : '—'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Residence</span>
                  <span className={styles.infoValue}>
                    <MapPin size={15} color="#ef4444" /> {profile.residence || '—'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Work Schedule / Rate</span>
                  <span className={styles.infoValue}>
                    <Briefcase size={15} color="#d97706" /> {profile.rate || '—'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>School & Degree</span>
                  <span className={styles.infoValue}>
                    <GraduationCap size={15} color="var(--brand)" />{' '}
                    {profile.university || profile.course
                      ? [profile.university, profile.course].filter(Boolean).join(' • ')
                      : '—'}
                  </span>
                </div>

                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Account Status</span>
                  <span className={styles.infoValue}>
                    <CreditCard size={15} color="#16a34a" />
                    {user?.plan === 'student' ? 'Student Plan (Premium)' : 'Basic Plan'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Change Password Panel (Replaces Weekly Work-Study Balance) */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>
                <KeyRound size={18} color="var(--brand)" /> Change Password
              </h3>
            </div>

            <form onSubmit={handlePasswordChange} className={styles.passwordForm}>
              <p className={styles.passwordHint}>
                To change your password, you must enter your current password first for verification.
              </p>

              {pwError && (
                <div className={styles.passwordMsgError}>
                  <AlertCircle size={17} />
                  <span>{pwError}</span>
                </div>
              )}

              {pwSuccess && (
                <div className={styles.passwordMsgSuccess}>
                  <CheckCircle2 size={17} />
                  <span>{pwSuccess}</span>
                </div>
              )}

              {/* Step 1: Must enter current password */}
              <div className={styles.passwordField}>
                <label className={styles.formLabel}>Current Password *</label>
                <div className={styles.passwordInputWrap}>
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    className={styles.passwordInput}
                    value={currentPassword}
                    onChange={e => {
                      setCurrentPassword(e.target.value)
                      if (pwError) setPwError('')
                    }}
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    title={showCurrentPw ? 'Hide password' : 'Show password'}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Step 2: New password */}
              <div className={styles.passwordField}>
                <label className={styles.formLabel}>New Password *</label>
                <div className={styles.passwordInputWrap}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className={styles.passwordInput}
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value)
                      if (pwError) setPwError('')
                    }}
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowNewPw(!showNewPw)}
                    title={showNewPw ? 'Hide password' : 'Show password'}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className={styles.passwordHint}>
                  Must be at least 8 characters long and contain at least one uppercase letter (A-Z).
                </span>
              </div>

              {/* Step 3: Confirm new password */}
              <div className={styles.passwordField}>
                <label className={styles.formLabel}>Confirm New Password *</label>
                <div className={styles.passwordInputWrap}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className={styles.passwordInput}
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value)
                      if (pwError) setPwError('')
                    }}
                    placeholder="Re-type your new password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggleBtn}
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    title={showConfirmPw ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className={styles.passwordActions}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={pwSubmitting || !currentPassword || !newPassword || !confirmPassword}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <KeyRound size={15} />
                  {pwSubmitting ? 'Verifying & Updating...' : 'Update Password'}
                </button>
                {(currentPassword || newPassword || confirmPassword) && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                      setPwError('')
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
