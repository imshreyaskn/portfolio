import React, { useState } from 'react';
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

  const getFormattedBody = () => {
    return `Name: ${name}\nEmail: ${fromEmail}\n\nMessage:\n${body}`;
  };

  const handleSendMailApp = () => {
    const mailtoLink = `mailto:imshreyaskn@gmail.com?subject=Portfolio Inquiry&body=${encodeURIComponent(getFormattedBody())}`;
    window.location.href = mailtoLink;
    onClose();
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

            <div className="connect-actions">
              <button className="connect-btn connect-btn-primary" onClick={handleSendMailApp}>
                Send
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
