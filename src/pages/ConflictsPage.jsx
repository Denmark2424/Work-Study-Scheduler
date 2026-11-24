/* src/pages/ConflictsPage.jsx */
import { useApp } from '../context/AppContext.jsx'
import { AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import styles from './ConflictsPage.module.css'

const TIPS = [
  'Talk to your employer about adjusting your shift for that day.',
  'Complete the assignment early, before the work shift starts.',
  'Ask a classmate for notes if you need to attend work.',
  'Inform your instructor in advance if you foresee a conflict.',
  'Block extra study time the day before the deadline.',
]

export default function ConflictsPage() {
  const { conflicts, schedule } = useApp()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Conflict Detection</h1>
          <p className={styles.subtitle}>
            A conflict is detected when a deadline falls on a time block marked as WORK.
          </p>
        </div>
      </div>

      {/* Status banner */}
      {conflicts.length === 0 ? (
        <div className={styles.clearBanner}>
          <CheckCircle size={32} color="var(--success)" />
          <div>
            <div className={styles.clearTitle}>No Conflicts Detected!</div>
            <div className={styles.clearSub}>
              All your deadlines are outside your work shifts. Keep planning ahead!
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.warningBanner}>
          <AlertTriangle size={32} color="var(--warning)" />
          <div>
            <div className={styles.warnTitle}>{conflicts.length} Conflict{conflicts.length > 1 ? 's' : ''} Found</div>
            <div className={styles.warnSub}>
              The following deadlines overlap with your work schedule. Plan ahead!
            </div>
          </div>
        </div>
      )}

      {/* Conflict cards */}
      {conflicts.length > 0 && (
        <div className={styles.conflictList}>
          {conflicts.map(c => (
            <div key={c.id} className={`card ${styles.conflictCard}`}>
              <div className={styles.conflictTop}>
                <AlertTriangle size={18} color="var(--danger)" />
                <div>
                  <div className={styles.conflictTitle}>{c.title}</div>
                  <div className={styles.conflictMeta}>{c.subject} · {c.day} · {c.time}</div>
                </div>
                {c.urgent && <span className="badge badge-deadline" style={{ marginLeft: 'auto' }}>Urgent</span>}
              </div>
              <div className={styles.conflictExplain}>
                Your schedule shows <strong>WORK</strong> on <strong>{c.day} {c.time}</strong>,
                but you have a deadline during that exact slot.
              </div>
              <div className={styles.tipBox}>
                <Lightbulb size={14} />
                <span>Tip: {TIPS[c.id % TIPS.length]}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className={`card ${styles.howCard}`}>
        <h2 className={styles.howTitle}>How Conflict Detection Works</h2>
        <div className={styles.steps}>
          {[
            ['1', 'INPUT', 'Enter your class schedule, work shifts, and deadlines.'],
            ['2', 'ORGANIZE', 'All time blocks are placed on one unified weekly calendar.'],
            ['3', 'DETECT', 'Deadlines are compared against WORK blocks automatically.'],
            ['4', 'ALERT', 'A warning is shown when a deadline lands on a WORK block.'],
            ['5', 'PLAN', 'Adjust your schedule, prepare earlier, or communicate with your employer.'],
          ].map(([num, label, desc]) => (
            <div key={num} className={styles.step}>
              <div className={styles.stepNum}>{num}</div>
              <div>
                <div className={styles.stepLabel}>{label}</div>
                <div className={styles.stepDesc}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Link to="/schedule" className="btn btn-primary">Edit Schedule</Link>
        <Link to="/deadlines" className="btn btn-secondary">Manage Deadlines</Link>
      </div>
    </div>
  )
}
