import React, { createContext, useContext, useState, useCallback } from 'react';

const ModalContext = createContext();

export const useModal = () => useContext(ModalContext);

export const ModalProvider = ({ children }) => {
    const [modalConfig, setModalConfig] = useState(null);

    const showAlert = useCallback((title, message) => {
        return new Promise((resolve) => {
            setModalConfig({
                type: 'alert',
                title,
                message,
                onClose: () => {
                    setModalConfig(null);
                    resolve();
                },
            });
        });
    }, []);

    const showConfirm = useCallback((title, message) => {
        return new Promise((resolve) => {
            setModalConfig({
                type: 'confirm',
                title,
                message,
                onConfirm: () => {
                    setModalConfig(null);
                    resolve(true);
                },
                onCancel: () => {
                    setModalConfig(null);
                    resolve(false);
                },
            });
        });
    }, []);

    const showPrompt = useCallback((title, message, defaultValue = '') => {
        return new Promise((resolve) => {
            setModalConfig({
                type: 'prompt',
                title,
                message,
                defaultValue,
                onConfirm: (value) => {
                    setModalConfig(null);
                    resolve(value);
                },
                onCancel: () => {
                    setModalConfig(null);
                    resolve(null);
                },
            });
        });
    }, []);

    return (
        <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
            {children}
            {modalConfig && <ModalComponent config={modalConfig} />}
        </ModalContext.Provider>
    );
};

// Internal component to render the modal
import { createPortal } from 'react-dom';

const ModalComponent = ({ config }) => {
    const [promptValue, setPromptValue] = useState(config.defaultValue || '');

    const handleConfirm = () => {
        if (config.type === 'prompt') {
            config.onConfirm(promptValue);
        } else if (config.onConfirm) {
            config.onConfirm();
        } else if (config.onClose) {
            config.onClose();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] animate-fadeIn">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scaleIn ring-1 ring-slate-200">
                <div className="p-8">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-3">
                        {config.title}
                    </h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">
                        {config.message}
                    </p>

                    {config.type === 'prompt' && (
                        <div className="mb-8">
                            <input
                                autoFocus
                                type="text"
                                className="form-input !py-4 text-center font-bold text-lg"
                                value={promptValue}
                                onChange={(e) => setPromptValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                            />
                        </div>
                    )}

                    <div className="flex gap-3 justify-end items-center">
                        {(config.type === 'confirm' || config.type === 'prompt') && (
                            <button
                                onClick={config.onCancel}
                                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs"
                            >
                                Cancel
                            </button>
                        )}

                        <button
                            onClick={handleConfirm || config.onClose}
                            className={`px-8 py-3 rounded-xl font-black transition-all active:scale-95 shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs ${config.type === 'alert' || config.onConfirm
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                                }`}
                        >
                            {config.type === 'alert' ? 'Got it' : config.type === 'confirm' ? 'Confirm' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
