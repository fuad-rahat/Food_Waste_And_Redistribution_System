import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'

const IconSearch = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

export default function Foods() {
  const { showAlert, showPrompt } = useModal()
  const user = getUserFromToken()
  const [foods, setFoods] = useState([])
  const [search, setSearch] = useState('')
  const [nearMe, setNearMe] = useState(false)
  const [userLoc, setUserLoc] = useState(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(false)
  const [myRequests, setMyRequests] = useState([])

  useEffect(() => {
    fetchFoods()
    if (user && user.role === 'ngo') {
      fetchMyRequests()
      // Also fetch NGO location for distance calculation if not already set
      if (!userLoc) {
        api.get('/api/auth/profile/' + user.id, { headers: { Authorization: 'Bearer ' + getToken() } })
          .then(res => {
            const loc = res.data?.user?.location;
            if (loc && loc.lat !== 0) {
              setUserLoc({ lat: loc.lat, lng: loc.lng });
            }
          }).catch(() => {});
      }
    }
  }, [page, nearMe, userLoc])

  useEffect(() => {
    if (nearMe && !userLoc) {
       navigator.geolocation.getCurrentPosition(
         pos => {
           setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude })
           setPage(1)
           fetchFoods({ lat: pos.coords.latitude, lng: pos.coords.longitude })
         },
         () => {
           setNearMe(false)
           showAlert('Location Access Denied', 'Please allow location to find nearby food.')
         }
       )
    }
  }, [nearMe])

  const fetchFoods = async (coords = userLoc) => {
    setLoading(true)
    try {
      const params = { search, page, limit: 12, nearMe: nearMe ? 'true' : 'false' }
      if (coords) { params.lat = coords.lat; params.lng = coords.lng }
      const res = await api.get('/api/food/available', { params })
      setFoods(res.data.foods || [])
      setTotalPages(res.data.pages || 1)
      setTotalItems(res.data.total || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const fetchMyRequests = async () => {
    try {
       const res = await api.get('/api/ngo/requests', { headers: { Authorization: 'Bearer ' + getToken() } })
       setMyRequests(res.data.list || [])
    } catch (e) { }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    fetchFoods()
  }

  const hasRequested = (foodId) => {
    return myRequests.some(r => String(r.foodId?._id || r.foodId) === String(foodId) && ['pending', 'accepted', 'picked', 'distributed'].includes(r.status))
  }

  const requestFood = async (foodId, defaultQty) => {
    if (!user) { showAlert('Login Required', 'Please sign in to request food.'); return }
    if (user.role !== 'ngo') { showAlert('Access Denied', 'Only NGOs can request food.'); return }

    const amt = await showPrompt('Request Item', `Enter quantity needed (Available: ${defaultQty})`, defaultQty)
    if (!amt) return

    try {
       await api.post(`/api/ngo/request/${foodId}`, { requestedAmount: Number(amt) }, { headers: { Authorization: 'Bearer ' + getToken() } })
       showAlert('Success!', 'Your request has been sent to the provider.')
       fetchMyRequests()
    } catch (e) {
       showAlert('Error', e.response?.data?.message || 'Failed to send request.')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── HERO HEADER ────────────────────────────────────────── */}
      <section className="bg-emerald-900 pt-16 pb-32 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        <div className="max-w-7xl mx-auto relative">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Explore Available Food</h1>
            <p className="text-emerald-100/80 text-lg max-w-xl mx-auto font-medium">Browse live food rescues and support your community.</p>
        </div>
      </section>

      {/* ── MAIN DISCOVERY ───────────────────────────────────────── */}
      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-24">
        
        {/* Updated Premium Search Bar */}
        <form onSubmit={handleSearch} className="bg-white border border-slate-200 rounded-[2.5rem] p-4 mb-12 flex flex-col md:flex-row gap-4 items-stretch md:items-center shadow-2xl shadow-emerald-900/10 backdrop-blur-sm">
          <div className="relative flex-1">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
              placeholder="Search food or providers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="hidden md:block w-px h-10 bg-slate-100" />
          
          <div className="flex items-center gap-2 px-4">
            <label className="flex items-center gap-3 text-xs font-black text-slate-500 uppercase tracking-widest cursor-pointer select-none">
              <input type="checkbox" checked={nearMe} onChange={e => setNearMe(e.target.checked)} className="rounded-lg text-emerald-600 focus:ring-emerald-500 w-5 h-5 border-slate-300" />
              Near Me
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="flex-1 md:px-10 py-4 bg-emerald-600 text-white font-black rounded-3xl hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-widest shadow-lg shadow-emerald-100">
              Search
            </button>
            {(search || nearMe) && (
              <button type="button" onClick={() => {setSearch(''); setNearMe(false); setPage(1)}} className="px-6 py-4 bg-rose-50 text-rose-600 font-black rounded-3xl hover:bg-rose-100 transition-all text-xs uppercase tracking-widest">
                ✕
              </button>
            )}
          </div>
        </form>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-8 px-2">
           <h3 className="text-xl font-black text-slate-800 tracking-tighter uppercase">Available Items ({totalItems})</h3>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Live Updates</span>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1,2,3,4,5,6].map(i => (
               <div key={i} className="bg-white h-72 rounded-[2.5rem] animate-pulse border border-slate-100 shadow-sm" />
             ))}
          </div>
        ) : foods.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner">
             <span className="text-7xl mb-6 block">🥣</span>
             <h3 className="text-2xl font-black text-slate-800">No food found</h3>
             <p className="text-slate-500 font-medium mt-2">Adjust your filters or explore different areas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {foods.map(f => (
               <div key={f._id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-emerald-500/40 transition-all duration-500 hover:shadow-2xl shadow-sm group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-6">
                     <div className="flex-1 pr-4 truncate">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest rounded-lg mb-2 inline-block">Verified Safe</span>
                        <h4 className="text-xl font-black text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors truncate">{f.foodName}</h4>
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                          🏪 
                          <Link to={`/profile/${f.providerId?._id || f.providerId?.slug}`} className="hover:text-emerald-600 transition-colors">
                            {f.providerId?.name || 'Local Provider'}
                          </Link>
                        </div>
                        {f.distanceKm != null && (
                          <div className="flex items-center gap-1.5 mt-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">
                               {f.distanceKm.toFixed(1)} km away
                            </p>
                          </div>
                        )}
                     </div>
                     <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${f.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {f.isExpired ? 'Expired' : 'Live'}
                     </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                     <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-50 flex flex-col justify-center text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Quantity</span>
                        <span className="text-sm font-black text-slate-700 truncate">📦 {f.quantity} units</span>
                     </div>
                     <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-50 flex flex-col justify-center text-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase mb-1">Best Before</span>
                        <span className="text-xs font-black text-rose-500 truncate">
                          ⌛ {new Date(f.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                     </div>
                  </div>

                  <button
                    disabled={hasRequested(f._id) || f.isExpired}
                    onClick={() => requestFood(f._id, f.quantity)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${hasRequested(f._id) || f.isExpired ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}`}
                  >
                    {hasRequested(f._id) ? '✓ Requested' : '🚀 Request Now'}
                  </button>
               </div>
             ))}
          </div>
        )}

        {/* Improved Pagination */}
        {totalPages > 1 && (
          <div className="mt-16 flex justify-center items-center gap-3">
             <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 shadow-sm disabled:opacity-30">←</button>
             <span className="px-6 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest shadow-sm">Page {page} of {totalPages}</span>
             <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages} className="w-12 h-12 flex items-center justify-center bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-emerald-600 shadow-sm disabled:opacity-30">→</button>
          </div>
        )}
      </main>
    </div>
  )
}
