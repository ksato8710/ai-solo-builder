'use client';

import { useState, FormEvent } from 'react';

interface NewsletterFormProps {
  variant?: 'modal' | 'inline' | 'footer';
  onSuccess?: () => void;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterForm({ variant = 'inline', onSuccess }: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === 'loading') return;

    setState('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, _hp: honeypot }),
      });

      const data = await res.json();

      if (data.ok) {
        setState('success');
        setMessage(data.message);
        setEmail('');
        onSuccess?.();
      } else {
        setState('error');
        setMessage(data.message);
      }
    } catch {
      setState('error');
      setMessage('ネットワークエラーが発生しました。もう一度お試しください。');
    }
  }

  if (state === 'success') {
    return (
      <div className={`flex items-center gap-3 ${variant === 'footer' ? 'justify-center' : ''}`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/20">
          <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">{message}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">受信箱をご確認ください</p>
        </div>
      </div>
    );
  }

  const isCompact = variant === 'footer';

  return (
    <form onSubmit={handleSubmit} className={isCompact ? 'max-w-sm mx-auto' : ''}>
      {/* Honeypot field */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true" tabIndex={-1}>
        <input
          type="text"
          name="_hp"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className={`flex ${isCompact ? 'gap-2' : 'gap-3'} ${variant === 'modal' ? 'flex-col sm:flex-row' : ''}`}>
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === 'error') setState('idle');
          }}
          placeholder="メールアドレス"
          required
          className={`
            flex-1 px-4 py-2.5 rounded-lg
            bg-[var(--bg-primary)] border border-[var(--border-color)]
            text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
            text-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
            transition-all
            ${isCompact ? 'py-2 text-xs' : ''}
          `}
        />
        <button
          type="submit"
          disabled={state === 'loading'}
          className={`
            px-5 py-2.5 rounded-lg font-semibold text-white text-sm
            bg-gradient-to-r from-blue-500 to-violet-500
            hover:from-blue-600 hover:to-violet-600
            focus:outline-none focus:ring-2 focus:ring-blue-500/50
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-all whitespace-nowrap
            ${isCompact ? 'px-4 py-2 text-xs' : ''}
          `}
        >
          {state === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              送信中...
            </span>
          ) : (
            '無料で登録'
          )}
        </button>
      </div>

      {state === 'error' && message && (
        <p className="mt-2 text-xs text-red-400">{message}</p>
      )}
    </form>
  );
}
