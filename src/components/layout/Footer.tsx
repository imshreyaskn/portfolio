import { motion } from 'framer-motion';
import './Footer.css';

const Footer = ({ onOpenConnectModal }: { onOpenConnectModal: () => void }) => {
  return (
    <footer id="footer" className="footer-section">
      <div className="footer-animated-border" />
      <div className="footer-content">
        <div className="footer-links">
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
            onClick={onOpenConnectModal}
            className="footer-text-link footer-mail-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            mail
          </motion.button>

          <motion.a 
            href="https://drive.google.com/file/d/1xkwCVuQZmElNuCnR7d3vqgr9eqzklVi2/view?usp=sharing" 
            target="_blank" 
            rel="noopener noreferrer"
            className="footer-text-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            resume
          </motion.a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
