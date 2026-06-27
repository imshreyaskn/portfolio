import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ConnectModal.css';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const handleSendMailApp = () => {
    const mailtoLink = `mailto:imshreyaskn@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
    onClose();
  };

  const handleSendGmail = () => {
    const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=imshreyaskn@gmail.com&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailLink, '_blank');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="connect-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="connect-modal"
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
              <label>Subject</label>
              <input 
                type="text" 
                className="connect-input" 
                placeholder="What's this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
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
              <button className="connect-btn" onClick={handleSendMailApp}>
                Mail App
              </button>
              <button className="connect-btn connect-btn-primary" onClick={handleSendGmail}>
                Gmail Web
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConnectModal;
