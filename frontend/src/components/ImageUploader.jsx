import React, { useState, useRef, useCallback, useEffect } from 'react'

const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY

/**
 * ImageUploader – drag-and-drop + click-to-browse multi-image uploader using ImgBB.
 * Props:
 *   label    string  – section label
 *   maxFiles number  – max images allowed (default 5)
 *   onUpload fn      – called with array of all successfully uploaded URLs
 */
export default function ImageUploader({ label = 'Upload Images', maxFiles = 5, onUpload }) {
    const [files, setFiles] = useState([])   // { file, preview, status, url, error }
    const [dragging, setDragging] = useState(false)
    const inputRef = useRef()

    // Notify parent whenever files change — done via useEffect to avoid setState-during-render
    useEffect(() => {
        const urls = files.filter(f => f.status === 'done').map(f => f.url)
        onUpload && onUpload(urls)
    }, [files]) // eslint-disable-line react-hooks/exhaustive-deps

    const uploadToImgBB = async (file) => {
        const formData = new FormData()
        formData.append('image', file)
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
            method: 'POST',
            body: formData
        })
        const data = await res.json()
        if (!data.success) throw new Error(data.error?.message || 'Upload failed')
        return data.data.url
    }

    const processFiles = useCallback(async (newFiles) => {
        const allowed = Array.from(newFiles)
            .filter(f => f.type.startsWith('image/'))
            .slice(0, maxFiles - files.length)

        if (!allowed.length) return

        const entries = allowed.map(f => ({
            file: f,
            preview: URL.createObjectURL(f),
            status: 'uploading',
            url: null,
            error: null
        }))

        setFiles(prev => [...prev, ...entries])

        const results = await Promise.allSettled(entries.map(e => uploadToImgBB(e.file)))

        setFiles(prev => {
            const updated = [...prev]
            results.forEach((r, i) => {
                const idx = updated.length - entries.length + i
                if (r.status === 'fulfilled') {
                    updated[idx] = { ...updated[idx], status: 'done', url: r.value }
                } else {
                    updated[idx] = { ...updated[idx], status: 'error', error: r.reason?.message || 'Failed' }
                }
            })
            return updated
        })
    }, [files, maxFiles])

    const removeFile = (idx) => {
        setFiles(prev => prev.filter((_, i) => i !== idx))
    }

    const onDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        processFiles(e.dataTransfer.files)
    }

    const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const onDragLeave = () => setDragging(false)

    const onInputChange = (e) => {
        processFiles(e.target.files)
        e.target.value = ''
    }

    return (
        <div className="image-uploader">
            {label && <label className="uploader-label">{label}</label>}

            {/* Drop zone */}
            <div
                className={`drop-zone ${dragging ? 'drag-over' : ''} ${files.length >= maxFiles ? 'disabled' : ''}`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => files.length < maxFiles && inputRef.current.click()}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && inputRef.current.click()}
            >
                <div className="drop-zone-content">
                    <div className='flex items-center justify-center'><img className='p-2 w-20 rounded-xl' src="https://i.ibb.co.com/QVxSqpk/upload.jpg" alt="upload" border="0" /></div>
                    {files.length >= maxFiles
                        ? <p>Maximum {maxFiles} images reached</p>
                        : <>
                            <p className="drop-primary">Drag &amp; drop images here</p>
                            <p className="drop-secondary">or <span className="browse-link">browse files</span></p>
                            <p className="drop-hint">PNG, JPG, WEBP · Max {maxFiles} images</p>
                        </>
                    }
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={onInputChange}
                />
            </div>

            {/* Preview grid */}
            {files.length > 0 && (
                <div className="preview-grid">
                    {files.map((f, i) => (
                        <div key={i} className={`preview-item status-${f.status}`}>
                            <img src={f.preview} alt={`doc-${i}`} className="preview-img" />
                            <div className="preview-overlay">
                                {f.status === 'uploading' && (
                                    <div className="upload-spinner">
                                        <svg viewBox="0 0 24 24" className="spin" fill="none" stroke="white" strokeWidth="3">
                                            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                                            <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                )}
                                {f.status === 'done' && <div className="status-badge success">✓</div>}
                                {f.status === 'error' && <div className="status-badge error" title={f.error}>✕</div>}
                                {f.status !== 'uploading' && (
                                    <button
                                        className="remove-btn"
                                        onClick={e => { e.stopPropagation(); removeFile(i) }}
                                    >×</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
