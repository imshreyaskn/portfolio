import { motion } from 'framer-motion';
import './Hero.css';

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    }
  }
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
};

const Hero = ({ onOpenConnectModal }: { onOpenConnectModal: () => void }) => {

  return (
    <section id="home" className="hero-section">
      
      {/* Right Image (Absolute to touch the right screen edge) */}
      <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)', x: 50 }}
        animate={{ opacity: 1, filter: 'blur(0px)', x: 0 }}
        transition={{ duration: 1.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        className="hero-image-wrapper"
      >
        <img
          src="/hero-figure.webp"
          alt="Artistic 3D rendering of Shreyas"
          aria-hidden="true"
          className="hero-image"
          width={810}
          height={1080}
          fetchPriority="high"
          decoding="async"
        />
      </motion.div>

      <div className="container hero-content-wrapper">
        
        {/* Left Content */}
        <motion.div 
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          animate="show"
          className="hero-content"
        >
          
          <motion.div variants={ITEM_VARIANTS} style={{ marginBottom: '4px' }}>
            <span className="hero-pretitle silver-glow-text">
              私は
            </span>
          </motion.div>
          
          <motion.div variants={ITEM_VARIANTS} className="hero-title-wrapper">
            <h1 className="hero-title">
              shreyas
            </h1>
          </motion.div>

          <motion.div variants={ITEM_VARIANTS} className="hero-desc-wrapper">
            <p className="hero-desc">
              a computer science student building ai agents, llm security tools, and automation systems.<br/>
              <span className="silver-glow-text">at your service.</span>
            </p>
          </motion.div>

          {/* Detached CTA Component */}
          <motion.div variants={ITEM_VARIANTS} className="hero-cta-wrapper">
            <motion.button 
              onClick={onOpenConnectModal}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="framer-button hero-cta"
            >
              let's connect
            </motion.button>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
