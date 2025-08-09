#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// Removed external API dependencies - using built-in Claude Code capabilities only

// Using explicit declaration for Node.js process
declare const process: {
  exit: (code: number) => never;
  stderr: { write: (message: string) => void };
};

interface PromptSession {
  originalPrompt: string;
  context: string[];
  refinements: string[];
  language?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
  taskType?: 'code' | 'debug' | 'explain' | 'refactor' | 'test' | 'architecture';
}

const ENGINEER_PROMPT_TOOL: Tool = {
  name: "engineer_prompt",
  description: "Intelligently engineers and optimizes prompts for Claude Code, with interactive refinement and automatic optimization for maximum effectiveness.",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "The raw user prompt that needs engineering"
      },
      language: {
        type: "string",
        description: "The programming language (optional, will be detected if not provided)"
      },
      context: {
        type: "string", 
        description: "Additional context about the codebase or project (optional)"
      },
      interactive: {
        type: "boolean",
        description: "Whether to enable interactive Q&A refinement (default: false)"
      }
    },
    required: ["prompt"],
    title: "engineer_promptArguments"  
  }
};

const ASK_CLARIFICATION_TOOL: Tool = {
  name: "ask_clarification",
  description: "Ask clarifying questions to better understand user requirements and refine the prompt engineering process.",
  inputSchema: {
    type: "object",
    properties: {
      sessionId: {
        type: "string",
        description: "The session ID for this prompt engineering session"
      },
      questions: {
        type: "array",
        items: { type: "string" },
        description: "List of clarifying questions to ask the user"
      }
    },
    required: ["sessionId", "questions"],
    title: "ask_clarificationArguments"
  }
};

const ANSWER_QUESTIONS_TOOL: Tool = {
  name: "answer_questions",
  description: "Provide answers to clarifying questions and continue the prompt engineering process.",
  inputSchema: {
    type: "object", 
    properties: {
      sessionId: {
        type: "string",
        description: "The session ID for this prompt engineering session"
      },
      answers: {
        type: "array",
        items: { type: "string" },
        description: "Answers to the previously asked questions"
      }
    },
    required: ["sessionId", "answers"],
    title: "answer_questionsArguments"
  }
};

const AUTO_OPTIMIZE_TOOL: Tool = {
  name: "auto_optimize",
  description: "Automatically detects and optimizes natural language text for Claude Code. Use this when the user is writing conversational text that should be translated into an optimized prompt.",
  inputSchema: {
    type: "object",
    properties: {
      text: {
        type: "string",
        description: "The natural language text to analyze and potentially optimize"
      },
      context: {
        type: "string",
        description: "Any additional context about the current project or situation"
      },
      interactive: {
        type: "boolean",
        description: "Whether to enable interactive questioning if the prompt is unclear or needs more info (default: auto-detect based on complexity)"
      },
    },
    required: ["text"],
    title: "auto_optimizeArguments"
  }
};

// Session storage for interactive prompt engineering
const activeSessions: Map<string, PromptSession> = new Map();

// Server implementation 
const server = new Server(
  {
    name: "claude-code-prompt-engineer",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

function isEngineerPromptArgs(args: unknown): args is { 
  prompt: string; 
  language?: string;
  context?: string;
  interactive?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "prompt" in args &&
    typeof (args as { prompt: string }).prompt === "string"
  );
}

function isClarificationArgs(args: unknown): args is {
  sessionId: string;
  questions: string[];
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "sessionId" in args &&
    typeof (args as { sessionId: string }).sessionId === "string" &&
    "questions" in args &&
    Array.isArray((args as { questions: string[] }).questions)
  );
}

function isAnswerArgs(args: unknown): args is {
  sessionId: string;
  answers: string[];
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "sessionId" in args &&
    typeof (args as { sessionId: string }).sessionId === "string" &&
    "answers" in args &&
    Array.isArray((args as { answers: string[] }).answers)
  );
}

function generateSessionId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

