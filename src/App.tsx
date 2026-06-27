import { useState, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';
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
        <Hero onOpenConnectModal={() => setIsConnectModalOpen(true)} />
        <Suspense fallback={null}>
          <Skills />
          <Experience />
          <Projects />
        </Suspense>
      </main>
      <Footer onOpenConnectModal={() => setIsConnectModalOpen(true)} />
      {rootElement && (
        <Canvas
          eventSource={rootElement}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
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
