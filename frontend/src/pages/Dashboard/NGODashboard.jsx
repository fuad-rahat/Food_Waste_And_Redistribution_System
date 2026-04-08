import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'
import ImageUploader from '../../components/Uploaders/ImageUploader'

const authHeaders = () => ({ headers: { Authorization: 'Bearer ' + getToken() } })

export default function NGODashboard() {
  const { showAlert, showConfirm, showPrompt } = useModal()
  const [tab, setTab] = useState('nearby')
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [list, setList] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [proofs, setProofs] = useState([])

  // Pickup state: requestId → { loading, done }
  const [pickupState, setPickupState] = useState({})

  // Inline proof state: collectionId → { images, desc, submitting, done }
  const [proofState, setProofState] = useState({})

  // Request modal
  const [requestModal, setRequestModal] = useState(null)
  const [reqMsg, setReqMsg] = useState('')
  const [reqAmount, setReqAmount] = useState(1)

  useEffect(() => {
    fetchMyRequests()
    fetchProofs()
    getLocation()
  }, [])

  useEffect(() => {
    if (lat && lng) {
      fetchNearby()
      fetchMyRequests()
    }
  }, [lat, lng])

  const getLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { setLat(pos.coords.latitude.toString()); setLng(pos.coords.longitude.toString()); setGeoLoading(false) },
      () => setGeoLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const fetchNearby = async () => {
    try {
      const res = await api.get(`/api/ngo/nearby?lat=${lat}&lng=${lng}&maxKm=10`, authHeaders())
      setList(res.data.list || [])
    } catch (e) { showAlert('Error', e.response?.data?.message || 'Failed to fetch nearby items.') }
  }

  const fetchMyRequests = async () => {
    try {
      const url = `/api/ngo/requests${lat && lng ? `?lat=${lat}&lng=${lng}` : ''}`
      const res = await api.get(url, authHeaders())
      setMyRequests(res.data.list || [])
    } catch (e) { }
  }

  const fetchProofs = async () => {
    try {
      const res = await api.get('/api/ngo/distribution-proofs', authHeaders())
      setProofs(res.data.proofs || [])
    } catch (e) { }
  }

  const claim = async (id) => {
    try { await api.put(`/api/ngo/claim/${id}`, {}, authHeaders()); fetchNearby(); showAlert('Claimed', 'Food item claimed successfully.') }
    catch (e) { showAlert('Error', e.response?.data?.message || 'Failed to claim food.') }
  }

  const collect = async (id) => {
    try { await api.put(`/api/ngo/collect/${id}`, {}, authHeaders()); fetchNearby(); showAlert('Collected', 'Food marked as collected.') }
    catch (e) { showAlert('Error', e.response?.data?.message || 'Failed to collect food.') }
  }

  const sendRequest = async () => {
    if (!requestModal) return
    try {
      await api.post(`/api/ngo/request/${requestModal._id}`, { message: reqMsg, requestedAmount: reqAmount }, authHeaders())
      setRequestModal(null); setReqMsg(''); setReqAmount(1)
      fetchMyRequests()
      showAlert('Request Sent', 'The provider has been notified of your request.')
    } catch (e) { showAlert('Error', e.response?.data?.message || 'Failed to send request.') }
  }

  // Mark pickup as complete for a specific request's collection
  const handlePickup = async (req) => {
    const colId = req.collectionId?._id
    if (!colId) return
    setPickupState(p => ({ ...p, [req._id]: { loading: true } }))
    try {
      await api.put(`/api/ngo/collection/${colId}/complete`, {}, authHeaders())
      await fetchMyRequests()
      setPickupState(p => ({ ...p, [req._id]: { loading: false, done: true } }))
      showAlert('Pickup Verified', 'Thank you! Please submit the distribution proof next.')
    } catch (e) {
      setPickupState(p => ({ ...p, [req._id]: { loading: false } }))
      showAlert('Error', e.response?.data?.message || 'Error marking pickup')
    }
  }

  // Update images for an inline proof
  const setProofImages = (colId, urls) => {
    setProofState(p => ({ ...p, [colId]: { ...(p[colId] || {}), images: urls } }))
  }

  const setProofDesc = (colId, val) => {
    setProofState(p => ({ ...p, [colId]: { ...(p[colId] || {}), desc: val } }))
  }

  // Submit distribution proof
  const submitProof = async (colId) => {
    const state = proofState[colId] || {}
    if (!state.images || state.images.length === 0) { showAlert('Missing Info', 'Please upload at least one image'); return }
    setProofState(p => ({ ...p, [colId]: { ...p[colId], submitting: true } }))
    try {
      await api.post(`/api/ngo/distribution-proof/${colId}`, {
        proofImages: state.images, description: state.desc || ''
      }, authHeaders())
      setProofState(p => ({ ...p, [colId]: { ...p[colId], submitting: false, done: true } }))
      fetchMyRequests()
      fetchProofs()
      showAlert('Proof Submitted', 'Thank you for your contribution!')
    } catch (e) {
      setProofState(p => ({ ...p, [colId]: { ...p[colId], submitting: false } }))
      showAlert('Error', e.response?.data?.message || 'Error submitting proof')
    }
  }

  // Check if a proof already exists for a collectionId
  const hasProof = (colId) => proofs.some(p => {
    const pid = p.collectionId?._id || p.collectionId
    return String(pid) === String(colId)
  })

  const statusColor = { available: 'bg-emerald-100 text-emerald-700', claimed: 'bg-yellow-100 text-yellow-700', collected: 'bg-blue-100 text-blue-700', expired: 'bg-rose-100 text-rose-700' }
  const reqStatusColor = { pending: 'bg-yellow-100 text-yellow-700', accepted: 'bg-emerald-100 text-emerald-700', rejected: 'bg-rose-100 text-rose-700' }

  return (
    <div className="max-w-7xl mx-auto py-8 animate-fadeIn overflow-x-hidden">
      <div className="mb-10 px-4">
        <h2 className="text-4xl font-black tracking-tighter mb-2">🤝 NGO Dashboard</h2>
        <p className="text-slate-500 font-medium text-lg">Help communities by claiming and distributing surplus food.</p>
      </div>

      <div className="mx-4 sticky top-24 z-10 flex gap-2 bg-white/70 backdrop-blur-md border border-slate-200 rounded-2xl p-1.5 shadow-sm overflow-x-auto shrink-0 mb-8">
        <button className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px] ${tab === 'nearby' ? 'bg-white shadow-sm ring-1 ring-slate-200 text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`} onClick={() => setTab('nearby')}>
          <span className="text-lg">🗺️</span> Nearby Food
        </button>
        <button className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px] ${tab === 'requests' ? 'bg-white shadow-sm ring-1 ring-slate-200 text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`} onClick={() => setTab('requests')}>
          <span className="text-lg">📬</span> My Requests
          {myRequests.filter(r => r.status === 'accepted' && r.collectionId?.pickup_status === 'pending').length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse">
              {myRequests.filter(r => r.status === 'accepted' && r.collectionId?.pickup_status === 'pending').length}
            </span>
          )}
        </button>
        <button className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap min-w-[150px] ${tab === 'proofs' ? 'bg-white shadow-sm ring-1 ring-slate-200 text-emerald-600' : 'text-slate-500 hover:text-slate-800 hover:bg-white/60'}`} onClick={() => setTab('proofs')}>
          <span className="text-lg">📸</span> Gallery
        </button>
      </div>

      <div className="mt-8 px-4">
        {/* ── NEARBY FOOD ── */}
        {tab === 'nearby' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl ring-1 ring-slate-200">
              <h3 className="text-xl font-bold mb-6 text-slate-800 flex items-center gap-2">
                📍 Find Food In Your Area
              </h3>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-grow w-full">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">Latitude</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" placeholder="e.g. 23.8103" value={lat} onChange={e => setLat(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-bold text-slate-700">Longitude</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all text-sm font-medium" placeholder="e.g. 90.4125" value={lng} onChange={e => setLng(e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto mt-4 md:mt-0">
                  <button onClick={getLocation} disabled={geoLoading} className="py-3 px-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all active:scale-95 flex justify-center items-center gap-2 flex-1 md:flex-none">
                    {geoLoading ? '...' : '🎯 Auto-Detect'}
                  </button>
                  <button onClick={fetchNearby} className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 flex justify-center items-center gap-2 flex-1 md:flex-none">🔍 Search</button>
                </div>
              </div>
            </div>

            {list.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 block">📡</span>
                <p className="text-slate-400 font-bold">Search for food near your location</p>
                <p className="text-slate-300 text-sm mt-2">Enter your coordinates or use auto-detect to see local surplus.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {list.map(item => {
                  const p = item.food.providerId;
                  const priorityLevel = item.priority < 2 ? 'High' : item.priority < 5 ? 'Medium' : 'Lower';
                  const priorityColor = item.priority < 2 ? 'bg-rose-100 text-rose-700' : item.priority < 5 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

                  return (
                    <div key={item.food._id} className="bg-white rounded-[2.5rem] p-8 ring-1 ring-slate-100 hover:ring-emerald-500/20 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col h-full group">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 pr-4 truncate">
                          <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg mb-2 inline-block ${priorityColor}`}>
                            {priorityLevel} Priority
                          </span>
                          <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none truncate group-hover:text-emerald-600 transition-colors">{item.food.foodName}</h4>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2 flex items-center gap-1">
                            🏪 {p?.name || 'Local Provider'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${statusColor[item.food.status] || 'bg-slate-100 text-slate-700'}`}>
                            {item.food.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-6">
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-dotted">Distance</span>
                          <span className="text-sm font-black text-emerald-600 block leading-none">📍 {item.distanceKm.toFixed(2)} km</span>
                        </div>
                        <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1 underline decoration-dotted">Expires In</span>
                          <span className={`text-sm font-black block leading-none ${item.hoursToExpiry < 1 ? 'text-rose-500' : 'text-slate-700'}`}>
                            ⏰ {item.hoursToExpiry.toFixed(1)}h
                          </span>
                        </div>
                      </div>

                      <div className="mb-6 flex-grow">
                        <div className="flex items-center gap-3 p-3 bg-emerald-50/30 rounded-2xl border border-emerald-100/30">
                          <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center font-bold text-xs">📦</div>
                          <div>
                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Available Qty</p>
                            <p className="text-sm font-black text-emerald-700 leading-none">{item.food.quantity} servings</p>
                          </div>
                        </div>
                        {item.food.details && <p className="text-xs mt-4 text-slate-500 font-medium leading-relaxed line-clamp-2 px-1 italic">"{item.food.details}"</p>}
                      </div>

                      <div className="pt-6 border-t border-slate-50 grid grid-cols-3 gap-2">
                        <button className="py-3 px-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black uppercase tracking-widest rounded-xl shadow-sm transition-all active:scale-95 text-[9px]" onClick={() => claim(item.food._id)}>Claim</button>
                        <button className="py-3 px-1.5 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-600 font-black uppercase tracking-widest rounded-xl shadow-sm transition-all active:scale-95 text-[9px]" onClick={() => collect(item.food._id)}>Collect</button>
                        <button className="py-3 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95 text-[9px]" onClick={() => setRequestModal(item.food)}>Request</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── MY REQUESTS ── */}
        {tab === 'requests' && (
          <div className="space-y-8 pb-12">
            {myRequests.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 block">📬</span>
                <p className="text-slate-400 font-bold">No requests yet</p>
                <p className="text-slate-300 text-sm mt-2">Browse nearby items and send requests to providers.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {myRequests.map(req => {
                  const colId = req.collectionId?._id;
                  const ps = pickupState[req._id] || {};
                  const proofsStateObj = proofState[colId] || {};
                  const hasPr = hasProof(colId);

                  return (
                    <div key={req._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-2 inline-block ${reqStatusColor[req.status]}`}>
                            {req.status}
                          </span>
                          <h4 className="text-xl font-black text-slate-800">{req.foodId?.foodName || 'Food Item'}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <p className="text-slate-400 font-medium text-xs">Provider: <span className="font-bold">{req.providerId?.name || '—'}</span></p>
                            {req.distanceKm != null && (
                              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100/50 flex items-center gap-1">
                                <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                                {req.distanceKm.toFixed(1)} km
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase block mb-0.5">Requested</span>
                          <span className="text-lg font-black text-slate-700">{req.requestedAmount} units</span>
                        </div>
                      </div>

                      {req.status === 'accepted' && (
                        <div className="pt-6 border-t border-slate-50 space-y-6">
                          <div className="flex items-center justify-between p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-emerald-700">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">✅</span>
                              <div>
                                <p className="text-xs font-black uppercase tracking-tight">Request Accepted!</p>
                                <p className="text-[10px] font-medium">Provider granted: <span className="font-black">{req.grantedAmount} units</span></p>
                              </div>
                            </div>
                            {req.collectionId?.pickup_status === 'pending' && !ps.done && (
                              <button
                                onClick={() => handlePickup(req)}
                                disabled={ps.loading}
                                className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-95"
                              >
                                {ps.loading ? 'Updating...' : 'Confirm Pickup'}
                              </button>
                            )}
                            {(req.collectionId?.pickup_status === 'completed' || ps.done) && (
                              <span className="text-xs font-black uppercase font-bold text-emerald-700">Picked Up 🤝</span>
                            )}
                          </div>

                          {/* Proof Upload (Only if picked up and no proof yet) */}
                          {(req.collectionId?.pickup_status === 'completed' || ps.done) && !hasPr && !proofsStateObj.done && (
                            <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 animate-fadeIn">
                              <div className="flex items-center gap-3 mb-4">
                                <span className="text-lg">📸</span>
                                <p className="text-sm font-black text-indigo-900">Distribution Proof Required</p>
                              </div>
                              <ImageUploader onUpload={(urls) => setProofImages(colId, urls)} multiple={true} initialImages={proofsStateObj.images || []} />
                              <textarea
                                placeholder="Where did you distribute this? (e.g. Slum area, School, Orphanage...)"
                                className="w-full mt-4 p-4 bg-white border border-indigo-100 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all min-h-[80px]"
                                value={proofsStateObj.desc || ''}
                                onChange={e => setProofDesc(colId, e.target.value)}
                              />
                              <button
                                onClick={() => submitProof(colId)}
                                disabled={proofsStateObj.submitting}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 transition-all active:scale-95"
                              >
                                {proofsStateObj.submitting ? 'Submitting...' : 'Upload 🚀'}
                              </button>
                            </div>
                          )}

                          {(hasPr || proofsStateObj.done) && (
                            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 text-violet-700 flex items-center gap-3">
                              <span className="text-xl">🌟</span>
                              <p className="text-xs font-black uppercase tracking-tight">Proof Submitted Successfully!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* ── MY PROOFS / GALLERY ── */}
        {tab === 'proofs' && (
          <div className="space-y-8 pb-12">
            {proofs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 flex flex-col items-center justify-center">
                <span className="text-6xl mb-4 block">📸</span>
                <p className="text-slate-400 font-bold">Your gallery is empty</p>
                <p className="text-slate-300 text-sm mt-2">Proofs of your food distribution will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {proofs.map(p => (
                  <div key={p._id} className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 mb-4 aspect-video">
                      {p.proofImages?.map((url, i) => (
                        <div key={i} className={`relative rounded-2xl overflow-hidden ${p.proofImages.length === 1 ? 'col-span-2' : ''}`}>
                          <img src={url} alt="Proof" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <h5 className="font-black text-slate-800 tracking-tight leading-snug">{p.collectionId?.foodId?.foodName || 'Donation Item'}</h5>
                      <p className="text-xs text-slate-500 font-medium line-clamp-3">"{p.description || 'No description provided'}"</p>
                      <p className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 py-1 px-3 rounded-full inline-block">Distributed on {new Date(p.uploadDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}      </div>

      {/* ── REQUEST FOOD MODAL ── */}
      {requestModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRequestModal(null)} />
          <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 md:p-10 animate-scaleIn">
            <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
              <span className="bg-emerald-100 p-2 rounded-xl text-xl">🥘</span> Request Item
            </h3>
            <p className="text-slate-500 font-medium mb-6">Requesting <span className="text-slate-800 font-bold">{requestModal.foodName}</span> from <span className="text-slate-800 font-bold">{requestModal.providerId?.name || 'Provider'}</span></p>

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Amount Needed (Max: {requestModal.quantity})</label>
                <div className="relative">
                  <input type="number" min={1} max={requestModal.quantity} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 pr-12" value={reqAmount} onChange={e => setReqAmount(e.target.value)} />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 font-bold">qty</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Add a message (Optional)</label>
                <textarea className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-slate-700 min-h-[120px]" placeholder="Explain why you need this or coordinate pickup..." value={reqMsg} onChange={e => setReqMsg(e.target.value)} />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={sendRequest}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  🚀 Submit Request
                </button>
                <button
                  onClick={() => setRequestModal(null)}
                  className="px-8 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-black text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  )
}