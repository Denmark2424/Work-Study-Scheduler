/* src/pages/LoginPage.jsx */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AlertCircle } from 'lucide-react'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login } = useApp()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 600)) // simulate network
    const ok = login(identifier, password)
    setLoading(false)
    if (ok) {
      navigate('/')
    } else {
      setError('Invalid email/username or password. Try: kenneth@student.edu / password123')
    }
  }

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <img src="/logo.png" alt="Work-Study Schedule Coordinator" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>One view.<br />Fewer conflicts.</h1>
          <p className={styles.heroSub}>
            A planning tool for students who balance classes, part-time work,
            study time, rest, and deadlines.
          </p>
          <div className={styles.pillRow}>
            <span className={`${styles.pill} ${styles.pillClass}`}>CLASS</span>
            <span className={`${styles.pill} ${styles.pillWork}`}>WORK</span>
            <span className={`${styles.pill} ${styles.pillStudy}`}>STUDY</span>
            <span className={`${styles.pill} ${styles.pillDeadline}`}>DEADLINE</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h2>Log In</h2>
            <p>Access your weekly schedule</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="identifier">Email or Username</label>
              <input
                id="identifier"
                type="text"
                placeholder="Enter your username"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              className={`btn btn-primary ${styles.submitBtn}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log In →'}
            </button>
          </form>

          <div className={styles.hint}>
            <strong>Demo credentials</strong><br />
            Email: <code>kenneth@student.edu</code><br />
            Password: <code>password123</code>
          </div>
        </div>
      </div>
    </div>
  )
}
