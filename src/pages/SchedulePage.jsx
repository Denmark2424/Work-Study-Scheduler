/* src/pages/SchedulePage.jsx */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import WeeklyGrid from '../components/WeeklyGrid.jsx'
import { Info, Lock, Zap } from 'lucide-react'
import styles from './SchedulePage.module.css'

const TYPES = ['class', 'work', 'study', 'free']
const TYPE_LABELS = { class: 'CLASS', work: 'WORK', study: 'STUDY', free: 'FREE' }
const ALL_DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const BASIC_DAY_LIMIT = 3

export default function SchedulePage() {
  const { user, setCell, clearCell, schedule } = useApp()
  const [activeTool, setActiveTool] = useState('class')
  const [lastEdit, setLastEdit] = useState(null)

  const isPremium = user?.plan === 'student'

  // For Basic plan: determine which days they've already used (have any cells)
  // They can edit any 3 days — once 3 distinct days have cells, all others are locked
  function getUsedDays() {
    const used = new Set()
    for (const day of ALL_DAYS) {
      const dayCells = schedule[day] || {}
      if (Object.keys(dayCells).length > 0) used.add(day)
    }
    return used
  }

  function isDayLocked(day) {
    if (isPremium) return false
    const usedDays = getUsedDays()
    // Day is locked if it's not already used AND we're already at the 3-day limit
    return !usedDays.has(day) && usedDays.size >= BASIC_DAY_LIMIT
  }

  function handleCellClick(day, slot, currentType) {
    if (!isPremium && isDayLocked(day)) return // Blocked day on Basic

    if (currentType === activeTool) {
      clearCell(day, slot)
      setLastEdit({ action: 'clear', day, slot })
    } else {
      setCell(day, slot, activeTool)
      setLastEdit({ action: 'set', day, slot, type: activeTool })
    }
  }

  const usedDays = getUsedDays()
  const lockedDayCount = !isPremium ? Math.max(0, ALL_DAYS.filter(d => isDayLocked(d)).length) : 0

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Schedule</h1>
          <p className={styles.subtitle}>
            {isPremium
              ? 'Click any cell to assign a time block. Click the same cell again to clear it.'
              : `Click any cell to assign a time block. Basic Plan: up to ${BASIC_DAY_LIMIT} days editable.`}
          </p>
        </div>
      </div>

      {/* Basic plan limit banner */}
      {!isPremium && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#fefce8',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          fontSize: 13,
          color: '#92400e',
          marginBottom: 4,
        }}>
          <Lock size={15} color="#d97706" style={{ flexShrink: 0 }} />
          <span>
            <strong>Basic Plan:</strong> You can schedule up to {BASIC_DAY_LIMIT} days.{' '}
            {usedDays.size}/{BASIC_DAY_LIMIT} days used.{' '}
            Remaining days are <strong>locked</strong> once your limit is reached.{' '}
            <Link to="/subscription" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}>
              Upgrade for all 7 days <Zap size={12} style={{ verticalAlign: 'middle' }} />
            </Link>
          </span>
        </div>
      )}

      {/* Toolbar */}
      <div className={`card ${styles.toolbar}`}>
        <span className={styles.toolbarLabel}>Active Tool:</span>
        {TYPES.map(t => (
          <button
            key={t}
            className={`${styles.toolBtn} ${styles[`tool_${t}`]} ${activeTool === t ? styles.toolActive : ''}`}
            onClick={() => setActiveTool(t)}
          >
            {TYPE_LABELS[t]}
          </button>
        ))}

        {lastEdit && (
          <div className={styles.hint}>
            <Info size={13} />
            {lastEdit.action === 'set'
              ? `Set ${lastEdit.day} ${lastEdit.slot} → ${TYPE_LABELS[lastEdit.type]}`
              : `Cleared ${lastEdit.day} ${lastEdit.slot}`}
          </div>
        )}
      </div>

      {/* Grid */}
      <div className={`card ${styles.gridCard}`}>
        <WeeklyGrid
          onCellClick={handleCellClick}
          lockedDays={!isPremium ? ALL_DAYS.filter(d => isDayLocked(d)) : []}
        />
      </div>

      {/* Legend */}
      <div className={`card ${styles.legend}`}>
        <span className={styles.legendTitle}>Legend</span>
        <div className={styles.legendItems}>
          {TYPES.map(t => (
            <div key={t} className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles[`dot_${t}`]}`} />
              <span>{TYPE_LABELS[t]}</span>
            </div>
          ))}
          {!isPremium && (
            <div className={styles.legendItem}>
              <div className={styles.legendDot} style={{ background: '#e2e8f0', border: '1px dashed #94a3b8' }} />
              <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={11} /> Locked Day
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
