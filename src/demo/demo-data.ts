// Demo dataset for PaperVault public demo mode
// This is a static dataset that works without database/FS

export interface DemoPaper {
  id: string;
  title: string;
  authors: string;
  year: number;
  venueType: string;
  status: string;
  abstract: string;
  doi?: string;
  arxivId?: string;
  summary?: string;
  bibtex?: string;
  createdAt: string;
  updatedAt: string;
  citationsCount?: number;
  citationsStatus?: string;
}

export interface DemoProject {
  id: string;
  name: string;
  description?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  paperIds: string[];
  docIds: string[];
  todoIds: string[];
}

export interface DemoDoc {
  id: string;
  projectId: string;
  paperId?: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTodo {
  id: string;
  projectId: string;
  title: string;
  dueDate: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoTag {
  id: string;
  name: string;
  createdAt: string;
}

export interface DemoCitation {
  id: string;
  sourcePaperId: string;
  raw: string;
  title?: string;
  authors?: string;
  year?: number;
  venue?: string;
  doi?: string;
  arxivId?: string;
  url?: string;
}

export interface DemoData {
  papers: DemoPaper[];
  projects: DemoProject[];
  docs: DemoDoc[];
  todos: DemoTodo[];
  tags: DemoTag[];
  citations: DemoCitation[];
  paperTags: Array<{ paperId: string; tagId: string }>;
  docTags: Array<{ docId: string; tagId: string }>;
}

export const demoData: DemoData = {
  papers: [
    {
      id: "demo-paper-1",
      title: "WASP: Benchmarking Web Agent Security Against Prompt Injection Attacks",
      authors: "Ivan Evtimov, FAIR at Meta; Arman Zharmagambetov, FAIR at Meta; Aaron Grattafiori",
      year: 2025,
      venueType: "NEURIPS",
      status: "READY",
      abstract: "Web agents powered by large language models (LLMs) are increasingly being deployed to interact with web applications. However, these agents are vulnerable to prompt injection attacks where malicious websites can inject instructions that override the agent's intended behavior. We present WASP, a comprehensive benchmark for evaluating web agent security against prompt injection attacks.",
      doi: "10.1234/example.doi",
      summary: "This paper introduces WASP, a benchmark for testing web agent security. Key findings include vulnerabilities in current LLM-based agents and proposed mitigation strategies.",
      bibtex: "@inproceedings{evtimov2025wasp,\n  title={WASP: Benchmarking Web Agent Security Against Prompt Injection Attacks},\n  author={Evtimov, Ivan and Zharmagambetov, Arman and Grattafiori, Aaron},\n  booktitle={Advances in Neural Information Processing Systems},\n  year={2025}\n}",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
      citationsCount: 12,
      citationsStatus: "DONE",
    },
    {
      id: "demo-paper-2",
      title: "Zero-Shot Embedding Drift Detection: A Lightweight Defense Against Prompt Injections in LLMs",
      authors: "Tingwei Zhang, Cornell University; Rishi Jha, Cornell University; Eugene Bagdasaryan, University of Massachusetts Amherst; Vitaly Shmatikov, Cornell Tech",
      year: 2024,
      venueType: "USENIX_SECURITY",
      status: "SKIMMED",
      abstract: "Prompt injection attacks pose a significant threat to LLM-based applications. We propose a lightweight defense mechanism that detects embedding drift in zero-shot scenarios, enabling early detection of malicious prompt injections without requiring labeled training data.",
      summary: "Novel approach to detecting prompt injections by monitoring embedding drift. Shows promise for real-time defense.",
      createdAt: "2025-01-14T09:00:00Z",
      updatedAt: "2025-01-16T14:30:00Z",
      citationsCount: 8,
      citationsStatus: "DONE",
    },
    {
      id: "demo-paper-3",
      title: "AidFuzzer: Adaptive Interrupt-Driven Firmware Fuzzing",
      authors: "John Doe, University Example; Jane Smith, Research Lab",
      year: 2024,
      venueType: "CHI",
      status: "TO_READ",
      abstract: "Firmware security is critical for embedded systems. We present AidFuzzer, an adaptive fuzzing framework that leverages interrupt-driven testing to discover vulnerabilities in firmware more efficiently than traditional approaches.",
      createdAt: "2025-01-13T08:00:00Z",
      updatedAt: "2025-01-13T08:00:00Z",
    },
    {
      id: "demo-paper-4",
      title: "Scaling Laws for Task-Optimized Models of the Primate Visual Ventral Stream",
      authors: "Neuroscience Research Team",
      year: 2024,
      venueType: "NEURIPS",
      status: "DEEP_READ",
      abstract: "Understanding how neural networks scale is crucial for building better models. We investigate scaling laws in task-optimized models that mimic the primate visual system, revealing insights into both biological and artificial vision.",
      summary: "Fascinating work connecting neural scaling laws to biological vision. Important implications for both neuroscience and AI.",
      createdAt: "2025-01-12T07:00:00Z",
      updatedAt: "2025-01-18T16:00:00Z",
      citationsCount: 15,
      citationsStatus: "DONE",
    },
    {
      id: "demo-paper-5",
      title: "Large Language Models for Code Generation: A Survey",
      authors: "AI Research Collective",
      year: 2024,
      venueType: "IEEE_GENERIC",
      status: "READY",
      abstract: "This survey provides a comprehensive overview of large language models applied to code generation tasks, covering architectures, training methods, evaluation metrics, and current challenges.",
      createdAt: "2025-01-11T06:00:00Z",
      updatedAt: "2025-01-11T06:00:00Z",
    },
    {
      id: "demo-paper-6",
      title: "Privacy-Preserving Machine Learning with Homomorphic Encryption",
      authors: "Cryptography Lab",
      year: 2023,
      venueType: "CCS",
      status: "INTEGRATED",
      abstract: "We explore the application of homomorphic encryption to enable privacy-preserving machine learning, allowing model training and inference on encrypted data without compromising privacy.",
      summary: "Excellent overview of homomorphic encryption for ML. Practical implementations show promise for sensitive data scenarios.",
      createdAt: "2025-01-10T05:00:00Z",
      updatedAt: "2025-01-17T12:00:00Z",
      citationsCount: 20,
      citationsStatus: "DONE",
    },
    {
      id: "demo-paper-7",
      title: "Graph Neural Networks for Molecular Property Prediction",
      authors: "Chemistry AI Team",
      year: 2024,
      venueType: "ICML",
      status: "READY",
      abstract: "Graph neural networks have shown remarkable success in molecular property prediction. We present a novel architecture that captures both local and global molecular structures more effectively.",
      createdAt: "2025-01-09T04:00:00Z",
      updatedAt: "2025-01-09T04:00:00Z",
    },
    {
      id: "demo-paper-8",
      title: "Attention Mechanisms in Transformer Architectures: A Comprehensive Analysis",
      authors: "Deep Learning Research Group",
      year: 2024,
      venueType: "ICLR",
      status: "SKIMMED",
      abstract: "We provide a detailed analysis of attention mechanisms in transformer architectures, examining different variants and their impact on model performance across various tasks.",
      createdAt: "2025-01-08T03:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
  ],
  projects: [
    {
      id: "demo-project-1",
      name: "Web Agent Security Research",
      description: "Investigating security vulnerabilities in LLM-based web agents",
      notes: "Focus on prompt injection attacks and defense mechanisms. Key papers: WASP and Zero-Shot Embedding Drift Detection.",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-18T16:00:00Z",
      paperIds: ["demo-paper-1", "demo-paper-2"],
      docIds: ["demo-doc-1", "demo-doc-2"],
      todoIds: ["demo-todo-1", "demo-todo-2"],
    },
    {
      id: "demo-project-2",
      name: "Neural Scaling Laws",
      description: "Understanding scaling behavior in neural networks",
      notes: "Exploring connections between biological and artificial vision systems.",
      createdAt: "2025-01-12T07:00:00Z",
      updatedAt: "2025-01-18T16:00:00Z",
      paperIds: ["demo-paper-4"],
      docIds: ["demo-doc-3"],
      todoIds: ["demo-todo-3"],
    },
    {
      id: "demo-project-3",
      name: "Privacy-Preserving ML",
      description: "Research on homomorphic encryption for machine learning",
      notes: "Evaluating practical implementations and performance trade-offs.",
      createdAt: "2025-01-10T05:00:00Z",
      updatedAt: "2025-01-17T12:00:00Z",
      paperIds: ["demo-paper-6"],
      docIds: [],
      todoIds: [],
    },
  ],
  docs: [
    {
      id: "demo-doc-1",
      projectId: "demo-project-1",
      paperId: "demo-paper-1",
      title: "WASP Benchmark Analysis",
      content: "## Key Findings\n\n1. Current web agents are vulnerable to prompt injection\n2. Proposed benchmark covers multiple attack vectors\n3. Defense mechanisms show promise but need refinement\n\n## Next Steps\n\n- Evaluate defense strategies\n- Test on real-world applications",
      createdAt: "2025-01-15T11:00:00Z",
      updatedAt: "2025-01-16T14:00:00Z",
    },
    {
      id: "demo-doc-2",
      projectId: "demo-project-1",
      paperId: "demo-paper-2",
      title: "Embedding Drift Detection Notes",
      content: "## Zero-Shot Approach\n\nThe embedding drift detection method is particularly interesting because it doesn't require labeled training data. This makes it practical for real-time deployment.\n\n## Implementation Considerations\n\n- Computational overhead is minimal\n- Works across different LLM architectures\n- Can be integrated into existing systems",
      createdAt: "2025-01-14T10:00:00Z",
      updatedAt: "2025-01-15T15:00:00Z",
    },
    {
      id: "demo-doc-3",
      projectId: "demo-project-2",
      title: "Scaling Laws Research Notes",
      content: "## Biological Connections\n\nThe parallels between artificial and biological vision systems are striking. This suggests that scaling laws might be fundamental to how neural systems process information.\n\n## Implications\n\n- Better understanding of biological vision\n- Improved model architectures\n- More efficient training strategies",
      createdAt: "2025-01-12T08:00:00Z",
      updatedAt: "2025-01-18T16:00:00Z",
    },
  ],
  todos: [
    {
      id: "demo-todo-1",
      projectId: "demo-project-1",
      title: "Review WASP benchmark results",
      dueDate: "2025-01-25T00:00:00Z",
      status: "OPEN",
      notes: "Focus on attack success rates",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "demo-todo-2",
      projectId: "demo-project-1",
      title: "Implement embedding drift detector prototype",
      dueDate: "2025-01-30T00:00:00Z",
      status: "OPEN",
      createdAt: "2025-01-15T10:00:00Z",
      updatedAt: "2025-01-15T10:00:00Z",
    },
    {
      id: "demo-todo-3",
      projectId: "demo-project-2",
      title: "Write summary of scaling laws paper",
      dueDate: "2025-01-22T00:00:00Z",
      status: "DONE",
      createdAt: "2025-01-12T07:00:00Z",
      updatedAt: "2025-01-18T16:00:00Z",
    },
  ],
  tags: [
    { id: "demo-tag-1", name: "Security", createdAt: "2025-01-15T10:00:00Z" },
    { id: "demo-tag-2", name: "LLMs", createdAt: "2025-01-15T10:00:00Z" },
    { id: "demo-tag-3", name: "Prompt Injection", createdAt: "2025-01-15T10:00:00Z" },
    { id: "demo-tag-4", name: "Neural Networks", createdAt: "2025-01-12T07:00:00Z" },
    { id: "demo-tag-5", name: "Vision", createdAt: "2025-01-12T07:00:00Z" },
    { id: "demo-tag-6", name: "Privacy", createdAt: "2025-01-10T05:00:00Z" },
    { id: "demo-tag-7", name: "Encryption", createdAt: "2025-01-10T05:00:00Z" },
    { id: "demo-tag-8", name: "Machine Learning", createdAt: "2025-01-09T04:00:00Z" },
    { id: "demo-tag-9", name: "Graph Neural Networks", createdAt: "2025-01-09T04:00:00Z" },
    { id: "demo-tag-10", name: "Transformers", createdAt: "2025-01-08T03:00:00Z" },
  ],
  citations: [
    {
      id: "demo-citation-1",
      sourcePaperId: "demo-paper-1",
      raw: "Evtimov et al. (2025) WASP: Benchmarking Web Agent Security",
      title: "WASP: Benchmarking Web Agent Security Against Prompt Injection Attacks",
      authors: "Ivan Evtimov, Arman Zharmagambetov, Aaron Grattafiori",
      year: 2025,
      venue: "NEURIPS",
    },
    {
      id: "demo-citation-2",
      sourcePaperId: "demo-paper-1",
      raw: "Zhang et al. (2024) Zero-Shot Embedding Drift Detection",
      title: "Zero-Shot Embedding Drift Detection: A Lightweight Defense Against Prompt Injections",
      authors: "Tingwei Zhang, Rishi Jha, Eugene Bagdasaryan, Vitaly Shmatikov",
      year: 2024,
      venue: "USENIX Security",
    },
  ],
  paperTags: [
    { paperId: "demo-paper-1", tagId: "demo-tag-1" },
    { paperId: "demo-paper-1", tagId: "demo-tag-2" },
    { paperId: "demo-paper-1", tagId: "demo-tag-3" },
    { paperId: "demo-paper-2", tagId: "demo-tag-1" },
    { paperId: "demo-paper-2", tagId: "demo-tag-2" },
    { paperId: "demo-paper-4", tagId: "demo-tag-4" },
    { paperId: "demo-paper-4", tagId: "demo-tag-5" },
    { paperId: "demo-paper-6", tagId: "demo-tag-6" },
    { paperId: "demo-paper-6", tagId: "demo-tag-7" },
    { paperId: "demo-paper-7", tagId: "demo-tag-8" },
    { paperId: "demo-paper-7", tagId: "demo-tag-9" },
    { paperId: "demo-paper-8", tagId: "demo-tag-8" },
    { paperId: "demo-paper-8", tagId: "demo-tag-10" },
  ],
  docTags: [
    { docId: "demo-doc-1", tagId: "demo-tag-1" },
    { docId: "demo-doc-1", tagId: "demo-tag-3" },
    { docId: "demo-doc-2", tagId: "demo-tag-2" },
  ],
};
