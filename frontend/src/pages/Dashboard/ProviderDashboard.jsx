import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'

const authHeaders = () => ({ headers: { Authorization: 'Bearer ' + getToken() } })

export default function ProviderDashboard() {
  const { showAlert, showConfirm } = useModal()
  const user = getUserFromToken()
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [expiryTime, setExpiryTime] = useState('')
  const [details, setDetails] = useState('')
  const [myFoods, setMyFoods] = useState([])
  const [requests, setRequests] = useState({})
  const [tab, setTab] = useState('post')
  const [posting, setPosting] = useState(false)
  const [grantAmounts, setGrantAmounts] = useState({})
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isDetecting, setIsDetecting] = useState(false)

  useEffect(() => {
    fetchMyFoods()
    fetchRequests()
    // Pre-fill location from provider's registered coordinates if available
    if (user && user.location) {
      setLat(user.location.lat ? String(user.location.lat) : '')
      setLng(user.location.lat ? String(user.location.lng) : '')
    }
  }, [])

  const fetchMyFoods = async () => {
    try {
      const res = await api.get('/api/food/my-food', authHeaders())
      setMyFoods(res.data.foods)
    } catch (e) {
      if (e.response?.status === 403) { /* account inactive handled below */ }
    }
  }

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/provider/requests', authHeaders())
      setRequests(res.data.grouped || {})
    } catch (e) { }
  }

  const submit = async (e) => {
    e.preventDefault()
    setPosting(true)
    try {
      await api.post('/api/food/create', {
        foodName, quantity: Number(quantity), expiryTime,
        location: { lat: parseFloat(lat) || 0, lng: parseFloat(lng) || 0 }, details
      }, authHeaders())
      setFoodName(''); setQuantity(1); setExpiryTime(''); setDetails(''); setLat(''); setLng('')
      fetchMyFoods()
      setTab('my-foods')
      showAlert('Food Posted!', 'Your donation is now visible to nearby NGOs.')
    } catch (e) { showAlert('Upload Failed', e.response?.data?.message || 'Error posting food') }
    finally { setPosting(false) }
  }

  const acceptRequest = async (reqId, defaultAmount) => {
    const granted = grantAmounts[reqId] ?? defaultAmount
    try {
      await api.put(`/api/provider/request/${reqId}/accept`, { grantedAmount: Number(granted) }, authHeaders())
      showAlert('Success', 'Request accepted successfully.')
      fetchMyFoods(); fetchRequests()
    } catch (e) { showAlert('Error', 'Failed to accept request.') }
  }

  const rejectRequest = async (reqId) => {
    try {
      if (!(await showConfirm('Reject Request', 'Are you sure you want to reject this request?'))) return
      await api.put(`/api/provider/request/${reqId}/reject`, {}, authHeaders())
      showAlert('Rejected', 'The request has been rejected.')
      fetchRequests()
    } catch (e) { showAlert('Error', 'Failed to reject request.') }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) return showAlert('Error', 'Geolocation is not supported by your browser.')
    setIsDetecting(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toString())
        setLng(pos.coords.longitude.toString())
        setIsDetecting(false)
      },
      () => {
        setIsDetecting(false)
        showAlert('Location Error', 'Unable to retrieve your current location.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const pendingRequestCount = Object.values(requests).reduce((sum, g) =>
    sum + g.requests.filter(r => r.status === 'pending').length, 0)

  const deleteFood = async (foodId) => {
    if (!(await showConfirm('Delete Post', 'Are you sure you want to delete this food post? This will also remove any pending notifications for it.'))) return
    try {
      await api.delete(`/api/food/${foodId}`, authHeaders())
      showAlert('Deleted', 'Food post deleted successfully.')
      fetchMyFoods()
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Error deleting food')
    }
  }

  const statusColor = { available: 'badge-green', claimed: 'badge-yellow', collected: 'badge-blue', expired: 'badge-red' }

  return (
    <div className="dashboard-page animate-fadeIn overflow-x-hidden">
      <div className="dashboard-header mb-10 px-4">
        <h2 className="text-4xl font-black tracking-tighter mb-2">🏪 Provider Dashboard</h2>
        <p className="text-slate-500 font-medium">Manage your food donations and coordinate with NGOs.</p>
      </div>

      <div className="tab-nav mx-4 sticky top-24 z-10 p-1.5 shadow-sm">
        <button className={`tab-btn flex items-center justify-center gap-2 ${tab === 'post' ? 'active' : ''}`} onClick={() => setTab('post')}>
          <span className="text-lg">➕</span> Post Food
        </button>
        <button className={`tab-btn flex items-center justify-center gap-2 ${tab === 'my-foods' ? 'active' : ''}`} onClick={() => setTab('my-foods')}>
          <span className="text-lg">🍱</span> My Foods <span className="hidden sm:inline">({myFoods.length})</span>
        </button>
        <button className={`tab-btn flex items-center justify-center gap-2 ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>
          <span className="text-lg">📬</span> Requests {pendingRequestCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">{pendingRequestCount}</span>}
        </button>
      </div>

      <div className="mt-8 px-4">
        {/* POST FOOD */}
        {tab === 'post' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-3xl p-8 shadow-xl ring-1 ring-slate-200">
              <h3 className="text-2xl font-black mb-6 text-slate-800 flex items-center gap-3">
                <span className="bg-emerald-100 p-2 rounded-xl">🥒</span> Post Surplus Food
              </h3>
              <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Food Item Description</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" placeholder="e.g. 10 Packs of Chicken Biryani" value={foodName} onChange={e => setFoodName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">Quantity (Servings/Units)</label>
                    <div className="relative">
                      <input type="number" className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} required />
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📦</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">Best Before / Expiry</label>
                    <input type="datetime-local" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" value={expiryTime} onChange={e => setExpiryTime(e.target.value)} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Pickup Location (Coordinates)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="relative">
                       <input type="number" step="any" className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" placeholder="Latitude" value={lat} onChange={e => setLat(e.target.value)} required />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Lat</span>
                     </div>
                     <div className="relative">
                       <input type="number" step="any" className="w-full px-4 py-3 pl-10 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" placeholder="Longitude" value={lng} onChange={e => setLng(e.target.value)} required />
                       <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Lng</span>
                     </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={detectLocation}
                    disabled={isDetecting}
                    className="mt-2 py-2 px-4 bg-emerald-50 text-emerald-600 font-bold rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 text-[10px] flex items-center justify-center gap-2 uppercase tracking-widest w-fit"
                  >
                    {isDetecting ? 'Detecting...' : '🎯 Detect My Current Location'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-slate-700">Additional Details</label>
                  <textarea className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium min-h-[120px]" placeholder="Allergy warnings, storage instructions, or specific pickup spot..." value={details} onChange={e => setDetails(e.target.value)} />
                </div>

                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 flex justify-center items-center gap-2" disabled={posting}>
                  {posting ? 'Posting to community...' : '🚀 Share Food Now'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MY FOODS */}
        {tab === 'my-foods' && (
          <div className="animate-fadeIn">
            {myFoods.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                <span className="text-6xl mb-4 block">🏠</span>
                <p className="text-slate-400 font-bold mb-6">No food posted yet</p>
                <button onClick={() => setTab('post')} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl transition-colors">Start Donating</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myFoods.map(f => (
                  <div key={f._id} className="bg-white rounded-3xl p-6 ring-1 ring-slate-200 hover:ring-emerald-500/20 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h4 className="text-lg font-bold truncate text-slate-800">{f.foodName}</h4>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 ${f.status === 'available' ? 'bg-emerald-100 text-emerald-700' : f.status === 'claimed' ? 'bg-yellow-100 text-yellow-700' : f.status === 'collected' ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>{f.status}</span>
                    </div>
                    <div className="italic text-slate-500 font-medium tracking-tight mb-4 flex flex-col gap-1 flex-grow">
                      <span className="flex items-center gap-2">📦 {f.quantity} units</span>
                      <span className="flex items-center gap-2 text-xs">⏰ {new Date(f.expiryTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      {f.details && <p className="text-xs line-clamp-2 mt-2 not-italic text-slate-600 bg-slate-50 p-2 rounded-lg break-words">"{f.details}"</p>}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {/* Placeholder for future: show icons of NGOs who requested */}
                      </div>

                      {f.status === 'available' && (
                        <button
                          onClick={() => deleteFood(f._id)}
                          className="text-rose-500 hover:text-rose-700 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition-colors p-2 rounded-lg hover:bg-rose-50"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS */}
        {tab === 'requests' && (
          <div className="animate-fadeIn pb-24">
            {Object.keys(requests).length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[40px] border border-dashed border-slate-200 flex flex-col items-center justify-center">
                <span className="text-7xl mb-6 block">📮</span>
                <p className="text-slate-500 font-black text-xl tracking-tight">Your inbox is clear</p>
                <p className="text-slate-400 font-medium text-sm mt-2 max-w-xs">When NGOs request your surplus food, they'll appear here for your approval.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {Object.entries(requests).map(([foodId, group]) => (
                  <div key={foodId} className="relative">
                    {/* Food Summary Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-6 py-8 bg-white rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 opacity-50 group-hover:scale-110 transition-transform duration-700" />
                       <div className="flex items-center gap-5 relative">
                          <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-emerald-100">🍱</div>
                          <div>
                             <h4 className="text-2xl font-black text-slate-800 tracking-tighter">{group.food.foodName}</h4>
                             <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Available: {group.food.quantity} units</span>
                                <span className="text-slate-400 text-[10px] font-medium uppercase tracking-widest">Posted {new Date(group.food.createdAt).toLocaleDateString()}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4 relative">
                          <div className="text-right hidden sm:block">
                             <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Active Requests</span>
                             <span className="text-2xl font-black text-emerald-600">{group.requests.filter(r => r.status === 'pending').length}</span>
                          </div>
                          <div className="h-10 w-px bg-slate-100 hidden sm:block mx-2" />
                          <span className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${group.food.status === 'available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                            {group.food.status}
                          </span>
                       </div>
                    </div>

                    {/* NGO Request Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
                      {group.requests.map(req => {
                        const isPending = req.status === 'pending';
                        return (
                          <div key={req._id} className={`bg-white rounded-[2.5rem] p-8 border transition-all duration-300 relative ${isPending ? 'border-indigo-100 shadow-xl shadow-indigo-50/20' : 'border-slate-50 opacity-70 grayscale-[0.3]'}`}>
                            
                            <div className="flex justify-between items-start mb-8">
                               <div className="flex items-center gap-4">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${isPending ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                    {req.ngoId?.name?.charAt(0) || 'N'}
                                  </div>
                                  <div>
                                     <h5 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1.5">
                                       <Link to={"/profile/" + req.ngoId?._id} className="hover:text-indigo-600 transition-colors">{req.ngoId?.name || 'NGO Partner'}</Link>
                                     </h5>
                                     <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                        {req.ngoId?.email}
                                     </p>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <span className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-xl ${isPending ? 'bg-amber-100 text-amber-600' : req.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    {req.status}
                                  </span>
                                  <p className="text-[9px] font-bold text-slate-300 uppercase mt-2">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                               </div>
                            </div>

                            {/* NGO Message if present */}
                            {req.message && (
                              <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
                                 <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-slate-100 text-[9px] font-black text-emerald-600 uppercase tracking-widest">Message</div>
                                 <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{req.message}"</p>
                              </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-8">
                               <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Requested Qty</span>
                                  <span className="text-xl font-black text-slate-700">{req.requestedAmount} units</span>
                               </div>
                               <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">{isPending ? 'Grant Amount' : 'Granted'}</span>
                                  {isPending ? (
                                    <div className="flex items-center gap-2">
                                       <input 
                                         type="number" 
                                         min={0}
                                         max={group.food.quantity}
                                         className="w-full bg-transparent border-none p-0 text-xl font-black text-indigo-700 focus:ring-0"
                                         value={grantAmounts[req._id] ?? req.requestedAmount}
                                         onChange={(e) => setGrantAmounts({ ...grantAmounts, [req._id]: e.target.value })}
                                       />
                                       <span className="text-[10px] font-black text-indigo-300">EDIT</span>
                                    </div>
                                  ) : (
                                    <span className="text-xl font-black text-indigo-700">{req.grantedAmount || 0} items</span>
                                  )}
                               </div>
                            </div>

                            {isPending && (
                              <div className="flex items-center gap-3">
                                 <button 
                                   onClick={() => acceptRequest(req._id, req.requestedAmount)}
                                   className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                                 >
                                   🚀 Accept & Grant
                                 </button>
                                 <button 
                                   onClick={() => rejectRequest(req._id)}
                                   className="px-6 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 py-4 rounded-2xl font-black text-sm transition-all active:scale-95 flex items-center justify-center"
                                   title="Reject Request"
                                 >
                                    Dismiss
                                 </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}      </div>
    </div>
  )
}
