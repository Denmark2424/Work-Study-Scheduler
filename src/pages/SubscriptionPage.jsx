/* src/pages/SubscriptionPage.jsx */
import { useApp } from '../context/AppContext.jsx'
import { Check, Star, Zap } from 'lucide-react'
import styles from './SubscriptionPage.module.css'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₱0',
    period: '/month',
    desc: 'Get started at no cost.',
    highlight: false,
    features: [
      'Basic weekly schedule view',
      'Up to 3 deadlines',
      'Manual conflict checking',
    ],
    cta: 'Current Plan',
    disabled: true,
  },
  {
    id: 'student',
    name: 'Student Plan',
    price: '₱49–₱99',
    period: '/month',
    desc: 'Affordable monthly access for working students.',
    highlight: true,
    features: [
      'Full weekly schedule editor',
      'Unlimited deadlines',
      'Automatic conflict detection',
      'Conflict tips & suggestions',
      'Priority support',
      'Early warning alerts',
    ],
    cta: 'Get Student Plan',
    disabled: false,
    badge: 'Most Popular',
  },
]

const FEATURES = [
  ['Class + Work in one view', false, true],
  ['Free / Study time visibility', false, true],
  ['Deadline / Work conflict check', false, true],
  ['Reusable regular schedule', true, true],
  ['Early warning alerts', false, true],
  ['Unlimited deadlines', false, true],
]

export default function SubscriptionPage() {
  const { user } = useApp()

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Subscription Plans</h1>
        <p className={styles.subtitle}>
          Affordable access designed for working students. Cancel anytime.
        </p>
      </div>

      {/* Plan cards */}
      <div className={styles.planGrid}>
        {PLANS.map(plan => (
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
              disabled={plan.disabled || (user?.plan === plan.id)}
            >
              {user?.plan === plan.id ? '✓ Current Plan' : plan.cta}
            </button>
          </div>
        ))}
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
                    {free ? <Check size={16} color="var(--success)" /> : <span className={styles.cross}>✗</span>}
                  </td>
                  <td className={`${styles.checkCell} ${styles.highlightCol}`}>
                    {student ? <Check size={16} color="var(--brand)" /> : <span className={styles.cross}>✗</span>}
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
