import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily to handle missing API keys gracefully.
let ai: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY not found in environment. Running in developer simulated mode.");
    }
    ai = new GoogleGenAI({
      apiKey: key || "SIMULATED_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return ai;
}

// -------------------------------------------------------------
// PRESET HIGH-QUALITY FALLBACK DATA & GENERATION CONFIGS
// -------------------------------------------------------------
const PRESET_CAREER_DETAILS: Record<string, any> = {
  "Software Engineer": {
    track: "Software Engineer",
    matchPercentage: 92,
    summary: "Software engineering centers on building robust, scalable applications, databases, and structural code. As a 1st year CSE student, mastering algorithms, object-oriented concepts, and version control will form your foundation. The market is highly demanding of full-stack capabilities, backend system architectures, and engineering principles.",
    whyThisFits: [
      "Your logical puzzle-solving score is high.",
      "You expressed interest in constructing visual products and reliable backend APIs.",
      "You value solid coding principles and problem solving."
    ],
    skillsList: [
      { skillName: "Data Structures & Algorithms", category: "Core CS", studentScore: 40, industryStandard: 85, gapDescription: "Needs regular practice on space/time complexity and data architecture concepts." },
      { skillName: "React & Modern Front-End", category: "Languages", studentScore: 50, industryStandard: 80, gapDescription: "Comfortable with HTML/CSS, but needs exposure to state management and async data." },
      { skillName: "Backend & Databases (Express, Node, SQL)", category: "Languages", studentScore: 30, industryStandard: 75, gapDescription: "Excellent fundamental logic, but needs hands-on REST API structure and query patterns." },
      { skillName: "Git & Collaborative Workflows", category: "Tools", studentScore: 35, industryStandard: 90, gapDescription: "Understand commits, but missing branch resolution and workflows." },
      { skillName: "Problem Solving & System Design", category: "Soft Skills", studentScore: 60, industryStandard: 80, gapDescription: "Great raw talent; needs structured exposure to scale concepts." }
    ],
    roadmap: [
      {
        id: "se-beginner",
        title: "Phase 1: Foundations of CSE & Logic building",
        phase: "Beginner",
        estimatedWeeks: 8,
        skillsAcquired: ["Python/C++ fundamentals", "Git/GitHub", "Basic HTML/CSS/JS"],
        description: "Set up the workspace, dive deep into programmatic logic, variables, and arrays. Create simple CLI applications.",
        resources: [
          { title: "CS50x: Introduction to Computer Science", provider: "Harvard / EdX (Free)", url: "https://pll.harvard.edu/course/cs50-introduction-computer-science", type: "free", duration: "12 weeks", difficulty: "Beginner", description: "The premier global introduction to standard computer engineering concepts." },
          { title: "JavaScript Survival Guide", provider: "freeCodeCamp (Free)", url: "https://www.youtube.com/watch?v=PKK86P9bXkY", type: "tutorial", duration: "4 hours", difficulty: "Beginner", description: "Quick, visual tutorial covering essential ES6+ syntax." }
        ]
      },
      {
        id: "se-intermediate",
        title: "Phase 2: Master Core Web & Database Structures",
        phase: "Intermediate",
        estimatedWeeks: 12,
        skillsAcquired: ["React", "Express JSON APIs", "SQL Databases"],
        description: "Scale your capability into full-stack territory. Build dynamic SPAs interacting with localized relational databases.",
        resources: [
          { title: "React Crash Course for Beginners", provider: "YouTube (Free)", url: "https://www.youtube.com/watch?v=w7ejDZ8SWv8", type: "tutorial", duration: "6 hours", difficulty: "Intermediate", description: "Modern React with hooks, UI frameworks, and state." },
          { title: "Full Stack Open", provider: "University of Helsinki", url: "https://fullstackopen.com/en/", type: "free", duration: "10 weeks", difficulty: "Intermediate", description: "Deep continuous integration, backend web, and database administration." }
        ]
      },
      {
        id: "se-advanced",
        title: "Phase 3: Robust Architectures & Scalability",
        phase: "Advanced",
        estimatedWeeks: 10,
        skillsAcquired: ["Docker / Cloud Hosting", "Advanced DSA", "CI/CD & Testing"],
        description: "Wrap applications into isolated containers, configure automation pipelines, and optimize performance.",
        resources: [
          { title: "System Design for Beginners", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=m8I0fJkuYcw", type: "tutorial", duration: "5 hours", difficulty: "Advanced", description: "Deep structures on horizontal scaling, load balancing, and load analysis." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Collaborative Realtime Canvas Board", description: "An ultra-responsive team canvas with multiple cursors, persistent state, and canvas libraries.", complexity: "Medium", techStack: ["React", "Express", "Vite"] },
      { title: "Automated Student Academic Hub", description: "A system with full role-based access, grade indicators, calendar planners, and automated report updates.", complexity: "Hard", techStack: ["NodeJS", "PostgreSQL", "React"] }
    ]
  },
  "Data Scientist": {
    track: "Data Scientist",
    matchPercentage: 88,
    summary: "Data Science focuses on collecting, treating, and mining massive datasets to extract predictive value. First-year CSE lays down essential foundations in linear algebra, basic regression, and introductory programming.",
    whyThisFits: [
      "Your high inclination for analytics, mathematics, and statistics.",
      "Interest in business-related data pipelines and predictive modeling."
    ],
    skillsList: [
      { skillName: "Python (NumPy, Pandas)", category: "Languages", studentScore: 40, industryStandard: 90, gapDescription: "Needs advanced mastery in vector operations and dataframes manipulation." },
      { skillName: "Statistics & Probability", category: "Core CS", studentScore: 45, industryStandard: 85, gapDescription: "Comfortable with high-school probability, needs Bayesian analysis expertise." },
      { skillName: "SQL Database Querying", category: "Languages", studentScore: 25, industryStandard: 75, gapDescription: "Requires analytical query writing, CTE definitions, and windowing functions." },
      { skillName: "Data Visualization (D3, Seaborn)", category: "Tools", studentScore: 30, industryStandard: 80, gapDescription: "Capable of simple scatter plots, needs custom visual dashboards." }
    ],
    roadmap: [
      {
        id: "ds-beginner",
        title: "Phase 1: Statistics Setup & Python Libraries",
        phase: "Beginner",
        estimatedWeeks: 8,
        skillsAcquired: ["Python Fundamentals", "Pandas & Numpy", "Probability basics"],
        description: "Implement simple analytical parsing. Establish statistical concepts like standard distribution, mean, median, standard deviation.",
        resources: [
          { title: "Python for Everybody Specialization", provider: "Coursera (Free Audit)", url: "https://www.coursera.org/specializations/python", type: "free", duration: "6 weeks", difficulty: "Beginner", description: "Essential python constructs for manipulating records." }
        ]
      },
      {
        id: "ds-intermediate",
        title: "Phase 2: Database Exploiting & Advanced Analytics",
        phase: "Intermediate",
        estimatedWeeks: 10,
        skillsAcquired: ["SQL advanced querying", "Exploratory Data Analysis", "Sklearn Machine Learning"],
        description: "Transform raw table datasets, execute predictive modeling via Scikit-Learn libraries, and evaluate error metrics.",
        resources: [
          { title: "Introduction to Machine Learning with Python", provider: "YouTube (Free)", url: "https://www.youtube.com/watch?v=GwIo3gToTSM", type: "tutorial", duration: "8 hours", difficulty: "Intermediate", description: "Comprehensive coverage of regression, clustering, and decision trees." }
        ]
      },
      {
        id: "ds-advanced",
        title: "Phase 3: Massive Pipelines & MLOps",
        phase: "Advanced",
        estimatedWeeks: 12,
        skillsAcquired: ["Spark/Big Data", "Model Deployment", "Tableau/PowerBI Systems"],
        description: "Deliver models via microservices and construct deep-learning classifiers on high-density graphics datasets.",
        resources: [
          { title: "Machine Learning Engineering", provider: "Google Cloud Labs", url: "https://www.cloudskillsboost.google/", type: "free", duration: "8 weeks", difficulty: "Advanced", description: "Learn to build production scale ML pipelines on GCP." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Global Pandemic Predictive Model", description: "Predict regional progression indicators based on continuous demographic and economic inputs.", complexity: "Medium", techStack: ["Python", "Pandas", "Scikit-Learn"] },
      { title: "Product Sentiment Miner", description: "Analyze real-time feedback feeds from retail products and flag dynamic trend issues automatically.", complexity: "Hard", techStack: ["Python", "NLTK", "Flask"] }
    ]
  },
  "AI Engineer": {
    track: "AI Engineer",
    matchPercentage: 95,
    summary: "As an Artificial Intelligence Engineer, you will build deep networks, integrate state-of-the-art LLM capabilities, design agent systems, and train visual models. 1st year CSE is the perfect time to build strong mathematical and logical foundations.",
    whyThisFits: [
      "Your strong passion for cognitive tech, agentic networks, and large language models.",
      "High desire to work with deep neural models and automation."
    ],
    skillsList: [
      { skillName: "Deep Learning (PyTorch/TensorFlow)", category: "Core CS", studentScore: 20, industryStandard: 90, gapDescription: "Need to start building simple feed forward networks from scratch." },
      { skillName: "Large Language Models & Prompt Engineering", category: "Tools", studentScore: 60, industryStandard: 85, gapDescription: "Already understand prompting, need experience in structured output extraction and fine-tuning." },
      { skillName: "REST API Integration & Cloud Inference", category: "Languages", studentScore: 40, industryStandard: 80, gapDescription: "Must master how to integrate SDKs like Google GenAI securely into backend code." }
    ],
    roadmap: [
      {
        id: "ai-beginner",
        title: "Phase 1: Math Foundations & Python AI Programming",
        phase: "Beginner",
        estimatedWeeks: 8,
        skillsAcquired: ["Python basics", "Linear Algebra", "Intro to Prompt Engineering"],
        description: "Solidify Python programming and linear algebra concepts (matrices, eigenvectors). Learn standard prompt structures.",
        resources: [
          { title: "Linear Algebra For Machine Learning", provider: "Imperial College London (EdX)", url: "https://www.edx.org/course/mathematics-for-machine-learning-linear-algebra", type: "free", duration: "4 weeks", difficulty: "Beginner", description: "Crucial matrix calculus to understand how model weights operate." },
          { title: "Gemini API Fast Crash Course", provider: "YouTube (Free)", url: "https://www.youtube.com/watch?v=S7bW7U6hI_g", type: "tutorial", duration: "2 hours", difficulty: "Beginner", description: "Build your first server with Google GenAI capabilities." }
        ]
      },
      {
        id: "ai-intermediate",
        title: "Phase 2: Deep Learning & Neural Architectures",
        phase: "Intermediate",
        estimatedWeeks: 12,
        skillsAcquired: ["PyTorch Deep Networks", "Computer Vision Basics", "Vector Databases (Pinecone)"],
        description: "Implement regression networks, custom convolution layers, and Retrieval-Augmented Generation (RAG) structures.",
        resources: [
          { title: "Practical Deep Learning for Coders", provider: "fast.ai (Free)", url: "https://course.fast.ai/", type: "free", duration: "8 weeks", difficulty: "Intermediate", description: "Acclaimed path to train complete, high-accuracy multi-class networks." }
        ]
      },
      {
        id: "ai-advanced",
        title: "Phase 3: Agent Systems & Advanced GenAI",
        phase: "Advanced",
        estimatedWeeks: 10,
        skillsAcquired: ["AI Agents & Tool Calling", "LLM Fine Tuning", "High-Scale ML Ops"],
        description: "Orchestrate multi-agent interactions, configure custom task routing, and deploy models as scalable microservices.",
        resources: [
          { title: "LangChain AI Agent Masterclass", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=hK8NQuK-K7g", type: "tutorial", duration: "6 hours", difficulty: "Advanced", description: "Design modular tool-calling systems capable of autonomous execution." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Personal Dynamic Research Copilot", description: "A system that automatically searches Google, gathers papers, synthesizes comparative lists, and extracts tables.", complexity: "Medium", techStack: ["Python", "Google GenAI SDK", "FastAPI"] },
      { title: "Real-time Defect Visual Detection", description: "Trained object-detection network that scans camera feeds in manufacturing lines to categorize failures.", complexity: "Hard", techStack: ["PyTorch", "React", "Docker"] }
    ]
  },
  "Cybersecurity Analyst": {
    track: "Cybersecurity Analyst",
    matchPercentage: 85,
    summary: "Cybersecurity Analyst is focused on securing networking, cloud servers, detecting intrusion incidents, and conducting ethical hacks. 1st year students starts with networking mechanics, operating systems, and basic terminal control.",
    whyThisFits: [
      "Indicated extreme curiosity on system boundaries, firewalls, and server access control.",
      "Values server robustness and deep operating system internals."
    ],
    skillsList: [
      { skillName: "Linux Administration & Bash", category: "Tools", studentScore: 40, industryStandard: 90, gapDescription: "Needs deeper command mastery, pipe chains, and privilege control definitions." },
      { skillName: "Computer Networks & OSI Model", category: "Core CS", studentScore: 30, industryStandard: 85, gapDescription: "Understand IP, but needs port routing mechanisms and TCP split handshakes." },
      { skillName: "Cryptography & Auth mechanics", category: "Soft Skills", studentScore: 20, industryStandard: 80, gapDescription: "Need to implement RSA calculations and study signature validations." }
    ],
    roadmap: [
      {
        id: "cyber-beginner",
        title: "Phase 1: Linux Terminal Mastery & Networking Protocols",
        phase: "Beginner",
        estimatedWeeks: 8,
        skillsAcquired: ["Linux tools", "IP Routing & Network layers", "Basic Cryptography Concepts"],
        description: "Get comfortable in visual and CLI terminals. Configure simple local firewall routers and isolate local networks.",
        resources: [
          { title: "Introduction to Cybersecurity Specialization", provider: "Coursera (NYU Free audit)", url: "https://www.coursera.org/specializations/introduction-cybersecurity-nyu", type: "free", duration: "8 weeks", difficulty: "Beginner", description: "Comprehensive overview of defensive metrics and digital architecture security." }
        ]
      },
      {
        id: "cyber-intermediate",
        title: "Phase 2: Incident Monitoring & Ethical Penetration",
        phase: "Intermediate",
        estimatedWeeks: 12,
        skillsAcquired: ["Wireshark Scanning", "Kali Linux basics", "OWASP Top-10 Vulnerabilities"],
        description: "Analyze network payloads, trace malicious route handshakes, and debug basic SQL injection vectors.",
        resources: [
          { title: "Ethical Hacking For Beginners", provider: "YouTube (Free)", url: "https://www.youtube.com/watch?v=3Kq1MIfTWCE", type: "tutorial", duration: "10 hours", difficulty: "Intermediate", description: "Teaches essential network tracking and penetration scanning safely." }
        ]
      },
      {
        id: "cyber-advanced",
        title: "Phase 3: Threat Hunting & SecOps Automating",
        phase: "Advanced",
        estimatedWeeks: 10,
        skillsAcquired: ["Cloud Security Architectures", "SIEM Dashboards (Splunk)", "Automated Python Sec Scripts"],
        description: "Deploy incident tracking nodes across vast cloud networks. Run vulnerability scans against automated cloud clusters.",
        resources: [
          { title: "Google Cybersecurity Certificate", provider: "Coursera / Google", url: "https://grow.google/certificates/cybersecurity/", type: "cert", duration: "16 weeks", difficulty: "Advanced", description: "Get career-ready skills for high-scale enterprise operations monitoring." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Network Intrusion Alert Analyzer", description: "A system reading packet files to identify dynamic port scans and log visual alerts dynamically.", complexity: "Medium", techStack: ["Python", "Flask", "Tailwind"] },
      { title: "Automated Pentest Scanner Suite", description: "Web console verifying specific SSL/TLS key vulnerabilities on domain parameters provided recursively.", complexity: "Hard", techStack: ["React", "Express", "Bash scripting"] }
    ]
  },
  "Cloud Engineer": {
    track: "Cloud Engineer",
    matchPercentage: 89,
    summary: "Cloud Engineers design enterprise architectures, scale clusters, regulate IAM boundaries, and configure serverless actions. Perfect entry point for 1st-year students to learn distributed hosting, modern deployment methods, and system modularity.",
    whyThisFits: [
      "Strong interest in scaling apps, maintaining zero-downtime, and container clustering.",
      "Excited about robust, cloud-agnostic architectures."
    ],
    skillsList: [
      { skillName: "Docker Containerization", category: "Tools", studentScore: 30, industryStandard: 85, gapDescription: "Need hands-on experience writing customizable multilayers Dockerfiles." },
      { skillName: "Cloud Provisioning (Google Cloud, AWS)", category: "Core CS", studentScore: 25, industryStandard: 80, gapDescription: "Need to learn serverless actions, compute nodes, and cloud load routers." },
      { skillName: "DevOps Pipelines (CI/CD)", category: "Languages", studentScore: 20, industryStandard: 80, gapDescription: "Understand basics, need implementation experience using GitHub Actions." }
    ],
    roadmap: [
      {
        id: "cloud-beginner",
        title: "Phase 1: Cloud Architecture Basics & Static Hosting",
        phase: "Beginner",
        estimatedWeeks: 6,
        skillsAcquired: ["Web server basics", "DNS & domain routing", "Google Cloud Storage"],
        description: "Deploy static pages, configure secure load balancing parameters, and configure continuous delivery from git on push.",
        resources: [
          { title: "Google Cloud Fundamentals", provider: "Google Skills Boost", url: "https://www.cloudskillsboost.google/", type: "free", duration: "4 weeks", difficulty: "Beginner", description: "The definitive guide on GCP products: App Engine, Compute, GKE, Cloud Run." }
        ]
      },
      {
        id: "cloud-intermediate",
        title: "Phase 2: Container Orch & Microservice Design",
        phase: "Intermediate",
        estimatedWeeks: 10,
        skillsAcquired: ["Docker engine", "Kubernetes cluster orchestrations", "Terraform IaC basics"],
        description: "Wrap full-stack apps into containers. Scale services automatically across elastic availability areas.",
        resources: [
          { title: "Docker and Kubernetes Masterclass", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=3c-i9V_vgSg", type: "tutorial", duration: "7 hours", difficulty: "Intermediate", description: "Excellent visual instruction on container namespaces, volumes, and networks." }
        ]
      },
      {
        id: "cloud-advanced",
        title: "Phase 3: Automated Disaster Recovery & Zero-Trust Cloud",
        phase: "Advanced",
        estimatedWeeks: 12,
        skillsAcquired: ["Advanced Terraform configs", "IAM policies hardening", "Serverless workflows"],
        description: "Implement zero-trust security setups across complex corporate virtual networks. Build self-healing software architectures.",
        resources: [
          { title: "AWS Certified Solutions Architect Special", provider: "YouTube Academy", url: "https://www.youtube.com/watch?v=Ia-UEYYR44s", type: "tutorial", duration: "12 hours", difficulty: "Advanced", description: "Prepare for professional infrastructure certification with deep architectural templates." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Self-Healing App Cluster Deployer", description: "A localized app monitoring healthy heartbeats and automatically restarting scaled Docker nodes when offline.", complexity: "Medium", techStack: ["NodeJS", "Docker SDK", "Bash"] },
      { title: "Automated Resource IAM Auditor", description: "Scans cloud projects to pinpoint accounts missing dual verification or containing excessive permission vectors.", complexity: "Hard", techStack: ["React", "Express", "GCP IAM APIs"] }
    ]
  },
  "UI/UX Designer": {
    track: "UI/UX Designer",
    matchPercentage: 91,
    summary: "UI/UX Designers balance graphic beauty, user behavior intuition, research logs, high-fidelity prototypes, and design systems. Highly vital role in software squads, translating heavy engineering scripts into seamless human interactions.",
    whyThisFits: [
      "Excellent intuition for balanced geometry, typography hierarchies, and user interactions.",
      "Wants to build gorgeous, deeply research-backed product experiences."
    ],
    skillsList: [
      { skillName: "Figma & Vector Design", category: "Tools", studentScore: 50, industryStandard: 90, gapDescription: "Comfortable constructing basic banners, need auto-layout grids and reusable multi-state components." },
      { skillName: "Interactions & Micro-Animations", category: "Core CS", studentScore: 35, industryStandard: 80, gapDescription: "Needs training in motion arcs, spatial timing, and transition feedback." },
      { skillName: "UX Research & Analytics Map", category: "Soft Skills", studentScore: 40, industryStandard: 85, gapDescription: "Understand standard flowcharts, need user testing strategies and heatmaps parsing." }
    ],
    roadmap: [
      {
        id: "uiux-beginner",
        title: "Phase 1: Typographic Scales & Color Science",
        phase: "Beginner",
        estimatedWeeks: 6,
        skillsAcquired: ["Typography pairings", "Color contrasts", "Basic Figma Layouts"],
        description: "Deconstruct popular elegant screens. Learn the magic relationships of margins, padding, and geometric spacing guides.",
        resources: [
          { title: "UX Design Process", provider: "YouTube (UX Academy)", url: "https://www.youtube.com/watch?v=5C29_S_785M", type: "tutorial", duration: "5 hours", difficulty: "Beginner", description: "Step-by-step product walkthrough from rough wireframe sketches to refined display screens." }
        ]
      },
      {
        id: "uiux-intermediate",
        title: "Phase 2: Master Component Design Systems & States",
        phase: "Intermediate",
        estimatedWeeks: 8,
        skillsAcquired: ["Figma Variables & Auto Layout", "Responsive grids modeling", "Functional prototyping"],
        description: "Build robust UI kits with centralized design properties, responsive layouts, and interactive mock triggers.",
        resources: [
          { title: "Building Figma Design Systems", provider: "freeCodeCamp", url: "https://www.youtube.com/watch?v=S08P7S49xGo", type: "tutorial", duration: "4 hours", difficulty: "Intermediate", description: "Design modular visual tokens, custom inputs, and interactive menus." }
        ]
      },
      {
        id: "uiux-advanced",
        title: "Phase 3: Modern Motion Patterns & Usability Diagnostics",
        phase: "Advanced",
        estimatedWeeks: 10,
        skillsAcquired: ["Interaction prototypes", "Lottie/Framer animations", "Live user diagnostic surveys"],
        description: "Analyze heatmap telemetry, organize extensive testing focus groups, and configure immersive micro-interactions.",
        resources: [
          { title: "Google UX Design Professional Cert", provider: "Coursera / Google", url: "https://grow.google/certificates/ux-design/", type: "cert", duration: "24 weeks", difficulty: "Advanced", description: "The global gold Standard program to launch UI/UX careers." }
        ]
      }
    ],
    suggestedProjects: [
      { title: "Futuristic Mars Transit Interactive Hub", description: "Immersive ticket-procurement device mock with complex states on pricing calculation and seating allocations.", complexity: "Medium", techStack: ["Figma Design", "Framer Prototype"] },
      { title: "Inclusive Medical Monitor Interface", description: "High-contrast, screen-reader friendly emergency visual command workspace for heavy clinical tablets.", complexity: "Hard", techStack: ["Figma System", "A11y audits"] }
    ]
  }
};

const PRESET_MARKET_TRENDS: Record<string, any> = {
  "Software Engineer": {
    track: "Software Engineer",
    demandScore: 88,
    salaryRange: "$75,000 - $155,000",
    growthRate: "+12% YoY",
    trendingKeywords: ["TypeScript", "Rust", "NextJS", "PostgreSQL", "Next-Gen Web"],
    overview: "Software Engineering is undergoing massive refinement. Companies prioritize efficient, cost-optimized backend platforms, secure distributed storage engines, and highly interactive UI modules over old, heavily bloated systems.",
    emergingSkills: [
      { name: "Rust for Performance", relevance: "Critical for compiling ultra-fast web tools and core network protocols." },
      { name: "NextJS & RSC", relevance: "The prevailing standard in corporate web interfaces for progressive hydration." }
    ]
  },
  "Data Scientist": {
    track: "Data Scientist",
    demandScore: 85,
    salaryRange: "$85,000 - $170,000",
    growthRate: "+15% YoY",
    trendingKeywords: ["Data Engineering", "PySpark", "Snowflake", "Feature Stores", "Real-time Metrics"],
    overview: "Data Scientists are shifting focus from standalone spreadsheet-level processing to real-time stream data operations. High proficiency in extracting immediate business insights from massive continuous telemetry is paramount.",
    emergingSkills: [
      { name: "Real-time Stream Treatments", relevance: "Critical for handling continuous application event logs (Kafka, Flink)." },
      { name: "Snowflake Cloud Queries", relevance: "The primary high-scale warehouse tech used in global financial telemetry." }
    ]
  },
  "AI Engineer": {
    track: "AI Engineer",
    demandScore: 98,
    salaryRange: "$105,000 - $210,000",
    growthRate: "+32% YoY",
    trendingKeywords: ["LLMs", "RAG Systems", "AI Agents", "PyTorch", "Model Fine-Tuning", "Vector DBs"],
    overview: "The absolute highest demanding industry right now. With the explosion of generative capabilities like Gemini and open-weights models, developers who can orchestrate scalable agent systems, setup reliable Vector RAG layers, and maintain low inference latency are highly coveted.",
    emergingSkills: [
      { name: "Agentic Tool Describing", relevance: "Enabling models to execute API tasks and control structural backends." },
      { name: "RAG and Context Loading", relevance: "Injecting custom internal databases safely into the LLM logic thread." }
    ]
  },
  "Cybersecurity Analyst": {
    track: "Cybersecurity Analyst",
    demandScore: 92,
    salaryRange: "$80,000 - $160,000",
    growthRate: "+18% YoY",
    trendingKeywords: ["Zero Trust", "Cloud Security", "SecOps Automation", "Infiltration Testing", "Compliance"],
    overview: "With global digital transformations, malicious hacking incidents have escalated in complexity. Security operations center monitoring and proactive ethical testing are crucial pillars of safe enterprise operations.",
    emergingSkills: [
      { name: "Serverless IAM Constraints", relevance: "Verifying exact policy boundaries to block access points on code updates." },
      { name: "SIEM Automations", relevance: "Using script algorithms in Splunk to flag cyber threat routines immediately." }
    ]
  },
  "Cloud Engineer": {
    track: "Cloud Engineer",
    demandScore: 90,
    salaryRange: "$85,000 - $165,000",
    growthRate: "+14% YoY",
    trendingKeywords: ["Terraform", "Kubernetes", "DevOps Pipelines", "Serverless GCP", "Cost Optimizer"],
    overview: "Modern organizations want high flexibility with minimal cloud waste. Cloud engineering aims to configure highly flexible server structures via automation code (IaC) and coordinate server containers smoothly.",
    emergingSkills: [
      { name: "Terraform Infrastructure as Code", relevance: "Translating hardware settings into version-controlled text scripts." },
      { name: "Autonomous Kubernetes Clusters", relevance: "Continuous scaling parameters to adapt computing resources dynamically." }
    ]
  },
  "UI/UX Designer": {
    track: "UI/UX Designer",
    demandScore: 84,
    salaryRange: "$70,000 - $135,000",
    growthRate: "+9% YoY",
    trendingKeywords: ["Figma variables", "Design Systems Token", "Interactive Prototypes", "Inclusive A11y"],
    overview: "UI/UX focuses deeply on product differentiation and emotional alignment. Organizations rely on stunning, highly specialized interactive visual dashboards to engage and retain target audiences.",
    emergingSkills: [
      { name: "Dynamic Design Variables", relevance: "Creating modular color, spacing, and sizing rules to support multi-mode platforms." },
      { name: "Usability Testing Loops", relevance: "Extracting telemetry and running rapid interactive design sprints." }
    ]
  }
};

const PRESET_QUIZZES: Record<string, any[]> = {
  "Software Engineer": [
    { id: 1, question: "Which of the following data structures operates on a strict Last-In, First-Out (LIFO) order?", options: ["Queue", "Stack", "Binary Tree", "Linked List"], correctOptionIndex: 1, explanation: "A Stack pushes elements on top and pops from the top, sorting operations so that the last element added is the first one processed.", skillTag: "Data Structures" },
    { id: 2, question: "What is the primary benefit of Git branching in a software group?", options: ["It encrypts the source code.", "It speeds up computational compilation.", "It isolates working code updates without polluting main branch state.", "It optimizes relational database queries."], correctOptionIndex: 2, explanation: "Branches isolate changes, empowering developers to build features separately until they are tested and ready to merge into standard code.", skillTag: "Git & Collaboration" },
    { id: 3, question: "In computational complexity (Big O notation), what is the best description of O(1)?", options: ["Constant processing time", "Logarithmic execution cycles", "Linear scanning steps", "Quadratic loop processing"], correctOptionIndex: 0, explanation: "An O(1) algorithm completes its execution in consistent constant time, completely independent of the input size.", skillTag: "Algorithms" },
    { id: 4, question: "Which HTTP request verb is most appropriate for updating an existing database record?", options: ["GET", "POST", "PUT/PATCH", "DELETE"], correctOptionIndex: 2, explanation: "PUT or PATCH is standard for modifications, POST creates new objects, GET reads, and DELETE removes.", skillTag: "Web REST API" },
    { id: 5, question: "What is object-oriented encapsulation?", options: ["Grouping variables and dynamic methods into singular class bounds and limiting external visibility.", "A mechanism to convert code structures into binary numbers.", "A cloud resource grouping routine.", "An automated test structure."], correctOptionIndex: 0, explanation: "Encapsulation safeguards internal class states by isolating components and only exposing public interfaces.", skillTag: "Object-Oriented Programming" }
  ],
  "AI Engineer": [
    { id: 1, question: "What is Retrieval-Augmented Generation (RAG) primarily used for in modern GenAI apps?", options: ["Translating audio clips into text", "Injecting external specific databases dynamically into current LLM query prompts", "Running massive neural layers locally on minimal hardware devices", "Creating visual diagrams dynamically from raw audio"], correctOptionIndex: 1, explanation: "RAG connects secure external company documents or dynamic datasets to the prompt, ensuring the model references real, up-to-date facts.", skillTag: "RAG & LLM Integration" },
    { id: 2, question: "Which mathematically operations represents weight optimization in a neural network during backpropagation?", options: ["Linear Hash calculations", "Gradient Descent adjustments", "Circular Queue allocations", "DNS records resolution"], correctOptionIndex: 1, explanation: "Gradient descent computes weights adjustments in opposite vector directions of the evaluated calculated loss gradient.", skillTag: "Deep Learning Foundations" },
    { id: 3, question: "What represents a primary target utility of a Vector Database in AI systems?", options: ["Storing highly structural relational table keys", "Calculating standard linear equations instantly", "Storing high-dimension model embedding representations for similarity search", "Compiling standard typescript into computer binary code"], correctOptionIndex: 2, explanation: "Vector databases index embeddings so similarity searches (like cosine distances) can find related semantic text instantly.", skillTag: "Vector Databases" },
    { id: 4, question: "What does temperature control in LLM generate parameters specify?", options: ["Thermal CPU engine levels during inference", "Statistical randomness and creativity of next token outcomes", "The total size of neural network weights to load", "Audio frequency amplitude heights"], correctOptionIndex: 1, explanation: "Higher temperatures increase response randomness, whereas zero temperature secures absolute deterministic logical responses.", skillTag: "LLM Configuration" },
    { id: 5, question: "When designing multi-agent frameworks, what is critical to grant the AI agent to execute actions?", options: ["Hardware cooling controls", "Predefined text templates only", "Executable API Tools with schema definitions", "A physical chassis"], correctOptionIndex: 2, explanation: "Tools (as JSON function schemas) allow the agent model to choose to run specific server actions dynamically.", skillTag: "AI Agent Systems" }
  ]
};

// -------------------------------------------------------------
// API ROUTE DEFINITIONS
// -------------------------------------------------------------

// API 1: GET - General list of careers with introductory stats.
app.get("/api/careers/list", (req, res) => {
  const tracksList = Object.keys(PRESET_CAREER_DETAILS).map(key => ({
    name: key,
    matchPercentagePreset: PRESET_CAREER_DETAILS[key].matchPercentage,
    summaryShortcut: PRESET_CAREER_DETAILS[key].summary.substring(0, 110) + "..."
  }));
  res.json({ success: true, tracks: tracksList });
});

// API 2: POST - Recommend Career & Generate Roadmap (AI-Optimized)
app.post("/api/careers/recommend", async (req, res) => {
  const { interests, currentLevelSkill, year, college, targetTrack } = req.body;
  
  if (!targetTrack) {
    return res.status(400).json({ success: false, error: "Please choose a desired target Career Track to build a customized roadmap." });
  }

  // Attempt using Gemini API if a key is configured
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const geminiInstance = getGemini();
      const prompt = `
        You are an advanced AI Career Counselor specifically optimized for 1st Year Computer Science Engineering students.
        We need you to generate a fully customized Career Recommendation and step-by-step learning roadmap for:
        - Target Track: ${targetTrack}
        - Student Year: ${year || "1st Year CSE"}
        - Current Skill Profile: ${currentLevelSkill || "Beginner coder, limited web experience"}
        - Expressed Personal Interests: ${interests ? JSON.stringify(interests) : "unspecified interests"}

        Output your answer in strict, valid JSON format. Do not write any markdown codeblock headers like \`\`\`json. Only write the raw JSON directly beginning with { and ending with }.
        The JSON must match this TypeScript interface structure:
        {
          "track": "${targetTrack}",
          "matchPercentage": 75-99 range,
          "summary": "precise, supportive, highly professional 3-sentence summary targeting a 1st year CSE student",
          "whyThisFits": ["reason 1 relating to interests", "reason 2 in relation to track demands"],
          "skillsList": [
            { "skillName": "name", "category": "Languages|Core CS|Tools|Soft Skills", "studentScore": number (0-100), "industryStandard": number (0-100), "gapDescription": "what is missing and what to do" }
          ],
          "roadmap": [
            {
              "id": "phase-1",
              "title": "Phase Title",
              "phase": "Beginner|Intermediate|Advanced",
              "estimatedWeeks": number,
              "skillsAcquired": ["skill A", "skill B"],
              "description": "Short phase outline",
              "resources": [
                { "title": "resource title", "provider": "Coursera|YouTube|fCC|Google", "url": "URL link", "type": "free|cert|tutorial", "duration": "length", "difficulty": "Beginner|Intermediate|Advanced", "description": "Specific value" }
              ]
            }
          ],
          "suggestedProjects": [
            { "title": "Project Title", "description": "A high-fidelity project description targeting this track", "complexity": "Medium|Hard", "techStack": ["React", "Express", "Python"] }
          ]
        }
      `;

      const response = await geminiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      // Clean up potential markdown wrappers
      const cleanJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const calculatedResult = JSON.parse(cleanJson);
      return res.json({ success: true, source: "gemini-ai", data: calculatedResult });
    } catch (err: any) {
      console.error("Gemini Generation failed, falling back to rich presets: ", err?.message || err);
    }
  }

  // Fallback pattern if AI key missing or errors
  const fallbackData = PRESET_CAREER_DETAILS[targetTrack] || PRESET_CAREER_DETAILS["Software Engineer"];
  
  // Custom adjust the match score slightly based on custom inputs to show real-time dynamic behavior
  let adjustedScore = fallbackData.matchPercentage;
  if (interests && interests.length > 0) {
    adjustedScore = Math.min(99, fallbackData.matchPercentage + Math.floor(Math.random() * 5));
  }
  
  return res.json({ 
    success: true, 
    source: "preset-engine-fallback", 
    data: {
      ...fallbackData,
      matchPercentage: adjustedScore
    } 
  });
});

// API 3: GET - Fetch dynamic market trends
app.get("/api/market/trends", async (req, res) => {
  const targetTrack = req.query.track as string;
  const selectedTrack = targetTrack || "Software Engineer";

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const geminiInstance = getGemini();
      const prompt = `
        Provide critical, futuristic and realistic job market analysis for Computer Science Engineering students targeting: ${selectedTrack}.
        Include salary scales, growth indices, current hot tools, and suggestions of high-demand emerging skills (like AI, DevOps).
        Return strict JSON (no markdown block wrapper) matching this pattern:
        {
          "track": "${selectedTrack}",
          "demandScore": 0-100 score,
          "salaryRange": "expected range",
          "growthRate": "percentage increase",
          "trendingKeywords": ["keyword1", "keyword2", "keyword3"],
          "overview": "3-sentence high level summary",
          "emergingSkills": [
            { "name": "skill name", "relevance": "exact practical benefit" }
          ]
        }
      `;

      const response = await geminiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const result = JSON.parse(cleanJson);
      return res.json({ success: true, source: "gemini-ai", trends: result });
    } catch (err: any) {
      console.error("Gemini Trends API failed, using presets: ", err?.message || err);
    }
  }

  // Fallback
  const trendsResponse = PRESET_MARKET_TRENDS[selectedTrack] || PRESET_MARKET_TRENDS["Software Engineer"];
  return res.json({ success: true, source: "fallback-preset", trends: trendsResponse });
});

// API 4: GET - Fetch Assessment Quiz Questions
app.get("/api/quiz/questions", async (req, res) => {
  const targetTrack = req.query.track as string || "Software Engineer";

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const geminiInstance = getGemini();
      const prompt = `
        Generate a unique, high-quality skill assessment quiz consisting of exactly 5 multiple choice questions for first-year CSE students interested in: ${targetTrack}.
        Questions should test essential entry-level concepts under realistic industry contexts.
        Provide options, correct index (0 to 3), and short educational explanations why it is correct.
        
        Return strict JSON (no wrapping strings or markdown blocks):
        [
          {
            "id": 1,
            "question": "The question string",
            "options": ["A", "B", "C", "D"],
            "correctOptionIndex": number,
            "explanation": "Clear reason for correction",
            "skillTag": "Exact skill being tested"
          }
        ]
      `;

      const response = await geminiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const resultList = JSON.parse(cleanJson);
      if (Array.isArray(resultList) && resultList.length > 0) {
        return res.json({ success: true, source: "gemini-ai", questions: resultList });
      }
    } catch (err: any) {
      console.error("Quiz Generator failed: ", err?.message || err);
    }
  }

  // Fallback
  const localQuestions = PRESET_QUIZZES[targetTrack] || PRESET_QUIZZES["Software Engineer"];
  return res.json({ success: true, source: "fallback-presets", questions: localQuestions });
});

// API 5: POST - Evaluate quiz responses and output actionable student feedback
app.post("/api/quiz/evaluate", async (req, res) => {
  const { track, answers, questions } = req.body;
  if (!answers || !questions) {
    return res.status(400).json({ success: false, error: "Missing answers/questions mapping parameters." });
  }

  // Calculate local score
  let correctCount = 0;
  const total = questions.length;
  const skillGapsDetected: string[] = [];
  const changesList: any[] = [];

  questions.forEach((q: any, idx: number) => {
    const studentChoice = answers[idx];
    if (studentChoice === q.correctOptionIndex) {
      correctCount++;
      changesList.push({ skillName: q.skillTag, extraScore: 15 });
    } else {
      skillGapsDetected.push(`${q.skillTag}: Requires fundamental concept review based on question: "${q.question}"`);
      changesList.push({ skillName: q.skillTag, extraScore: -5 });
    }
  });

  const finalScorePercent = Math.round((correctCount / total) * 100);

  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
    try {
      const geminiInstance = getGemini();
      const prompt = `
        The student scored ${finalScorePercent}% (${correctCount} correct out of ${total}) on an assessment quiz for ${track}.
        Here are the evaluated questions with student answers:
        ${JSON.stringify(questions.map((q: any, i: number) => ({
          question: q.question,
          skillsTested: q.skillTag,
          correct: answers[i] === q.correctOptionIndex ? "YES" : "NO",
          explanation: q.explanation
        })))}

        Draft a support, highly encouraging 3-sentence expert educational diagnostic analysis and direct recommendations to address identified gaps for 1st Year CSE students.

        Format your answer in strict, valid JSON format matching:
        {
          "insights": "the diagnostic paragraphs",
          "gaps": ["gap description 1 with skill focus", "gap description 2 with focus"]
        }
      `;

      const response = await geminiInstance.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "";
      const cleanJson = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsed = JSON.parse(cleanJson);
      return res.json({
        success: true,
        source: "gemini-ai",
        evaluation: {
          score: finalScorePercent,
          correctCount,
          totalQuestions: total,
          insights: parsed.insights,
          skillGapsIdentified: parsed.gaps || skillGapsDetected,
          updatedSkillRatings: changesList
        }
      });
    } catch (err: any) {
      console.warn("AI diagnostic evaluation failed, using dynamic preset metrics: ", err);
    }
  }

  // Local feedback engine fallback
  const fallbackInsights = `Excellent effort! You scored ${finalScorePercent}% on this standard technical benchmark. You demonstrated steady comprehension in some areas of ${track}. To fully bridge your current gaps, pay extra attention to resource guidelines under the personalized roadmap steps, schedule weekly system practice, and configure active sandbox projects.`;

  return res.json({
    success: true,
    source: "fallback-preset",
    evaluation: {
      score: finalScorePercent,
      correctCount,
      totalQuestions: total,
      insights: fallbackInsights,
      skillGapsIdentified: skillGapsDetected.length > 0 ? skillGapsDetected : ["No critical missing knowledge flagged! Ready to proceed to practical project construction."],
      updatedSkillRatings: changesList
    }
  });
});

// Vite Middleware & static routes configuration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dynamically retrieve the Vite Dev server to keep production deployment runtime independent
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted for developer live previews.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving compiled production assets from: " + distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Career Compass AI server boot sequence complete on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Express Server boot process failed", err);
});
