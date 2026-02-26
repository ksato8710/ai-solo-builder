'use client';

import { useEffect, useRef, useCallback } from 'react';
import NewsletterForm from './NewsletterForm';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewsletterModal({ isOpen, onClose }: NewsletterModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus trap
      contentRef.current?.focus();
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-text-deep/40 backdrop-blur-sm newsletter-modal-overlay"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        role="dialog"
        aria-modal="true"
        aria-label="ニュースレター登録"
        tabIndex={-1}
        className="relative w-full max-w-md bg-bg-card rounded-[var(--radius-card)] border border-border shadow-2xl newsletter-modal-content focus:outline-none"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-text-light hover:text-text-deep hover:bg-bg-warm transition-colors"
          aria-label="閉じる"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 sm:p-8">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-accent-leaf/20 via-accent-bark/15 to-accent-moss/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-leaf" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="font-heading text-xl font-bold text-text-deep text-center mb-2">
            AIニュースを毎朝お届け
          </h2>
          <p className="text-sm text-text-muted text-center mb-6">
            グローバルのAI最新情報を、毎朝 8:15 にメールで。
          </p>

          {/* Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-leaf/15 text-accent-leaf">
              無料
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-leaf/15 text-accent-leaf">
              毎朝 8:15 配信
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent-bark/15 text-accent-bark">
              解除はいつでも
            </span>
          </div>

          {/* Form */}
          <NewsletterForm variant="modal" onSuccess={() => {}} />
        </div>
      </div>
    </div>
  );
}
