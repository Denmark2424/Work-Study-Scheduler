/* src/pages/SignupPage.jsx */
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { AlertCircle } from 'lucide-react'
import styles from './SignupPage.module.css'

export default function SignupPage() {
  const { signup } = useApp()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter (A-Z).')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.')
      return
    }

    setLoading(true)
    const res = await signup({
      name: formData.name,
      username: formData.username,
      email: formData.email,
      password: formData.password,
      plan: 'free',
    })

    if (res?.success) {
      setIsSuccess(true)
      setIsExiting(true)
      await new Promise(r => setTimeout(r, 450))
      navigate('/')
    } else {
      setLoading(false)
      setError(res?.error || 'Failed to create account. Please try again.')
    }
  }

  return (
    <div className={`${styles.page} ${isExiting ? styles.pageExiting : ''}`}>
      {/* Left panel */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <img src="/logo.png" alt="Work-Study Schedule Coordinator" className={styles.heroLogo} />
          <h1 className={styles.heroTitle}>Balance work & study effortlessly.</h1>
          <p className={styles.heroSub}>
            Create your free account today. Organize your course hours, job shifts, study blocks,
            and eliminate schedule conflicts before they happen.
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
            <h2>Create Account</h2>
            <p>Join working students organizing their schedules</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.rowTwo}>
              <div className={styles.field}>
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="username">Username *</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter Username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.field}>
              <label htmlFor="email">Email Address *</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.rowTwo}>
              <div className={styles.field}>
                <label htmlFor="password">Password *</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {error && (
              <div className={styles.errorBox}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              className={`btn btn-primary ${styles.submitBtn} ${isSuccess ? styles.submitSuccess : ''}`}
              type="submit"
              disabled={loading || isSuccess}
            >
              {isSuccess ? '✓ Account Created!' : loading ? 'Creating Account…' : 'Sign Up →'}
            </button>
          </form>

          <div className={styles.switchPrompt}>
            Already have an account?{' '}
            <Link to="/login" className={styles.switchLink}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
