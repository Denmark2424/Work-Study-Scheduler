/* src/pages/Dashboard.jsx */
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  Calendar, FileText, AlertTriangle, CheckCircle,
  BookOpen, Briefcase, Coffee, Clock
} from 'lucide-react'
import WeeklyGrid from '../components/WeeklyGrid.jsx'
import styles from './Dashboard.module.css'

function statColor(type) {
  const map = { class: '#3b82f6', work: '#f59e0b', study: '#22c55e', free: '#94a3b8' }
  return map[type] || '#94a3b8'
}

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
          <h1 className={styles.title}>Good morning, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Here's your week at a glance.</p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/schedule" className="btn btn-primary">
            <Calendar size={16} /> Edit Schedule
          </Link>
        </div>
      </div>

      {/* Conflict banner */}
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
            View full schedule
          </Link>
        </div>
        <WeeklyGrid readonly />
      </div>

      {/* Upcoming deadlines */}
      <div className={`card ${styles.deadlinesCard}`}>
        <div className={styles.gridHeader}>
          <h2>Upcoming Deadlines</h2>
          <Link to="/deadlines" className="btn btn-secondary" style={{ fontSize: 13 }}>
            <FileText size={14} /> Manage
          </Link>
        </div>
        {deadlines.length === 0 ? (
          <p className={styles.empty}>No deadlines added yet.</p>
        ) : (
          <div className={styles.deadlineList}>
            {deadlines.map(dl => {
              const isConflict = conflicts.some(c => c.id === dl.id)
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
