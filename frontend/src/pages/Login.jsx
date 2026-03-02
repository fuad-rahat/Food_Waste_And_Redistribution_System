import React, { useState } from 'react'
import api from '../api'
import { saveToken } from '../utils/auth'
import { useNavigate, Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [verificationStatus, setVerificationStatus] = useState(null)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setVerificationStatus(null)
    setLoading(true)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      saveToken(res.data.token)
      const user = JSON.parse(atob(res.data.token.split('.')[1]))
      if (user.role === 'provider') navigate('/provider')
      else if (user.role === 'ngo') navigate('/ngo')
      else if (user.role === 'admin') navigate('/admin')
    } catch (err) {
      const data = err.response?.data
      setVerificationStatus(data?.verificationStatus || null)
      setError(data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all'

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl ring-1 ring-slate-200 p-8 md:p-12 w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-6 animate-bounce">🌱</div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2">Welcome Back</h2>
          <p className="text-slate-500 font-medium">Continue your journey in reducing food waste.</p>
        </div>

        {/* Pending banner */}
        {verificationStatus === 'pending' && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 text-amber-800 mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2 font-black">
              <span className="text-xl">⏳</span> Account Pending
            </div>
            <p className="text-xs font-medium leading-relaxed opacity-80">
              Your account is currently under review by our admin team. We appreciate your patience!
            </p>
          </div>
        )}

        {/* Rejected banner */}
        {verificationStatus === 'rejected' && (
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-800 mb-8 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2 font-black">
              <span className="text-xl">❌</span> Access Denied
            </div>
            <p className="text-xs font-medium leading-relaxed opacity-80">
              Your registration could not be verified. Please contact our support team for details.
            </p>
          </div>
        )}

        {/* tanvir will add error banner here */}

        <form onSubmit={submit} className="space-y-6">
          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Email Address</label>
            <div className="relative">
              <input
                type="email"
                className={`${inputClass} pl-11 py-4`}
                placeholder="name@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Secure Password</label>
            <div className="relative">
              <input
                type="password"
                className={`${inputClass} pl-11 py-4`}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : 'Sign In to Account'}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 font-bold text-sm">
          New here?{' '}
          <Link to="/register" className="text-emerald-600 hover:text-emerald-700 transition-colors">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
