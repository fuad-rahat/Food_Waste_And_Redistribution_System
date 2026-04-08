import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { getToken, getUserFromToken } from '../../utils/auth'
import { useModal } from '../../context/ModalContext'
import DashboardLayout from '../../components/Dashboard/DashboardLayout'

const authHeaders = () => ({ headers: { Authorization: 'Bearer ' + getToken() } })

// ── Reusable helpers ────────────────────────────────────────────────────────

const Badge = ({ children, color }) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${colors[color] || colors.slate}`}>
      {children}
    </span>
  )
}

const roleBadge = (role) => {
  const map = { provider: 'blue', ngo: 'purple', admin: 'slate' }
  return <Badge color={map[role] || 'slate'}>{role}</Badge>
}

const statusBadge = (status) => {
  const map = { pending: 'amber', approved: 'emerald', rejected: 'rose' }
  return <Badge color={map[status] || 'slate'}>{status}</Badge>
}

const thClass = 'text-left py-4 px-5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50/50 border-b border-slate-100 whitespace-nowrap'
const tdClass = 'py-4 px-5 border-b border-slate-50 text-slate-700'

// ── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { showAlert, showConfirm } = useModal()
  const user = getUserFromToken()
  const [tab, setTab] = useState('stats')
  const [pendingUsers, setPendingUsers] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [foods, setFoods] = useState([])
  const [stats, setStats] = useState({})
  const [proofs, setProofs] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [docViewer, setDocViewer] = useState(null)

  const openDocViewer = (u) => setDocViewer({ name: u.name, pages: u.legalDocumentImages, page: 0 })
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
    } catch (e) { showAlert('Error', e.response?.data?.message || 'Action failed') }
  }

  const toggleBlock = async (id) => {
    await api.put(`/api/admin/user/${id}/block`, {}, authHeaders())
    fetchAll()
  }

  const delUser = async (id) => {
    if (!(await showConfirm('Delete User', 'This action is permanent.'))) return
    await api.delete(`/api/admin/user/${id}/delete`, authHeaders())
    fetchAll()
  }

  const delFood = async (id) => {
    if (!(await showConfirm('Delete Food', 'Remove this listing?'))) return
    await api.delete(`/api/admin/food/${id}`, authHeaders())
    fetchAll()
  }

  const sidebarTabs = [
    { id: 'stats', label: 'Overview', icon: '📊' },
    { id: 'pending', label: `Verification (${pendingUsers.length})`, icon: '🛡️' },
    { id: 'users', label: 'User Directory', icon: '👥' },
    { id: 'foods', label: 'Food Database', icon: '🍱' },
    { id: 'proofs', label: 'Rescue Proofs', icon: '📸' },
  ];

  return (
    <DashboardLayout
      title="Admin Control"
      subtitle="Platform governance and verification management"
      tabs={sidebarTabs}
      activeTab={tab}
      setActiveTab={setTab}
      roleColor="slate"
    >
      <div className="animate-fadeIn">

        {/* ── OVERVIEW / STATS ── */}
        {tab === 'stats' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '📈', label: 'Pending Verifications', value: pendingUsers.length, color: 'rose' },
                { icon: '🏪', label: 'Active Providers', value: stats.activeProviders, color: 'emerald' },
                { icon: '🏢', label: 'Active NGOs', value: stats.activeNGOs, color: 'indigo' },
                { icon: '📦', label: 'Total Rescues', value: stats.totalCollected, color: 'amber' },
              ].map(s => (
                <div key={s.label} className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center group">
                  <span className="text-4xl mb-4 group-hover:scale-110 transition-transform">{s.icon}</span>
                  <h4 className="text-4xl font-black text-slate-800 tracking-tighter mb-1">{s.value || 0}</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-zinc-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 group-hover:scale-110 transition-transform duration-1000" />
               <div className="relative flex flex-col md:flex-row justify-between items-center gap-12">
                  <div className="flex-1">
                     <h3 className="text-4xl font-black tracking-tighter italic uppercase mb-4 leading-tight">System Performance</h3>
                     <p className="text-white/60 font-medium text-lg leading-relaxed max-w-xl">
                        The platform is currently operating at <span className="text-emerald-400">98.4% uptime</span>. 
                        Verification queue is <span className={pendingUsers.length > 5 ? 'text-rose-400' : 'text-emerald-400'}>{pendingUsers.length > 5 ? 'Elevated' : 'Normal'}</span>.
                        Distribution efficiency is rated as <span className="text-indigo-400">Optimal</span>.
                     </p>
                  </div>
                  <div className="w-48 h-48 rounded-full border-[10px] border-white/10 flex items-center justify-center relative">
                     <div className="text-center">
                        <span className="text-3xl font-black block leading-none">A+</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 mt-1">Health Score</span>
                     </div>
                     <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="96" cy="96" r="82" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-emerald-400 opacity-80" strokeDasharray="300 514" strokeLinecap="round" />
                     </svg>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* ── PENDING VERIFICATION ── */}
        {tab === 'pending' && (
          <div className="space-y-8">
            {pendingUsers.length === 0 ? (
              <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                <span className="text-7xl mb-6 block">✨</span>
                <p className="text-slate-400 font-black uppercase tracking-widest text-xs">All caught up! No pending verifications.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {pendingUsers.map(u => (
                  <div key={u._id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-8 md:p-10">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <Link to={`/profile/${u._id || u.slug}`} className="hover:text-emerald-600 transition-colors">
                            <h4 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none mb-2">{u.name}</h4>
                          </Link>
                          <p className="text-slate-400 text-sm font-bold tracking-tight">{u.email}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                           <span className="text-[8px] font-black text-slate-400 block mb-0.5 tracking-widest">JOINED</span>
                           <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mb-8">
                        {roleBadge(u.role)}
                        {statusBadge(u.verificationStatus)}
                      </div>

                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Legal Documents Attachment</p>
                         <div className="flex gap-3 mb-6">
                            {u.legalDocumentImages?.slice(0, 3).map((url, i) => (
                               <div key={i} className="relative w-16 aspect-[3/4] rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white shadow-sm cursor-zoom-in" onClick={() => openDocViewer(u)}>
                                  <img src={url} alt="doc" className="w-full h-full object-cover" />
                               </div>
                            ))}
                            {u.legalDocumentImages?.length > 3 && (
                               <div className="w-16 aspect-[3/4] rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs">
                                  +{u.legalDocumentImages.length - 3}
                               </div>
                            )}
                         </div>
                         <button onClick={() => openDocViewer(u)} className="w-full py-4 bg-white border-2 border-dashed border-slate-200 text-slate-400 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
                            🔍 Examine Documentation Room
                         </button>
                      </div>

                      <div className="flex gap-4">
                         <button onClick={() => verifyUser(u._id, 'approve')} className="flex-[2] py-4 bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all border-none cursor-pointer">Verify Account</button>
                         <button onClick={() => verifyUser(u._id, 'reject')} className="flex-1 py-4 bg-white border border-rose-100 text-rose-500 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-rose-50 transition-all cursor-pointer">Reject</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── USER DIRECTORY ── */}
        {tab === 'users' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
             <div className="p-8 border-b border-slate-50">
                <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">User Registry</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Managing {allUsers.length} total participants</p>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-sm">
                   <thead>
                      <tr>
                         <th className={thClass}>Participant</th>
                         <th className={thClass}>Role</th>
                         <th className={thClass}>Verification</th>
                         <th className={thClass}>Status</th>
                         <th className={thClass}>Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {allUsers.map(u => (
                         <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                            <td className={tdClass}>
                               <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                     {u.role === 'ngo' ? '🏢' : u.role === 'provider' ? '🏪' : '🛡️'}
                                  </div>
                                  <div>
                                     <Link to={`/profile/${u._id || u.slug}`} className="font-black text-slate-800 leading-tight uppercase italic hover:text-emerald-600 transition-colors">
                                        {u.name}
                                     </Link>
                                     <div className="text-[10px] text-slate-400 font-bold tracking-tight lowercase">{u.email}</div>
                                  </div>
                               </div>
                            </td>
                            <td className={tdClass}>{roleBadge(u.role)}</td>
                            <td className={tdClass}>{statusBadge(u.verificationStatus)}</td>
                            <td className={tdClass}>
                               <Badge color={u.isActive ? 'emerald' : 'rose'}>{u.isActive ? 'OPERATIONAL' : 'RESTRICTED'}</Badge>
                            </td>
                            <td className={tdClass}>
                               {u.role !== 'admin' && (
                                  <div className="flex gap-2">
                                     <button onClick={() => toggleBlock(u._id)} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer">
                                        {u.isActive ? 'Block' : 'Unblock'}
                                     </button>
                                     <button onClick={() => delUser(u._id)} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer">Delete</button>
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

        {/* ── FOOD DATABASE ── */}
        {tab === 'foods' && (
           <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b border-slate-50">
                <h3 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Food Inventory</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">System wide surplus food tracking</p>
             </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-sm">
                    <thead>
                       <tr>
                          <th className={thClass}>Item Description</th>
                          <th className={thClass}>Origin</th>
                          <th className={thClass}>Quantity</th>
                          <th className={thClass}>Expiry</th>
                          <th className={thClass}>Actions</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {foods.map(f => (
                          <tr key={f._id} className="hover:bg-slate-50/50 transition-colors">
                             <td className={tdClass}>
                                <div className="font-black text-slate-800 uppercase italic">{f.foodName}</div>
                                <div className="text-[10px] text-slate-400 font-bold">Added {new Date(f.createdAt).toLocaleDateString()}</div>
                             </td>
                             <td className={tdClass}>
                                <div className="flex items-center gap-2">
                                   <span className="text-sm">🏪</span>
                                   <Link to={`/profile/${f.providerId?._id || f.providerId?.slug}`} className="font-bold text-slate-600 uppercase tracking-tight text-xs hover:text-emerald-600 transition-colors">
                                      {f.providerId?.name || 'Local Store'}
                                   </Link>
                                </div>
                             </td>
                             <td className={tdClass}>
                                <span className="font-black text-slate-800">📦 {f.quantity} Servings</span>
                             </td>
                             <td className={tdClass}>
                                <Badge color={f.isExpired ? 'rose' : 'emerald'}>{f.isExpired ? 'EXPIRED' : 'ACTIVE'}</Badge>
                             </td>
                             <td className={tdClass}>
                                <button onClick={() => delFood(f._id)} className="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-all cursor-pointer">Remove</button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}

        {/* ── RESCUE PROOFS ── */}
        {tab === 'proofs' && (
           <div className="space-y-8">
              {proofs.length === 0 ? (
                 <div className="py-24 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <span className="text-7xl mb-6 block">📸</span>
                    <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Waiting for rescue evidence submissions</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {proofs.map(p => (
                       <div key={p._id} className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all">
                          <div className="p-8">
                             <div className="flex justify-between items-start gap-4 mb-8">
                                <div>
                                   <p className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Verified Proof
                                   </p>
                                   <h4 className="text-2xl font-black text-slate-800 tracking-tighter italic uppercase leading-none mb-1">Rescue Log #{p._id.slice(-6).toUpperCase()}</h4>
                                   <p className="text-slate-400 text-xs font-black uppercase tracking-widest">
                                      Target: 
                                      <Link to={`/profile/${p.ngoId?._id || p.ngoId?.slug}`} className="text-indigo-600 ml-1 hover:text-indigo-800 transition-colors">
                                         {p.ngoId?.name}
                                      </Link>
                                   </p>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center shadow-inner">
                                   <span className="text-[9px] font-black text-slate-400 block mb-0.5 tracking-widest">QUANTITY</span>
                                   <span className="text-xl font-black text-slate-800 leading-none">{p.collectionId?.quantity || 0}</span>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-3 mb-8">
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Surplus From</p>
                                   <p className="text-xs font-black text-slate-700 truncate">{p.collectionId?.providerId?.name || 'Local Provider'}</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Food Item</p>
                                   <p className="text-xs font-black text-slate-700 truncate">{p.collectionId?.foodId?.foodName || 'Food'}</p>
                                </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                {p.proofImages?.map((url, i) => (
                                   <div key={i} className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-slate-100 bg-slate-50 cursor-zoom-in" onClick={() => setSelectedDoc(url)}>
                                      <img src={url} alt="proof" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                   </div>
                                ))}
                             </div>
                             
                             <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                <span>Report Date: {new Date(p.uploadDate).toLocaleDateString()}</span>
                                <span className="text-emerald-500">Security Clearance ✓</span>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
              )}
           </div>
        )}

      </div>

      {/* ── Document Viewer & Modal Readers ── */}
      {selectedDoc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedDoc(null)}>
           <div className="relative max-w-4xl w-full rounded-[2.5rem] overflow-hidden shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <button className="absolute top-6 right-6 w-12 h-12 bg-black/40 backdrop-blur-xl rounded-2xl text-white font-black text-lg border-none cursor-pointer z-10" onClick={() => setSelectedDoc(null)}>✕</button>
              <img src={selectedDoc} alt="preview" className="w-full h-auto max-h-[85vh] object-contain" />
           </div>
        </div>
      )}

      {docViewer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-fadeIn" onClick={closeDocViewer}>
           <div className="relative w-full max-w-4xl bg-zinc-900 rounded-[3rem] overflow-hidden flex flex-col shadow-2xl animate-scaleIn" onClick={e => e.stopPropagation()}>
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                 <div>
                    <h3 className="text-white font-black text-2xl tracking-tighter uppercase italic">{docViewer.name}</h3>
                    <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Verification Dossier · Page {docViewer.page + 1} of {docViewer.pages.length}</p>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={viewerPrev} disabled={docViewer.page === 0} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-20 border-none cursor-pointer transition-all">←</button>
                    <button onClick={viewerNext} disabled={docViewer.page === docViewer.pages.length - 1} className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-2xl hover:bg-white/20 disabled:opacity-20 border-none cursor-pointer transition-all">→</button>
                    <button onClick={closeDocViewer} className="w-12 h-12 flex items-center justify-center bg-rose-500/20 text-rose-500 rounded-2xl hover:bg-rose-500/30 border-none cursor-pointer transition-all ml-4">✕</button>
                 </div>
              </div>
              <div className="flex flex-1 overflow-hidden min-h-[500px]">
                 <div className="w-24 border-r border-white/5 p-4 flex flex-col gap-3 overflow-y-auto hidden md:flex">
                    {docViewer.pages.map((url, i) => (
                       <div key={i} onClick={() => setDocViewer(v => ({...v, page: i}))} className={`aspect-[3/4] rounded-xl overflow-hidden cursor-pointer ring-2 transition-all ${i === docViewer.page ? 'ring-emerald-500' : 'ring-transparent opacity-40'}`}>
                          <img src={url} className="w-full h-full object-cover" alt="thumb" />
                       </div>
                    ))}
                 </div>
                 <div className="flex-1 p-10 flex items-center justify-center bg-zinc-950/50 overflow-y-auto">
                    <img src={docViewer.pages[docViewer.page]} className="max-w-full h-auto rounded-xl shadow-2xl" alt="legal_doc" />
                 </div>
              </div>
           </div>
        </div>
      )}

    </DashboardLayout>
  )
}
