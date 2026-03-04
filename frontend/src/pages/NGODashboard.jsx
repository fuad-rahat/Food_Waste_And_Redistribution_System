import React, { useState, useEffect } from 'react'
import api from '../api'
import { getToken } from '../utils/auth'
import { useModal } from '../context/ModalContext'
import ImageUploader from '../components/ImageUploader'

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
  }, [])

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
                {list.map(item => (
                  <div key={item.food._id} className="bg-white rounded-3xl p-6 ring-1 ring-slate-200 hover:ring-emerald-500/20 transition-all shadow-sm hover:shadow-md flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <h4 className="text-lg font-bold truncate pr-2 text-slate-800">{item.food.foodName}</h4>
                      <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shrink-0 ${statusColor[item.food.status] || 'bg-slate-100 text-slate-700'}`}>{item.food.status}</span>
                    </div>
                    <div className="font-medium text-slate-500 flex flex-col gap-1.5 text-sm mb-4 flex-grow">
                      <span className="flex items-center gap-1.5">📦 {item.food.quantity} units</span>
                      <span className="flex items-center gap-1.5 text-emerald-600 font-black">📍 {item.distanceKm.toFixed(2)} km</span>
                      <span className="flex items-center gap-1.5">⏰ {item.hoursToExpiry.toFixed(1)}h left</span>
                      {item.food.details && <p className="text-xs mt-2 text-slate-600 bg-slate-50 p-3 rounded-xl break-words line-clamp-2">"{item.food.details}"</p>}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button className="py-2.5 px-3 bg-white border border-blue-200 hover:bg-blue-50 text-blue-500 font-bold rounded-xl shadow-sm transition-all active:scale-95 flex justify-center items-center text-xs" onClick={() => claim(item.food._id)}>Claim</button>
                      <button className="py-2.5 px-3 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-500 font-bold rounded-xl shadow-sm transition-all active:scale-95 flex justify-center items-center text-xs" onClick={() => collect(item.food._id)}>Collect</button>
                      <button className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all active:scale-95 flex justify-center items-center text-xs" onClick={() => setRequestModal(item.food)}>Request</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY REQUESTS ── */}
        

        {/* ── MY PROOFS ── */}
        
      </div>

      {/* ── REQUEST FOOD MODAL ── */}
      
    </div>
  )
}
