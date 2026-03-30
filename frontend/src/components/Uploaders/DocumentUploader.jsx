import React, { useState, useRef, useCallback, useEffect } from 'react'
import * as pdfjsLib from 'pdfjs-dist'

import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

export default function DocumentUploader({ label = 'Upload Documents', maxFiles = 5, onUpload }) {
    // Each entry: { id, name, type:'image'|'pdf', pageCount, previews:[], statuses:[], urls:[], errors:[] }
    const [entries, setEntries] = useState([])
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()

    // Notify parent whenever entries change
    useEffect(() => {
        const allUrls = entries.flatMap(e => e.urls.filter(Boolean))
        onUpload && onUpload(allUrls)
    }, [entries]) // eslint-disable-line

    // ── ImgBB upload helper ────────────────────────────────────────────────────
    const uploadBlobToImgBB = async (blob, filename = 'page.png') => {
        const formData = new FormData()
        formData.append('image', blob, filename)
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData,
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error?.message || 'Upload failed')
        return data.data.url
    }

    // ── PDF → images pipeline ──────────────────────────────────────────────────
    const processPdf = useCallback(async (file, entryId) => {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const pageCount = pdf.numPages

        // Initialise the entry with placeholders for each page
        setEntries(prev => prev.map(e =>
            e.id !== entryId ? e : {
                ...e,
                pageCount,
                previews: Array(pageCount).fill(null),
                statuses: Array(pageCount).fill('rendering'),
                urls: Array(pageCount).fill(null),
                errors: Array(pageCount).fill(null),
            }
        ))

        // Render pages one-by-one (sequential to avoid memory spikes)
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            const i = pageNum - 1
            try {
                const page = await pdf.getPage(pageNum)
                const viewport = page.getViewport({ scale: 1.5 })
                const canvas = document.createElement('canvas')
                canvas.width = viewport.width
                canvas.height = viewport.height
                await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise

                // Preview data URL for thumbnail
                const previewDataUrl = canvas.toDataURL('image/png')

                // Upload blob to ImgBB
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
                const url = await uploadBlobToImgBB(blob, `${file.name.replace('.pdf', '')}_page${pageNum}.png`)

                setEntries(prev => prev.map(e => {
                    if (e.id !== entryId) return e
                    const previews = [...e.previews]; previews[i] = previewDataUrl
                    const statuses = [...e.statuses]; statuses[i] = 'done'
                    const urls = [...e.urls]; urls[i] = url
                    return { ...e, previews, statuses, urls }
                }))
            } catch (err) {
                setEntries(prev => prev.map(e => {
                    if (e.id !== entryId) return e
                    const statuses = [...e.statuses]; statuses[i] = 'error'
                    const errors = [...e.errors]; errors[i] = err.message || 'Failed'
                    return { ...e, statuses, errors }
                }))
            }
        }
    }, [])

    // ── Image upload pipeline (one file) ──────────────────────────────────────
    const processImage = useCallback(async (file, entryId) => {
        const preview = URL.createObjectURL(file)
        setEntries(prev => prev.map(e =>
            e.id !== entryId ? e : { ...e, previews: [preview], statuses: ['uploading'], urls: [null], errors: [null] }
        ))
        try {
            const blob = await fetch(preview).then(r => r.blob())
            const url = await uploadBlobToImgBB(blob, file.name)
            setEntries(prev => prev.map(e =>
                e.id !== entryId ? e : { ...e, statuses: ['done'], urls: [url] }
            ))
        } catch (err) {
            setEntries(prev => prev.map(e =>
                e.id !== entryId ? e : { ...e, statuses: ['error'], errors: [err.message || 'Failed'] }
            ))
        }
    }, [])

    // ── File intake ────────────────────────────────────────────────────────────
    const processFiles = useCallback((fileList) => {
        const incoming = Array.from(fileList)
            .filter(f => f.type.startsWith('image/') || f.type === 'application/pdf')
            .slice(0, maxFiles - entries.length)

        if (!incoming.length) return

        const newEntries = incoming.map(f => ({
            id: `${Date.now()}-${Math.random()}`,
            name: f.name,
            type: f.type === 'application/pdf' ? 'pdf' : 'image',
            pageCount: 0,
            previews: [],
            statuses: ['pending'],
            urls: [],
            errors: [],
        }))

        setEntries(prev => [...prev, ...newEntries])

        // Start uploads
        newEntries.forEach((entry, i) => {
            const file = incoming[i]
            if (entry.type === 'pdf') processPdf(file, entry.id)
            else processImage(file, entry.id)
        })
    }, [entries, maxFiles, processPdf, processImage])

    const removeEntry = (id) => setEntries(prev => prev.filter(e => e.id !== id))

    const onDrop = (e) => { e.preventDefault(); setDragging(false); processFiles(e.dataTransfer.files) }
    const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = () => setDragging(false)
    const onInputChange = (e) => { processFiles(e.target.files); e.target.value = '' }

    const totalPages = entries.reduce((sum, e) => sum + Math.max(1, e.pageCount), 0)
    const isFull = entries.length >= maxFiles

    return (
        <div className="flex flex-col gap-4">
            {label && <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>}

            {/* ── Drop zone ───────────────────────────────────────────────────── */}
            <div
                onClick={() => !isFull && inputRef.current.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && !isFull && inputRef.current.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed py-10 px-6 text-center transition-all cursor-pointer select-none
          ${dragging ? 'border-emerald-400 bg-emerald-50/60' : 'border-slate-200 bg-slate-50/50 hover:border-emerald-300 hover:bg-emerald-50/30'}
          ${isFull ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
                {/* Upload image icon */}
                <div className="flex items-center justify-center">
                    <img className="w-48 rounded-xl object-contain" src="https://i.ibb.co.com/QVxSqpk/upload.jpg" alt="upload" />
                </div>

                {isFull ? (
                    <p className="text-sm font-bold text-slate-400">Maximum {maxFiles} files reached</p>
                ) : (
                    <>
                        <p className="text-sm font-black text-slate-600">Drag &amp; drop files here</p>
                        <p className="text-xs text-slate-400 font-medium">
                            or <span className="text-emerald-600 font-bold underline underline-offset-2">browse files</span>
                        </p>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                                🖼 Images (PNG · JPG · WEBP)
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">
                                📄 PDF Documents
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-bold">Max {maxFiles} files</p>
                    </>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    multiple
                    className="hidden"
                    onChange={onInputChange}
                />
            </div>

            {/* ── File entries ────────────────────────────────────────────────── */}
            {entries.length > 0 && (
                <div className="flex flex-col gap-3">
                    {entries.map(entry => (
                        <div
                            key={entry.id}
                            className="bg-white rounded-2xl border border-slate-100 ring-1 ring-slate-100 shadow-sm overflow-hidden"
                        >
                            {/* Entry header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-base flex-shrink-0">{entry.type === 'pdf' ? '📄' : '🖼'}</span>
                                    <span className="text-xs font-bold text-slate-700 truncate">{entry.name}</span>
                                    {entry.type === 'pdf' && entry.pageCount > 0 && (
                                        <span className="text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">
                                            {entry.pageCount} page{entry.pageCount > 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeEntry(entry.id)}
                                    className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 text-slate-400 text-sm font-black transition-all"
                                >
                                    ×
                                </button>
                            </div>

                            {/* Page thumbnails */}
                            {entry.previews.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 p-3">
                                    {entry.previews.map((preview, i) => (
                                        <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                                            {preview && (
                                                <img src={preview} alt={`page-${i + 1}`} className="w-full h-full object-cover" />
                                            )}
                                            {/* Status overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                {(entry.statuses[i] === 'rendering' || entry.statuses[i] === 'uploading') && (
                                                    <div className="bg-black/40 rounded-full p-1">
                                                        <svg className="w-5 h-5 text-white animate-spin" viewBox="0 0 24 24" fill="none">
                                                            <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.25" strokeWidth="3" />
                                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                                                        </svg>
                                                    </div>
                                                )}
                                                {entry.statuses[i] === 'done' && (
                                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow">✓</div>
                                                )}
                                                {entry.statuses[i] === 'error' && (
                                                    <div className="absolute bottom-1 right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-white text-[10px] font-black shadow" title={entry.errors[i]}>✕</div>
                                                )}
                                            </div>
                                            {/* PDF page number */}
                                            {entry.type === 'pdf' && (
                                                <span className="absolute top-1 left-1 text-[9px] font-black bg-black/50 text-white px-1 rounded">
                                                    p{i + 1}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pending state (before any preview is available) */}
                            {entry.previews.length === 0 && (
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <svg className="w-5 h-5 text-emerald-500 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    <span className="text-xs font-bold text-slate-400">
                                        {entry.type === 'pdf' ? 'Reading PDF…' : 'Uploading…'}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ── Summary badge ────────────────────────────────────────────────── */}
            {entries.length > 0 && (
                <div className="text-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {entries.flatMap(e => e.urls.filter(Boolean)).length} / {totalPages} page{totalPages !== 1 ? 's' : ''} uploaded
                </div>
            )}
        </div>
    )
}
