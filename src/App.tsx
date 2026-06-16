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

const Skills = lazy(() => import('./components/sections/Skills'));
const Experience = lazy(() => import('./components/sections/Experience'));
const Projects = lazy(() => import('./components/sections/Projects'));

// Hoisted once — never changes across the app lifetime
const rootElement = document.getElementById('root');

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      </AnimatePresence>

      <CustomCursor />
      <StarMapBackground />
      <OrbNavbar />
      <main className="main-content">
        <Hero />
        <Suspense fallback={null}>
          <Skills />
          <Experience />
          <Projects />
        </Suspense>
      </main>
      <Footer />
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
    </>
  );
}

export default App;
