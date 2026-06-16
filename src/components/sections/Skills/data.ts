import { IconType } from 'react-icons';
import { SiPython, SiJavascript, SiGo, SiFastapi, SiExpress, SiSpringboot, SiPostgresql, SiSupabase, SiDocker, SiTerraform, SiGit, SiGithub, SiReact, SiTailwindcss, SiGooglechrome } from 'react-icons/si';
import { FaJava, FaAws, FaRobot, FaProjectDiagram, FaLink, FaDatabase, FaCode, FaBrain, FaServer, FaCloud, FaGlobe } from 'react-icons/fa';
import { BsTriangle } from 'react-icons/bs';

export interface SkillItem {
  name: string;
  icon: IconType;
  x: number;
  y: number;
}

export interface SkillData {
  category: string;
  icon: IconType;
  skills: SkillItem[];
  side: 'left' | 'right';
  desc?: string;
}

export const SKILLS_DATA: SkillData[] = [
  { 
    category: 'Languages',
    icon: FaCode,
    skills: [
      { name: 'Python', icon: SiPython, x: 25, y: 20 },
      { name: 'Java', icon: FaJava, x: 65, y: 30 },
      { name: 'JavaScript', icon: SiJavascript, x: 40, y: 55 },
      { name: 'Go', icon: SiGo, x: 75, y: 75 }
    ],
    side: 'right'
  },
  { 
    category: 'AI / LLM Engineering',
    icon: FaBrain,
    skills: [
      { name: 'LangGraph', icon: FaProjectDiagram, x: 15, y: 20 },
      { name: 'LangChain', icon: FaLink, x: 65, y: 15 },
      { name: 'AI Agents', icon: FaRobot, x: 40, y: 40 },
      { name: 'RAG', icon: FaDatabase, x: 85, y: 50 },
      { name: 'Pinecone', icon: BsTriangle, x: 25, y: 85 },
      { name: 'AWS Bedrock', icon: FaAws, x: 75, y: 90 }
    ],
    side: 'left'
  },
  { 
    category: 'Backend & Databases',
    icon: FaServer,
    skills: [
      { name: 'FastAPI', icon: SiFastapi, x: 35, y: 20 },
      { name: 'Express.js', icon: SiExpress, x: 70, y: 30 },
      { name: 'Spring Boot', icon: SiSpringboot, x: 25, y: 55 },
      { name: 'PostgreSQL', icon: SiPostgresql, x: 65, y: 70 },
      { name: 'Supabase', icon: SiSupabase, x: 45, y: 95 }
    ],
    side: 'right'
  },
  { 
    category: 'Cloud & DevOps',
    icon: FaCloud,
    skills: [
      { name: 'AWS', icon: FaAws, x: 25, y: 20 },
      { name: 'Docker', icon: SiDocker, x: 60, y: 35 },
      { name: 'Terraform', icon: SiTerraform, x: 80, y: 15 },
      { name: 'Git', icon: SiGit, x: 30, y: 65 },
      { name: 'GitHub', icon: SiGithub, x: 75, y: 80 }
    ],
    side: 'left'
  },
  { 
    category: 'Web & Automation',
    icon: FaGlobe,
    skills: [
      { name: 'React', icon: SiReact, x: 50, y: 30 },
      { name: 'Chrome Ext (V3)', icon: SiGooglechrome, x: 20, y: 75 },
      { name: 'Tailwind CSS', icon: SiTailwindcss, x: 75, y: 65 }
    ],
    side: 'right'
  }
];
