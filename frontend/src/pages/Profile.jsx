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

  // mahbub will work later

  //mahbub will work later

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

        //mahbub will work later
      </div>
    </div>
  )
}
