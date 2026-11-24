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
]

export default function Layout() {
  const { user, logout, conflicts } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={styles.shell}>
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

        {conflicts.length > 0 ? (
          <NavLink to="/conflicts" className={styles.mobileAlertPill} title="View conflicts">
            <AlertTriangle size={15} />
            <span>{conflicts.length}</span>
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
                {label === 'Conflicts' && conflicts.length > 0 && (
                  <span className={styles.badge}>{conflicts.length}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sidebarBottom}>
          <div className={styles.userCard}>
            <div className={styles.avatar}><User size={18} color="var(--brand)" /></div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.name}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={`btn btn-secondary ${styles.logoutBtn}`} onClick={handleLogout}>
            <LogOut size={16} /> Logout
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
