/* src/pages/SchedulePage.jsx */
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import WeeklyGrid from '../components/WeeklyGrid.jsx'
import { Trash2, Info } from 'lucide-react'
import styles from './SchedulePage.module.css'

const TYPES = ['class', 'work', 'study', 'free']
const TYPE_LABELS = { class: 'CLASS', work: 'WORK', study: 'STUDY', free: 'FREE' }

export default function SchedulePage() {
  const { setCell, clearCell } = useApp()
  const [activeTool, setActiveTool] = useState('class')
  const [lastEdit, setLastEdit] = useState(null)

  function handleCellClick(day, slot, currentType) {
    if (currentType === activeTool) {
      // clicking same type clears it
      clearCell(day, slot)
      setLastEdit({ action: 'clear', day, slot })
    } else {
      setCell(day, slot, activeTool)
      setLastEdit({ action: 'set', day, slot, type: activeTool })
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Schedule</h1>
          <p className={styles.subtitle}>Click any cell to assign a time block. Click the same cell again to clear it.</p>
        </div>
      </div>

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
        <WeeklyGrid onCellClick={handleCellClick} />
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
        </div>
      </div>
    </div>
  )
}
