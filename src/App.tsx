import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
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
import MobileBlocker from './components/layout/MobileBlocker';
import { useIsMobile } from './hooks/useIsMobile';

// Lazy imports — chunks load on demand
const Skills = lazy(() => import('./components/sections/Skills'));
const Experience = lazy(() => import('./components/sections/Experience'));
const Projects = lazy(() => import('./components/sections/Projects'));

function App() {
  useMoonFavicon();
  
  const [revealed, setRevealed] = useState(false);
  const [preloaderGone, setPreloaderGone] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const openConnectModal = useCallback(() => setIsConnectModalOpen(true), []);
  const closeConnectModal = useCallback(() => setIsConnectModalOpen(false), []);

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

  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileBlocker />;
  }

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

      <ConnectModal isOpen={isConnectModalOpen} onClose={closeConnectModal} />
    </>
  );
}

export default App;
