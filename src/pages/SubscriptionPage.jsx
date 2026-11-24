/* src/pages/SubscriptionPage.jsx */
import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { Check, Star, Zap, CheckCircle2 } from 'lucide-react'
import styles from './SubscriptionPage.module.css'

const PLANS = [
  {
    id: 'free',
    name: 'Basic Plan',
    price: '₱0',
    period: '/month',
    desc: 'Get started at no cost.',
    highlight: false,
    features: [
      'Schedule up to 3 days per week',
      'Up to 3 deadlines',
      'Notifies 1 conflict at a time',
      'Manual conflict checking',
    ],
    cta: 'Downgrade to Basic',
  },
  {
    id: 'student',
    name: 'Student Plan (Premium)',
    price: '₱49',
    period: '/month',
    desc: 'Affordable monthly access for working students.',
    highlight: true,
    features: [
      'Full weekly schedule editor (7 days)',
      'Unlimited deadlines',
      'Unlimited conflict notifications',
      'Automatic conflict detection',
      'Conflict tips & suggestions',
      'Priority support',
      'Early warning alerts',
    ],
    cta: 'Upgrade to Student Plan →',
    badge: 'Recommended',
  },
]

const FEATURES = [
  ['Schedule editing (up to 3 days)', true, true],
  ['Schedule editing (all 7 days)', false, true],
  ['Up to 3 deadlines', true, true],
  ['Unlimited deadlines', false, true],
  ['Conflict notifications', '1 conflict', 'Unlimited'],
  ['Automatic conflict detection', false, true],
  ['Conflict tips & suggestions', false, true],
  ['Early warning alerts', false, true],
]

export default function SubscriptionPage() {
  const { user, updatePlan } = useApp()
  const [loadingPlan, setLoadingPlan] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  const currentPlanId = user?.plan || 'free'

  async function handleSelectPlan(planId) {
    if (planId === currentPlanId) return
    setLoadingPlan(planId)
    await updatePlan(planId)
    setLoadingPlan(null)
    setSuccessMsg(
      planId === 'student'
        ? '🎉 Congratulations! You upgraded to the Student Plan (Premium).'
        : 'You have switched back to the Basic Plan.'
    )
    setTimeout(() => setSuccessMsg(''), 5000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Subscription Plans</h1>
        <p className={styles.subtitle}>
          Affordable access designed for working students. Upgrade or cancel anytime.
        </p>
      </div>

      {successMsg && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'var(--study-bg)',
          color: 'var(--study-text)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 20,
          fontWeight: 600,
          fontSize: 14,
          border: '1px solid #86efac',
        }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Plan cards */}
      <div className={styles.planGrid}>
        {PLANS.map(plan => {
          const isCurrent = currentPlanId === plan.id
          const isLoading = loadingPlan === plan.id

          return (
            <div key={plan.id} className={`card ${styles.planCard} ${plan.highlight ? styles.planHighlight : ''}`}>
              {plan.badge && (
                <div className={styles.planBadge}>
                  <Star size={12} fill="currentColor" /> {plan.badge}
                </div>
              )}
              <div className={styles.planName}>{plan.name}</div>
              <div className={styles.planPrice}>
                {plan.price}
                <span className={styles.planPeriod}>{plan.period}</span>
              </div>
              <div className={styles.planDesc}>{plan.desc}</div>

              <ul className={styles.featureList}>
                {plan.features.map(f => (
                  <li key={f} className={styles.featureItem}>
                    <Check size={15} color={plan.highlight ? 'var(--brand)' : 'var(--success)'} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn ${plan.highlight ? 'btn-primary' : 'btn-secondary'} ${styles.planBtn}`}
                disabled={isCurrent || isLoading}
                onClick={() => handleSelectPlan(plan.id)}
              >
                {isLoading ? 'Updating…' : isCurrent ? '✓ Current Plan' : plan.cta}
              </button>
            </div>
          )
        })}
      </div>

      {/* Comparison table */}
      <div className={`card ${styles.tableCard}`}>
        <h2 className={styles.tableTitle}>Feature Comparison</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th className={styles.highlightCol}>Student Plan <Zap size={13} /></th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map(([label, free, student]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td className={styles.checkCell}>
                    {typeof free === 'boolean' ? (
                      free ? <Check size={16} color="var(--success)" /> : <span className={styles.cross}>✗</span>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: 12.5 }}>{free}</span>
                    )}
                  </td>
                  <td className={`${styles.checkCell} ${styles.highlightCol}`}>
                    {typeof student === 'boolean' ? (
                      student ? <Check size={16} color="var(--brand)" /> : <span className={styles.cross}>✗</span>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--brand)' }}>{student}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className={styles.note}>
        * Estimated price for the prototype stage. Final pricing may vary.
        This tool is built for college students juggling school and part-time work.
      </p>
    </div>
  )
}
