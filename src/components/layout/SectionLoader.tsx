import { motion } from 'framer-motion';
import './SectionLoader.css';

interface SectionLoaderProps {
  label?: string;
}

const SectionLoader = ({ label = "INITIALIZING COSMIC SYSTEM" }: SectionLoaderProps) => {
  return (
    <motion.div 
      className="section-loader-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="section-loader-diamond">
        ✦
      </div>
      <div className="section-loader-text silver-glow-text">
        {label}
      </div>
    </motion.div>
  );
};

export default SectionLoader;
