import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConnectModal.css';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    // Close the modal when the window scrolls
    const handleScroll = () => {
      onClose();
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async () => {
    if (!name || !fromEmail || !body) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const accessKey = import.meta.env.VITE_WEB3FORMS_KEY;
      if (!accessKey) {
        throw new Error("API key is missing. Please add VITE_WEB3FORMS_KEY to your .env file.");
      }

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          name: name,
          email: fromEmail,
          message: body,
          subject: "Portfolio Inquiry from " + name,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setTimeout(() => {
            setName('');
            setFromEmail('');
            setBody('');
            setIsSuccess(false);
          }, 500);
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to send email");
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="connect-modal-overlay" onClick={onClose}>
          {/* Spreading black background */}
          <motion.div
            className="connect-modal-bg"
            initial={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
            animate={{ clipPath: 'circle(150% at 50% 50%)', opacity: 1 }}
            exit={{ clipPath: 'circle(0% at 50% 50%)', opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.div
            className="connect-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="connect-modal-close" onClick={onClose} aria-label="Close modal">
              &times;
            </button>
            
            <h2 className="connect-modal-title">let's connect</h2>
            
            <div className="connect-form-group">
              <label>To</label>
              <input 
                type="text" 
                className="connect-input" 
                value="imshreyaskn@gmail.com" 
                disabled 
              />
            </div>

            <div className="connect-form-group">
              <label>Name</label>
              <input 
                type="text" 
                className="connect-input" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="connect-form-group">
              <label>From</label>
              <input 
                type="email" 
                className="connect-input" 
                placeholder="john@example.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
            </div>

            <div className="connect-form-group">
              <label>Message</label>
              <textarea 
                className="connect-textarea" 
                placeholder="Write your message here..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </div>

            {errorMsg && <p style={{ color: '#ff4444', fontSize: '13px', marginTop: '-10px', marginBottom: '15px' }}>{errorMsg}</p>}
            
            <div className="connect-actions">
              <button 
                className="connect-btn connect-btn-primary" 
                onClick={handleSubmit}
                disabled={isSubmitting || isSuccess}
                style={{ 
                  opacity: (isSubmitting || isSuccess) ? 0.7 : 1, 
                  cursor: (isSubmitting || isSuccess) ? 'not-allowed' : 'pointer',
                  backgroundColor: isSuccess ? 'rgba(76, 175, 80, 0.2)' : undefined,
                  borderColor: isSuccess ? 'rgba(76, 175, 80, 0.5)' : undefined,
                  color: isSuccess ? '#4caf50' : undefined
                }}
              >
                {isSubmitting ? 'Sending...' : isSuccess ? 'Sent Successfully!' : 'Send'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
