import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
import CustomCursor from './components/CustomCursor';
import StarMapBackground from './components/StarMapBackground';
import Hero from './components/sections/Hero';
import OrbNavbar from './components/layout/OrbNavbar';
import Footer from './components/layout/Footer';
import LoadingScreen from './components/layout/LoadingScreen';
import SectionLoader from './components/layout/SectionLoader';
import ConnectModal from './components/layout/ConnectModal';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { useMoonFavicon } from './hooks/useMoonFavicon';

// Lazy imports — chunks load on demand
const Skills = lazy(() => import('./components/sections/Skills'));
const Experience = lazy(() => import('./components/sections/Experience'));
const Projects = lazy(() => import('./components/sections/Projects'));

function App() {
  useMoonFavicon();
  
  const [revealed, setRevealed] = useState(false);
  const [preloaderGone, setPreloaderGone] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null);

  const openConnectModal = useCallback(() => setIsConnectModalOpen(true), []);
  const closeConnectModal = useCallback(() => setIsConnectModalOpen(false), []);

  // Get root element AFTER mount (not at module level)
  useEffect(() => {
    setRootElement(document.getElementById('root'));
  }, []);

  // Scroll lock while the airlock is sealed
  useEffect(() => {
    document.documentElement.classList.toggle('is-locked', !revealed);
    return () => document.documentElement.classList.remove('is-locked');
  }, [revealed]);

  // Prefetch lazy chunks AFTER the boot sequence completes
  // This prevents chunk loading from colliding with the implosion animation
  useEffect(() => {
    if (!preloaderGone) return;
    
    // Small delay to let the site settle after reveal
    const timer = setTimeout(() => {
      import('./components/sections/Skills');
      import('./components/sections/Experience');
      import('./components/sections/Projects');
    }, 500);
    
    return () => clearTimeout(timer);
  }, [preloaderGone]);

  return (
    <>
      {!preloaderGone && (
        <LoadingScreen
          onReveal={() => setRevealed(true)}
          onDone={() => setPreloaderGone(true)}
        />
      )}

      <CustomCursor />
      <StarMapBackground />
      <OrbNavbar />

      <main className="main-content" aria-busy={!revealed}>
        <Hero start={revealed} onOpenConnectModal={openConnectModal} />
        <ErrorBoundary>
          <Suspense fallback={<SectionLoader />}>
            <Skills />
            <Experience />
            <Projects />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer onOpenConnectModal={openConnectModal} />

      {rootElement && (
        <Canvas
          eventSource={rootElement}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          className="global-canvas"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'none',
            zIndex: 5,
          }}
        >
          <View.Port />
        </Canvas>
      )}

      <ConnectModal isOpen={isConnectModalOpen} onClose={closeConnectModal} />
    </>
  );
}

export default App;
