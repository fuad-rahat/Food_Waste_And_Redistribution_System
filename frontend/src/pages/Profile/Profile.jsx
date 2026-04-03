import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'

/* ── SVG Icons ───────────────────────────────────────────────────────── */
const Ico = ({ d, extra = '', size = 'w-5 h-5', vb = '0 0 24 24', sw = 2, children }) => (
  <svg className={size} fill="none" viewBox={vb} stroke="currentColor" strokeWidth={sw}>
    {d && <path strokeLinecap="round" strokeLinejoin="round" d={d} />}
    {children}
  </svg>
)
const IconMail = ({ s }) => <Ico size={s} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
const IconPin = ({ s }) => <Ico size={s}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></Ico>
const IconShield = ({ s }) => <Ico size={s} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
const IconStore = ({ s }) => <Ico size={s}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13l-1-5h13" /><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /></Ico>
const IconOrg = ({ s }) => <Ico size={s} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
const IconBox = ({ s }) => <Ico size={s} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
const IconInbox = ({ s }) => <Ico size={s} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
const IconCheck = ({ s = 'w-3.5 h-3.5' }) => <Ico size={s} sw={3} d="M5 13l4 4L19 7" />
const IconRecycle = ({ s }) => <Ico size={s} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
const IconStar = ({ s }) => <Ico size={s} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />

/* ── StatusBadge ─────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
    accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    rejected: 'bg-rose-100 text-rose-600 border-rose-200',
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    taken: 'bg-slate-100 text-slate-500 border-slate-200',
    approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    pending_review: 'bg-amber-100 text-amber-700 border-amber-200',
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${map[status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
      {status?.replace('_', ' ')}
    </span>
  )
}

/* ── Stat Card ───────────────────────────────────────────────────────── */
function StatCard({ label, value, Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
        <Icon s="w-7 h-7" />
      </div>
      <div>
        <div className="text-3xl font-extrabold text-slate-900 leading-none mb-1">{value}</div>
        <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</div>
      </div>
    </div>
  )
}

