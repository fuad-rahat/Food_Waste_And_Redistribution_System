import React, { useState, useEffect } from 'react'
import api from '../api'
import { getToken, getUserFromToken } from '../utils/auth'
import { useModal } from '../context/ModalContext'

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

  useEffect(() => { fetchMyFoods(); fetchRequests() }, [])

  const fetchMyFoods = async () => {
    try {
      const res = await api.get('/api/food/my-food', authHeaders())
      setMyFoods(res.data.foods)
    } catch (e) {
      if (e.response?.status === 403) { /* account inactive handled below */ }
    }
  }

 

  

  const acceptRequest = async (reqId) => {
    const granted = grantAmounts[reqId] || 0
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
        
      </div>
    </div>
  )
}