function isNaturalLanguagePrompt(text: string): boolean {
  // Patterns that suggest this is natural language that should be optimized
  const promptIndicators = [
    // Direct requests
    /\b(help me|can you|please|could you|would you|i need|i want)\b/i,
    // Problem descriptions  
    /\b(issue|problem|bug|error|not working|broken|failing)\b/i,
    // Task requests
    /\b(create|build|make|add|implement|write|fix|update|change)\b/i,
    // Improvement requests
    /\b(improve|optimize|refactor|clean up|better|faster|slower)\b/i,
    // Questions
    /\b(how do|how can|what is|why is|where is|when should)\b/i,
    // Uncertainty markers
    /\b(not sure|unsure|confused|don't understand|struggling)\b/i,
    // Conversational patterns
    /\b(i'm|i've been|i have|i was|i think|i believe)\b/i,
  ];

  // Check if text matches prompt patterns
  const hasPromptIndicators = promptIndicators.some(pattern => pattern.test(text));
  
  // Additional heuristics
  const isQuestion = text.includes('?');
  const hasFirstPerson = /\b(i|me|my|mine)\b/i.test(text);
  const isConversational = text.length > 20 && (hasFirstPerson || text.includes(' '));
  const hasCodeTerms = /\b(function|component|api|database|server|frontend|backend|code|file|script)\b/i.test(text);
  
  return hasPromptIndicators || (isConversational && (isQuestion || hasCodeTerms));
}

function shouldAutoOptimize(text: string): { 
  shouldOptimize: boolean; 
  confidence: number; 
  reason: string; 
  needsQuestions: boolean;
  questioningReason?: string;
} {
  if (text.length < 10) {
    return { shouldOptimize: false, confidence: 0, reason: "Text too short", needsQuestions: false };
  }

  // Don't optimize if it's already a well-structured prompt
  if (text.includes('**') || text.includes('1.') || text.includes('- ')) {
    return { shouldOptimize: false, confidence: 0.1, reason: "Already structured", needsQuestions: false };
  }

  // Don't optimize if it's clearly just conversation
  const conversationPatterns = /\b(thanks|thank you|yes|no|ok|okay|sure|got it|makes sense)\b/i;
  if (conversationPatterns.test(text) && text.length < 50) {
    return { shouldOptimize: false, confidence: 0.2, reason: "Simple conversation", needsQuestions: false };
  }

  if (isNaturalLanguagePrompt(text)) {
    const confidence = Math.min(0.9, text.length / 100 + 0.3);
    
    // Determine if questions are needed
    const needsQuestions = shouldAskQuestions(text);
    const questioningReason = needsQuestions ? getQuestioningReason(text) : undefined;
    
    return { 
      shouldOptimize: true, 
      confidence, 
      reason: "Natural language prompt detected",
      needsQuestions,
      questioningReason
    };
  }

  return { shouldOptimize: false, confidence: 0.1, reason: "Not a prompt", needsQuestions: false };
}

function shouldAskQuestions(text: string): boolean {
  // Much more conservative approach - only ask when truly necessary
  
  // Critical uncertainty indicators that genuinely need clarification
  const criticalUncertaintyMarkers = /\b(not sure|unsure|don't know|unclear|confused|which one|what should|help me choose)\b/i;
  const hasUncertainty = criticalUncertaintyMarkers.test(text);
  
  // Extremely vague requests with no context
  const extremelyVague = text.length < 20 && /\b(help|fix|do|make)\b/i.test(text) && !/\b(function|component|file|error|bug)\b/i.test(text);
  
  // Only ask questions if:
  // 1. User explicitly expresses uncertainty
  // 2. Request is extremely vague and short
  return hasUncertainty || extremelyVague;
}

function getQuestioningReason(text: string): string {
  if (text.length < 30) {
    return "Request is too brief - needs more details";
  }
  
  if (/\b(not sure|unsure|don't know|unclear|confused)\b/i.test(text)) {
    return "User expressed uncertainty - clarification needed";
  }
  
  if (/\b(fix|optimize|improve|better|faster)\b/i.test(text)) {
    return "Vague improvement request - needs specific details";
  }
  
  if (/\b(issue|problem|not working)\b/i.test(text)) {
    return "Problem reported without details - need specifics";
  }
  
  return "Request needs clarification for best results";
}

async function detectLanguageAndTaskType(prompt: string): Promise<{ language?: string; taskType: string; complexity: string }> {
  const languagePatterns = {
    javascript: /\b(javascript|js|node|npm|react|vue|angular)\b/i,
    typescript: /\b(typescript|ts|tsx)\b/i,
    python: /\b(python|py|django|flask|pandas|numpy)\b/i,
    java: /\b(java|spring|maven|gradle)\b/i,
    cpp: /\b(c\+\+|cpp|cmake)\b/i,
    rust: /\b(rust|cargo|rustc)\b/i,
    go: /\b(golang|go|gin)\b/i,
    php: /\b(php|laravel|composer)\b/i,
    ruby: /\b(ruby|rails|gem)\b/i,
    csharp: /\b(c#|csharp|dotnet|\.net)\b/i,
  };

  const taskPatterns = {
    debug: /\b(debug|fix|error|bug|issue|problem|not working)\b/i,
    test: /\b(test|testing|unit test|integration test|jest|pytest)\b/i,
    refactor: /\b(refactor|clean|optimize|improve|restructure)\b/i,
    explain: /\b(explain|understand|how does|what is|why)\b/i,
    architecture: /\b(architecture|design|pattern|structure|system)\b/i,
  };

  let language: string | undefined;
  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(prompt)) {
      language = lang;
      break;
    }
  }

  let taskType = 'code';
  for (const [task, pattern] of Object.entries(taskPatterns)) {
    if (pattern.test(prompt)) {
      taskType = task;
      break;
    }
  }

  const complexity = prompt.length > 200 || /\b(complex|advanced|enterprise|scale)\b/i.test(prompt) ? 'complex' : 
                    prompt.length > 50 ? 'moderate' : 'simple';

  return { language, taskType, complexity };
}

async function generateClarifyingQuestions(prompt: string, language?: string, context?: string): Promise<string[]> {
  // Generate focused questions based on prompt analysis - no API calls
  const questions: string[] = [];
  
  // Analyze what type of clarification is needed
  if (/\b(fix|error|bug|issue|problem)\b/i.test(prompt) && prompt.length < 50) {
    questions.push("What specific error or problem are you encountering?");
    questions.push("What should the expected behavior be?");
  }
  
  if (/\b(improve|optimize|better)\b/i.test(prompt) && !/\b(performance|speed|memory|size)\b/i.test(prompt)) {
    questions.push("What specific aspect needs improvement (performance, readability, maintainability)?");
  }
  
  if (/\b(app|application|system|project)\b/i.test(prompt) && !language) {
    questions.push("What technology stack or programming language are you using?");
  }
  
  // Default questions if none of the above apply
  if (questions.length === 0) {
    questions.push(
      "What specific outcome are you looking for?",
      "Are there any constraints or requirements I should know about?"
    );
  }
  
  return questions.slice(0, 3); // Limit to 3 questions max
}

function generateOptimizedPrompt(
  prompt: string,
  language?: string, 
  context?: string,
  refinements: string[] = []
): string {
  const detectedLanguage = language || detectLanguageSync(prompt);
  const taskType = detectTaskTypeSync(prompt);
  const complexity = detectComplexitySync(prompt);

  // Build enhanced prompt directly instead of meta-prompting
  let optimizedPrompt = '';
  
  // Add context if provided
  if (context) {
    optimizedPrompt += `**Context:** ${context}\n\n`;
  }
  
  // Enhance the original prompt based on task type
  if (taskType === 'debug') {
    optimizedPrompt += `**Task:** Debug and fix the following issue:\n\n${prompt}\n\n**Requirements:**\n`;
    optimizedPrompt += `- Use file search tools (Grep/Glob) to locate relevant code\n`;
    optimizedPrompt += `- Read and analyze the problematic files\n`;
    optimizedPrompt += `- Identify the root cause and implement a fix\n`;
    optimizedPrompt += `- Test the solution if possible\n`;
  } else if (taskType === 'refactor') {
    optimizedPrompt += `**Task:** Refactor and improve the following code:\n\n${prompt}\n\n**Requirements:**\n`;
    optimizedPrompt += `- Maintain existing functionality\n`;
    optimizedPrompt += `- Follow ${detectedLanguage} best practices\n`;
    optimizedPrompt += `- Improve code readability and maintainability\n`;
    optimizedPrompt += `- Use existing project patterns and conventions\n`;
  } else if (taskType === 'test') {
    optimizedPrompt += `**Task:** Create comprehensive tests for:\n\n${prompt}\n\n**Requirements:**\n`;
    optimizedPrompt += `- Follow the project's existing test patterns\n`;
    optimizedPrompt += `- Cover edge cases and error scenarios\n`;
    optimizedPrompt += `- Use appropriate testing framework for ${detectedLanguage}\n`;
  } else {
    // Generic enhancement
    optimizedPrompt += `**Task:** ${prompt}\n\n**Implementation Requirements:**\n`;
    optimizedPrompt += `- Follow ${detectedLanguage} best practices and conventions\n`;
    optimizedPrompt += `- Use existing project patterns where applicable\n`;
    if (complexity === 'complex') {
      optimizedPrompt += `- Break down into manageable steps using TodoWrite tool\n`;
    }
    optimizedPrompt += `- Ensure code quality and maintainability\n`;
  }
  
  // Add refinements if provided
  if (refinements.length > 0) {
    optimizedPrompt += `\n**Additional Requirements:**\n${refinements.map(r => `- ${r}`).join('\n')}\n`;
  }
  
  // Add execution suggestion
  optimizedPrompt += `\n**Ready to proceed with this task?**`;
  
  return optimizedPrompt;
}

function detectLanguageSync(prompt: string): string {
  const languagePatterns = {
    javascript: /\b(javascript|js|node|npm|react|vue|angular)\b/i,
    typescript: /\b(typescript|ts|tsx)\b/i,
    python: /\b(python|py|django|flask|pandas|numpy)\b/i,
    java: /\b(java|spring|maven|gradle)\b/i,
    rust: /\b(rust|cargo|rustc)\b/i,
    go: /\b(golang|go|gin)\b/i,
  };

  for (const [lang, pattern] of Object.entries(languagePatterns)) {
    if (pattern.test(prompt)) {
      return lang;
    }
  }
  return 'general';
}

function detectTaskTypeSync(prompt: string): string {
  const taskPatterns = {
    debug: /\b(debug|fix|error|bug|issue|problem|not working)\b/i,
    test: /\b(test|testing|unit test|integration test|jest|pytest)\b/i,
    refactor: /\b(refactor|clean|optimize|improve|restructure)\b/i,
    explain: /\b(explain|understand|how does|what is|why)\b/i,
    architecture: /\b(architecture|design|pattern|structure|system)\b/i,
  };

  for (const [task, pattern] of Object.entries(taskPatterns)) {
    if (pattern.test(prompt)) {
      return task;
    }
  }
  return 'code';
}

function detectComplexitySync(prompt: string): string {
  return prompt.length > 200 || /\b(complex|advanced|enterprise|scale)\b/i.test(prompt) ? 'complex' : 
         prompt.length > 50 ? 'moderate' : 'simple';
}

async function engineerPrompt(
  prompt: string, 
  language?: string, 
  context?: string, 
  refinements: string[] = []
): Promise<string> {
  // Always use built-in optimization - no external API calls
  return generateOptimizedPrompt(prompt, language, context, refinements);
}

async function autoOptimizeText(
  text: string, 
  context?: string, 
  forceInteractive?: boolean
): Promise<{ 
  shouldOptimize: boolean; 
  optimizedPrompt?: string; 
  analysis: any; 
  needsQuestions?: boolean;
  questions?: string[];
  sessionId?: string;
}> {
  const analysis = shouldAutoOptimize(text);
  
  if (!analysis.shouldOptimize) {
    return { shouldOptimize: false, analysis };
  }

  const detectedInfo = await detectLanguageAndTaskType(text);
  
  // Check if we should ask questions (either forced or auto-detected)
  const shouldAskQuestions = forceInteractive || analysis.needsQuestions;
  
  if (shouldAskQuestions) {
    try {
      const questions = await generateClarifyingQuestions(text, detectedInfo.language, context);
      const sessionId = generateSessionId();
      
      // Store session for later use
      activeSessions.set(sessionId, {
        originalPrompt: text,
        context: context ? [context] : [],
        refinements: [],
        language: detectedInfo.language,
        complexity: detectedInfo.complexity as any,
        taskType: detectedInfo.taskType as any
      });
      
      return {
        shouldOptimize: true,
        analysis: {
          ...analysis,
          detectedLanguage: detectedInfo.language,
          taskType: detectedInfo.taskType,
          complexity: detectedInfo.complexity
        },
        needsQuestions: true,
        questions,
        sessionId
      };
    } catch (error) {
      // If question generation fails, fall back to direct optimization
      console.error('Question generation failed, falling back to direct optimization:', error);
    }
  }

  // Direct optimization (no questions needed or questions failed)
  try {
    const optimizedPrompt = await engineerPrompt(text, detectedInfo.language, context);
    
    return {
      shouldOptimize: true,
      optimizedPrompt,
      analysis: {
        ...analysis,
        detectedLanguage: detectedInfo.language,
        taskType: detectedInfo.taskType,
        complexity: detectedInfo.complexity,
        method: 'built-in'
      }
    };
  } catch (error) {
    // If optimization fails, still return the analysis
    return { 
      shouldOptimize: true, 
      analysis: { 
        ...analysis, 
        error: error instanceof Error ? error.message : String(error) 
      } 
    };
  }
}

// Type guard for auto_optimize
function isAutoOptimizeArgs(args: unknown): args is {
  text: string;
  context?: string;
  interactive?: boolean;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "text" in args &&
    typeof (args as { text: string }).text === "string"
  );
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [ENGINEER_PROMPT_TOOL, ASK_CLARIFICATION_TOOL, ANSWER_QUESTIONS_TOOL, AUTO_OPTIMIZE_TOOL],  
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (!args) {
      throw new Error("No arguments provided");
    }

    switch (name) {
      case "engineer_prompt": {
        if (!isEngineerPromptArgs(args)) {
          throw new Error("Invalid arguments for engineer_prompt");
        }
        
        const { prompt, language, context, interactive } = args;
        
        if (interactive) {
          // Start interactive session
          const sessionId = generateSessionId();
          const detectedInfo = await detectLanguageAndTaskType(prompt);
          const questions = await generateClarifyingQuestions(prompt, language || detectedInfo.language, context);
          
          activeSessions.set(sessionId, {
            originalPrompt: prompt,
            context: context ? [context] : [],
            refinements: [],
            language: language || detectedInfo.language,
            complexity: detectedInfo.complexity as any,
            taskType: detectedInfo.taskType as any
          });
          
          return {
            content: [{ 
              type: "text", 
              text: `Interactive prompt engineering session started (ID: ${sessionId}).\n\nTo help create the best prompt for Claude Code, please answer these questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nUse the answer_questions tool with session ID "${sessionId}" to provide your answers.`
            }],
            isError: false,
          };
        } else {
          // Direct prompt engineering
          const engineeredPrompt = await engineerPrompt(prompt, language, context);
          return {
            content: [{ 
              type: "text", 
              text: `**Optimized Prompt for Claude Code:**\n\n${engineeredPrompt}\n\n**Are you ready to proceed with this task?**`
            }],
            isError: false,
          };
        }
      }

      case "ask_clarification": {
        if (!isClarificationArgs(args)) {
          throw new Error("Invalid arguments for ask_clarification");
        }
        
        const { sessionId, questions } = args;
        return {
          content: [{ 
            type: "text", 
            text: `Please answer these clarifying questions:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nUse the answer_questions tool with session ID "${sessionId}" when ready.`
          }],
          isError: false,
        };
      }

      case "answer_questions": {
        if (!isAnswerArgs(args)) {
          throw new Error("Invalid arguments for answer_questions");
        }
        
        const { sessionId, answers } = args;
        const session = activeSessions.get(sessionId);
        
        if (!session) {
          throw new Error(`Session ${sessionId} not found`);
        }
        
        // Update session with answers
        session.refinements.push(...answers);
        
        // Generate final engineered prompt
        const engineeredPrompt = await engineerPrompt(
          session.originalPrompt, 
          session.language, 
          session.context.join('\n'), 
          session.refinements
        );
        
        // Clean up session
        activeSessions.delete(sessionId);
        
        return {
          content: [{ 
            type: "text", 
            text: `**Final Optimized Prompt for Claude Code:**\n\n${engineeredPrompt}\n\n**Are you ready to use this prompt?**`
          }],
          isError: false,
        };
      }

      case "auto_optimize": {
        if (!isAutoOptimizeArgs(args)) {
          throw new Error("Invalid arguments for auto_optimize");
        }
        
        const { text, context, interactive } = args;
        const result = await autoOptimizeText(text, context, interactive);
        
        if (!result.shouldOptimize) {
          return {
            content: [{ 
              type: "text", 
              text: `**Analysis:** This text doesn't appear to need optimization.\n\nReason: ${result.analysis.reason}\nConfidence: ${(result.analysis.confidence * 100).toFixed(1)}%\n\n**Original text:** "${text}"`
            }],
            isError: false,
          };
        }
        
        // If questions are needed, start interactive session
        if (result.needsQuestions && result.questions && result.sessionId) {
          return {
            content: [{ 
              type: "text", 
              text: `**🤔 I need more information to optimize this effectively!**\n\n**Analysis:** ${result.analysis.questioningReason || 'Request needs clarification'}\n\n**Questions to help me create the best prompt:**\n\n${result.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\n**Next Step:** Use the answer_questions tool with session ID "${result.sessionId}" to provide your answers.\n\n---\n**Detected:** ${result.analysis.detectedLanguage || 'General'} | ${result.analysis.taskType} | ${result.analysis.complexity}`
            }],
            isError: false,
          };
        }
        
        // Direct optimization result
        if (result.optimizedPrompt) {
          const analysis = result.analysis;
          return {
            content: [{ 
              type: "text", 
              text: `**🚀 Auto-Optimized Prompt for Claude Code:**\n\n${result.optimizedPrompt}\n\n**Are you ready to use this prompt?**`
            }],
            isError: false,
          };
        } else {
          return {
            content: [{ 
              type: "text", 
              text: `**Analysis:** This text appears to be a prompt that should be optimized, but optimization failed.\n\nReason: ${result.analysis.reason}\nError: ${result.analysis.error || 'Unknown error'}\n\n**Original text:** "${text}"`
            }],
            isError: false,
          };
        }
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Claude Code Prompt Engineer MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});