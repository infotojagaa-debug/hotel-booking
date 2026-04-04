import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

/* ─── Toast Context ──────────────────────────────────────── */
const ToastContext = createContext();

let toastId = 0;

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                right: '24px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                pointerEvents: 'none',
            }}>
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        onClick={() => dismiss(toast.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: toast.type === 'removed'
                                ? 'linear-gradient(135deg, #1e293b, #0f172a)'
                                : 'linear-gradient(135deg, #e91e63, #c2185b)',
                            color: '#fff',
                            padding: '14px 20px',
                            borderRadius: '14px',
                            boxShadow: toast.type === 'removed'
                                ? '0 8px 32px rgba(0,0,0,0.35)'
                                : '0 8px 32px rgba(233,30,99,0.4)',
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            fontFamily: 'Inter, sans-serif',
                            minWidth: '240px',
                            maxWidth: '340px',
                            pointerEvents: 'all',
                            cursor: 'pointer',
                            animation: 'toastSlideIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            letterSpacing: '0.01em',
                        }}
                    >
                        {/* Icon */}
                        <span style={{
                            fontSize: '1.3rem',
                            lineHeight: 1,
                            flexShrink: 0,
                            filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.3))',
                        }}>
                            {toast.type === 'removed' ? '💔' : '❤️'}
                        </span>
                        <span style={{ flex: 1 }}>{toast.message}</span>
                        {/* X button */}
                        <span style={{
                            marginLeft: 8,
                            opacity: 0.6,
                            fontSize: '0.8rem',
                            flexShrink: 0,
                        }}>✕</span>
                    </div>
                ))}
            </div>

            {/* Animation keyframes injected once */}
            <style>{`
                @keyframes toastSlideIn {
                    from { opacity: 0; transform: translateX(60px) scale(0.9); }
                    to   { opacity: 1; transform: translateX(0)  scale(1); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
