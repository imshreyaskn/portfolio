import { motion } from 'framer-motion';
import './Footer.css';

const Footer = () => {
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

          <motion.a 
            href="mailto:imshreyaskn@gmail.com" 
            className="footer-text-link"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            mail
          </motion.a>

          <motion.a 
            href="/resume.pdf" 
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
