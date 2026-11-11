'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, WarningCircle, Info, X, Warning } from '@phosphor-icons/react';

// ==============================================================================
// TYPES
// ==============================================================================

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  id?: string;
  message: string;
  title?: string;
  type?: NotificationType;
  durationMs?: number;
}

export interface BannerOptions {
  id?: string;
  message: string;
  title?: string;
  type?: NotificationType;
  dismissible?: boolean;
}

export interface ModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'info';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface InkWellContextType {
  toast: (options: string | ToastOptions) => void;
  banner: (options: string | BannerOptions) => void;
  dismissBanner: (id?: string) => void;
  modal: (options: ModalOptions) => void;
  inline: (field: string, error: string | null) => void;
  getInlineError: (field: string) => string | null;
  clearInlineErrors: () => void;
}

const InkWellContext = createContext<InkWellContextType | null>(null);

// ==============================================================================
// INKWELL PROVIDER COMPONENT
// ==============================================================================

export function InkWellProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Required<ToastOptions>[]>([]);
  const [banners, setBanners] = useState<Required<BannerOptions>[]>([]);
  const [modalState, setModalState] = useState<ModalOptions | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [inlineErrors, setInlineErrors] = useState<Record<string, string>>({});

  // ----------------------------------------------------------------------------
  // TOAST DISPATCHER
  // ----------------------------------------------------------------------------
  const toast = useCallback((options: string | ToastOptions) => {
    const opts: Required<ToastOptions> = typeof options === 'string'
      ? {
          id: Math.random().toString(36).slice(2, 9),
          message: options,
          title: '',
          type: 'info',
          durationMs: 3500,
        }
      : {
          id: options.id || Math.random().toString(36).slice(2, 9),
          message: options.message,
          title: options.title || '',
          type: options.type || 'info',
          durationMs: options.durationMs ?? 3500,
        };

    setToasts((prev) => [...prev.filter((t) => t.id !== opts.id), opts]);

    if (opts.durationMs > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== opts.id));
      }, opts.durationMs);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ----------------------------------------------------------------------------
  // BANNER DISPATCHER
  // ----------------------------------------------------------------------------
  const banner = useCallback((options: string | BannerOptions) => {
    const opts: Required<BannerOptions> = typeof options === 'string'
      ? {
          id: 'global-banner',
          message: options,
          title: '',
          type: 'info',
          dismissible: true,
        }
      : {
          id: options.id || 'global-banner',
          message: options.message,
          title: options.title || '',
          type: options.type || 'info',
          dismissible: options.dismissible ?? true,
        };

    setBanners((prev) => [...prev.filter((b) => b.id !== opts.id), opts]);
  }, []);

  const dismissBanner = useCallback((id?: string) => {
    if (id) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
    } else {
      setBanners([]);
    }
  }, []);

  // ----------------------------------------------------------------------------
  // MODAL DISPATCHER
  // ----------------------------------------------------------------------------
  const modal = useCallback((options: ModalOptions) => {
    setModalState(options);
    setModalLoading(false);
  }, []);

  const closeModal = useCallback(() => {
    if (modalState?.onCancel) modalState.onCancel();
    setModalState(null);
  }, [modalState]);

  const confirmModal = async () => {
    if (!modalState) return;
    try {
      setModalLoading(true);
      await modalState.onConfirm();
      setModalState(null);
    } catch (err) {
      console.error('Modal action failed:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // ----------------------------------------------------------------------------
  // INLINE FORM VALIDATION ERRORS
  // ----------------------------------------------------------------------------
  const inline = useCallback((field: string, error: string | null) => {
    setInlineErrors((prev) => {
      if (!error) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  const getInlineError = useCallback(
    (field: string) => inlineErrors[field] || null,
    [inlineErrors]
  );

  const clearInlineErrors = useCallback(() => {
    setInlineErrors({});
  }, []);

  return (
    <InkWellContext.Provider
      value={{
        toast,
        banner,
        dismissBanner,
        modal,
        inline,
        getInlineError,
        clearInlineErrors,
      }}
    >
      {/* 1. Top Banners */}
      {banners.length > 0 && (
        <div style={{ width: '100%', position: 'sticky', top: 0, zIndex: 9999 }}>
          {banners.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 1.25rem',
                backgroundColor:
                  b.type === 'error'
                    ? 'rgba(184, 0, 0, 0.95)'
                    : b.type === 'warning'
                    ? '#b45309'
                    : 'var(--foreground)',
                color: '#ffffff',
                fontFamily: 'var(--font-primary)',
                fontSize: '0.82rem',
                borderBottom: '1px solid var(--min-borders)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Warning size={16} weight="fill" />
                <span>
                  {b.title && <strong>{b.title}: </strong>}
                  {b.message}
                </span>
              </div>
              {b.dismissible && (
                <button
                  type="button"
                  onClick={() => dismissBanner(b.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                  }}
                  title="Dismiss banner"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      {children}

      {/* 2. Floating Toasts Container (Bottom-Right) */}
      <aside
        aria-label="Notifications"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          zIndex: 10000,
          pointerEvents: 'none',
          maxWidth: '380px',
          width: 'calc(100% - 3rem)',
        }}
      >
        {toasts.map((t) => {
          const accentColor =
            t.type === 'success'
              ? '#16a34a'
              : t.type === 'error'
              ? 'var(--logsig-input-focus, #b80000)'
              : t.type === 'warning'
              ? '#d97706'
              : 'var(--foreground)';

          return (
            <div
              key={t.id}
              role="alert"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--card-bg, #ffffff)',
                color: 'var(--foreground, #111111)',
                border: '1px solid var(--min-borders, #cccccc)',
                borderLeft: `4px solid ${accentColor}`,
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                fontFamily: 'var(--font-primary)',
                fontSize: '0.84rem',
                lineHeight: 1.4,
                animation: 'slideInRight 0.25s ease-out forwards',
              }}
            >
              <div style={{ color: accentColor, marginTop: '2px', flexShrink: 0 }}>
                {t.type === 'success' && <CheckCircle size={18} weight="fill" />}
                {t.type === 'error' && <WarningCircle size={18} weight="fill" />}
                {t.type === 'warning' && <Warning size={18} weight="fill" />}
                {t.type === 'info' && <Info size={18} weight="fill" />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {t.title && (
                  <div style={{ fontWeight: 700, marginBottom: '2px', fontSize: '0.85rem' }}>
                    {t.title}
                  </div>
                )}
                <div>{t.message}</div>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--task-editor-text-muted, #71717a)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  marginLeft: '0.25rem',
                  flexShrink: 0,
                }}
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </aside>

      {/* 3. Confirmation Dialog / Modal */}
      {modalState && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            padding: '1rem',
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: 'var(--card-bg, #ffffff)',
              color: 'var(--foreground, #111111)',
              border: '1px solid var(--min-borders, #cccccc)',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
              fontFamily: 'var(--font-primary)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontFamily: 'var(--font-reading), serif',
                fontSize: '1.25rem',
                margin: '0 0 0.65rem 0',
                fontWeight: 700,
                color: 'var(--foreground)',
              }}
            >
              {modalState.title}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--task-editor-text-light, #555555)',
                lineHeight: 1.55,
                margin: '0 0 1.5rem 0',
              }}
            >
              {modalState.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={closeModal}
                disabled={modalLoading}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid var(--min-borders)',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                }}
              >
                {modalState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal}
                disabled={modalLoading}
                style={{
                  padding: '0.5rem 1.15rem',
                  border: 'none',
                  backgroundColor:
                    modalState.type === 'danger'
                      ? 'var(--logsig-button-bg, #b80000)'
                      : 'var(--foreground, #111111)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  opacity: modalLoading ? 0.6 : 1,
                }}
              >
                {modalLoading ? 'Processing...' : modalState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </InkWellContext.Provider>
  );
}

// ==============================================================================
// HOOK
// ==============================================================================

export function useInkWell() {
  const context = useContext(InkWellContext);
  if (!context) {
    throw new Error('useInkWell must be used within an <InkWellProvider>');
  }
  return context;
}

export default InkWellProvider;