/* ── main component ──────────────────────────────────────────────────── */
export default function Profile() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { showAlert, showPrompt } = useModal()
  const [userData, setUserData] = useState(null)
  const [publicStats, setPublicStats] = useState(null)
  const [activities, setActivities] = useState([])
  const [foods, setFoods] = useState([])
  const [lat, setLat] = useState(null)
  const [lng, setLng] = useState(null)
  const [groupedRequests, setGrouped] = useState({})
  const [requests, setRequests] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({ name: '', email: '', lat: 0, lng: 0 })
  const user = getUserFromToken()

  useEffect(() => {
    if (userData) {
      setEditData({
        name: userData.name || '',
        email: userData.email || '',
        lat: userData.location?.lat || 0,
        lng: userData.location?.lng || 0
      })
    }
  }, [userData])

  useEffect(() => { 
    if (user && user.role === 'ngo' && !lat) {
       navigator.geolocation.getCurrentPosition(
         pos => {
           const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
           setLat(c.lat); setLng(c.lng);
           loadProfile(c);
         },
         () => loadProfile()
       );
    } else if (user) {
       loadProfile() 
    }
  }, [id])

  const loadProfile = async (coords = null) => {
    try {
      const token = getToken()
      const uLat = coords?.lat || lat;
      const uLng = coords?.lng || lng;
      const query = uLat && uLng ? `?lat=${uLat}&lng=${uLng}` : '';
      if (id) {
        // View another user's profile
        try {
          const res = await api.get('/api/auth/profile/' + id + query, { headers: { Authorization: 'Bearer ' + token } })
          if (res.data?.user) {
            setUserData(res.data.user)
            if (res.data.stats) setPublicStats(res.data.stats)
            if (res.data.activities) setActivities(res.data.activities)
          }
        } catch (e) {
          showAlert('Private Account', e.response?.data?.message || 'Access denied.')
          navigate('/')
        }
        return
      }

      // View own profile
      const resUser = await api.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null)
      if (resUser?.data?.user) setUserData(resUser.data.user)
      if (user.role === 'provider') {
        const [resFoods, pres] = await Promise.all([
          api.get('/api/food/my-food', { headers: { Authorization: 'Bearer ' + token } }),
          api.get('/api/provider/requests', { headers: { Authorization: 'Bearer ' + token } }),
        ])
        setFoods(resFoods.data.foods || [])
        setGrouped(pres.data.grouped || {})
      } else if (user.role === 'ngo') {
        const res = await api.get('/api/ngo/requests', { headers: { Authorization: 'Bearer ' + token } })
        setRequests(res.data.list || [])
      }
    } catch (e) { }
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    try {
      await api.put('/api/auth/profile', {
        name: editData.name,
        email: editData.email,
        location: { lat: Number(editData.lat), lng: Number(editData.lng) }
      }, { headers: { Authorization: 'Bearer ' + getToken() } })
      showAlert('Success', 'Profile updated successfully!')
      setIsEditing(false)
      loadProfile()
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to update profile')
    }
  }

  const accept = async (requestId, foodId) => {
    const amtStr = await showPrompt('Grant Amount', 'Enter amount you will give to this NGO (number)')
    if (!amtStr) return
    const grantedAmount = parseInt(amtStr, 10)
    if (isNaN(grantedAmount) || grantedAmount < 0) { showAlert('Invalid Amount', 'Please enter a valid positive number.'); return }
    try {
      await api.put('/api/provider/request/' + requestId + '/accept', { grantedAmount }, { headers: { Authorization: 'Bearer ' + getToken() } })
      showAlert('Accepted', 'The NGO has been notified.')
      loadProfile()
    } catch { showAlert('Error', 'Failed to accept the request.') }
  }

  const reject = async (requestId) => {
    try {
      await api.put('/api/provider/request/' + requestId + '/reject', {}, { headers: { Authorization: 'Bearer ' + getToken() } })
      showAlert('Rejected', 'The request has been removed.')
      loadProfile()
    } catch { showAlert('Error', 'Failed to reject.') }
  }

  const isViewOnly = !!id
  const isProvider = isViewOnly ? userData?.role === 'provider' : user?.role === 'provider'
  const initials = (userData?.name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const totalReq = isViewOnly ? (publicStats?.total || 0) : (isProvider ? Object.values(groupedRequests).reduce((s, g) => s + g.requests.length, 0) : requests.length)
  const acceptedCnt = isViewOnly ? (publicStats?.accepted || 0) : (isProvider ? Object.values(groupedRequests).reduce((s, g) => s + g.requests.filter(r => r.status === 'accepted').length, 0) : requests.filter(r => r.status === 'accepted').length)
  const pendingCnt = isViewOnly ? (publicStats?.pending || 0) : (isProvider ? Object.values(groupedRequests).reduce((s, g) => s + g.requests.filter(r => r.status === 'pending').length, 0) : requests.filter(r => r.status === 'pending').length)

  if (!userData) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-pulse text-slate-400 font-bold uppercase tracking-widest text-sm">Loading Profile...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ══════════════════════════════ HERO BANNER ══════════════════════════════ */}
      <div className="relative bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-700 overflow-hidden">
        {/* dot grid */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '30px 30px' }} />
        {/* blobs */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 pt-16 pb-36">
          <div className="flex flex-col md:flex-row md:items-end gap-8">
            {/* Avatar */}
            <div className={`w-28 h-28 rounded-3xl border-4 border-white/25 flex items-center justify-center text-white font-extrabold text-4xl shadow-2xl shrink-0
              ${isProvider ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}>
              {initials}
            </div>

            {/* Name block */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border border-white/20 backdrop-blur-sm
                  ${isProvider ? 'bg-emerald-500/30 text-emerald-100' : 'bg-sky-500/30 text-sky-100'}`}>
                  {isProvider ? <IconStore s="w-3.5 h-3.5" /> : <IconOrg s="w-3.5 h-3.5" />}
                  {isProvider ? 'Food Provider' : 'NGO Distributor'}
                </span>
                <StatusBadge status={userData?.verificationStatus || 'pending_review'} />
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                {userData?.name || 'Loading…'}
              </h1>
              <div className="flex flex-wrap gap-6 text-emerald-200/80 text-sm">
                <span className="flex items-center gap-2">
                  <IconMail s="w-4 h-4" /> {userData?.email || '—'}
                </span>
                {userData?.location && (
                  <span className="flex items-center gap-2">
                    <IconPin s="w-4 h-4" />
                    {userData.location.lat?.toFixed(4)}, {userData.location.lng?.toFixed(4)}
                  </span>
                )}
              </div>
            </div>

            {/* Edit Trigger */}
            <div className="md:self-start">
               {!isViewOnly && (
                 <button 
                   onClick={() => setIsEditing(!isEditing)}
                   className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-bold text-sm backdrop-blur-md border border-white/20 transition-all flex items-center gap-2"
                 >
                   {isEditing ? '🔌 Cancel' : '⚙️ Edit Profile'}
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0 leading-[0]">
          <svg viewBox="0 0 1440 70" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 fill-slate-50">
            <path d="M0,35 C360,70 1080,0 1440,45 L1440,70 L0,70 Z" />
          </svg>
        </div>
      </div>

      {/* ══════════════════════════ STATS ROW ══════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 -mt-14 mb-10 relative z-10">
        <div className={`grid gap-5 ${isProvider ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3'}`}>
          <StatCard label="Total Requests" value={totalReq} Icon={IconInbox} accent="bg-emerald-100 text-emerald-600" />
          <StatCard label="Accepted" value={acceptedCnt} Icon={IconCheck} accent="bg-sky-100 text-sky-600" />
          <StatCard label="Pending" value={pendingCnt} Icon={IconStar} accent="bg-amber-100 text-amber-600" />
          {isProvider && <StatCard label="Food Listings" value={foods.length} Icon={IconBox} accent="bg-violet-100 text-violet-600" />}
        </div>
      </div>

      {/* ══════════════════════════ MAIN CONTENT ══════════════════════════ */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 pb-24">

        {/* ── EDIT PROFILE SECTION ── */}
        {isEditing && (
          <div className="mb-12 animate-fadeIn">
            <div className="bg-white rounded-[40px] p-8 md:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16" />
               <div className="relative">
                 <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                   <span className="bg-emerald-100 p-2 rounded-xl text-xl">📝</span> Update Account Details
                 </h2>
                 <form onSubmit={saveProfile} className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name / Organization</label>
                        <input className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} required />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address (Contact)</label>
                        <input type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" value={editData.email} onChange={e => setEditData({...editData, email: e.target.value})} required />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Latitude</label>
                          <input type="number" step="any" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" value={editData.lat} onChange={e => setEditData({...editData, lat: e.target.value})} required />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-400">Longitude</label>
                          <input type="number" step="any" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" value={editData.lng} onChange={e => setEditData({...editData, lng: e.target.value})} required />
                        </div>
                      </div>
                      <div className="pt-4 flex gap-4">
                         <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95">
                           🚀 Save Changes
                         </button>
                         <button type="button" onClick={() => setIsEditing(false)} className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm transition-all">
                           Back
                         </button>
                      </div>
                    </div>
                 </form>
               </div>
            </div>
          </div>
        )}

        {/* ── IMPACT GALLERY OR VERIFICATION DOCUMENTS ── */}
        <div className="mb-12">
           <div className="flex items-center gap-3 mb-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${isViewOnly && !isProvider ? 'bg-indigo-100 text-indigo-700' : 'bg-violet-100 text-violet-700'}`}>
                {isViewOnly && !isProvider ? '🎨' : '📄'}
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {isViewOnly && !isProvider ? 'Impact Gallery & Recent Activity' : 'Verification Documents'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {isViewOnly && !isProvider ? 'Documented food distributions and community impact' : 'Legal identifications uploaded during registration'}
                </p>
              </div>
           </div>
           
           {/* If viewing public NGO profile, show activities */}
           {isViewOnly && !isProvider ? (
             <div className="space-y-6">
               {activities.length === 0 ? (
                 <div className="py-20 bg-white border border-dashed border-slate-200 rounded-[32px] text-center">
                    <span className="text-5xl mb-4 block">🚚</span>
                    <p className="text-slate-400 font-bold">No orders picked up yet</p>
                    <p className="text-slate-300 text-sm">This NGO hasn't completed any food collections yet.</p>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {activities.map((act, i) => (
                     <div key={i} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                        {act.hasProof ? (
                          <div className="aspect-video relative overflow-hidden bg-slate-100">
                             <img src={act.proofImages[0]} alt="Impact" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                             <div className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg shadow-lg">Verified Impact</div>
                          </div>
                        ) : (
                          <div className="aspect-video flex flex-col items-center justify-center bg-slate-50 border-b border-slate-100 text-slate-400 p-6 text-center">
                             <span className="text-3xl mb-2">📸</span>
                             <p className="text-[10px] font-black uppercase tracking-widest leading-tight">Proof of distribution pending</p>
                             <p className="text-[9px] mt-1 opacity-70">Distribution documentation is required for every pickup.</p>
                          </div>
                        )}
                        <div className="p-5 flex-1 flex flex-col">
                           <div className="flex justify-between items-start mb-2">
                              <h4 className="font-extrabold text-slate-800 leading-tight">{act.foodName}</h4>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(act.pickupDate).toLocaleDateString()}</span>
                           </div>
                           {act.description && <p className="text-xs text-slate-500 line-clamp-2 italic mb-3">"{act.description}"</p>}
                           <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                              <span className={`text-[9px] font-black uppercase tracking-widest ${act.hasProof ? 'text-emerald-600' : 'text-amber-500'}`}>
                                {act.hasProof ? '✅ Documentation Complete' : '⏳ Pending Evidence'}
                                {act.distanceKm != null && ` (${act.distanceKm.toFixed(1)} km)`}
                              </span>
                              {act.hasProof && act.proofImages.length > 1 && (
                                <span className="text-[9px] font-bold text-slate-300">+{act.proofImages.length - 1} more photos</span>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           ) : (
             /* Otherwise show verification documents (self view or provider) */
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {userData?.legalDocumentImages?.map((url, i) => (
                  <div key={i} className="group relative bg-white p-2 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden aspect-square">
                     <img src={url} alt={`Doc ${i+1}`} className="w-full h-full object-cover rounded-xl grayscale group-hover:grayscale-0 transition-all" />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <a href={url} target="_blank" rel="noreferrer" className="bg-white text-slate-900 p-2 rounded-lg text-xs font-black uppercase">View</a>
                     </div>
                  </div>
                ))}
                {(!userData?.legalDocumentImages || userData.legalDocumentImages.length === 0) && (
                  <div className="col-span-full py-10 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400 font-bold">
                    No documents uploaded
                  </div>
                )}
             </div>
           )}
        </div>

        {/* ── PROVIDER: grouped request cards ── */}
        {isProvider && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-700">
                <IconInbox s="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Supply & Incoming Requests</h2>
                <p className="text-slate-400 text-sm">NGO requests grouped by your food listings</p>
              </div>
            </div>

            {Object.values(groupedRequests).length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center py-28 text-center">
                <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                  <IconBox s="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-slate-700 text-lg mb-1">No requests yet</h3>
                <p className="text-slate-400 text-sm max-w-xs">When NGOs request your food listings, they'll appear here grouped by item.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {Object.values(groupedRequests).map(gr => (
                  <div key={gr.food._id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden flex flex-col">
                    {/* Food header */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-slate-100 px-7 py-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-extrabold text-slate-900 text-lg leading-snug">{gr.food.foodName}</h3>
                          <p className="text-slate-400 text-xs mt-1 font-semibold uppercase tracking-wider">
                            Qty available: <strong className="text-slate-700">{gr.food.quantity}</strong>
                          </p>
                        </div>
                        <StatusBadge status={gr.food.status} />
                      </div>
                    </div>

                    {/* Request rows */}
                    <div className="flex-1 divide-y divide-slate-50 px-2">
                      {gr.requests.map(r => (
                        <div key={r._id} className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-5 hover:bg-slate-50/60 transition-colors rounded-2xl">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <Link to={"/profile/" + r.ngoId?._id} className="font-bold text-slate-900 hover:text-emerald-600 transition-colors">{r.ngoId?.name}</Link>
                              <StatusBadge status={r.status} />
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 font-medium">
                              <span>Requested: <strong className="text-slate-700">{r.requestedAmount}</strong></span>
                              <span>Granted: <strong className="text-emerald-600">{r.grantedAmount || 0}</strong></span>
                            </div>
                          </div>
                          {r.status === 'pending' && (
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => accept(r._id, gr.food._id)}
                                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all active:scale-95 shadow-sm"
                              >
                                <IconCheck /> Accept
                              </button>
                              <button
                                onClick={() => reject(r._id)}
                                className="px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-xs font-extrabold rounded-xl transition-all active:scale-95"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── NGO: request history table ── */}
        {user.role === 'ngo' && (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center text-sky-700">
                <IconInbox s="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">My Request History</h2>
                <p className="text-slate-400 text-sm">All food requests you've made to providers</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              {requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-28 text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-5">
                    <IconInbox s="w-8 h-8" />
                  </div>
                  <h3 className="font-extrabold text-slate-700 text-lg mb-1">No requests yet</h3>
                  <p className="text-slate-400 text-sm max-w-xs">Browse available food listings and request items to see them here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                        {['Food Item', 'Provider', 'Requested', 'Status', 'Granted'].map(h => (
                          <th key={h} className="text-left py-5 px-7 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((r, i) => (
                        <tr key={r._id} className={`border-b border-slate-50 hover:bg-emerald-50/30 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                          <td className="py-5 px-7 font-bold text-slate-900">{r.foodId?.foodName || '—'}</td>
                          <td className="py-5 px-7 text-slate-500 font-medium text-sm">{r.foodId?.provider?.name || '—'}</td>
                          <td className="py-5 px-7 font-semibold text-slate-700 text-sm">{r.requestedAmount} units</td>
                          <td className="py-5 px-7"><StatusBadge status={r.status} /></td>
                          <td className="py-5 px-7 font-extrabold text-emerald-600 text-sm">{r.grantedAmount || 0}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Hide history/requests table for others */}
        {isViewOnly && (
           <div className="mt-12 bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-sm">
              <div className="text-4xl mb-4">ℹ️</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request History Private</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Specific request histories and distribution details are private. Summary stats and verified documents are shown for NGO accountability.</p>
           </div>
        )}
      </div>
    </div>
  )
}
