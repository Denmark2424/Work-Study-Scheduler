// src/context/AppContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const AppContext = createContext(null)

const STORAGE_USERS_KEY = 'sched_users'
const STORAGE_CURRENT_USER_KEY = 'sched_current_user'
const STORAGE_SCHEDULE_KEY = 'sched_schedule'
const STORAGE_DEADLINES_KEY = 'sched_deadlines'

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const TIME_SLOTS = [
  '6–7 AM', '7–8 AM', '8–9 AM', '9–10 AM', '10–11 AM',
  '11 AM–12 PM', '12–1 PM', '1–2 PM', '2–3 PM', '3–4 PM',
  '4–5 PM', '5–6 PM', '6–7 PM', '7–8 PM', '8–9 PM',
]

const emptySchedule = {
  MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {}, SAT: {}, SUN: {}
}

function getInitialLocalUsers() {
  try {
    const saved = localStorage.getItem(STORAGE_USERS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        return parsed
      }
    }
  } catch (e) {
    console.warn('Failed reading users from localStorage', e)
  }
  return []
}

function getInitialLocalUser() {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (e) {
    console.warn('Failed reading currentUser from localStorage', e)
  }
  return null
}

function getInitialLocalSchedule() {
  try {
    const saved = localStorage.getItem(STORAGE_SCHEDULE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {}
  return emptySchedule
}

function getInitialLocalDeadlines() {
  try {
    const saved = localStorage.getItem(STORAGE_DEADLINES_KEY)
    if (saved) return JSON.parse(saved)
  } catch (e) {}
  return []
}

export function AppProvider({ children }) {
  const isCloud = isSupabaseConfigured()

  const [users, setUsers] = useState(getInitialLocalUsers)
  const [user, setUser] = useState(() => isCloud ? null : getInitialLocalUser())
  const [isLoggedIn, setIsLoggedIn] = useState(() => isCloud ? false : Boolean(getInitialLocalUser()))
  const [schedule, setSchedule] = useState(() => isCloud ? emptySchedule : getInitialLocalSchedule())
  const [deadlines, setDeadlines] = useState(() => isCloud ? [] : getInitialLocalDeadlines())
  const [loading, setLoading] = useState(isCloud)

  // Fetch Supabase data for the current authenticated user
  async function loadUserData(userId, userMeta = {}) {
    if (!supabase || !userId) return

    try {
      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profile) {
        setUser({
          id: profile.id,
          name: profile.name,
          username: profile.username,
          email: profile.email,
          plan: profile.plan,
          avatar_url: profile.avatar_url || null,
          role_title: profile.role_title || profile.role || null,
          age: profile.age || null,
          residence: profile.residence || null,
          student_classification: profile.student_classification || profile.student_type || null,
          monthly_rate: profile.monthly_rate || profile.rate || null,
          school: profile.school || profile.university || null,
          degree_program: profile.degree_program || profile.course || null,
          profile_data: profile.profile_data || null,
        })
      } else {
        setUser({
          id: userId,
          name: userMeta?.name || 'Student',
          username: userMeta?.username || 'student',
          email: userMeta?.email,
          plan: userMeta?.plan || 'free',
          avatar_url: userMeta?.avatar_url || null,
          role_title: userMeta?.role_title || null,
          age: userMeta?.age || null,
          residence: userMeta?.residence || null,
          student_classification: userMeta?.student_classification || null,
          monthly_rate: userMeta?.monthly_rate || null,
          school: userMeta?.school || null,
          degree_program: userMeta?.degree_program || null,
          profile_data: userMeta?.profile_data || null,
        })
      }

      // 2. Fetch Schedule
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('day, slot, type')
        .eq('user_id', userId)

      const grid = { MON: {}, TUE: {}, WED: {}, THU: {}, FRI: {}, SAT: {}, SUN: {} }
      if (scheduleData && Array.isArray(scheduleData)) {
        scheduleData.forEach(row => {
          if (grid[row.day]) {
            grid[row.day][row.slot] = row.type
          }
        })
      }
      setSchedule(grid)

      // 3. Fetch Deadlines
      const { data: deadlineData } = await supabase
        .from('deadlines')
        .select('*')
        .eq('user_id', userId)
        .order('id', { ascending: true })

      if (deadlineData && Array.isArray(deadlineData)) {
        setDeadlines(deadlineData)
      }
    } catch (err) {
      console.error('Error loading Supabase user data:', err)
    }
  }

  // Set up Supabase auth listener on mount
  useEffect(() => {
    if (!isCloud || !supabase) {
      setLoading(false)
      return
    }

    let isMounted = true

    async function initSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && isMounted) {
          setIsLoggedIn(true)
          await loadUserData(session.user.id, session.user.user_metadata)
        }
      } catch (e) {
        console.warn('Session init error:', e)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    initSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setIsLoggedIn(true)
        await loadUserData(session.user.id, session.user.user_metadata)
      } else {
        setIsLoggedIn(false)
        setUser(null)
        setSchedule(emptySchedule)
        setDeadlines([])
      }
      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [isCloud])

  // --- Auth Handlers ---

  async function login(identifier, password) {
    const cleanId = (identifier || '').trim().toLowerCase()

    if (isCloud && supabase) {
      try {
        let emailToUse = cleanId

        // If the user entered a username instead of an email, look up the email
        if (!cleanId.includes('@')) {
          const { data, error: profileErr } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', cleanId)
            .maybeSingle()

          if (profileErr || !data?.email) {
            return { success: false, error: 'Username not found. Please check your credentials.' }
          }
          emailToUse = data.email
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data?.user) {
          setIsLoggedIn(true)
          await loadUserData(data.user.id, data.user.user_metadata)
          return { success: true }
        }
        return { success: false, error: 'Login failed. Please try again.' }
      } catch (err) {
        return { success: false, error: err.message || 'Login error occurred.' }
      }
    }

    // LocalStorage Fallback
    const found = users.find(
      u => (u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId) &&
           u.password === password
    )

    if (found) {
      setUser(found)
      setIsLoggedIn(true)
      try {
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(found))
      } catch (e) {}
      return { success: true }
    }
    return { success: false, error: 'Invalid email/username or password.' }
  }

  async function signup({ name, username, email, password, plan = 'free' }) {
    const cleanEmail = (email || '').trim().toLowerCase()
    const cleanUsername = (username || '').trim().toLowerCase()

    if (!cleanEmail || !cleanUsername || !password || !name) {
      return { success: false, error: 'Please fill in all required fields.' }
    }

    if (password.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' }
    }

    if (!/[A-Z]/.test(password)) {
      return { success: false, error: 'Password must contain at least one uppercase letter (A-Z).' }
    }

    if (isCloud && supabase) {
      try {
        // Check if username already exists in profiles
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanUsername)
          .maybeSingle()

        if (existingUser) {
          return { success: false, error: 'This username is already taken. Please choose another.' }
        }

        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: name.trim(),
              username: cleanUsername,
              plan,
            },
          },
        })

        if (error) {
          return { success: false, error: error.message }
        }

        if (data?.user) {
          // If Supabase has email confirmation enabled, session will be null
          if (!data.session) {
            return {
              success: false,
              error: 'Sign up successful! Please check your email to confirm your account, or disable "Confirm email" in Supabase Authentication Settings.',
            }
          }

          // Manually ensure profile exists (in case trigger is delayed or not yet run)
          try {
            await supabase.from('profiles').upsert({
              id: data.user.id,
              name: name.trim(),
              username: cleanUsername,
              email: cleanEmail,
              plan,
              updated_at: new Date().toISOString(),
            })
          } catch (pErr) {
            console.warn('Profile upsert note:', pErr)
          }

          const newUser = {
            id: data.user.id,
            name: name.trim(),
            username: cleanUsername,
            email: cleanEmail,
            plan,
          }
          setUser(newUser)
          setIsLoggedIn(true)
          return { success: true, user: newUser }
        }

        return { success: false, error: 'Sign up failed. Please try again.' }
      } catch (err) {
        return { success: false, error: err.message || 'Error creating account.' }
      }
    }

    // LocalStorage Fallback
    const emailExists = users.some(u => u.email.toLowerCase() === cleanEmail)
    if (emailExists) {
      return { success: false, error: 'An account with this email address already exists.' }
    }

    const usernameExists = users.some(u => u.username.toLowerCase() === cleanUsername)
    if (usernameExists) {
      return { success: false, error: 'This username is already taken. Please choose another.' }
    }

    const newUser = {
      id: Date.now().toString(),
      name: name.trim(),
      username: cleanUsername,
      email: cleanEmail,
      password,
      plan,
    }

    const updatedUsers = [...users, newUser]
    setUsers(updatedUsers)
    setUser(newUser)
    setIsLoggedIn(true)

    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updatedUsers))
      localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(newUser))
    } catch (e) {}

    return { success: true, user: newUser }
  }

  async function logout() {
    if (isCloud && supabase) {
      try {
        await supabase.auth.signOut()
      } catch (e) {}
    }
    setIsLoggedIn(false)
    setUser(null)
    setSchedule(emptySchedule)
    setDeadlines([])
    try {
      localStorage.removeItem(STORAGE_CURRENT_USER_KEY)
    } catch (e) {}
  }

  // --- Schedule Handlers ---

  async function setCell(day, slot, type) {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [slot]: type },
    }))

    if (isCloud && supabase && user?.id) {
      try {
        const { error } = await supabase.from('schedules').upsert({
          user_id: user.id,
          day,
          slot,
          type,
        }, { onConflict: 'user_id, day, slot' })
        if (error) console.error('Failed saving schedule cell to Supabase:', error)
      } catch (err) {
        console.error('Failed saving schedule cell to Supabase:', err)
      }
    } else {
      setSchedule(prev => {
        try {
          localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(prev))
        } catch (e) {}
        return prev
      })
    }
  }

  async function clearCell(day, slot) {
    setSchedule(prev => {
      const updatedDay = { ...prev[day] }
      delete updatedDay[slot]
      const updated = { ...prev, [day]: updatedDay }
      try {
        localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })

    if (isCloud && supabase && user?.id) {
      try {
        await supabase.from('schedules')
          .delete()
          .eq('user_id', user.id)
          .eq('day', day)
          .eq('slot', slot)
      } catch (err) {
        console.error('Failed clearing schedule cell in Supabase:', err)
      }
    }
  }

  // --- Deadline Handlers ---

  const BASIC_DEADLINE_LIMIT = 3

  async function addDeadline(dl) {
    // Enforce deadline limit for Basic plan users
    const isPremium = user?.plan === 'student'
    if (!isPremium) {
      const currentCount = deadlines.length
      if (currentCount >= BASIC_DEADLINE_LIMIT) {
        console.warn('Basic plan deadline limit reached.')
        return
      }
    }

    const tempId = Date.now()
    const optimisticDl = { ...dl, id: tempId }
    setDeadlines(prev => [...prev, optimisticDl])

    if (isCloud && supabase && user?.id) {
      try {
        const { data, error } = await supabase.from('deadlines').insert({
          user_id: user.id,
          title: dl.title,
          subject: dl.subject || '',
          day: dl.day,
          time: dl.time,
          urgent: !!dl.urgent,
        }).select().single()

        if (error) console.error('Failed adding deadline to Supabase:', error)
        if (data) {
          setDeadlines(prev => prev.map(d => d.id === tempId ? data : d))
        }
      } catch (err) {
        console.error('Failed adding deadline to Supabase:', err)
      }
    } else {
      setDeadlines(prev => {
        try {
          localStorage.setItem(STORAGE_DEADLINES_KEY, JSON.stringify(prev))
        } catch (e) {}
        return prev
      })
    }
  }

  async function updateDeadline(id, updatedFields) {
    setDeadlines(prev => {
      const updated = prev.map(d => d.id === id ? { ...d, ...updatedFields } : d)
      try {
        localStorage.setItem(STORAGE_DEADLINES_KEY, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })

    if (isCloud && supabase && user?.id) {
      try {
        await supabase.from('deadlines').update({
          title: updatedFields.title,
          subject: updatedFields.subject,
          day: updatedFields.day,
          time: updatedFields.time,
          urgent: updatedFields.urgent,
        }).eq('id', id)
      } catch (err) {
        console.error('Failed updating deadline in Supabase:', err)
      }
    }
  }

  async function removeDeadline(id) {
    setDeadlines(prev => {
      const updated = prev.filter(d => d.id !== id)
      try {
        localStorage.setItem(STORAGE_DEADLINES_KEY, JSON.stringify(updated))
      } catch (e) {}
      return updated
    })

    if (isCloud && supabase && user?.id) {
      try {
        await supabase.from('deadlines').delete().eq('id', id)
      } catch (err) {
        console.error('Failed removing deadline from Supabase:', err)
      }
    }
  }

  async function updatePlan(newPlan) {
    setUser(prev => (prev ? { ...prev, plan: newPlan } : prev))

    if (isCloud && supabase && user?.id) {
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ plan: newPlan, updated_at: new Date().toISOString() })
          .eq('id', user.id)
        if (error) console.error('Failed updating plan in Supabase:', error)
      } catch (err) {
        console.error('Error updating plan:', err)
      }
    } else {
      try {
        const current = JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER_KEY) || '{}')
        const updated = { ...current, plan: newPlan }
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(updated))
      } catch (e) {}
    }
  }

  async function updateProfile(fields) {
    if (!fields) return
    setUser(prev => (prev ? { ...prev, ...fields } : prev))

    if (isCloud && supabase && user?.id) {
      try {
        const updatePayload = { updated_at: new Date().toISOString() }

        if (fields.name !== undefined) updatePayload.name = fields.name
        if (fields.avatar_url !== undefined) updatePayload.avatar_url = fields.avatar_url
        if (fields.role_title !== undefined) updatePayload.role_title = fields.role_title
        if (fields.age !== undefined) updatePayload.age = fields.age
        if (fields.residence !== undefined) updatePayload.residence = fields.residence
        if (fields.student_classification !== undefined) updatePayload.student_classification = fields.student_classification
        if (fields.monthly_rate !== undefined) updatePayload.monthly_rate = fields.monthly_rate
        if (fields.school !== undefined) updatePayload.school = fields.school
        if (fields.degree_program !== undefined) updatePayload.degree_program = fields.degree_program
        if (fields.profile_data !== undefined) updatePayload.profile_data = fields.profile_data

        const { error } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', user.id)
        if (error) console.warn('Supabase profile update warning:', error)
      } catch (err) {
        console.warn('Error updating profile in Supabase:', err)
      }
    }
  }

  async function changePassword(currentPassword, newPassword) {
    if (!currentPassword) {
      return { success: false, error: 'Please enter your current password.' }
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' }
    }
    if (!/[A-Z]/.test(newPassword)) {
      return { success: false, error: 'New password must contain at least one uppercase letter (A-Z).' }
    }
    if (currentPassword === newPassword) {
      return { success: false, error: 'New password must be different from your current password.' }
    }

    if (isCloud && supabase && user?.email) {
      try {
        // Step 1: Re-authenticate to verify current password
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        })
        if (signInErr) {
          return { success: false, error: 'Incorrect current password. Please try again.' }
        }

        // Step 2: Update password in Supabase Auth
        const { error: updateErr } = await supabase.auth.updateUser({
          password: newPassword,
        })
        if (updateErr) {
          return { success: false, error: updateErr.message }
        }

        return { success: true }
      } catch (err) {
        return { success: false, error: err.message || 'Failed to update password.' }
      }
    }

    // LocalStorage Fallback
    try {
      const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || '[]')
      const index = users.findIndex(u => u.id === user?.id || u.email === user?.email)
      if (index !== -1) {
        if (users[index].password !== currentPassword) {
          return { success: false, error: 'Incorrect current password. Please try again.' }
        }
        users[index].password = newPassword
        localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))

        const cur = JSON.parse(localStorage.getItem(STORAGE_CURRENT_USER_KEY) || '{}')
        cur.password = newPassword
        localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(cur))

        return { success: true }
      }
    } catch (e) {
      return { success: false, error: 'Failed to update local password.' }
    }

    return { success: false, error: 'User account not found.' }
  }

  // ---- Conflict detection ----
  // Always computed; UI pages decide whether to show based on plan
  const conflicts = deadlines.filter(dl => {
    return schedule[dl.day]?.[dl.time] === 'work'
  })

  return (
    <AppContext.Provider value={{
      isLoggedIn, user, loading, isCloud, login, signup, logout, updatePlan, updateProfile, changePassword,
      schedule, setCell, clearCell,
      deadlines, addDeadline, updateDeadline, removeDeadline,
      conflicts,
      DAYS, TIME_SLOTS,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
