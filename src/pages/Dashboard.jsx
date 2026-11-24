/* src/pages/Dashboard.jsx */
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  Calendar, FileText, AlertTriangle, CheckCircle,
  BookOpen, Briefcase, Coffee, Clock, Lock, Zap
} from 'lucide-react'
import WeeklyGrid from '../components/WeeklyGrid.jsx'
import styles from './Dashboard.module.css'

const BASIC_DEADLINE_LIMIT = 3

function countCells(schedule, type) {
  let n = 0
  for (const day of Object.values(schedule)) {
    for (const v of Object.values(day)) {
      if (v === type) n++
    }
  }
  return n
}

export default function Dashboard() {
  const { user, schedule, deadlines, conflicts, DAYS, TIME_SLOTS } = useApp()

  const isPremium = user?.plan === 'student'

  const classHours = countCells(schedule, 'class')
  const workHours = countCells(schedule, 'work')
  const studyHours = countCells(schedule, 'study')
  const freeHours = countCells(schedule, 'free')

  const stats = [
    { label: 'Class Hours', value: classHours, icon: BookOpen, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Work Hours', value: workHours, icon: Briefcase, color: '#d97706', bg: '#fef9c3' },
    { label: 'Study Hours', value: studyHours, icon: Coffee, color: '#16a34a', bg: '#dcfce7' },
    { label: 'Free Hours', value: freeHours, icon: Clock, color: '#6b7280', bg: '#f3f4f6' },
  ]

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0] || 'Student'} 👋</h1>
          <p className={styles.subtitle}>Here's your week at a glance.</p>
        </div>
        <div className={styles.headerActions}>
          {isPremium ? (
            <Link to="/schedule" className="btn btn-primary">
              <Calendar size={16} /> Edit Schedule
            </Link>
          ) : (
            <Link to="/schedule" className="btn btn-secondary">
              <Calendar size={16} /> View Schedule
            </Link>
          )}
        </div>
      </div>

      {/* Upgrade banner for Basic plan */}
      {!isPremium && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: 'linear-gradient(135deg, #ede9fe, #dbeafe)',
          border: '1px solid #c4b5fd',
          borderRadius: 'var(--radius-sm)',
          padding: '12px 18px',
          fontSize: 13,
          color: '#4c1d95',
        }}>
          <Zap size={16} color="#7c3aed" style={{ flexShrink: 0 }} />
          <span>
            <strong>You're on the Basic Plan.</strong> Unlock full schedule editing, unlimited deadlines,
            automatic conflict detection, and tips by upgrading.{' '}
            <Link to="/subscription" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'underline' }}>
              Upgrade now →
            </Link>
          </span>
        </div>
      )}

      {/* Conflict banner — Premium: all auto-detected, Basic: 1 conflict alert */}
      {isPremium ? (
        <>
          {conflicts.length > 0 && (
            <Link to="/conflicts" className={styles.conflictBanner}>
              <AlertTriangle size={18} />
              <span>
                <strong>{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''} detected</strong> —
                a deadline overlaps with your work shift. Tap to review.
              </span>
              <span className={styles.bannerArrow}>→</span>
            </Link>
          )}
          {conflicts.length === 0 && (
            <div className={styles.clearBanner}>
              <CheckCircle size={18} />
              <span><strong>All clear!</strong> No conflicts between your deadlines and work shifts.</span>
            </div>
          )}
        </>
      ) : conflicts.length > 0 ? (
        <Link to="/conflicts" className={styles.conflictBanner} style={{ borderLeftColor: '#f59e0b' }}>
          <AlertTriangle size={18} color="#d97706" />
          <span>
            <strong>1 conflict alert notified (Basic Plan)</strong> —
            tap to review on the Conflicts page. Upgrade to Student Plan to reveal all conflicts.
          </span>
          <span className={styles.bannerArrow}>→</span>
        </Link>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 16px',
          fontSize: 13,
          color: '#64748b',
        }}>
          <CheckCircle size={16} color="var(--success)" style={{ flexShrink: 0 }} />
          <span>
            <strong>All clear:</strong> No active conflicts detected between your deadlines and work shifts.
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className={styles.statsRow}>
        {stats.map(s => (
          <div key={s.label} className={`card ${styles.statCard}`}>
            <div className={styles.statIcon} style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div>
              <div className={styles.statValue}>{s.value}h</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly grid preview */}
      <div className={`card ${styles.gridCard}`}>
        <div className={styles.gridHeader}>
          <h2>My Week</h2>
          <Link to="/schedule" className="btn btn-secondary" style={{ fontSize: 13 }}>
            {isPremium ? 'Edit schedule' : 'View schedule'}
          </Link>
        </div>
        <WeeklyGrid readonly />
      </div>

      {/* Upcoming deadlines */}
      <div className={`card ${styles.deadlinesCard}`}>
        <div className={styles.gridHeader}>
          <h2>Upcoming Deadlines</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isPremium && (
              <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Lock size={12} /> {deadlines.length}/{BASIC_DEADLINE_LIMIT}
              </span>
            )}
            <Link to="/deadlines" className="btn btn-secondary" style={{ fontSize: 13 }}>
              <FileText size={14} /> Manage
            </Link>
          </div>
        </div>
        {deadlines.length === 0 ? (
          <p className={styles.empty}>No deadlines added yet.</p>
        ) : (
          <div className={styles.deadlineList}>
            {deadlines.map(dl => {
              const activeConflicts = isPremium ? conflicts : conflicts.slice(0, 1)
              const isConflict = activeConflicts.some(c => c.id === dl.id)
              return (
                <div key={dl.id} className={`${styles.deadlineRow} ${isConflict ? styles.conflictRow : ''}`}>
                  <div className={styles.dlLeft}>
                    {isConflict && <AlertTriangle size={15} color="var(--danger)" />}
                    <div>
                      <div className={styles.dlTitle}>{dl.title}</div>
                      <div className={styles.dlMeta}>{dl.subject} · {dl.day} {dl.time}</div>
                    </div>
                  </div>
                  {dl.urgent && <span className="badge badge-deadline">Urgent</span>}
                  {isConflict && <span className="badge badge-deadline">Conflict!</span>}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
