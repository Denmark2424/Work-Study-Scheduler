/* src/components/Layout.jsx */
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  LayoutDashboard, Calendar, FileText, AlertTriangle,
  CreditCard, LogOut, User, Menu, X
} from 'lucide-react'
import styles from './Layout.module.css'

const navItems = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schedule',     icon: Calendar,        label: 'My Schedule' },
  { to: '/deadlines',    icon: FileText,        label: 'Deadlines' },
  { to: '/conflicts',    icon: AlertTriangle,   label: 'Conflicts' },
  { to: '/subscription', icon: CreditCard,      label: 'Subscription' },
  { to: '/profile',      icon: User,            label: 'Profile' },
]

export default function Layout() {
  const { user, logout, conflicts } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [localPhoto, setLocalPhoto] = useState(null)

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Sync uploaded photo from user profile or local storage
  useEffect(() => {
    setImgError(false)
    try {
      const storageKey = `ws_profile_${user?.id || user?.email || 'user'}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed?.photo) {
          setLocalPhoto(parsed.photo)
          return
        }
      }
      setLocalPhoto(null)
    } catch (e) {
      setLocalPhoto(null)
    }
  }, [user, location.pathname])

  const avatarPhoto = !imgError ? (user?.avatar_url || localPhoto || null) : null
  const isPremium = user?.plan === 'student'
  const notifyConflictCount = isPremium ? conflicts.length : Math.min(conflicts.length, 1)

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  async function handleLogout() {
    setIsLoggingOut(true)
    await new Promise(r => setTimeout(r, 450))
    await logout()
    navigate('/login')
  }

  return (
    <div className={`${styles.shell} ${isLoggingOut ? styles.shellExiting : ''}`}>
      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMobileOpen(prev => !prev)}
          aria-label="Toggle navigation menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={styles.mobileLogoBox}>
          <img src="/logo.png" alt="Work-Study Coordinator" className={styles.mobileLogo} />
        </div>

        {notifyConflictCount > 0 ? (
          <NavLink to="/conflicts" className={styles.mobileAlertPill} title="View conflicts">
            <AlertTriangle size={15} />
            <span>{notifyConflictCount}</span>
          </NavLink>
        ) : (
          <div className={styles.mobilePlaceholder} />
        )}
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar (Desktop persistent, Mobile off-canvas drawer) */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>
            <img src="/logo.png" alt="Work-Study Schedule Coordinator" className={styles.brandLogo} />
          </div>

          <nav className={styles.nav}>
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navActive : ''}`
                }
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === 'Conflicts' && notifyConflictCount > 0 && (
                  <span className={styles.badge}>{notifyConflictCount}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <NavLink
            to="/profile"
            className={styles.userCard}
            title="View & Edit Profile"
          >
            <div className={styles.avatar}>
              {avatarPhoto ? (
                <img
                  src={avatarPhoto}
                  alt={user?.name || 'Account'}
                  className={styles.avatarImg}
                  onError={() => setImgError(true)}
                />
              ) : (
                <User size={18} color="var(--brand)" />
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name || 'Account'}</div>
              <div className={styles.userEmail}>{user?.email || ''}</div>
            </div>
          </NavLink>
          <button
            className={`btn btn-secondary ${styles.logoutBtn}`}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut size={16} /> {isLoggingOut ? 'Logging out…' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        <div className={styles.mainContainer}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
