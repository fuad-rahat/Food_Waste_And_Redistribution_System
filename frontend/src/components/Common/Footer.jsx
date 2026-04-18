import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
    return (
        <footer className="bg-slate-900 text-slate-400">

            {/* Main footer grid */}
            <div className="max-w-6xl mx-auto px-6 pt-16 pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <Link to="/" className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M3 12H4m16 0h1M4.22 19.778l.707-.707M18.364 5.636l.707-.707" />
                                    <circle cx="12" cy="12" r="4" />
                                </svg>
                            </div>
                            <span className="text-white font-extrabold text-lg tracking-tight">FoodShareBd</span>
                        </Link>
                        <p className="text-sm leading-relaxed mb-5">
                            Connecting surplus food with communities in need across Bangladesh.
                        </p>
                        <div className="flex gap-3">
                            {/* Facebook */}
                            <a href="#" aria-label="Facebook" className="w-8 h-8 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                                </svg>
                            </a>
                            {/* Twitter */}
                            <a href="#" aria-label="Twitter" className="w-8 h-8 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                                </svg>
                            </a>
                            {/* LinkedIn */}
                            <a href="#" aria-label="LinkedIn" className="w-8 h-8 bg-slate-800 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4 text-slate-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                                    <circle cx="4" cy="4" r="2" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            {[
                                { label: 'Browse Food', to: '/foods' },
                                { label: 'Post Surplus', to: '/register' },
                                { label: 'NGO Dashboard', to: '/login' },
                                { label: 'Live Map', to: '/#food-section' },
                            ].map(l => (
                                <li key={l.label}>
                                    <Link to={l.to} className="hover:text-emerald-400 transition-colors">{l.label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Organization */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Organization</h4>
                        <ul className="space-y-3 text-sm">
                            {['About Us', 'Our Mission', 'Impact Report', 'Press Kit', 'Careers'].map(l => (
                                <li key={l}><a href="#" className="hover:text-emerald-400 transition-colors">{l}</a></li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Dhaka, Bangladesh</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span>hello@foodsharebd.org</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="w-4 h-4 mt-0.5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span>+8801754677999</span>
                            </li>
                        </ul>
                    </div>

                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-slate-800">
                <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p>© {new Date().getFullYear()} FoodShare Bangladesh. All rights reserved.</p>
                    <div className="flex gap-5">
                        <a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-emerald-400 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-emerald-400 transition-colors">Cookie Policy</a>
                    </div>
                </div>
            </div>

        </footer>
    )
}
