import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'
import DashboardLayout from '../../components/Dashboard/DashboardLayout'
import ImageUploader from '../../components/Uploaders/ImageUploader'

const authHeaders = () => ({ headers: { Authorization: 'Bearer ' + getToken() } })

export default function NGODashboard() {
  const { showAlert } = useModal()
  const user = getUserFromToken()
  const [tab, setTab] = useState('browse')
  const [nearby, setNearby] = useState([])
  const [myRequests, setMyRequests] = useState([])
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(false)
  const [lat, setLat] = useState('')
  const [lng, setLng] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  
  // States for Proof Upload
  const [selectedCol, setSelectedCol] = useState(null)
  const [proofImages, setProofImages] = useState([])
  const [proofDesc, setProofDesc] = useState('')
  const [uploading, setUploading] = useState(false)

  // Request Modal State
  const [requestModal, setRequestModal] = useState(null)
  const [reqMsg, setReqMsg] = useState('')
  const [reqAmount, setReqAmount] = useState(1)
  const [viewProofModal, setViewProofModal] = useState(null)

  useEffect(() => {
    getLocation()
    fetchMyRequests()
    fetchProofs()
  }, [])

  useEffect(() => {
    if (lat && lng) fetchNearby()
  }, [lat, lng])

  const sortedRequests = React.useMemo(() => {
    if (!myRequests) return [];
    return [...myRequests].sort((a, b) => {
      const getPriority = (req) => {
        if (req.status === 'accepted' && req.collectionId?.pickup_status === 'completed') return 1; // Needs Proof
        if (req.status === 'accepted' && req.collectionId?.pickup_status === 'pending') return 2;   // Needs Pickup
        if (req.status === 'pending') return 3;
        if (req.status === 'picked') return 4;
        if (req.status === 'rejected') return 5;
        return 6;
      };
      return getPriority(a) - getPriority(b);
    });
  }, [myRequests]);

  const getLocation = () => {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => { 
        setLat(pos.coords.latitude.toString())
        setLng(pos.coords.longitude.toString())
        setGeoLoading(false) 
      },
      () => {
        setGeoLoading(false)
        showAlert('Location Error', 'Unable to get your location. Results may not be localized.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const fetchNearby = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/api/ngo/nearby?lat=${lat}&lng=${lng}&maxKm=20`, authHeaders())
      setNearby(res.data.list || [])
    } catch (e) { }
    finally { setLoading(false) }
  }

  const fetchMyRequests = async () => {
    try {
      const res = await api.get(`/api/ngo/requests${lat && lng ? `?lat=${lat}&lng=${lng}` : ''}`, authHeaders())
      setMyRequests(res.data.list || [])
    } catch (e) { }
  }

  const fetchProofs = async () => {
    try {
      const res = await api.get('/api/ngo/distribution-proofs', authHeaders())
      setProofs(res.data.proofs || [])
    } catch (e) { }
  }

  const handleSendRequest = async () => {
    if (!requestModal) return
    try {
      await api.post(`/api/ngo/request/${requestModal._id}`, { 
        message: reqMsg, 
        requestedAmount: reqAmount 
      }, authHeaders())
      showAlert('Success', 'Request sent to the provider.')
      setRequestModal(null); setReqMsg(''); setReqAmount(1)
      fetchNearby(); fetchMyRequests()
    } catch (e) { showAlert('Error', e.response?.data?.message || 'Failed to send request.') }
  }

  const handleUploadProof = async (e) => {
    e.preventDefault()
    if (!proofImages || proofImages.length === 0) return showAlert('Error', 'Please upload at least one proof image.')
    setUploading(true)
    try {
      await api.post(`/api/ngo/distribution-proof/${selectedCol}`, { 
        proofImages, 
        description: proofDesc 
      }, authHeaders())
      showAlert('Success', 'Distribution proof uploaded!')
      setSelectedCol(null); setProofImages([]); setProofDesc('')
      fetchMyRequests(); fetchProofs()
    } catch (e) { showAlert('Error', 'Failed to upload proof.') }
    finally { setUploading(false) }
  }

  const handlePickup = async (colId) => {
    try {
      await api.put(`/api/ngo/collection/${colId}/complete`, {}, authHeaders())
      showAlert('Success', 'Pickup marked as complete. Now please upload the distribution proof.')
      fetchMyRequests()
    } catch (e) { showAlert('Error', 'Failed to update pickup status.') }
  }

  const sidebarTabs = [
    { id: 'browse', label: 'Nearby Food', icon: '📍' },
    { id: 'requests', label: 'My Requests', icon: '📋' },
    { id: 'gallery', label: 'Impact Gallery', icon: '🖼️' },
  ];

  return (
    <DashboardLayout
      title="NGO Dashboard"
      subtitle="Connect with providers and manage food distribution"
      tabs={sidebarTabs}
      activeTab={tab}
      setActiveTab={setTab}
      roleColor="indigo"
    >
      <div className="animate-fadeIn">
        
        {/* BROWSE NEARBY */}
        {tab === 'browse' && (
          <div className="space-y-8">
            <div className="bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl overflow-hidden relative">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16" />
               <div className="relative mb-8">
                  <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-sm not-italic">📍</span>
                    Find Food In Your Area
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1 ml-10">Discover surplus listings near your NGO location</p>
               </div>

               <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-end gap-6 relative">
                  <div className="w-full xl:flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Latitude</label>
                        <div className="relative group">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">Y</span>
                           <input 
                              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200" 
                              placeholder="0.0000"
                              value={lat} 
                              onChange={e => setLat(e.target.value)} 
                           />
                        </div>
                     </div>
                     <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Longitude</label>
                        <div className="relative group">
                           <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">X</span>
                           <input 
                              className="w-full pl-12 pr-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200" 
                              placeholder="0.0000"
                              value={lng} 
                              onChange={e => setLng(e.target.value)} 
                           />
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                     <button onClick={getLocation} className="flex-1 sm:flex-none px-6 py-4 bg-slate-100 text-slate-500 font-extrabold text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer flex items-center justify-center gap-2 group whitespace-nowrap">
                        <span className="group-hover:scale-125 transition-transform">{geoLoading ? '⌛' : '🎯'}</span>
                        {geoLoading ? 'Detecting...' : 'Auto Detect'}
                     </button>
                     <button onClick={fetchNearby} className="flex-[2] sm:flex-none px-10 py-4 bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 border-none cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap">
                        {loading ? 'Searching...' : '🔍 Search Nearby Food'}
                     </button>
                  </div>
               </div>
            </div>

            {nearby.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">🍃</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No surplus food found in this area</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {nearby.map(item => (
                  <div key={item.food._id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 opacity-50" />
                    <div className="relative">
                      <div className="flex justify-between items-start mb-6">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${item.priority < 2 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                          {item.priority < 2 ? 'High Priority' : 'Available'}
                        </span>
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">📍 {item.distanceKm.toFixed(1)} km</p>
                      </div>
                      <h4 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-3 italic uppercase group-hover:text-indigo-600 transition-colors">{item.food.foodName}</h4>
                      <div className="space-y-2 mb-8">
                         <p className="text-sm font-bold text-slate-500 flex items-center gap-2">
                           🏪 
                           <Link to={`/profile/${item.food.providerId?._id || item.food.providerId?.slug}`} className="hover:text-indigo-600 transition-colors">
                             {item.food.providerId?.name || 'Local Store'}
                           </Link>
                         </p>
                         <p className="text-sm font-bold text-slate-500 flex items-center gap-2">📦 {item.food.quantity} servings available</p>
                      </div>
                      
                      <div className="pt-6 border-t border-slate-50 flex flex-col gap-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                           <span className={item.hoursToExpiry < 2 ? 'text-rose-500' : ''}>⏰ Expires: {item.hoursToExpiry.toFixed(1)}h</span>
                        </div>
                        <button 
                          onClick={() => setRequestModal(item.food)}
                          className="w-full py-4 bg-indigo-600 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-95 border-none cursor-pointer"
                        >
                          Request This Food
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MY REQUESTS */}
        {tab === 'requests' && (
          <div className="animate-fadeIn">
            {myRequests.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">🗒️</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No donation requests yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {sortedRequests.map(r => (
                  <div key={r._id} className={`bg-white rounded-[2.5rem] p-8 border transition-all ${r.status === 'accepted' ? 'border-indigo-100 shadow-xl' : 'border-slate-100 shadow-sm'}`}>
                    <div className="flex justify-between items-start gap-4 mb-8">
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${r.status === 'accepted' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             {r.status === 'accepted' ? '✅' : '⏳'}
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1 italic uppercase">{r.foodId?.foodName || 'Food Item'}</h4>
                             <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                Provider: 
                                <Link to={`/profile/${r.providerId?._id}`} className="text-indigo-600 ml-1 hover:text-indigo-800 transition-colors">
                                  {r.providerId?.name}
                                </Link>
                             </p>
                          </div>
                       </div>
                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                          r.status === 'distributed' ? 'bg-emerald-600 text-white' : 
                          r.status === 'picked' ? 'bg-indigo-100 text-indigo-600' : 
                          r.status === 'accepted' ? 'bg-emerald-100 text-emerald-600' : 
                          r.status === 'rejected' ? 'bg-rose-100 text-rose-600' : 
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {r.status === 'distributed' ? 'Distributed' : r.status === 'picked' ? 'Picked' : r.status}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requested</p>
                          <p className="text-xl font-black text-slate-800">{r.requestedAmount} Units</p>
                       </div>
                       <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50 text-center">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Grant Amount</p>
                          <p className="text-xl font-black text-indigo-700">{r.grantedAmount || 0}</p>
                       </div>
                    </div>

                    {(r.status === 'accepted' || r.status === 'picked') && (
                       <div className="pt-6 border-t border-slate-50">
                          {r.collectionId?.pickup_status === 'completed' ? (
                             <button
                               onClick={() => setSelectedCol(r.collectionId?._id)}
                               className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-100 active:scale-95 border-none cursor-pointer"
                             >
                               📸 Upload Distribution Proof
                             </button>
                          ) : (
                             <button
                               onClick={() => handlePickup(r.collectionId?._id)}
                               className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-100 active:scale-95 border-none cursor-pointer"
                             >
                               🤝 Mark as Picked Up
                             </button>
                          )}
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IMPACT GALLERY */}
        {tab === 'gallery' && (
          <div className="animate-fadeIn">
            {proofs.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">🖼️</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No distribution gallery items yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {proofs.map(p => (
                  <div key={p._id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
                    <div className="relative aspect-video bg-slate-100">
                       <img src={p.proofImages[0]} alt="Proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       <div className="absolute top-4 left-4">
                          <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-xl italic">Verified Impact</span>
                       </div>
                    </div>
                    <div className="p-8">
                       <h4 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-3 italic uppercase">{p.collectionId?.foodId?.foodName || 'Donation Item'}</h4>
                       <p className="text-sm font-medium text-slate-500 line-clamp-2 italic leading-relaxed mb-6">"{p.description || 'Successfully distributed to the community members.'}"</p>
                       <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                          <span>Shared {new Date(p.uploadDate).toLocaleDateString()}</span>
                          <button 
                            onClick={() => setViewProofModal(p)}
                            className="bg-transparent border-none p-0 text-indigo-500 font-black cursor-pointer hover:text-indigo-700 transition-colors uppercase tracking-widest text-[9px]"
                          >
                            View Proof →
                          </button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* REQUEST FOOD MODAL */}
      {requestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setRequestModal(null)}>
           <div className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black mb-1 text-slate-800 tracking-tight italic uppercase">Request Donation</h3>
              <p className="text-sm text-slate-400 font-bold mb-8 uppercase tracking-widest">Applying for {requestModal.foodName}</p>
              
              <div className="space-y-6">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested amount (Max: {requestModal.quantity})</label>
                    <input type="number" min={1} max={requestModal.quantity} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10" value={reqAmount} onChange={e => setReqAmount(e.target.value)} />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Brief Message / Purpose</label>
                    <textarea className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-indigo-500/10 h-32" placeholder="e.g. Distributed to local orphanage..." value={reqMsg} onChange={e => setReqMsg(e.target.value)} />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button onClick={() => setRequestModal(null)} className="flex-1 py-4 bg-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer">Discard</button>
                    <button onClick={handleSendRequest} className="flex-[2] py-4 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 border-none cursor-pointer">
                      Send Request
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* PROOF UPLOAD MODAL */}
      {selectedCol && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedCol(null)}>
           <div className="relative bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <h3 className="text-2xl font-black mb-1 text-slate-800 tracking-tight italic uppercase">Confirm Rescue</h3>
              <p className="text-sm text-slate-400 font-bold mb-8 uppercase tracking-widest">Help verify the impact of this donation</p>
              
              <form onSubmit={handleUploadProof} className="space-y-6">
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidence of Distribution</label>
                    <ImageUploader onUpload={setProofImages} multiple={true} initialImages={proofImages} />
                 </div>
                 <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Description</label>
                    <textarea className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none font-bold text-slate-700 transition-all focus:bg-white focus:ring-4 focus:ring-emerald-500/10 h-32" placeholder="Where was it distributed? Who was helped?" value={proofDesc} onChange={e => setProofDesc(e.target.value)} />
                 </div>
                 <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setSelectedCol(null)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all border-none cursor-pointer">Back</button>
                    <button type="submit" disabled={uploading} className="flex-[2] py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 border-none cursor-pointer">
                       {uploading ? 'Confirming...' : '✨ Confirm Rescue'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {/* VIEW PROOF MODAL */}
      {viewProofModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={() => setViewProofModal(null)}>
           <div className="relative bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
                 <div className="md:w-1/2 bg-slate-50 flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
                       {viewProofModal.proofImages.map((img, i) => (
                          <img key={i} src={img} alt={`Proof ${i+1}`} className="w-full rounded-2xl shadow-sm border border-slate-100" />
                       ))}
                    </div>
                 </div>
                 <div className="md:w-1/2 p-10 flex flex-col justify-between">
                    <div>
                       <div className="flex justify-between items-start mb-6">
                          <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-indigo-100">Impact Evidence</span>
                          <button onClick={() => setViewProofModal(null)} className="text-slate-300 hover:text-slate-500 transition-colors bg-transparent border-none cursor-pointer text-xl">✕</button>
                       </div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase mb-2">
                          {viewProofModal.collectionId?.foodId?.foodName || 'Donation Impact'}
                       </h3>
                       <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-8">Shared on {new Date(viewProofModal.uploadDate).toLocaleDateString()}</p>
                       
                       <div className="space-y-6">
                          <div>
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Distribution Details</label>
                             <div className="p-6 rounded-[2rem] bg-indigo-50/30 border border-indigo-100/50 text-slate-600 italic leading-relaxed text-sm">
                                "{viewProofModal.description || 'Successfully distributed to the community members.'}"
                             </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-sm font-black text-emerald-600 uppercase">Verified</p>
                             </div>
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type</p>
                                <p className="text-sm font-black text-slate-700 uppercase">Direct Relief</p>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    <button onClick={() => setViewProofModal(null)} className="mt-10 w-full py-4 bg-slate-800 hover:bg-black text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-slate-200 border-none cursor-pointer">
                       Close Proof View
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

    </DashboardLayout>
  )
}
