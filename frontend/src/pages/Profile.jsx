import React, { useEffect, useState } from 'react'
import api from '../api'
import { getToken, getUserFromToken } from '../utils/auth'
import { useModal } from '../context/ModalContext'

export default function Profile() {
  const { showAlert, showConfirm, showPrompt } = useModal()
  const [userData, setUserData] = useState(null)
  const [foods, setFoods] = useState([])
  const [groupedRequests, setGroupedRequests] = useState({})
  const [requests, setRequests] = useState([])
  const user = getUserFromToken()

  useEffect(() => { if (user) loadProfile(); }, [])

  const loadProfile = async () => {
    try {
      const token = getToken();
      const resUser = await api.get('/api/auth/me', { headers: { Authorization: 'Bearer ' + token } }).catch(() => null);
      if (resUser && resUser.data.user) setUserData(resUser.data.user);
      if (user.role === 'provider') {
        const resFoods = await api.get('/api/food/my-food', { headers: { Authorization: 'Bearer ' + token } });
        setFoods(resFoods.data.foods || []);
        const pres = await api.get('/api/provider/requests', { headers: { Authorization: 'Bearer ' + token } });
        setGroupedRequests(pres.data.grouped || {});
      } else if (user.role === 'ngo') {
        const res = await api.get('/api/ngo/requests', { headers: { Authorization: 'Bearer ' + token } });
        setRequests(res.data.list || []);
      }
    } catch (e) { }
  }

  const accept = async (requestId, foodId) => {
    const amtStr = await showPrompt('Grant Amount', 'Enter amount you will give to this NGO (number)');
    if (!amtStr) return;
    const grantedAmount = parseInt(amtStr, 10);
    if (isNaN(grantedAmount) || grantedAmount < 0) { showAlert('Invalid Amount', 'Please entering a valid positive number.'); return }
    try {
      await api.put('/api/provider/request/' + requestId + '/accept', { grantedAmount }, { headers: { Authorization: 'Bearer ' + getToken() } });
      showAlert('Request Accepted', 'The NGO has been notified of your donation.');
      loadProfile();
    } catch (e) { showAlert('Error', 'Failed to accept the request. Please try again.') }
  }

  const reject = async (requestId) => {
    try {
      await api.put('/api/provider/request/' + requestId + '/reject', {}, { headers: { Authorization: 'Bearer ' + getToken() } });
      showAlert('Request Rejected', 'The request has been removed.');
      loadProfile();
    } catch (e) { showAlert('Error', 'Failed to reject the request.') }
  }

  return (
    <div className="dashboard-page animate-fadeIn overflow-x-hidden">
      <div className="dashboard-header mb-10 px-4">
        <h2 className="text-4xl font-black tracking-tighter mb-2">👤 Professional Profile</h2>
        <p className="text-slate-500 font-medium text-lg">Manage your account identity and verify your recent activity.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4">
        {/* Account Summary Card */}
        <div className="lg:col-span-1">
          <div className="card shadow-xl ring-1 ring-slate-200 !p-8 sticky top-24">
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-inner ring-1 ring-emerald-200">
                {user.role === 'provider' ? '🏪' : '🤝'}
              </div>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{userData?.name || 'Loading...'}</h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">{user.role}</p>
            </div>

            <div className="space-y-6">
              <div className="form-group border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Email Identity</label>
                <div className="text-slate-700 font-bold break-all flex items-center gap-2">
                  <span className="text-lg">📧</span> {userData?.email || 'N/A'}
                </div>
              </div>
              <div className="form-group border-b border-slate-50 pb-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Account Status</label>
                <div className="flex gap-2">
                  <span className="badge badge-green !rounded-lg font-black text-[10px]">ACTIVE</span>
                  <span className="badge badge-blue !rounded-lg font-black text-[10px] uppercase">{userData?.verificationStatus}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">Region</label>
                <div className="text-slate-500 text-xs font-bold flex items-center gap-1.5">
                  📍 {userData?.location?.lat.toFixed(4)}, {userData?.location?.lng.toFixed(4)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-8">
          {user.role === 'provider' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 ml-2">
                📦 Supply & Incoming Requests
              </h3>
              {Object.values(groupedRequests).length === 0 ? (
                <div className="empty-state !bg-white ring-1 ring-slate-100 py-20">
                  <span className="text-4xl mb-4 block">🥣</span>
                  <p className="text-slate-400 font-bold">No active requests found</p>
                </div>
              ) : (
                Object.values(groupedRequests).map(gr => (
                  <div key={gr.food._id} className="card ring-1 ring-slate-200 shadow-lg overflow-hidden !rounded-3xl p-0 border-none transition-all hover:ring-emerald-200">
                    <div className="p-6 md:p-8 bg-slate-50/50 flex justify-between items-center border-b border-slate-100">
                      <div>
                        <h4 className="text-xl font-black text-slate-800 tracking-tight mb-1">{gr.food.foodName}</h4>
                        <div className="flex gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <span>Qty: <strong className="text-slate-800">{gr.food.quantity}</strong></span>
                          <span>Status: <span className={`badge ${gr.food.status === 'available' ? 'badge-green' : 'badge-yellow'}`}>{gr.food.status}</span></span>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 space-y-4">
                      {gr.requests.map(r => (
                        <div key={r._id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-white ring-1 ring-slate-100 transition-shadow hover:shadow-md">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-base font-black text-slate-800 tracking-tight">{r.ngoId.name}</span>
                              <span className={`badge ${r.status === 'pending' ? 'badge-yellow' : r.status === 'accepted' ? 'badge-green' : 'badge-red'} !text-[9px]`}>{r.status}</span>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">Requested: <strong className="text-slate-700">{r.requestedAmount}</strong> | Granted: <strong className="text-emerald-600 font-black">{r.grantedAmount || 0}</strong></p>
                          </div>

                          {r.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => accept(r._id, gr.food._id)} className="btn-primary !px-5 !py-2.5 text-[10px] font-black shadow-none lowercase tracking-widest">Accept</button>
                              <button onClick={() => reject(r._id)} className="btn-secondary !text-rose-600 !border-rose-100 !px-5 !py-2.5 text-[10px] font-black lowercase tracking-widest">Reject</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {user.role === 'ngo' && (
            <div className="space-y-6">
              <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3 ml-2">
                📬 My Request History
              </h3>
              <div className="card shadow-lg ring-1 ring-slate-200 !rounded-3xl p-0 overflow-hidden border-none">
                <div className="overflow-x-auto">
                  <table className="data-table !m-0">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="!py-5 !px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Target Item</th>
                        <th className="!py-5 !px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Proposed</th>
                        <th className="!py-5 !px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Result</th>
                        <th className="!py-5 !px-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Response</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {requests.map(r => (
                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="!py-5 !px-6 border-none text-slate-800 font-bold">{r.foodId?.foodName || '—'}</td>
                          <td className="!py-5 !px-6 border-none text-xs font-mono">{r.requestedAmount} unt.</td>
                          <td className="!py-5 !px-6 border-none">
                            <span className={`badge ${r.status === 'accepted' ? 'badge-green' : r.status === 'pending' ? 'badge-yellow' : 'badge-red'} !rounded-lg !px-3 font-black text-[9px] uppercase`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="!py-5 !px-6 border-none text-xs font-black text-emerald-600">{r.grantedAmount || 0} units</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {requests.length === 0 && (
                    <div className="py-20 text-center">
                      <span className="text-4xl mb-2 block">📭</span>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No history found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
