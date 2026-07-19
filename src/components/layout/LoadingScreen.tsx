import { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onComplete: () => void;
}

const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const controls = useAnimation();

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const runAnimation = async () => {
      // 1. Initial spin and build up (Don't await, because rotateZ loops infinitely)
      controls.start('visible');
      
      // 2. Wait for the initial animations to finish (longest is 1.8s) + a short pause (800ms)
      await new Promise(resolve => setTimeout(resolve, 2600));
      
      // 3. Implosion effect
      window.dispatchEvent(new CustomEvent('implosion-start'));
      await controls.start('implode');
      
      // 4. Trigger unmount
      onComplete();
      
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };

    runAnimation();

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [controls, onComplete]);

  return (
    <motion.div 
      className="loading-screen-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
    >
      <div className="black-hole-container">
        
        {/* Outer Ring */}
        <motion.div 
          className="accretion-disk-outer"
          initial={{ scale: 0, opacity: 0, rotateX: 70, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: { 
              scale: 1, opacity: 1, rotateZ: 360, 
              transition: { 
                scale: { duration: 1.5, ease: "easeOut" },
                opacity: { duration: 1.5 },
                rotateZ: { duration: 10, ease: "linear", repeat: Infinity } 
              } 
            },
            implode: { scale: 0, opacity: 0, transition: { duration: 0.8, ease: "backIn" } }
          }}
        />

        {/* Main Disk */}
        <motion.div 
          className="accretion-disk"
          initial={{ scale: 0.2, opacity: 0, rotateX: 65, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: { 
              scale: 1, opacity: 1, rotateZ: 360, 
              transition: { 
                scale: { duration: 1.2, ease: "easeOut", delay: 0.2 },
                opacity: { duration: 1.2, delay: 0.2 },
                rotateZ: { duration: 3, ease: "linear", repeat: Infinity } 
              } 
            },
            implode: { scale: 0, opacity: 0, rotateZ: 720, transition: { duration: 0.8, ease: "backIn" } }
          }}
        />

        {/* Inner Disk */}
        <motion.div 
          className="accretion-disk-inner"
          initial={{ scale: 0, opacity: 0, rotateX: 60, rotateZ: 0 }}
          animate={controls}
          variants={{
            visible: { 
              scale: 1, opacity: 1, rotateZ: -360, 
              transition: { 
                scale: { duration: 1, ease: "easeOut", delay: 0.4 },
                opacity: { duration: 1, delay: 0.4 },
                rotateZ: { duration: 2, ease: "linear", repeat: Infinity } 
              } 
            },
            implode: { scale: 0, opacity: 0, rotateZ: -720, transition: { duration: 0.6, ease: "backIn" } }
          }}
        />

        {/* Black Hole Event Horizon */}
        <motion.div 
          className="event-horizon"
          initial={{ scale: 0 }}
          animate={controls}
          variants={{
            visible: { scale: 1, transition: { duration: 1.8, ease: [0.16, 1, 0.3, 1] } },
            implode: { scale: 0, transition: { duration: 0.6, ease: "easeIn", delay: 0.2 } }
          }}
        />

        {/* Pulsing Text */}
        <motion.div 
          className="loading-text"
          initial={{ opacity: 0 }}
          animate={controls}
          variants={{
            visible: { 
              opacity: [0.3, 0.8, 0.3], 
              transition: { opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" } } 
            },
            implode: { opacity: 0, transition: { duration: 0.3 } }
          }}
        >
          establishing orbit
        </motion.div>
      </div>
    </motion.div>
  );
};

export default LoadingScreen;
