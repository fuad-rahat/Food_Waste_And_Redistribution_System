import React, { useState } from 'react'
import api from '../api'
import { useNavigate, Link } from 'react-router-dom'
import DocumentUploader from '../components/DocumentUploader'
import { useModal } from '../context/ModalContext'

/* ── Tiny inline SVG icons ───────────────────────────────── */
const IconPin = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconCheck = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const IconSpinner = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
  </svg>
)

const IconMail = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const IconLock = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
)

const IconUser = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
)

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
  const { showAlert } = useModal?.() ?? {}

  const getLocation = () => {
    if (!navigator.geolocation) { setGeoError('Geolocation not supported'); return }
    setGeoLoading(true); setGeoError('')
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toFixed(6)); setLng(pos.coords.longitude.toFixed(6)); setGeoLoading(false) },
      () => { setGeoError('Unable to retrieve location'); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (legalDocumentImages.length === 0) {
      setError('Please upload at least one legal document before submitting.')
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

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white transition-all'

  /* ── Success screen ───────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-16 bg-slate-50">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl p-10 md:p-14 w-full max-w-lg text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Registration Received!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your application is <strong className="text-slate-700">under admin review</strong>. We'll activate your account shortly after verifying your documents.
          </p>
          <div className="space-y-3 mb-10 text-left">
            {[
              { label: 'Account created', done: true },
              { label: 'Documents uploaded', done: true },
              { label: 'Admin review', done: false },
              { label: 'Account activation', done: false },
            ].map((step, idx) => (
              <div key={idx} className={`flex items-center gap-3 p-4 rounded-xl text-sm font-semibold border ${step.done ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${step.done ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                  {step.done
                    ? <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    : <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                  }
                </div>
                {step.label}
              </div>
            ))}
          </div>
          <Link to="/login" className="inline-flex items-center justify-center w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl transition-all shadow-lg">
            Return to Login
          </Link>
          <p className="mt-5 text-xs text-slate-400">You'll receive an email once approved</p>
        </div>
      </div>
    )
  }

  /* ── Registration form ────────────────────────────── */
  return (
    <div className="min-h-[80vh] bg-slate-50 flex items-stretch py-0">
      <div className="w-full flex flex-col lg:flex-row max-w-6xl mx-auto shadow-2xl rounded-none lg:rounded-3xl overflow-hidden my-0 lg:my-10">

        {/* ── LEFT PANEL — Branding ─────────────────────── */}
        <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 flex-col justify-between p-12 relative overflow-hidden">
          {/* Background dot grid */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '28px 28px' }} />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M3 12H4m16 0h1M4.22 19.778l.707-.707M18.364 5.636l.707-.707" />
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <span className="text-white font-extrabold text-xl tracking-tight">FoodShare</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white leading-snug mb-4">
              Join the Food<br />Rescue Movement
            </h2>
            <p className="text-emerald-100/80 text-sm leading-relaxed mb-10">
              Connect with NGOs, track your impact, and help eliminate food waste across Bangladesh.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                { value: '12,480+', label: 'Meals Rescued' },
                { value: '340+', label: 'Partner Orgs' },
                { value: '28', label: 'Cities Active' },
                { value: '9,800kg', label: 'Food Saved' },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/15">
                  <div className="text-white font-extrabold text-xl">{s.value}</div>
                  <div className="text-emerald-200 text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom trust badges */}
          <div className="relative z-10">
            {[
              'Free to join — no credit card needed',
              'Admin-verified accounts for trust',
              'Your data is always secure',
            ].map((t, i) => (
              <div key={i} className="flex items-center gap-3 mb-3">
                <div className="w-5 h-5 bg-emerald-400/30 rounded-full flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-emerald-100/80 text-xs">{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL — Form ─────────────────────────── */}
        <div className="flex-1 bg-white flex flex-col justify-center px-8 py-12 md:px-12 lg:px-14">
          <div className="max-w-lg w-full mx-auto">
            {/* Mobile logo */}
            <div className="flex items-center gap-2 mb-8 lg:hidden">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="4" />
                </svg>
              </div>
              <span className="font-extrabold text-emerald-700 text-lg">FoodShare</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-1">Create your account</h1>
            <p className="text-slate-500 text-sm mb-8">Fill in the details below to get started.</p>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold mb-6">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" /></svg>
                {error}
              </div>
            )}

            <form onSubmit={submit} className="space-y-5">

              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    Full Name / Organization
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconUser /></span>
                    <input className={`${inputCls} pl-9`} placeholder="e.g. Hope Kitchen" value={name} onChange={e => setName(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconMail /></span>
                    <input type="email" className={`${inputCls} pl-9`} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                </div>
              </div>

              {/* Row 2: Password + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><IconLock /></span>
                    <input type="password" className={`${inputCls} pl-9`} placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                    Account Type
                  </label>
                  {/* Role toggle */}
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-1 gap-1">
                    {[
                      { val: 'provider', label: 'Provider' },
                      { val: 'ngo', label: 'NGO' },
                    ].map(opt => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setRole(opt.val)}
                        className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${role === opt.val
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                          }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Location */}
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-slate-500 block mb-1.5">
                  Official Location
                </label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <div className="flex gap-3 items-center">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        placeholder="Latitude"
                        value={lat}
                        onChange={e => setLat(e.target.value)}
                      />
                      <input
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        placeholder="Longitude"
                        value={lng}
                        onChange={e => setLng(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={geoLoading}
                      className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-lg px-4 py-2.5 transition-all whitespace-nowrap disabled:opacity-50 shrink-0"
                    >
                      {geoLoading ? <IconSpinner /> : <IconPin />}
                      {geoLoading ? 'Detecting…' : 'Auto-Detect'}
                    </button>
                  </div>
                  {lat && lng && (
                    <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      Location set: {lat}, {lng}
                    </p>
                  )}
                  {geoError && <p className="text-xs text-rose-500 font-semibold mt-2">{geoError}</p>}
                </div>
              </div>

              {/* Row 4: Legal Documents */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Legal Documents
                  </label>
                  <span className="text-[10px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>
                </div>
                <p className="text-slate-400 text-xs mb-3">Upload business licenses or registration certificates for admin verification.</p>
                <div className="bg-slate-50 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors">
                  <DocumentUploader
                    label=""
                    maxFiles={5}
                    onUpload={urls => setLegalDocumentImages(urls)}
                  />
                </div>
                {legalDocumentImages.length > 0 && (
                  <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    {legalDocumentImages.length} document{legalDocumentImages.length > 1 ? 's' : ''} uploaded
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-emerald-100 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <><IconSpinner /> Processing…</> : 'Create Account & Join Network'}
              </button>
            </form>

            <p className="mt-6 text-center text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
