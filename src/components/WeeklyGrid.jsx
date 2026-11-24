/* src/components/WeeklyGrid.jsx */
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
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

export default function WeeklyGrid({ readonly = false, onCellClick }) {
  const { schedule, DAYS, TIME_SLOTS } = useApp()
  const [selectedDay, setSelectedDay] = useState('ALL')

  const visibleDays = selectedDay === 'ALL' ? DAYS : [selectedDay]

  return (
    <div className={styles.container}>
      {/* Responsive Day Filter Tabs (especially great for phones and tablets) */}
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
              className={`${styles.filterPill} ${selectedDay === day ? styles.filterPillActive : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
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
                <th key={d} className={styles.dayHeader}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TIME_SLOTS.map(slot => (
              <tr key={slot}>
                <td className={styles.timeCell}>{slot}</td>
                {visibleDays.map(day => {
                  const type = schedule[day]?.[slot]
                  const cls = type ? TYPE_CLASS[type] : styles.cellEmpty
                  return (
                    <td
                      key={day}
                      className={`${styles.cell} ${cls} ${!readonly && !type ? styles.cellClickable : ''} ${!readonly && type ? styles.cellEditable : ''}`}
                      onClick={() => !readonly && onCellClick && onCellClick(day, slot, type)}
                      title={type ? `${TYPE_LABELS[type]} (${day} ${slot})` : readonly ? '' : `Click to add (${day} ${slot})`}
                      role={!readonly ? 'button' : undefined}
                      tabIndex={!readonly ? 0 : undefined}
                      onKeyDown={(e) => {
                        if (!readonly && onCellClick && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault()
                          onCellClick(day, slot, type)
                        }
                      }}
                    >
                      {type && (
                        <span className={styles.label}>{TYPE_LABELS[type]}</span>
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
