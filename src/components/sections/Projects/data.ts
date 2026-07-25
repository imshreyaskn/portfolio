// data.ts — Project metadata + deterministic thread-particle field

/** mulberry32 seeded PRNG — identical particle layout across reloads & SSR */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const THREADS = ['0%', '16.67%', '33.33%', '50%', '66.67%', '83.33%', '100%'];

export interface ThreadParticle {
  left: string;
  top: string;
  animDelay: string;
  speed: string;
  direction: 1 | -1;
}

export const generateParticles = (count = 18, seed = 42): ThreadParticle[] => {
  const rand = mulberry32(seed);
  return Array.from({ length: count }).map((_, i) => ({
    left: THREADS[i % THREADS.length],
    top: `${20 + rand() * 50}%`,
    animDelay: `${rand() * -30}s`, // negative → start mid-flight, no pop-in
    speed: `${25 + rand() * 25}s`,
    direction: rand() > 0.5 ? 1 : -1,
  }));
};

export const PROJECT_TECH_STACKS: Record<string, string> = {
  'Lurien Matrix': 'LLM Security Firewall | Python, FastAPI, DistilBERT, MongoDB, React',
  Valerie: 'Automated LLM Red Teaming Platform | FastAPI, LangGraph, LiteLLM, PostgreSQL',
  Alethia: 'Self-Healing CI/CD Agent | FastAPI, LangGraph, Docker, GitHub Apps',
  Lucy: 'Voice-Controlled Accessibility Agent | Browser Automation, Agent Orchestration',
  Relay: 'Decentralized Disaster Communication Network | ESP32, React Native, Mesh Networking',
};

export const PROJECT_LINKS: Record<string, string> = {
  'Lurien Matrix': 'https://lurienmatrix.vercel.app/',
  Valerie: 'https://valerie-beta.vercel.app/',
  Alethia: 'https://alethia-gamma.vercel.app/',
  Lucy: 'https://lucyx.vercel.app/',
  Relay: 'https://github.com/imshreyaskn/Relay',
};
