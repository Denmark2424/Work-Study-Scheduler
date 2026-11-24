/* src/components/WeeklyGrid.jsx */
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Lock } from 'lucide-react'
import styles from './WeeklyGrid.module.css'

const TYPE_LABELS = {
  class: 'CLASS',
  work: 'WORK',
  study: 'STUDY',
  free: 'FREE',
}

const TYPE_CLASS = {
  class: styles.cellClass,
  work: styles.cellWork,
  study: styles.cellStudy,
  free: styles.cellFree,
}

export default function WeeklyGrid({ readonly = false, onCellClick, lockedDays = [] }) {
  const { schedule, DAYS, TIME_SLOTS } = useApp()
  const [selectedDay, setSelectedDay] = useState('ALL')

  const visibleDays = selectedDay === 'ALL' ? DAYS : [selectedDay]
  const lockedSet = new Set(lockedDays)

  return (
    <div className={styles.container}>
      {/* Responsive Day Filter Tabs */}
      <div className={styles.dayFilterBar}>
        <span className={styles.filterLabel}>View:</span>
        <div className={styles.filterPills}>
          <button
            type="button"
            className={`${styles.filterPill} ${selectedDay === 'ALL' ? styles.filterPillActive : ''}`}
            onClick={() => setSelectedDay('ALL')}
          >
            All Days
          </button>
          {DAYS.map(day => (
            <button
              key={day}
              type="button"
              className={`${styles.filterPill} ${selectedDay === day ? styles.filterPillActive : ''} ${lockedSet.has(day) ? styles.filterPillLocked : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
              {lockedSet.has(day) && <Lock size={10} style={{ marginLeft: 3, verticalAlign: 'middle' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Table with Sticky Time Column */}
      <div className={styles.wrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.timeHeader}>Time Slot</th>
              {visibleDays.map(d => (
                <th
                  key={d}
                  className={`${styles.dayHeader} ${lockedSet.has(d) ? styles.dayHeaderLocked : ''}`}
                >
                  {d}
                  {lockedSet.has(d) && (
                    <span style={{ marginLeft: 4, opacity: 0.6 }}>
                      <Lock size={11} style={{ verticalAlign: 'middle' }} />
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td className={styles.timeCell}>{slot}</td>
                {visibleDays.map(day => {
                  const type = schedule[day]?.[slot]
                  const isLocked = lockedSet.has(day)
                  const cls = type ? TYPE_CLASS[type] : (isLocked ? styles.cellLocked : styles.cellEmpty)
                  const interactive = !readonly && !isLocked
                  return (
                    <td
                      key={day}
                      className={`${styles.cell} ${cls} ${interactive && !type ? styles.cellClickable : ''} ${interactive && type ? styles.cellEditable : ''}`}
                      onClick={() => interactive && onCellClick && onCellClick(day, slot, type)}
                      title={
                        isLocked
                          ? `${day} is locked — upgrade to edit all 7 days`
                          : type
                            ? `${TYPE_LABELS[type]} (${day} ${slot})`
                            : readonly
                              ? ''
                              : `Click to add (${day} ${slot})`
                      }
                      role={interactive ? 'button' : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (interactive && onCellClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          onCellClick(day, slot, type)
                        }
                      }}
                    >
                      {type && !isLocked && (
                        <span className={styles.label}>{TYPE_LABELS[type]}</span>
                      )}
                      {isLocked && (
                        <span className={styles.lockedLabel}>
                          <Lock size={12} />
                        </span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.scrollHint}>
        <span>← Swipe horizontally to see all days →</span>
      </div>
    </div>
  )
}
