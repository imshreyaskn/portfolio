// data.ts — Skill taxonomy with stable IDs and responsive coordinates
import type { IconType } from 'react-icons';
import {
  SiPython, SiJavascript, SiGo, SiFastapi, SiExpress,
  SiSpringboot, SiPostgresql, SiSupabase, SiDocker,
  SiTerraform, SiGit, SiGithub, SiReact, SiTailwindcss,
  SiGooglechrome,
} from 'react-icons/si';
import {
  FaJava, FaAws, FaRobot, FaProjectDiagram, FaLink,
  FaDatabase, FaCode, FaBrain, FaServer, FaCloud, FaGlobe,
} from 'react-icons/fa';
import { BsTriangle } from 'react-icons/bs';

/* ─── Types ─── */

export interface SkillItem {
  id: string;
  name: string;
  icon: IconType;
  /** Percentage position within the constellation graph (0–100) */
  x: number;
  y: number;
  /** Mobile-adjusted position to prevent overflow on narrow viewports */
  xMobile?: number;
  yMobile?: number;
}

export type SkillSide = 'left' | 'right';

export interface SkillCategory {
  id: string;
  category: string;
  icon: IconType;
  skills: SkillItem[];
  side: SkillSide;
  desc?: string;
}

/* ─── Data ─── */

export const SKILLS_DATA: SkillCategory[] = [
  {
    id: 'languages',
    category: 'Languages',
    icon: FaCode,
    side: 'right',
    skills: [
      { id: 'python',     name: 'Python',     icon: SiPython,     x: 25, y: 20, xMobile: 20, yMobile: 18 },
      { id: 'java',       name: 'Java',       icon: FaJava,       x: 65, y: 30, xMobile: 60, yMobile: 28 },
      { id: 'javascript', name: 'JavaScript', icon: SiJavascript, x: 40, y: 55, xMobile: 38, yMobile: 52 },
      { id: 'go',         name: 'Go',         icon: SiGo,         x: 75, y: 75, xMobile: 68, yMobile: 72 },
    ],
  },
  {
    id: 'ai-llm',
    category: 'AI / LLM Engineering',
    icon: FaBrain,
    side: 'left',
    desc: 'Building autonomous agents, retrieval pipelines, and LLM security tooling.',
    skills: [
      { id: 'langgraph',   name: 'LangGraph',   icon: FaProjectDiagram, x: 15, y: 20, xMobile: 12, yMobile: 18 },
      { id: 'langchain',   name: 'LangChain',   icon: FaLink,           x: 65, y: 15, xMobile: 58, yMobile: 14 },
      { id: 'ai-agents',   name: 'AI Agents',   icon: FaRobot,          x: 40, y: 40, xMobile: 36, yMobile: 38 },
      { id: 'rag',         name: 'RAG',         icon: FaDatabase,       x: 85, y: 50, xMobile: 72, yMobile: 48 },
      { id: 'pinecone',    name: 'Pinecone',    icon: BsTriangle,       x: 25, y: 85, xMobile: 22, yMobile: 80 },
      { id: 'aws-bedrock', name: 'AWS Bedrock', icon: FaAws,            x: 75, y: 90, xMobile: 65, yMobile: 85 },
    ],
  },
  {
    id: 'backend-db',
    category: 'Backend & Databases',
    icon: FaServer,
    side: 'right',
    skills: [
      { id: 'fastapi',    name: 'FastAPI',    icon: SiFastapi,    x: 35, y: 20, xMobile: 30, yMobile: 18 },
      { id: 'express',    name: 'Express.js', icon: SiExpress,    x: 70, y: 30, xMobile: 62, yMobile: 28 },
      { id: 'springboot', name: 'Spring Boot',icon: SiSpringboot, x: 25, y: 55, xMobile: 22, yMobile: 52 },
      { id: 'postgresql', name: 'PostgreSQL', icon: SiPostgresql, x: 65, y: 70, xMobile: 58, yMobile: 66 },
      { id: 'supabase',   name: 'Supabase',   icon: SiSupabase,   x: 45, y: 95, xMobile: 40, yMobile: 88 },
    ],
  },
  {
    id: 'cloud-devops',
    category: 'Cloud & DevOps',
    icon: FaCloud,
    side: 'left',
    skills: [
      { id: 'aws',       name: 'AWS',       icon: FaAws,       x: 25, y: 20, xMobile: 20, yMobile: 18 },
      { id: 'docker',    name: 'Docker',    icon: SiDocker,    x: 60, y: 35, xMobile: 55, yMobile: 32 },
      { id: 'terraform', name: 'Terraform', icon: SiTerraform, x: 80, y: 15, xMobile: 70, yMobile: 14 },
      { id: 'git',       name: 'Git',       icon: SiGit,       x: 30, y: 65, xMobile: 26, yMobile: 60 },
      { id: 'github',    name: 'GitHub',    icon: SiGithub,    x: 75, y: 80, xMobile: 65, yMobile: 75 },
    ],
  },
  {
    id: 'web-automation',
    category: 'Web & Automation',
    icon: FaGlobe,
    side: 'right',
    skills: [
      { id: 'react',       name: 'React',           icon: SiReact,       x: 50, y: 30, xMobile: 45, yMobile: 28 },
      { id: 'chrome-ext',  name: 'Chrome Ext (V3)', icon: SiGooglechrome,x: 20, y: 75, xMobile: 18, yMobile: 70 },
      { id: 'tailwind',    name: 'Tailwind CSS',    icon: SiTailwindcss, x: 75, y: 65, xMobile: 65, yMobile: 60 },
    ],
  },
];

/** Number of categories — used by the shader for slice calculation */
export const CATEGORY_COUNT = SKILLS_DATA.length;
