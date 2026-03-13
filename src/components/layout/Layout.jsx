import Sidebar from './Sidebar'
import styles from './Layout.module.css'

export default function Layout({ children, activePage, onNavigate, alertsByPage, alertCount, user }) {
  return (
    <div className={styles.shell}>
      <Sidebar activePage={activePage} onNavigate={onNavigate} alertsByPage={alertsByPage} alertCount={alertCount} user={user} />
      <main className={styles.main}>{children}</main>
    </div>
  )
}
