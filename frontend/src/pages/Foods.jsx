import React, { useState, useEffect } from 'react'
import api from '../api'
import { getToken, getUserFromToken } from '../utils/auth'
import { useModal } from '../context/ModalContext'

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
    if (user && user.role === 'ngo') fetchMyRequests()
  }, [page, nearMe])

  // Get location when Near Me is toggled
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
    return myRequests.some(r => (r.foodId?._id || r.foodId) === foodId && ['pending', 'accepted'].includes(r.status))
  }

  const requestFood = async (food) => {
    if (!user) { showAlert('Login Required', 'Please sign in to request food.'); return }
    if (user.role !== 'ngo') { showAlert('Access Denied', 'Only NGOs can request food.'); return }

    const amt = await showPrompt('Request Item', `Enter quantity needed (Available: ${food.quantity})`, food.quantity)
    if (!amt) return

    try {
      await api.post(`/api/ngo/request/${food._id}`, { requestedAmount: Number(amt) }, { headers: { Authorization: 'Bearer ' + getToken() } })
      showAlert('Success!', 'Your request has been sent to the provider.')
      fetchMyRequests()
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Failed to send request.')
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Hero Section */}
      <section className="bg-emerald-800 pt-16 pb-32 px-6 relative overflow-hidden">
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
         <div className="max-w-6xl mx-auto relative">
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">Explore Surplus Food</h1>
            <p className="text-emerald-100/80 text-lg max-w-xl font-medium">Browse live donations from restaurants, hotels, and markets across the platform.</p>
         </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-16 pb-24">
         {/* Filter Bar */}
         <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 p-4 border border-slate-100 mb-12 flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 relative">
               <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
                  <IconSearch />
               </span>
               <input 
                 className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl font-bold text-slate-700 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                 placeholder="Search by food name or provider..."
                 value={search}
                 onChange={e => setSearch(e.target.value)}
               />
            </form>

            <div className="h-10 w-px bg-slate-100 hidden md:block" />

            <div className="flex items-center gap-4 px-4 overflow-x-auto shrink-0">
               <button 
                 onClick={() => { setNearMe(!nearMe); setPage(1) }}
                 className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${nearMe ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
               >
                 📍 Near Me
               </button>
               { (search || nearMe) && (
                 <button 
                   onClick={() => { setSearch(''); setNearMe(false); setPage(1) }}
                   className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-100 transition-all"
                 >
                   Clear
                 </button>
               )}
            </div>

            <div className="hidden md:block text-xs font-black text-slate-400 uppercase tracking-widest px-4 border-l border-slate-100">
               {totalItems} Items
            </div>
         </div>

         {/* Results Grid */}
         {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="bg-slate-50 h-[320px] rounded-[2.5rem] animate-pulse" />
              ))}
           </div>
         ) : foods.length === 0 ? (
           <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
              <span className="text-7xl mb-6 block">🥡</span>
              <h3 className="text-2xl font-black text-slate-800">No items found</h3>
              <p className="text-slate-500 font-medium mt-2">Try adjusting your filters or searching for something else.</p>
           </div>
         ) : (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {foods.map(f => (
                <div key={f._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full overflow-hidden">
                   <div className="flex justify-between items-start mb-6 gap-4">
                      <div className="flex-1 pr-2 truncate">
                         <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-lg mb-2 inline-block shadow-sm">Available</span>
                         <h4 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors leading-none truncate">{f.foodName}</h4>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">🏪 {f.providerId?.name || 'Local Provider'}</p>
                      </div>
                      <div className="text-right">
                         <span className={`px-2 py-1 text-[8px] font-black uppercase rounded-md ${f.isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-600'}`}>
                           {f.isExpired ? 'Expired' : 'Live'}
                         </span>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serving</span>
                         <span className="text-sm font-black text-slate-700">📦 {f.quantity} units</span>
                      </div>
                      <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Expires</span>
                         <span className="text-xs font-black text-rose-500">
                           {new Date(f.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </span>
                      </div>
                   </div>

                   <div className="mb-6 flex-grow">
                      {f.details && <p className="text-xs text-slate-500 italic font-medium leading-relaxed line-clamp-2 px-1">"{f.details}"</p>}
                   </div>

                   <div className="pt-6 border-t border-slate-50 mt-auto">
                      <button 
                        disabled={hasRequested(f._id) || f.isExpired}
                        onClick={() => requestFood(f)}
                        className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${hasRequested(f._id) || f.isExpired ? 'bg-slate-100 text-slate-300 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-100'}`}
                      >
                        {hasRequested(f._id) ? '✓ Requested' : '🚀 Request Item'}
                      </button>
                   </div>
                </div>
              ))}
           </div>
         )}

         {/* Pagination */}
         {totalPages > 1 && (
           <div className="mt-16 flex justify-center items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-black shadow-sm"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button 
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-12 h-12 rounded-2xl text-sm font-black transition-all shadow-sm ${page === p ? 'bg-emerald-600 text-white shadow-emerald-100' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
                >
                  {p}
                </button>
              ))}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all font-black shadow-sm"
              >
                →
              </button>
           </div>
         )}
      </main>
    </div>
  )
}
