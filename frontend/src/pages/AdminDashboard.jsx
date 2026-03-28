import React, { useEffect, useState } from 'react'
import api from '../api'
import { getToken } from '../utils/auth'
import { useModal } from '../context/ModalContext'

const authHeaders = () => ({ headers: { Authorization: 'Bearer ' + getToken() } })

// ── Reusable helpers ────────────────────────────────────────────────────────

const Badge = ({ children, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-emerald-100 text-emerald-700',
    red: 'bg-rose-100 text-rose-700',
    yellow: 'bg-amber-100 text-amber-700',
    gray: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

const roleBadge = (role) => {
  const map = { provider: 'blue', ngo: 'purple', admin: 'gray' }
  return <Badge color={map[role] || 'gray'}>{role}</Badge>
}

const statusBadge = (status) => {
  const map = { pending: 'yellow', approved: 'green', rejected: 'red' }
  return <Badge color={map[status] || 'gray'}>{status}</Badge>
}
const thClass = 'text-left py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100 whitespace-nowrap'
const tdClass = 'py-3 px-5 border-b border-slate-50 text-slate-700'

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { showAlert, showConfirm } = useModal()
  const [tab, setTab] = useState('pending')
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [foods, setFoods] = useState([])
  const [stats, setStats] = useState({})
  const [proofs, setProofs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  // docViewer: { name, pages: string[], page: number }
  const [docViewer, setDocViewer] = useState(null)

  const openDocViewer = (user) => setDocViewer({ name: user.name, pages: user.legalDocumentImages, page: 0 })
  const closeDocViewer = () => setDocViewer(null)
  const viewerNext = () => setDocViewer(v => v.page < v.pages.length - 1 ? { ...v, page: v.page + 1 } : v)
  const viewerPrev = () => setDocViewer(v => v.page > 0 ? { ...v, page: v.page - 1 } : v)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [pu, au, f, s, pr] = await Promise.all([
        api.get('/api/admin/pending-users', authHeaders()),
        api.get('/api/admin/users', authHeaders()),
        api.get('/api/admin/foods', authHeaders()),
        api.get('/api/admin/stats', authHeaders()),
        api.get('/api/admin/distribution-proofs', authHeaders()),
      ])
      setPendingUsers(pu.data.users)
      setAllUsers(au.data.users)
      setFoods(f.data.foods)
      setStats(s.data)
      setProofs(pr.data.proofs)
    } catch (e) { console.error(e) }
  }

  const verifyUser = async (id, action) => {
    try {
      await api.put(`/api/admin/user/${id}/verify`, { action }, authHeaders())
      showAlert('Success', `User ${action}ed successfully.`)
      fetchAll()
    } catch (e) { showAlert('Action Failed', 'Error: ' + (e.response?.data?.message || e.message)) }
  }

  const toggleBlock = async (id) => {
    await api.put(`/api/admin/user/${id}/block`, {}, authHeaders())
    fetchAll()
  }

  const delUser = async (id) => {
    if (!(await showConfirm('Delete User', 'Are you sure you want to permanently delete this user?'))) return
    await api.delete(`/api/admin/user/${id}/delete`, authHeaders())
    showAlert('Deleted', 'User has been removed.')
    fetchAll()
  }

  const delFood = async (id) => {
    await api.delete(`/api/admin/food/${id}`, authHeaders())
    fetchAll()
  }

  const tabs = [
    { id: 'pending', label: `⏳ Pending (${stats.pendingVerification || 0})` },
    { id: 'users', label: '👥 All Users' },
    { id: 'foods', label: '🍱 Foods' },
    { id: 'proofs', label: '📸 Distribution Proofs' },
    { id: 'stats', label: '📊 Stats' },
  ]

  return (
    <div className="py-8 animate-fadeIn overflow-x-hidden">

      {/* Page header */}
      <div className="mb-10 px-4">
        <h2 className="text-4xl font-black tracking-tighter mb-2">🛡️ Admin Control</h2>
        <p className="text-slate-500 font-medium text-lg">Platform-wide management and verification portal.</p>
      </div>

      {/* Quick stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 px-4 mb-10">
        {[
          { value: stats.pendingVerification, label: 'Pending Verify', bg: 'bg-rose-50', ring: 'ring-rose-200/50', text: 'text-rose-600', sub: 'text-rose-400' },
          { value: stats.activeProviders, label: 'Providers', bg: 'bg-emerald-50', ring: 'ring-emerald-200/50', text: 'text-emerald-600', sub: 'text-emerald-400' },
          { value: stats.activeNGOs, label: 'Active NGOs', bg: 'bg-indigo-50', ring: 'ring-indigo-200/50', text: 'text-indigo-600', sub: 'text-indigo-400' },
          { value: stats.totalFood, label: 'Total Posts', bg: 'bg-slate-50', ring: 'ring-slate-200/50', text: 'text-slate-800', sub: 'text-slate-400' },
          { value: stats.totalCollected, label: 'Rescue Goal', bg: 'bg-amber-50', ring: 'ring-amber-200/50', text: 'text-amber-600', sub: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} ring-1 ${s.ring} rounded-2xl border border-slate-100 p-5 shadow-sm`}>
            <div className={`text-3xl font-black ${s.text} mb-1 tracking-tighter`}>{s.value || 0}</div>
            <div className={`text-[10px] font-black uppercase tracking-widest ${s.sub}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
       <div className="mx-4 sticky top-24 z-10 mb-8">
        <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-max px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wide transition-all whitespace-nowrap ${tab === t.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100'
                : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 animate-fadeIn">

        {/* ── PENDING VERIFICATION ── */}
       {tab === 'pending' && (
          <div className="max-w-5xl mx-auto">
            {pendingUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[3rem] py-24 bg-white ring-1 ring-slate-100 shadow-sm text-center">
                <span className="text-7xl mb-6 block">✨</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No pending verifications</p>
                <p className="text-slate-300 text-sm mt-2">All users have been processed.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pendingUsers.map(u => (
                  <div key={u._id} className="bg-white rounded-[2.5rem] ring-1 ring-slate-200 shadow-xl overflow-hidden border border-white">
                    <div className="p-8 md:p-10">
                      <div className="flex justify-between items-start gap-4 mb-8">
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-2">{u.name}</h4>
                          <p className="text-slate-400 text-sm font-bold truncate max-w-[200px]">{u.email}</p>
                        </div>
                        <div className="text-[9px] bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-black text-slate-400 uppercase tracking-widest shadow-inner shrink-0">
                          {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>

                      <div className="flex gap-2 mb-10">
                        {roleBadge(u.role)}
                        {statusBadge(u.verificationStatus)}
                      </div>

                      {u.legalDocumentImages?.length > 0 && (
                        <div className="mb-10">
                          <div className="flex gap-3 mb-4">
                            {u.legalDocumentImages.slice(0, 3).map((url, i) => (
                              <div key={i} className="relative w-20 aspect-[3/4] rounded-2xl overflow-hidden ring-1 ring-slate-200 bg-slate-100 flex-shrink-0 shadow-sm transition-transform hover:scale-105 cursor-zoom-in" onClick={() => openDocViewer(u)}>
                                <img src={url} alt={`p${i + 1}`} className="w-full h-full object-cover" />
                                <span className="absolute bottom-1 right-1 text-[8px] font-black bg-black/50 text-white px-2 py-0.5 rounded-lg backdrop-blur-sm">{i + 1}</span>
                              </div>
                            ))}
                            {u.legalDocumentImages.length > 3 && (
                              <div className="w-20 aspect-[3/4] rounded-2xl ring-1 ring-slate-100 bg-slate-50 flex items-center justify-center flex-shrink-0 text-slate-400 font-black">
                                +{u.legalDocumentImages.length - 3}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => openDocViewer(u)}
                            className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white hover:bg-slate-50 text-slate-500 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
                          >
                            🔍 Open Legal Document Reader
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 pt-8 border-t border-slate-50">
                        <button
                          onClick={() => verifyUser(u._id, 'approve')}
                          className="py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-100"
                        >
                          Verify User
                        </button>
                        <button
                          onClick={() => verifyUser(u._id, 'reject')}
                          className="py-4 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 font-black text-[10px] uppercase tracking-widest rounded-2xl border border-rose-100 transition-all"
                        >
                          Reject Request
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ALL USERS ── */}
        {tab === 'users' && (
          <div className="bg-white ring-1 ring-slate-100 rounded-[2rem] overflow-hidden shadow-xl border border-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={thClass}>User Profile</th>
                    <th className={thClass}>Platform Role</th>
                    <th className={thClass}>Verify Status</th>
                    <th className={thClass}>Safety Status</th>
                    <th className={thClass}>Control Panel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {allUsers.map(u => (
                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className={tdClass}>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-inner ring-1 ring-slate-200">
                              {u.role === 'ngo' ? '🏢' : u.role === 'provider' ? '🏪' : '🛡️'}
                           </div>
                           <div>
                              <div className="font-black text-slate-800 leading-none mb-1">{u.name}</div>
                              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{u.email}</div>
                           </div>
                        </div>
                      </td>
                      <td className={tdClass}>{roleBadge(u.role)}</td>
                      <td className={tdClass}>{statusBadge(u.verificationStatus)}</td>
                      <td className={tdClass}>
                        <Badge color={u.isActive ? 'green' : 'red'}>
                          {u.isActive ? 'OPERATIONAL' : 'SUSPENDED'}
                        </Badge>
                      </td>
                      <td className={tdClass}>
                        {u.role !== 'admin' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleBlock(u._id)}
                              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${u.isActive
                                ? 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100 shadow-sm'
                                : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 shadow-sm'
                                }`}
                            >
                              {u.isActive ? 'Restrict' : 'Activate'}
                            </button>
                            <button
                              onClick={() => delUser(u._id)}
                              className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FOODS ── */}
        {tab === 'foods' && (
          <div className="bg-white ring-1 ring-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl border border-white">
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                   <thead>
                      <tr>
                         <th className={thClass}>Food Detail</th>
                         <th className={thClass}>Provider</th>
                         <th className={thClass}>Quantity</th>
                         <th className={thClass}>Status</th>
                         <th className={thClass}>Action</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {foods.map(f => (
                         <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className={tdClass}>
                               <div className="font-black text-slate-800">{f.foodName}</div>
                               <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Added {new Date(f.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className={tdClass}>
                               <div className="flex items-center gap-2">
                                  <span className="text-sm">🏪</span>
                                  <span className="font-bold text-slate-600">{f.providerId?.name || 'Local Store'}</span>
                               </div>
                            </td>
                            <td className={tdClass}>
                               <span className="font-black text-slate-800">📦 {f.quantity} Items</span>
                            </td>
                            <td className={tdClass}>
                               <Badge color={f.isExpired ? 'red' : 'green'}>
                                  {f.isExpired ? 'EXPIRED' : 'ACTIVE'}
                               </Badge>
                            </td>
                            <td className={tdClass}>
                               <button 
                                 onClick={() => delFood(f._id)}
                                 className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100 transition-all active:scale-95 shadow-sm"
                               >
                                  Remove listing
                               </button>
                            </td>
                         </tr>
                      ))}
                   </tbody>
                </table>
             </div>
             {foods.length === 0 && (
                <div className="py-24 text-center">
                   <span className="text-6xl mb-4 block">🍜</span>
                   <p className="text-slate-400 font-black uppercase tracking-widest text-xs">No food records found</p>
                </div>
             )}
          </div>
        )}

        {/* ── DISTRIBUTION PROOFS ── */}
        {tab === 'proofs' && (
           <div className="max-w-6xl mx-auto space-y-8">
              {proofs.length === 0 ? (
                 <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <span className="text-7xl mb-6 block">📸</span>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">No proofs submitted yet</h3>
                    <p className="text-slate-400 text-sm mt-2">Waiting for NGOs to complete food rescues.</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {proofs.map(p => (
                       <div key={p._id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group">
                          <div className="p-8">
                             <div className="flex justify-between items-start gap-4 mb-8">
                                <div>
                                   <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Verified Distribution
                                   </div>
                                   <h4 className="text-2xl font-black text-slate-800 tracking-tighter leading-none mb-2">Rescue Log #{p._id.slice(-6).toUpperCase()}</h4>
                                   <p className="text-slate-400 text-sm font-bold">Rescued by <span className="text-indigo-500 uppercase tracking-tight">{p.ngoId?.name}</span></p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl ring-1 ring-slate-100 shadow-inner text-center">
                                   <span className="text-[10px] font-black text-slate-400 block mb-0.5">SERVINGS</span>
                                   <span className="text-lg font-black text-slate-800 leading-none">📦 {p.collectionId?.quantity || 0}</span>
                                </div>
                             </div>

                             <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <span className="text-lg">🍱</span>
                                   <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Food Item</p>
                                      <p className="text-sm font-black text-slate-700 leading-none">{p.collectionId?.foodId?.foodName || 'Food Item'}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                   <span className="text-lg">🏪</span>
                                   <div>
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Rescued From</p>
                                      <p className="text-sm font-black text-slate-700 leading-none">{p.collectionId?.providerId?.name || 'Local Provider'}</p>
                                   </div>
                                </div>
                             </div>

                             <div className="mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Evidence of Distribution</p>
                                <div className="grid grid-cols-2 gap-4">
                                   {p.proofPhotos?.map((url, i) => (
                                      <div key={i} className="relative aspect-video rounded-2xl overflow-hidden ring-2 ring-slate-100 bg-slate-100 cursor-zoom-in group-hover:ring-emerald-200 transition-all shadow-sm" onClick={() => setSelectedDoc(url)}>
                                         <img src={url} alt={`proof_${i}`} className="w-full h-full object-cover" />
                                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <span className="text-white text-xs font-black uppercase tracking-widest">Enlarge</span>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </div>

                             <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest border-t border-slate-50 pt-6">
                                Completed on {new Date(p.createdAt).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

        {/* ── STATS ── */}
        

      </div>

      {/* ── Single image preview (for proof images) ── */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-4 animate-scaleIn"
          onClick={() => setSelectedDoc(null)}
        >
          <div className="relative max-w-5xl w-full rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={e => e.stopPropagation()}>
            <button className="absolute top-6 right-6 z-10 w-12 h-12 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur text-white hover:bg-black/60 text-xl font-bold transition-all border-none cursor-pointer" onClick={() => setSelectedDoc(null)}>✕</button>
            <img src={selectedDoc} alt="preview" className="w-full h-auto max-h-[90vh] object-contain shadow-2xl" />
          </div>
        </div>
      )}

      {/* ── Scrollable Legal Document Viewer ── */}
      {docViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn px-4"
          onClick={closeDocViewer}
          onKeyDown={e => { if (e.key === 'Escape') closeDocViewer(); if (e.key === 'ArrowRight' || e.key === 'ArrowDown') viewerNext(); if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') viewerPrev() }}
          tabIndex={-1}
        >
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-zinc-900 rounded-2xl overflow-hidden flex flex-col shadow-2xl ring-1 ring-white/10"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-zinc-800 border-b border-white/10">
              <div>
                <p className="text-white font-black text-sm">{docViewer.name}</p>
                <p className="text-white/50 text-xs font-medium">Legal Documents · {docViewer.pages.length} page{docViewer.pages.length > 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={viewerPrev}
                  disabled={docViewer.page === 0}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition-all text-base border-none cursor-pointer"
                >‹</button>
                <span className="text-white font-black text-sm tabular-nums min-w-[2.5rem] text-center">{docViewer.page + 1} / {docViewer.pages.length}</span>
                <button
                  onClick={viewerNext}
                  disabled={docViewer.page === docViewer.pages.length - 1}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white flex items-center justify-center transition-all text-base border-none cursor-pointer"
                >›</button>
              </div>
              <button
                onClick={closeDocViewer}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all text-base font-bold border-none cursor-pointer"
              >✕</button>
            </div>

            {/* Sidebar + main */}
            <div className="flex flex-1 overflow-hidden">
              {/* Thumbnail sidebar */}
              <div className="hidden md:flex flex-col gap-2 w-16 flex-shrink-0 overflow-y-auto py-3 px-2 bg-zinc-800/50 border-r border-white/10">
                {docViewer.pages.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => setDocViewer(v => ({ ...v, page: i }))}
                    className={`relative aspect-[3/4] rounded-md overflow-hidden cursor-pointer ring-2 transition-all flex-shrink-0 ${i === docViewer.page ? 'ring-emerald-400 opacity-100' : 'ring-transparent opacity-40 hover:opacity-70'}`}
                  >
                    <img src={url} alt={`p${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-0.5 left-0.5 text-[8px] font-black bg-black/60 text-white px-0.5 rounded">{i + 1}</span>
                  </div>
                ))}
              </div>

              {/* Main page */}
              <div className="flex-1 overflow-y-auto flex flex-col items-center gap-4 py-5 px-4">
                <img
                  src={docViewer.pages[docViewer.page]}
                  alt={`Page ${docViewer.page + 1}`}
                  className="w-full max-w-lg h-auto rounded-xl shadow-2xl ring-1 ring-white/10"
                />
                <p className="text-white/30 text-xs font-bold uppercase tracking-widest">
                  Page {docViewer.page + 1} of {docViewer.pages.length}
                </p>
                <div className="flex gap-3 pb-2">
                  <button onClick={viewerPrev} disabled={docViewer.page === 0} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-black text-xs transition-all border-none cursor-pointer">← Prev</button>
                  <button onClick={viewerNext} disabled={docViewer.page === docViewer.pages.length - 1} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white font-black text-xs transition-all border-none cursor-pointer">Next →</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
