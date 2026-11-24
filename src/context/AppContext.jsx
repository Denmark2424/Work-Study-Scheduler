// src/context/AppContext.jsx
import { createContext, useContext, useState } from 'react'

const AppContext = createContext(null)

// Demo user (matches the persona from the PPT: Kenneth B. Mantica, 21 y/o)
const DEMO_USER = {
  email: 'kenneth@student.edu',
  username: 'kenneth.mantica',
  password: 'password123',
  name: 'Kenneth B. Mantica',
  age: 21,
  residence: 'Villanueva, Mis. Or.',
  plan: 'student',
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const TIME_SLOTS = [
  '6–7 AM', '7–8 AM', '8–9 AM', '9–10 AM', '10–11 AM',
  '11 AM–12 PM', '12–1 PM', '1–2 PM', '2–3 PM', '3–4 PM',
  '4–5 PM', '5–6 PM', '6–7 PM', '7–8 PM', '8–9 PM',
]

// Default schedule matching the PPT prototype
const defaultSchedule = {
  MON: { '7–8 AM': 'class', '8–9 AM': 'class', '9–10 AM': 'class', '10–11 AM': 'class', '11 AM–12 PM': 'free', '12–1 PM': 'free', '1–2 PM': 'work', '2–3 PM': 'work', '3–4 PM': 'work', '4–5 PM': 'work', '5–6 PM': 'work', '6–7 PM': 'study', '7–8 PM': 'study' },
  TUE: { '7–8 AM': 'class', '8–9 AM': 'class', '9–10 AM': 'class', '10–11 AM': 'class', '11 AM–12 PM': 'free', '12–1 PM': 'free', '1–2 PM': 'work', '2–3 PM': 'work', '3–4 PM': 'work', '4–5 PM': 'work', '5–6 PM': 'work', '6–7 PM': 'study', '7–8 PM': 'study' },
  WED: { '11 AM–12 PM': 'free', '12–1 PM': 'free', '1–2 PM': 'work', '2–3 PM': 'work', '3–4 PM': 'work', '4–5 PM': 'work', '5–6 PM': 'work', '6–7 PM': 'study', '7–8 PM': 'study' },
  THU: { '6–7 PM': 'study', '7–8 PM': 'study' },
  FRI: { '6–7 PM': 'study', '7–8 PM': 'study' },
  SAT: {},
  SUN: {},
}

const defaultDeadlines = [
  { id: 1, title: 'Math Assignment', day: 'MON', time: '8–9 AM', subject: 'Mathematics', urgent: true },
  { id: 2, title: 'Science Lab Report', day: 'WED', time: '1–2 PM', subject: 'Science', urgent: false },
  { id: 3, title: 'English Essay', day: 'FRI', time: '6–7 PM', subject: 'English', urgent: true },
]

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [schedule, setSchedule] = useState(defaultSchedule)
  const [deadlines, setDeadlines] = useState(defaultDeadlines)

  function login(identifier, password) {
    if (
      (identifier === DEMO_USER.email || identifier === DEMO_USER.username) &&
      password === DEMO_USER.password
    ) {
      setUser(DEMO_USER)
      setIsLoggedIn(true)
      return true
    }
    return false
  }

  function logout() {
    setIsLoggedIn(false)
    setUser(null)
  }

  function setCell(day, slot, type) {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [slot]: type },
    }))
  }

  function clearCell(day, slot) {
    setSchedule(prev => {
      const updated = { ...prev[day] }
      delete updated[slot]
      return { ...prev, [day]: updated }
    })
  }

  function addDeadline(dl) {
    setDeadlines(prev => [...prev, { ...dl, id: Date.now() }])
  }

  function updateDeadline(id, updatedFields) {
    setDeadlines(prev => prev.map(d => d.id === id ? { ...d, ...updatedFields } : d))
  }

  function removeDeadline(id) {
    setDeadlines(prev => prev.filter(d => d.id !== id))
  }

  // ---- Conflict detection ----
  // A conflict = a deadline whose (day, time slot) overlaps with a WORK block
  const conflicts = deadlines.filter(dl => {
    return schedule[dl.day]?.[dl.time] === 'work'
  })

  return (
    <AppContext.Provider value={{
      isLoggedIn, user, login, logout,
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
