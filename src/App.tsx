import { useState, lazy, Suspense, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import Lenis from 'lenis';
import CustomCursor from './components/CustomCursor';
import StarMapBackground from './components/StarMapBackground';
import Hero from './components/sections/Hero';
import OrbNavbar from './components/layout/OrbNavbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/layout/LoadingScreen';
import ConnectModal from './components/layout/ConnectModal';
import { useIsMobile } from './hooks/useIsMobile';

const Skills = lazy(() => import('./components/sections/Skills'));
const Experience = lazy(() => import('./components/sections/Experience'));
const Projects = lazy(() => import('./components/sections/Projects'));

// Hoisted once — never changes across the app lifetime
const rootElement = document.getElementById('root');

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const isMobile = useIsMobile(1023);

  useEffect(() => {
    if (isMobile) return;
    const lenis = new Lenis({
      lerp: 0.05, // Apple-like momentum friction (lower = longer, looser glide)
      wheelMultiplier: 1.0, 
      smoothWheel: true
    });
    
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [isMobile]);

  const handleOpenConnectModal = useCallback(() => {
    setIsConnectModalOpen(true);
  }, []);

  if (isMobile) {
    return (
      <div style={{
        height: '100dvh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F0F1A',
        color: '#EBEBF0',
        padding: '2rem',
        textAlign: 'center',
        zIndex: 9999,
        position: 'fixed',
        top: 0,
        left: 0
      }}>
        <h1 style={{ fontFamily: 'Italiana, serif', fontSize: '2.5rem', marginBottom: '1rem' }}>Desktop Required</h1>
        <p style={{ fontFamily: 'Jost, sans-serif', fontSize: '1.1rem', color: '#7A7A8C', maxWidth: '400px' }}>
          This highly interactive portfolio is currently optimized exclusively for desktop and laptop displays. 
          Please visit again from a larger screen.
        </p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <CustomCursor />
      <StarMapBackground />
      <OrbNavbar />
      <main className="main-content">
        <Hero onOpenConnectModal={handleOpenConnectModal} />
        <Suspense fallback={null}>
          <Skills />
          <Experience />
          <Projects />
        </Suspense>
      </main>
      <Footer onOpenConnectModal={handleOpenConnectModal} />
      {rootElement && !isLoading && (
        <Canvas
          eventSource={rootElement}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 1.5]}
          className="global-canvas"
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 5 }}
        >
          <View.Port />
        </Canvas>
      )}
      <ConnectModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
    </>
  );
}

export default App;
