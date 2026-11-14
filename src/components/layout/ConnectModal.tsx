import { useState, useEffect, useRef, useId, useCallback, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EASE_OUT, EASE_IN, DUR } from '../../lib/motion';
import './ConnectModal.css';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECIPIENT = 'imshreyaskn@gmail.com';
// Web3Forms access keys are designed to be public (they only allow sending to
// the inbox they were issued for). The env var lets a deploy swap keys without
// a code change; the literal keeps local builds working without a .env file.
const WEB3FORMS_KEY: string =
  import.meta.env.VITE_WEB3FORMS_KEY ?? '3be71592-ae80-4ac0-bf6c-b4682d1b1d4f';
const REQUEST_TIMEOUT_MS = 12_000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = 'name' | 'email' | 'message';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([tabindex="-1"]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ConnectModal = ({ isOpen, onClose }: ConnectModalProps) => {
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [body, setBody] = useState('');
  const [botcheck, setBotcheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [invalid, setInvalid] = useState<Field | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Mirrors the fields so the scroll listener always sees current values
  // (the old effect captured the values from when the modal opened).
  const hasDraftRef = useRef(false);
  useEffect(() => {
    hasDraftRef.current = name.length > 0 || fromEmail.length > 0 || body.length > 0;
  }, [name, fromEmail, body]);

  const ids = useId();
  const titleId = `${ids}-title`;
  const errorId = `${ids}-error`;

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };
  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  // Unmount: never let a pending timer touch state.
  useEffect(() => clearTimers, []);

  // Open: remember what had focus, move focus into the dialog.
  // Close: drop pending timers, clear transient state, give focus back.
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      const t = setTimeout(() => firstFieldRef.current?.focus({ preventScroll: true }), 50);
      return () => clearTimeout(t);
    }
    clearTimers();
    setErrorMsg('');
    setInvalid(null);
    setIsSubmitting(false);
    if (isSuccess) {
      setName('');
      setFromEmail('');
      setBody('');
      setIsSuccess(false);
    }
    returnFocusRef.current?.focus?.({ preventScroll: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Scrolling away dismisses an empty form; a draft is never thrown away.
  // Only the user's own wheel/touch scroll outside the dialog counts. A plain
  // 'scroll' listener also fired for smooth-scrolls still settling when the
  // modal opened (e.g. after tabbing to the button) and closed it instantly.
  useEffect(() => {
    if (!isOpen) return;
    const handleIntent = (e: Event) => {
      if (hasDraftRef.current) return;
      if (dialogRef.current?.contains(e.target as Node)) return;
      onClose();
    };
    window.addEventListener('wheel', handleIntent, { passive: true });
    window.addEventListener('touchmove', handleIntent, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleIntent);
      window.removeEventListener('touchmove', handleIntent);
    };
  }, [isOpen, onClose]);

  // Escape closes; Tab stays inside the dialog.
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const nodes = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  const edit = (setter: (v: string) => void, field: Field) => (v: string) => {
    setter(v);
    if (invalid === field) setInvalid(null);
    if (errorMsg) setErrorMsg('');
  };

  const fail = (field: Field | null, msg: string) => {
    setInvalid(field);
    setErrorMsg(msg);
    if (field) dialogRef.current?.querySelector<HTMLElement>(`[data-field="${field}"]`)?.focus();
  };

  const finishSuccess = () => {
    setIsSuccess(true);
    later(onClose, 1800);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isSuccess) return;

    // Honeypot: bots tick the hidden box; pretend it worked.
    if (botcheck) {
      finishSuccess();
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = fromEmail.trim();
    const trimmedBody = body.trim();
    if (!trimmedName) return fail('name', 'Please add your name.');
    if (!EMAIL_RE.test(trimmedEmail)) return fail('email', 'That email address doesn’t look right.');
    if (trimmedBody.length < 2) return fail('message', 'Please write a short message.');

    setIsSubmitting(true);
    setErrorMsg('');
    setInvalid(null);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_KEY,
          name: trimmedName,
          email: trimmedEmail,
          from_name: 'Portfolio Contact Form',
          message: trimmedBody,
          subject: `Portfolio Inquiry from ${trimmedName}`,
        }),
        signal: controller.signal,
      });

      // An HTML error page would make .json() throw a cryptic SyntaxError.
      const result = (await response.json().catch(() => null)) as
        | { success?: boolean; message?: string }
        | null;
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `The message service returned ${response.status}.`);
      }
      finishSuccess();
    } catch (err: unknown) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      fail(
        null,
        aborted
          ? 'The request timed out. Please check your connection and try again.'
          : `Couldn’t send: ${err instanceof Error ? err.message : 'unknown error'} You can also email ${RECIPIENT} directly.`,
      );
    } finally {
      clearTimeout(timeout);
      setIsSubmitting(false);
    }
  };

  const buttonLabel = isSubmitting ? 'Sending' : isSuccess ? 'Sent — thank you' : 'Send';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="connect-modal-overlay" onClick={onClose}>
          <motion.div
            className="connect-modal-bg"
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, transition: { duration: 0.8, ease: EASE_OUT } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: DUR.slow, ease: EASE_IN, delay: 0.05 } }}
          />

          <motion.div
            ref={dialogRef}
            className="connect-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ scale: 0.96, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE_OUT, delay: 0.1 } }}
            exit={{ scale: 0.97, y: 8, opacity: 0, transition: { duration: DUR.fast, ease: EASE_IN } }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <button type="button" className="connect-modal-close" onClick={onClose} aria-label="Close contact form">
              <span aria-hidden="true">&times;</span>
            </button>

            <h2 id={titleId} className="connect-modal-title">let's connect</h2>

            <form onSubmit={handleSubmit} noValidate>
              <div className="connect-form-group">
                <span className="connect-label">To</span>
                <a className="connect-recipient" href={`mailto:${RECIPIENT}`}>
                  {RECIPIENT}
                </a>
              </div>

              {/* Honeypot for spam bots: invisible and skipped by keyboard and screen readers. */}
              <input
                type="checkbox"
                name="botcheck"
                className="connect-honeypot"
                tabIndex={-1}
                aria-hidden="true"
                autoComplete="off"
                checked={botcheck}
                onChange={(e) => setBotcheck(e.target.checked)}
              />

              <div className="connect-form-group">
                <label className="connect-label" htmlFor={`${ids}-name`}>Name</label>
                <input
                  ref={firstFieldRef}
                  id={`${ids}-name`}
                  data-field="name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  className="connect-input"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => edit(setName, 'name')(e.target.value)}
                  aria-invalid={invalid === 'name'}
                  aria-describedby={invalid === 'name' ? errorId : undefined}
                  disabled={isSuccess}
                />
              </div>

              <div className="connect-form-group">
                <label className="connect-label" htmlFor={`${ids}-email`}>From</label>
                <input
                  id={`${ids}-email`}
                  data-field="email"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  className="connect-input"
                  placeholder="you@example.com"
                  value={fromEmail}
                  onChange={(e) => edit(setFromEmail, 'email')(e.target.value)}
                  aria-invalid={invalid === 'email'}
                  aria-describedby={invalid === 'email' ? errorId : undefined}
                  disabled={isSuccess}
                />
              </div>

              <div className="connect-form-group">
                <label className="connect-label" htmlFor={`${ids}-message`}>Message</label>
                <textarea
                  id={`${ids}-message`}
                  data-field="message"
                  name="message"
                  className="connect-textarea"
                  placeholder="What would you like to talk about?"
                  value={body}
                  onChange={(e) => edit(setBody, 'message')(e.target.value)}
                  onKeyDown={(e) => {
                    // Ctrl/Cmd + Enter sends from the message box.
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                  aria-invalid={invalid === 'message'}
                  aria-describedby={invalid === 'message' ? errorId : undefined}
                  disabled={isSuccess}
                />
              </div>

              <AnimatePresence initial={false}>
                {errorMsg && (
                  <motion.p
                    key="error"
                    id={errorId}
                    className="connect-error-msg"
                    role="alert"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: DUR.fast, ease: EASE_OUT } }}
                    exit={{ opacity: 0, transition: { duration: DUR.instant } }}
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>

              <div className="connect-actions">
                <button
                  type="submit"
                  className={`connect-btn connect-btn-primary${isSubmitting ? ' submitting' : ''}${isSuccess ? ' success' : ''}`}
                  disabled={isSubmitting || isSuccess}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting && <span className="connect-spinner" aria-hidden="true" />}
                  {isSuccess && <span className="connect-check" aria-hidden="true" />}
                  <span>{buttonLabel}</span>
                </button>
              </div>
              <p className="sr-only" aria-live="polite">
                {isSuccess ? 'Message sent. Thank you.' : ''}
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
