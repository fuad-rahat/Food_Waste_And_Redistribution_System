import React, { useState, useEffect, useRef } from 'react'
import { useModal } from '../context/ModalContext'
import { useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [40, 40], maxZoom: 14 })
    }
  }, [positions, map])
  return null
}

/* ── SVG Icon components ─────────────────────────────────── */
const IconStore = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13l-1-5h13" />
    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
  </svg>
)

const IconMapPin = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconHandshake = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const IconMeal = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
)

const IconOrg = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
)

const IconCity = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
)

const IconRecycle = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
)

const IconBike = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="5" cy="18" r="3" /><circle cx="19" cy="18" r="3" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-6l-4-2m4 8h7m-7 0H5m7-6l1-4M9 9l-2-2m5-2h3l2 5" />
  </svg>
)

const IconBox = ({ className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
)

const IconClock = ({ className = 'w-5 h-5' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
  </svg>
)

const IconSearch = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="8" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
)

const IconCheck = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const IconChevron = ({ className = 'w-4 h-4' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
  </svg>
)

/* ── Data ────────────────────────────────────────────────── */
const FOODS = [
  { _id: '1', name: 'Cooked Rice', qty: 50, cat: 'Cooked Meal', provider: 'Green Restaurant', lat: 23.8103, lng: 90.4125, expiresIn: '59m' },
  { _id: '2', name: 'Fresh Bread', qty: 30, cat: 'Bakery', provider: 'Daily Bakery', lat: 23.815, lng: 90.42, expiresIn: '1h 59m' },
  { _id: '3', name: 'Vegetable Curry', qty: 20, cat: 'Cooked Meal', provider: 'City Hotel', lat: 23.805, lng: 90.41, expiresIn: '1h 30m' },
  { _id: '4', name: 'Fruit Basket', qty: 40, cat: 'Fresh Produce', provider: 'Fresh Mart', lat: 23.812, lng: 90.408, expiresIn: '3h' },
  { _id: '5', name: 'Dal & Roti', qty: 60, cat: 'Cooked Meal', provider: 'Community Kitchen', lat: 23.807, lng: 90.416, expiresIn: '1h 10m' },
]

const CAT_STYLE = {
  'Cooked Meal': 'bg-orange-100 text-orange-700',
  'Bakery': 'bg-yellow-100 text-yellow-700',
  'Fresh Produce': 'bg-green-100 text-green-700',
}

const STEPS = [
  {
    Icon: IconStore,
    num: '01',
    title: 'Providers Post Food',
    desc: 'Restaurants and hotels list surplus food available for pickup in under 2 minutes — no paperwork, no hassle.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    tags: ['Quick Listing', 'Photo Upload', 'Qty & Expiry'],
    tagBg: 'bg-emerald-100',
    tagText: 'text-emerald-700',
  },
  {
    Icon: IconMapPin,
    num: '02',
    title: 'NGOs Discover Nearby',
    desc: 'Browse real-time food listings on an interactive live map. Filter by distance, food type, or availability.',
    color: 'from-sky-500 to-blue-600',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    tags: ['Live Map', 'Smart Filter', 'One-click Request'],
    tagBg: 'bg-sky-100',
    tagText: 'text-sky-700',
  },
  {
    Icon: IconHandshake,
    num: '03',
    title: 'Food Gets Rescued',
    desc: 'Volunteers collect and deliver to communities. Every delivery is tracked — turning waste into real, lasting impact.',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    tags: ['Impact Tracked', 'Zero Waste'],
    tagBg: 'bg-violet-100',
    tagText: 'text-violet-700',
  },
]

const STATS = [
  { value: '12,480+', label: 'Meals Rescued', Icon: IconMeal, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: '340+', label: 'Partner Orgs', Icon: IconHandshake, color: 'text-sky-600', bg: 'bg-sky-50' },
  { value: '28', label: 'Cities Active', Icon: IconCity, color: 'text-violet-600', bg: 'bg-violet-50' },
  { value: '9,800kg', label: 'Food Saved', Icon: IconRecycle, color: 'text-amber-600', bg: 'bg-amber-50' },
]

const ECOSYSTEM = [
  {
    Icon: IconStore,
    title: 'Food Providers',
    subtitle: 'Restaurants, Hotels & Markets',
    color: 'text-emerald-600',
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    accent: 'bg-emerald-600',
    points: ['Post surplus in 2 minutes', 'Track donation history'],
  },
  {
    Icon: IconOrg,
    title: 'NGOs & Shelters',
    subtitle: 'Aid Organizations & Charities',
    color: 'text-sky-600',
    bg: 'bg-gradient-to-br from-sky-50 to-blue-50',
    border: 'border-sky-200',
    accent: 'bg-sky-600',
    points: ['Find food by location & type', 'Live interactive map', 'One-click request system', 'Instant provider notification'],
  }
]

const TESTIMONIALS = [
  { name: 'Rahima Begum', role: 'NGO Coordinator — Dhaka Aid', quote: 'FoodShare transformed how we source meals. We now receive fresh food daily with zero paperwork.', initials: 'RB', color: 'from-emerald-400 to-teal-500' },
  { name: 'Chef Karim', role: 'Head Chef — Grand Palace Hotel', quote: 'Instead of throwing food away, we donate in minutes. The platform is incredibly simple to use.', initials: 'CK', color: 'from-sky-400 to-blue-500' },
  { name: 'Sumaiya Islam', role: 'Volunteer — Green Earth', quote: "The live map helps me plan pickup routes. I've rescued over 200 meals through FoodShare.", initials: 'SI', color: 'from-violet-400 to-purple-500' },
]

const ORGS = ['Dhaka Medical Aid', 'Green Earth BD', 'Bread of Life Foundation', 'Helping Hands NGO', 'UNICEF Partner', 'Youth Volunteers BD']

/* ── Component ───────────────────────────────────────────── */
export default function Home() {
  const { showAlert } = useModal()
  const navigate = useNavigate()
  const statsRef = useRef(null)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [sortBy, setSortBy] = useState('default')
  const [requested, setRequested] = useState([])
  const [statsOn, setStatsOn] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsOn(true) }, { threshold: 0.3 })
    if (statsRef.current) io.observe(statsRef.current)
    return () => io.disconnect()
  }, [])

  const foods = FOODS
    .filter(f =>
      (activeFilter === 'All' || f.cat === activeFilter) &&
      (f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.provider.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'qty') return b.qty - a.qty
      if (sortBy === 'expiry') return a.expiresIn.localeCompare(b.expiresIn)
      return 0
    })

  const request = (id) => {
    if (requested.includes(id)) return
    setRequested(p => [...p, id])
    showAlert('Success', 'Request sent! The provider will be notified shortly.')
  }

  const positions = foods.map(f => [f.lat, f.lng])

  return (
    <div className="bg-white">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_55%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.2),transparent_60%)] pointer-events-none" />

        {/* Floating decorative blobs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-56 h-56 bg-teal-400/15 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 w-full">
          <div className="max-w-3xl">
            {/* live badge */}
            <span className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-emerald-300 rounded-full animate-pulse" />
              Live Food Rescue Network · Bangladesh
            </span>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              Rescue Surplus.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-200">Feed the Hungry.</span>
            </h1>

            <p className="text-emerald-100/90 text-lg md:text-xl leading-relaxed mb-10 max-w-2xl">
              FoodShare connects restaurants, hotels &amp; markets with NGOs — turning food waste into real impact across Bangladesh. <strong className="text-white">12,000+ meals rescued</strong> and counting.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-700 font-extrabold rounded-2xl hover:bg-emerald-50 transition-all shadow-xl shadow-black/20 text-sm"
              >
                Get Started Free
                <IconChevron className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                onClick={() => document.getElementById('food-section').scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 border border-white/25 text-white font-bold rounded-2xl hover:bg-white/20 transition-all backdrop-blur-sm text-sm"
              >
                <IconMapPin className="w-4 h-4" />
                Browse Live Food
              </button>
            </div>

            {/* Hero trust indicators */}
            <div className="flex flex-wrap items-center gap-6">
              {[
                { label: '12,480+ Meals Rescued' },
                { label: '340+ Partner Orgs' },
                { label: '28 Cities Active' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-emerald-200">
                  <span className="w-5 h-5 bg-emerald-500/40 rounded-full flex items-center justify-center">
                    <IconCheck className="w-3 h-3 text-emerald-200" />
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0]">
          <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 md:h-20 fill-white">
            <path d="M0,50 C240,10 480,80 720,40 C960,0 1200,70 1440,30 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAR ────────────────────────────────────────── */}
      <section ref={statsRef} className="bg-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className={`rounded-2xl p-6 text-center border border-slate-100 shadow-sm hover:shadow-md transition-all duration-500 ${statsOn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                  <s.Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div className={`text-3xl font-extrabold ${s.color} mb-1`}>{s.value}</div>
                <div className="text-slate-500 text-xs uppercase tracking-widest font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE FOOD ────────────────────────────────────────── */}
      <section id="food-section" className="bg-white py-24 px-6">
        <div className="max-w-6xl mx-auto">

          {/* ── Section heading ── */}
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live Now
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900">Available Surplus Food</h2>
            <p className="text-slate-500 text-sm mt-1">Real-time listings from verified providers near you</p>
          </div>

          {/* ── Smart filter bar ── */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center shadow-sm">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <IconSearch />
              </span>
              <input
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all"
                placeholder="Search food or provider…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-slate-200 self-stretch" />

            {/* Category filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filter:</span>
              {['All', 'Cooked Meal', 'Bakery', 'Fresh Produce'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === cat
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px bg-slate-200 self-stretch" />

            {/* Sort dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="bg-slate-100 border-0 text-slate-600 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value="default">Newest</option>
                <option value="qty">Quantity ↓</option>
                <option value="expiry">Expiring Soon</option>
              </select>
            </div>

            {/* Active filter count badge */}
            {(activeFilter !== 'All' || search) && (
              <button
                onClick={() => { setActiveFilter('All'); setSearch('') }}
                className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-col lg:flex-row gap-5">
            {/* map */}
            <div className="lg:w-3/5 rounded-2xl overflow-hidden border border-slate-200 shadow-md" style={{ height: 460 }}>
              <MapContainer center={[23.8103, 90.4125]} zoom={13} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {positions.length > 0 && <FitBounds positions={positions} />}
                {foods.map(f => (
                  <Marker key={f._id} position={[f.lat, f.lng]}>
                    <Popup>
                      <b>{f.name}</b><br />{f.provider}<br />
                      <span className="text-slate-500">{f.qty} servings</span>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* cards */}
            <div className="lg:w-2/5 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 460 }}>
              {foods.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                  <IconSearch className="w-10 h-10 mb-3 opacity-40" />
                  <p className="text-sm">No listings match your search.</p>
                </div>
              )}
              {foods.map(f => {
                const done = requested.includes(f._id)
                return (
                  <div key={f._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{f.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <IconStore className="w-3 h-3" /> {f.provider}
                        </p>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CAT_STYLE[f.cat] ?? 'bg-slate-100 text-slate-600'}`}>{f.cat}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 mb-3">
                      <span className="flex items-center gap-1">
                        <IconBox className="w-3.5 h-3.5" /> {f.qty} servings
                      </span>
                      <span className="text-orange-500 font-semibold flex items-center gap-1">
                        <IconClock className="w-3.5 h-3.5" /> {f.expiresIn} left
                      </span>
                    </div>
                    <button
                      disabled={done}
                      onClick={() => request(f._id)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${done
                        ? 'bg-slate-100 text-slate-400 cursor-default'
                        : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
                        }`}
                    >
                      {done ? <><IconCheck className="w-3 h-3" /> Request Sent</> : 'Request Item'}
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/foods')}
              className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-emerald-600 text-emerald-700 font-bold rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-sm group"
            >
              View All Food Listings
              <IconChevron className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>
      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-0 overflow-hidden">
        {/* Top part — dark emerald header band */}
        <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-800 px-6 pt-20 pb-36 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="absolute -bottom-1 left-0 right-0 leading-[0]">
            <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 fill-slate-50">
              <path d="M0,40 C360,80 1080,0 1440,50 L1440,80 L0,80 Z" />
            </svg>
          </div>
          <div className="relative max-w-5xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-emerald-200 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Simple 3-Step Process
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
              How FoodShare Works
            </h2>
            <p className="text-emerald-100/80 text-base md:text-lg max-w-xl mx-auto">
              From surplus kitchen food to a hungry community's plate — in minutes, not hours.
            </p>
          </div>
        </div>

        {/* Step cards — float over the dark band */}
        <div className="bg-slate-50 px-6 pb-20">
          <div className="max-w-5xl mx-auto -mt-24 relative z-10">
            <div className="grid md:grid-cols-3 gap-5">
              {STEPS.map((s, i) => (
                <div key={i} className="group relative bg-white rounded-3xl shadow-xl shadow-slate-200/60 hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2 transition-all duration-400 overflow-hidden border border-slate-100 flex flex-col">

                  {/* Top accent stripe */}
                  <div className={`h-1.5 w-full bg-gradient-to-r ${s.color}`} />

                  <div className="p-7 flex flex-col flex-1">
                    {/* Step number badge + icon row */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-7xl font-black text-slate-100 select-none leading-none group-hover:text-slate-200 transition-colors">
                        {s.num}
                      </span>
                      <div className={`w-14 h-14 bg-gradient-to-br ${s.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shrink-0`}>
                        <s.Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-extrabold text-slate-900 text-xl mb-3 leading-snug">
                      {s.title}
                    </h3>

                    {/* Description */}
                    <p className="text-slate-500 text-sm leading-relaxed flex-1 mb-6">
                      {s.desc}
                    </p>

                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2">
                      {s.tags.map((tag, j) => (
                        <span key={j} className={`${s.tagBg} ${s.tagText} text-xs font-semibold px-3 py-1 rounded-full`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom connector / trust strip */}
            <div className="mt-10 bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-600 text-sm font-medium">
                <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <IconCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <span>Every step is <strong className="text-slate-900">verified & tracked</strong> in our platform.</span>
              </div>
              <div className="flex items-center gap-6 text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-sky-400 rounded-full" /> Live map updates
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-violet-400 rounded-full" /> Zero paperwork
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── BUILT FOR THE ECOSYSTEM ──────────────────────────── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block bg-sky-100 text-sky-700 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded-full mb-4">For Everyone</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Built for the Whole Ecosystem</h2>
            <p className="text-slate-500 text-base max-w-lg mx-auto">Whether you give, receive, or deliver — FoodShare has a place for you.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {ECOSYSTEM.map((c, i) => (
              <div key={i} className={`${c.bg} border ${c.border} rounded-2xl p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
                {/* Icon */}
                <div className={`w-14 h-14 ${c.accent} rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <c.Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className={`font-extrabold text-xl mb-1 ${c.color}`}>{c.title}</h3>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-5">{c.subtitle}</p>

                <ul className="space-y-3">
                  {c.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm text-slate-700">
                      <span className={`w-5 h-5 ${c.accent} rounded-full flex items-center justify-center shrink-0 mt-0.5`}>
                        <IconCheck className="w-3 h-3 text-white" />
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-28 px-6 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.1),transparent_60%)] pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-white/5 rounded-full blur-3xl" />

        <div className="relative max-w-2xl mx-auto">
          <span className="inline-block bg-white/15 border border-white/25 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6 backdrop-blur-sm">
            Join the Movement
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold mb-5 tracking-tight">Ready to Make a Difference?</h2>
          <p className="text-emerald-100 text-base md:text-lg mb-10 leading-relaxed">
            Whether you have surplus food to share or are looking to feed your community — FoodShare is your platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-700 font-extrabold rounded-2xl hover:bg-emerald-50 transition-all shadow-xl text-sm">
              <IconStore className="w-5 h-5" />
              Join as Provider
              <IconChevron className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/register" className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/15 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/25 transition-all backdrop-blur-sm text-sm">
              <IconOrg className="w-5 h-5" />
              Register as NGO
            </Link>
          </div>
          <p className="text-emerald-200 text-xs mt-8">Free to join · No credit card required · Setup in 2 minutes</p>
        </div>
      </section>

    </div>
  )
}