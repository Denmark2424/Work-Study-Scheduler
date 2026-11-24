/* src/pages/ConflictsPage.jsx */
import { useApp } from '../context/AppContext.jsx'
import { AlertTriangle, CheckCircle, Lightbulb, Lock, Zap, ArrowRight } from 'lucide-react'
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
  const { user, conflicts, schedule } = useApp()

  const isPremium = user?.plan === 'student'

  // On Basic plan: only notify 1 conflict (1 deadline or 1 time)
  const visibleConflicts = isPremium ? conflicts : conflicts.slice(0, 1)
  const hiddenCount = isPremium ? 0 : Math.max(0, conflicts.length - 1)

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Conflict Detection</h1>
          <p className={styles.subtitle}>
            {isPremium
              ? 'A conflict is detected when a deadline falls on a time block marked as WORK.'
              : 'Basic Plan: Limited to 1 conflict notification at a time. Upgrade for full alerts.'}
          </p>
        </div>
      </div>

      {/* Basic plan banner */}
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
            <strong>Basic Plan:</strong> Notifies only 1 conflict at a time. Conflict tips and automatic early warnings are locked.{' '}
            <Link to="/subscription" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'underline' }}>
              Upgrade to Student Plan <Zap size={12} style={{ verticalAlign: 'middle' }} />
            </Link>
          </span>
        </div>
      )}

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
            <div className={styles.warnTitle}>
              {isPremium
                ? `${conflicts.length} Conflict${conflicts.length > 1 ? 's' : ''} Found`
                : hiddenCount > 0
                  ? `1 Conflict Notified (Basic Plan Limit)`
                  : `1 Conflict Found`}
            </div>
            <div className={styles.warnSub}>
              {isPremium
                ? 'The following deadlines overlap with your work schedule. Plan ahead!'
                : hiddenCount > 0
                  ? `Showing 1 conflict notification. ${hiddenCount} more conflict${hiddenCount > 1 ? 's are' : ' is'} hidden on the Basic Plan.`
                  : 'This deadline overlaps with your work schedule. Plan ahead!'}
            </div>
          </div>
        </div>
      )}

      {/* Conflict cards */}
      {visibleConflicts.length > 0 && (
        <div className={styles.conflictList}>
          {visibleConflicts.map(c => (
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

              {/* Tips: Premium only */}
              {isPremium ? (
                <div className={styles.tipBox}>
                  <Lightbulb size={14} />
                  <span>Tip: {TIPS[c.id % TIPS.length]}</span>
                </div>
              ) : (
                <div className={styles.tipBox} style={{
                  opacity: 0.6,
                  background: '#f1f5f9',
                  border: '1px dashed #cbd5e1',
                  color: '#64748b',
                }}>
                  <Lock size={14} />
                  <span>
                    Conflict tips & suggestions — available on the{' '}
                    <Link to="/subscription" style={{ color: 'var(--brand)', fontWeight: 600 }}>
                      Student Plan
                    </Link>
                    .
                  </span>
                </div>
              )}
            </div>
          ))}

          {/* Hidden conflicts upsell card for Basic plan */}
          {!isPremium && hiddenCount > 0 && (
            <div
              className={`card ${styles.conflictCard}`}
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #ede9fe 100%)',
                border: '1.5px dashed #c4b5fd',
                padding: '24px 20px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed', fontWeight: 700, fontSize: 16 }}>
                <Lock size={18} />
                <span>+{hiddenCount} More Conflict{hiddenCount > 1 ? 's' : ''} Hidden</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#4b5563', maxWidth: 440, lineHeight: 1.5 }}>
                You are on the <strong>Basic Plan</strong>, which only notifies <strong>1 conflict</strong> at a time.
                Upgrade to the <strong>Student Plan (Premium)</strong> to reveal all {conflicts.length} conflicts and get early warning alerts!
              </p>
              <Link
                to="/subscription"
                className="btn btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                  marginTop: 6,
                  padding: '9px 18px',
                  fontWeight: 600,
                }}
              >
                <Zap size={15} /> Upgrade to Student Plan (₱49/mo) <ArrowRight size={14} />
              </Link>
            </div>
          )}
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
        {isPremium ? (
          <>
            <Link to="/schedule" className="btn btn-primary">Edit Schedule</Link>
            <Link to="/deadlines" className="btn btn-secondary">Manage Deadlines</Link>
          </>
        ) : (
          <>
            <Link to="/schedule" className="btn btn-secondary">View Schedule</Link>
            <Link to="/deadlines" className="btn btn-secondary">Manage Deadlines</Link>
            <Link to="/subscription" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={15} /> Upgrade for Full Access
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
