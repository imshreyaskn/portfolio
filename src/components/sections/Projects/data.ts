const THREADS = ['0%', '17%', '33%', '50%', '67%', '83%', '100%'];

// Function to generate particles safely during component mount to avoid HMR reshuffles
export const generateParticles = () => Array.from({ length: 18 }).map((_, i) => ({
  left: THREADS[i % THREADS.length],
  top: `${20 + Math.random() * 50}%`,
  animDelay: `${Math.random() * -30}s`,
  wobbleDelay: `${Math.random() * -10}s`,
  speed: `${25 + Math.random() * 25}s`,
  wobbleSpeed: `${4 + Math.random() * 6}s`,
  direction: Math.random() > 0.5 ? 1 : -1
}));
