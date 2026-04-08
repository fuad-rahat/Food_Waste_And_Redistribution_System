import React from 'react'
import { Routes, Route, NavLink, Link, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home/Home'
import AdminDashboard from './pages/Dashboard/AdminDashboard'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import ProviderDashboard from './pages/Dashboard/ProviderDashboard'
import NGODashboard from './pages/Dashboard/NGODashboard'
import Profile from './pages/Profile/Profile'
import Foods from './pages/Food/Foods'
import Footer from './components/Common/Footer'
import NotificationBell from './components/Common/NotificationBell'
import { ModalProvider } from './context/ModalContext'
import { getUserFromToken, logout } from './utils/auth'

function RoleRoute({ role, children }) {
  const user = getUserFromToken()
  if (!user) return <Navigate to="/login" />
  if (role && user.role !== role) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <ModalProvider>
      <AppContent />
    </ModalProvider>
  )
}

function AppContent() {
  const user = getUserFromToken()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = React.useState(false)

  const doLogout = () => { logout(); navigate('/login') }

  const NavLinks = () => {
    const activeClass = "text-emerald-600 border-b-2 border-emerald-600 text-sm font-black transition-all py-2 md:py-1";
    const inactiveClass = "text-slate-600 hover:text-emerald-600 text-sm font-bold transition-all py-2 md:py-1 border-b-2 border-transparent";

    return (
      <>
        <NavLink to="/" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Home</NavLink>
        {user && user.role === 'provider' && <NavLink to="/provider" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Dashboard</NavLink>}
        {user && user.role === 'ngo' && <NavLink to="/ngo" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Dashboard</NavLink>}
        {user && user.role === 'admin' && <NavLink to="/admin" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Admin Panel</NavLink>}
        <NavLink to="/foods" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Explore Food</NavLink>
        {user && <NavLink to="/profile" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => isActive ? activeClass : inactiveClass}>Profile</NavLink>}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-[100] border-b border-slate-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-black text-emerald-600 flex items-center gap-2 tracking-tighter">
              <span className="hidden sm:inline">FoodShare</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6">
              <NavLinks />
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {user && user.role === 'ngo' && <NotificationBell />}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold uppercase tracking-wider">{user.role}</span>
                <button onClick={doLogout} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-rose-100 transition-all active:scale-95 border border-rose-100">Logout</button>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link to="/login" className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all active:scale-95">Sign In</Link>
                <Link to="/register" className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all active:scale-95">Get Started</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-6 flex flex-col gap-4 animate-fadeIn shadow-xl">
            <NavLinks />
            {!user && (
              <div className="flex flex-col gap-2 pt-4 border-t border-slate-100">
                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center justify-center py-2.5 rounded-2xl text-sm font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-all">Sign In</Link>
                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="inline-flex items-center justify-center py-2.5 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all">Get Started</Link>
              </div>
            )}
          </div>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/provider" element={<RoleRoute role="provider"><ProviderDashboard /></RoleRoute>} />
          <Route path="/ngo" element={<RoleRoute role="ngo"><NGODashboard /></RoleRoute>} />
          <Route path="/admin" element={<RoleRoute role="admin"><AdminDashboard /></RoleRoute>} />
          <Route path="/profile/:id?" element={<Profile />} />
          <Route path="/foods" element={<Foods />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
