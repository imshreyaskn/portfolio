import { motion } from 'framer-motion';
import { EASE_OUT, DUR } from '../../lib/motion';
import './Footer.css';

const Footer = ({ onOpenConnectModal }: { onOpenConnectModal: () => void }) => {
  return (
    <footer id="footer" className="footer-section">
      <div className="footer-animated-border" />
      <div className="footer-content">
        <motion.div
          className="footer-links"
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: DUR.reveal, ease: EASE_OUT }}
        >
          <motion.a 
            href="https://github.com/imshreyaskn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-text-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            github
          </motion.a>
          
          <motion.a 
            href="https://linkedin.com/in/imshreyaskn" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-text-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            linkedin
          </motion.a>

          <motion.button
            type="button"
            aria-haspopup="dialog"
            onClick={onOpenConnectModal}
            className="footer-text-link footer-mail-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            mail
          </motion.button>

          <motion.a 
            href="https://drive.google.com/file/d/1jZAk3dqG7K3nCe5UGeCSA_4Kwz26lsSM/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-text-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            resume
          </motion.a>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
