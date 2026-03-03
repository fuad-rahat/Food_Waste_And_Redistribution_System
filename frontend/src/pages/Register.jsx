import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'
import DocumentUploader from '../components/DocumentUploader'
import { useModal } from '../context/ModalContext'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('provider')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [legalDocumentImages, setLegalDocumentImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // tanvir will for here

   const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (legalDocumentImages.length === 0) {
      setError('Please upload at least one legal document (image or PDF) before submitting.')
      return
    }
    setLoading(true)
    try {
      await api.post('/api/auth/register', {
        name, email, password, role,
        location: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 },
        legalDocumentImages
      })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all'

  // ── Success screen ──────────────────────────────────────────────────────────
  // tanvir will work here

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl ring-1 ring-slate-200 p-10 md:p-16 w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-5xl mb-6">🌱</div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2">Join FoodShare</h2>
          <p className="text-slate-500 font-medium text-lg">Start making an impact in your local community today.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold mb-10 animate-fadeIn">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-8">

          {/* Name + Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Full Name / Organization</label>
              <input className={inputClass} placeholder="e.g. Hope Kitchen" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Email Address</label>
              <input type="email" className={inputClass} placeholder="contact@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          {/* Password + Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Account Password</label>
              <input type="password" className={inputClass} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Who are you?</label>
              <select value={role} onChange={e => setRole(e.target.value)} className={`${inputClass} appearance-none`}>
                <option value="provider">🏪 Food Provider</option>
                <option value="ngo">🤝 NGO Distributor</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2 p-6 rounded-3xl bg-slate-50 border border-slate-100">
            <label className="text-slate-800 font-black mb-2 block text-sm uppercase tracking-widest">Official Location</label>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="grid grid-cols-2 gap-3 flex-grow">
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400 transition-all" placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} />
                <input className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 font-medium placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-400 transition-all" placeholder="Lng" value={lng} onChange={e => setLng(e.target.value)} />
              </div>
              <button
                type="button"
                onClick={getLocation}
                disabled={geoLoading}
                className="bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-black text-sm rounded-2xl px-5 py-3 border border-slate-200 transition-all whitespace-nowrap disabled:opacity-60"
              >
                {geoLoading ? '...' : '📍 Auto-Detect'}
              </button>
            </div>
            {geoError && <span className="text-xs text-rose-500 font-bold mt-1 block">{geoError}</span>}
          </div>

          {/* Legal Documents */}
          <div className="flex flex-col gap-2">
            <div className="mb-2">
              <label className="text-slate-800 font-black flex items-center gap-2 text-sm">
                Legal Documents{' '}
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-widest">Required</span>
              </label>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                Upload business licenses or registration certificates for admin verification.
              </p>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed border-slate-200">
              {/* // tanvir will update the uploader here */}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-lg rounded-2xl transition-all shadow-xl shadow-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing Registration...' : 'Join the Network'}
          </button>
        </form>

        <p className="mt-10 text-center text-slate-400 font-bold text-sm">
          Already registered?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 transition-colors">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}
