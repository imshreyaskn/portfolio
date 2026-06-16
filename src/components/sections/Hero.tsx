import { motion } from 'framer-motion';
import './Hero.css';

const Hero = () => {
  // Staggered animation variants for premium reveal
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.3,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 30, filter: 'blur(8px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
  };

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
          fetchpriority="high"
          decoding="async"
        />
      </motion.div>

      <div className="container hero-content-wrapper">
        
        {/* Left Content */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="hero-content"
        >
          
          <motion.div variants={item} style={{ marginBottom: '4px' }}>
            <span className="hero-pretitle silver-glow-text">
              私は
            </span>
          </motion.div>
          
          <motion.div variants={item} className="hero-title-wrapper">
            <h1 className="hero-title">
              shreyas
            </h1>
          </motion.div>

          <motion.div variants={item} className="hero-desc-wrapper">
            <p className="hero-desc">
              a computer science student building ai agents, llm security tools, and automation systems.<br/>
              <span className="silver-glow-text">at your service.</span>
            </p>
          </motion.div>

          {/* Detached CTA Component */}
          <motion.div variants={item} className="hero-cta-wrapper">
            <motion.a 
              href="https://www.linkedin.com/in/imshreyaskn"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="framer-button hero-cta"
            >
              let's connect
            </motion.a>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
