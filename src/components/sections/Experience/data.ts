export interface ExperienceData {
  id: string;
  role: string;
  company: string;
  duration: string;
  location?: string;
  description: string[];
  side: 'left' | 'right';
}

export const EXPERIENCES: ExperienceData[] = [
  {
    id: "exp-1",
    role: "Computer Science Student",
    company: "Open to Opportunities",
    duration: "Available for Internships & Roles",
    location: "Coimbatore, Tamil Nadu",
    description: [
      "Third-year Computer Science student with hands-on experience building AI agents, LLM security tools, and automation systems.",
      "Developed projects across adversarial red-teaming, browser automation, and self-healing CI/CD workflows.",
      "Strong exposure to cloud infrastructure, backend development, and agent-based architectures.",
      "Actively seeking opportunities to contribute to high-performance engineering teams."
    ],
    side: 'right'
  },
  {
    id: "exp-2",
    role: "LLM Security & Cloud Intern",
    company: "Centillion Labs",
    duration: "Sep 2025 – Oct 2025",
    location: "Coimbatore, Tamil Nadu",
    description: [
      "Researched emerging LLM attack vectors and organized findings into a structured threat taxonomy covering prompt injection, role manipulation, obfuscation, and related security risks.",
      "Curated and standardized red-teaming datasets from academic, open-source, and internally generated sources to support security evaluation workflows.",
      "Conducted adversarial testing across multiple commercial and open-source LLMs, documenting safety weaknesses, jailbreak patterns, and model-specific failure modes.",
      "Provisioned cloud infrastructure for LLM security testing pipelines using AWS, Azure, Terraform, and AWS Bedrock services."
    ],
    side: 'left'
  },
  {
    id: "exp-3",
    role: "AI / ML Intern",
    company: "Gateway Solutions",
    duration: "Jun 2025",
    location: "Coimbatore, Tamil Nadu",
    description: [
      "Developed an LLM-powered sentiment analysis pipeline for classifying large volumes of YouTube comments and user feedback.",
      "Evaluated multiple prompting strategies and language models to compare sentiment classification quality and consistency.",
      "Built a Retrieval-Augmented Generation (RAG) prototype that enabled contextual question answering over unstructured documents.",
      "Performed data cleaning, preprocessing, and exploratory analysis using Python, NumPy, and Pandas to prepare datasets for experimentation."
    ],
    side: 'right'
  }
];
