import { useAuth } from './hooks/useAuth'
import AuthScreen from './components/auth/AuthScreen'
import App from './App'

export default function Root() {
  const { user, error, signIn, signUp, signInWithGoogle, logOut, resetPassword } = useAuth()

  if (user === undefined) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6366f1', fontSize: '1.5rem' }}>💎 Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} onGoogle={signInWithGoogle} onReset={resetPassword} error={error} />
  }

  return <App user={user} logOut={logOut} />
}
