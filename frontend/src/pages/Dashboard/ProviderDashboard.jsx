import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'
import DashboardLayout from '../../components/Dashboard/DashboardLayout'

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
  const [proofs, setProofs] = useState([])
  const [tab, setTab] = useState('post')
  const [posting, setPosting] = useState(false)
  const [grantAmounts, setGrantAmounts] = useState({})
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [isDetecting, setIsDetecting] = useState(false)

  // Selected proof for detailed view
  const [selectedProof, setSelectedProof] = useState(null)

  useEffect(() => {
    fetchMyFoods()
    fetchRequests()
    fetchProofs()
    // Pre-fill location from provider's registered coordinates if available
    if (user && user.location) {
      setLat(user.location.lat ? String(user.location.lat) : '')
      setLng(user.location.lng ? String(user.location.lng) : '')
    }
  }, [])

  const fetchMyFoods = async () => {
    try {
      const res = await api.get('/api/food/my-food', authHeaders())
      setMyFoods(res.data.foods)
    } catch (e) { }
  }

  const fetchRequests = async () => {
    try {
      const res = await api.get('/api/provider/requests', authHeaders())
      setRequests(res.data.grouped || {})
    } catch (e) { }
  }

  const fetchProofs = async () => {
    try {
      const res = await api.get('/api/provider/distribution-proofs', authHeaders())
      setProofs(res.data.proofs || [])
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

  

  const deleteFood = async (foodId) => {
    if (!(await showConfirm('Delete Post', 'Are you sure you want to delete this food post?'))) return
    try {
      await api.delete(`/api/food/${foodId}`, authHeaders())
      showAlert('Deleted', 'Food post deleted successfully.')
      fetchMyFoods()
    } catch (e) {
      showAlert('Error', e.response?.data?.message || 'Error deleting food')
    }
  }

  const pendingRequestCount = Object.values(requests).reduce((sum, g) =>
    sum + g.requests.filter(r => r.status === 'pending').length, 0)

  const sidebarTabs = [
    { id: 'post', label: 'Post Food', icon: '➕' },
    { id: 'my-foods', label: 'My Foods', icon: '🍱' },
    { id: 'requests', label: 'Requests', icon: '📬' },
    { id: 'proofs', label: 'Impact Proofs', icon: '📸' },
  ];

  return (
    <DashboardLayout
      title="Provider Dashboard"
      subtitle="Manage your donations and coordinate with NGOs"
      tabs={sidebarTabs}
      activeTab={tab}
      setActiveTab={setTab}
      roleColor="emerald"
    >
      <div className="animate-fadeIn">
        {/* POST FOOD */}
        {tab === 'post' && (
          <div className="max-w-2xl mx-auto py-4">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100">
              <h3 className="text-2xl font-black mb-8 text-slate-800 flex items-center gap-3">
                <span className="bg-emerald-100 p-2 rounded-xl">🥦</span> Post Surplus Food
              </h3>
              <form onSubmit={submit} className="space-y-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Food Item Description</label>
                  <input className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" placeholder="e.g. 10 Packs of Chicken Biryani" value={foodName} onChange={e => setFoodName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Quantity (Units)</label>
                    <input type="number" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Expiry Time</label>
                    <input type="datetime-local" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" value={expiryTime} onChange={e => setExpiryTime(e.target.value)} required />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Pickup Location</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" step="any" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" placeholder="Lat" value={lat} onChange={e => setLat(e.target.value)} required />
                    <input type="number" step="any" className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700" placeholder="Lng" value={lng} onChange={e => setLng(e.target.value)} required />
                  </div>
                  <button type="button" onClick={detectLocation} disabled={isDetecting} className="mt-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 py-2 px-4 rounded-xl w-fit hover:bg-emerald-100 transition-all border-none cursor-pointer">
                    {isDetecting ? 'Detecting...' : '🎯 Detect current location'}
                  </button>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Additional Details</label>
                  <textarea className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 min-h-[120px]" placeholder="Allergies, storage, pickup instructions..." value={details} onChange={e => setDetails(e.target.value)} />
                </div>

                <button type="submit" className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex justify-center items-center gap-2 border-none cursor-pointer" disabled={posting}>
                  {posting ? 'Sharing...' : '🚀 Post Food Listing'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MY FOODS */}
        {tab === 'my-foods' && (
          <div className="animate-fadeIn">
            {myFoods.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">🏚️</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No food items posted yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {myFoods.map(f => (
                  <div key={f._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-500" />
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${f.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {f.status}
                        </span>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-3 group-hover:text-emerald-600 transition-colors uppercase italic">{f.foodName}</h4>
                      <p className="text-sm font-bold text-slate-500 mb-6 flex items-center gap-2">📦 {f.quantity} items available</p>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        {f.status === 'available' && (
                          <button onClick={() => deleteFood(f._id)} className="text-rose-500 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest border-none bg-transparent cursor-pointer">🗑️ Remove</button>
                        )}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expires in {Math.round((new Date(f.expiryTime) - new Date()) / (3600000))}h</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REQUESTS */}
        {tab === 'requests' && (
          <div className="animate-fadeIn">
            {Object.keys(requests).length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">📩</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No active requests</p>
              </div>
            ) : (
              <div className="space-y-12">
                {Object.entries(requests).map(([foodId, group]) => (
                  <div key={foodId} className="space-y-6">
                    <div className="flex items-center gap-4 px-6 py-4 bg-emerald-50 rounded-3xl border border-emerald-100/50">
                      <span className="text-2xl font-black text-emerald-600">🥘</span>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">{group.food.foodName}</h4>
                      <span className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest shadow-sm">
                        {group.food.quantity} left
                      </span>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {group.requests.map(req => (
                        <div key={req._id} className={`bg-white rounded-[2.5rem] p-8 border transition-all ${req.status === 'pending' ? 'border-indigo-100 shadow-xl' : 'border-slate-100 opacity-60'}`}>
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg">
                                {req.ngoId?.name?.charAt(0)}
                              </div>
                              <div>
                                <Link to={`/profile/${req.ngoId?.slug || req.ngoId?._id}`} className="hover:text-emerald-600 transition-colors">
                                  <h5 className="font-black text-slate-800 leading-none mb-1">{req.ngoId?.name}</h5>
                                </Link>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{req.ngoId?.email}</p>
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${req.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                              {req.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested</p>
                              <p className="text-xl font-black text-slate-800">{req.requestedAmount}</p>
                            </div>
                            <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Grant</p>
                              {req.status === 'pending' ? (
                                <input type="number" className="bg-transparent border-none p-0 text-xl font-black text-indigo-700 w-full focus:ring-0" value={grantAmounts[req._id] ?? req.requestedAmount} onChange={e => setGrantAmounts({ ...grantAmounts, [req._id]: e.target.value })} />
                              ) : (
                                <p className="text-xl font-black text-indigo-700">{req.grantedAmount || 0}</p>
                              )}
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-3">
                              <button onClick={() => acceptRequest(req._id, req.requestedAmount)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 transition-all active:scale-95 border-none cursor-pointer">Accept</button>
                              <button onClick={() => rejectRequest(req._id)} className="px-6 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 py-4 rounded-2xl font-black text-xs transition-all active:scale-95 border-none cursor-pointer">Reject</button>
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

        {/* IMPACT PROOFS */}
        {tab === 'proofs' && (
          <div className="animate-fadeIn">
            {proofs.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">📸</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No impact proofs yet</p>
                <p className="text-slate-300 text-sm mt-2">Proofs uploaded by NGOs will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {proofs.map(p => (
                  <div key={p._id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group" onClick={() => setSelectedProof(p)}>
                    <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-100 mb-6">
                      <img src={p.proofImages?.[0]} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 backdrop-blur px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-xl">View Details</span>
                      </div>
                      {p.proofImages?.length > 1 && (
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase">+{p.proofImages.length - 1} More</div>
                      )}
                    </div>
                    <div className="px-2">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 font-bold">Successfully Distributed</p>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-3 italic uppercase truncate">{p.collectionId?.foodId?.foodName || 'Food Item'}</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200">{p.ngoId?.name?.charAt(0)}</div>
                        <Link to={`/profile/${p.ngoId?._id || p.ngoId?.slug}`} className="text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors">
                          {p.ngoId?.name}
                        </Link>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                        <span>Verified {new Date(p.uploadDate).toLocaleDateString()}</span>
                        <span className="text-emerald-500">View →</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PROOF DETAIL MODAL */}
      {selectedProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedProof(null)}>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-scaleIn" onClick={e => e.stopPropagation()}>

            <button
              className="absolute top-6 right-6 z-10 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur text-white rounded-full flex items-center justify-center font-bold text-xl transition-all border-none cursor-pointer"
              onClick={() => setSelectedProof(null)}
            >✕</button>

            {/* Images Left */}
            <div className="md:w-1/2 bg-slate-100 h-64 md:h-auto overflow-y-auto p-4 flex flex-col gap-4">
              {selectedProof.proofImages?.map((url, i) => (
                <img key={i} src={url} alt={`proof_${i}`} className="w-full h-auto rounded-3xl shadow-lg ring-1 ring-black/5" />
              ))}
              <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">End of Visual Proofs</div>
            </div>

            {/* Content Right */}
            <div className="md:w-1/2 p-8 md:p-12 overflow-y-auto">
              <div className="mb-10">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] font-bold mb-3 block">Distribution Report</span>
                <h3 className="text-4xl font-black text-slate-800 tracking-tighter leading-none mb-3 italic uppercase">{selectedProof.collectionId?.foodId?.foodName}</h3>
                <p className="text-sm font-bold text-slate-400">Transaction ID: {selectedProof._id?.toUpperCase()}</p>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl shadow-indigo-100">
                    {selectedProof.ngoId?.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Receiver NGO</p>
                    <Link to={`/profile/${selectedProof.ngoId?._id || selectedProof.ngoId?.slug}`} className="hover:text-emerald-600 transition-colors">
                      <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">{selectedProof.ngoId?.name}</h4>
                    </Link>
                    <p className="text-xs font-bold text-slate-400">{selectedProof.ngoId?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100/50">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 font-bold">Quantity</p>
                    <p className="text-2xl font-black text-slate-800 tracking-tight leading-none">{selectedProof.collectionId?.foodId?.quantity || 0} <span className="text-sm font-bold text-slate-400">items</span></p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-bold">Rescued On</p>
                    <p className="text-lg font-black text-slate-800 tracking-tight leading-none">{new Date(selectedProof.uploadDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                </div>

                <div className="p-8 bg-zinc-900 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 font-bold select-none">Impact Statement</p>
                  <p className="text-sm font-medium leading-relaxed italic text-white/90">
                    "{selectedProof.description || 'Verified successful distribution to community members by the NGO partner.'}"
                  </p>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest select-none">Platform Secured · 2026</p>
                <button onClick={() => setSelectedProof(null)} className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-[10px] uppercase tracking-widest transition-all border-none cursor-pointer">Done Viewing</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </DashboardLayout>
  )
}
