# Claude Code Prompt Engineer MCP Server

An advanced Model Context Protocol (MCP) server that intelligently engineers and optimizes prompts for Claude Code, with interactive refinement capabilities and automatic optimization.

## Features

### 🚀 **Intelligent Prompt Engineering**
- Automatically detects programming language and task type
- Optimizes prompts specifically for Claude Code's capabilities
- Leverages knowledge of Claude Code's tools and workflows

### 🤖 **Interactive Refinement**
- Q&A-based prompt clarification system
- Context-aware question generation
- Session-based refinement process

### ⚡ **Automatic Optimization**
- Language-specific prompt enhancement
- Task complexity detection
- Claude Code capability awareness

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Environment Variable
Make sure your `ANTHROPIC_API_KEY` is set in your environment:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

### 3. MCP Configuration
The server is automatically configured in your `~/.mcp.json` file as `prompt-engineer`.

## Usage with Claude Code

### 🎯 **Natural Language Auto-Optimization (Recommended)**
Just type naturally - the system detects and optimizes automatically, asking questions when needed:

**Simple/Clear Request (Direct Optimization):**
```
/prompt-engineer auto_optimize text="create a React component for user profile display with avatar and name"
```

**Vague Request (Auto-Questions):**
```  
/prompt-engineer auto_optimize text="fix my app"
```
→ System detects vagueness and automatically asks clarifying questions

**Force Interactive Mode:**
```
/prompt-engineer auto_optimize text="optimize performance" interactive=true
```

### Basic Prompt Engineering
```
/prompt-engineer engineer_prompt prompt="fix this bug" language="typescript"
```

### Interactive Mode (For Complex Requests)
```
/prompt-engineer engineer_prompt prompt="create a new feature" interactive=true
```

### With Context
```
/prompt-engineer engineer_prompt prompt="optimize performance" context="React app with 10k users" language="javascript"
```

## Available Tools

### `auto_optimize` ⭐ **Primary Tool**
Automatically detects and optimizes natural language text:
- `text` (required): Your natural language text/request  
- `context` (optional): Additional project context

### `engineer_prompt`
Manual prompt engineering with specific parameters:
- `prompt` (required): The raw user prompt that needs engineering
- `language` (optional): Programming language (auto-detected if not provided)
- `context` (optional): Additional project context
- `interactive` (optional): Enable Q&A refinement process

### `answer_questions`
Used to provide answers during interactive sessions:
- `sessionId` (required): Session ID from interactive mode
- `answers` (required): Array of answers to the questions

## How It Works

### 1. **Natural Language Detection**
The system automatically identifies when your text is natural language that needs optimization by detecting:
- **Request patterns**: "help me", "can you", "i need", "i want"
- **Problem descriptions**: "issue", "bug", "not working", "broken"  
- **Task indicators**: "create", "build", "fix", "optimize"
- **Questions**: "how do", "what is", "why is"
- **Conversational markers**: "i'm", "i think", "not sure"

**🤔 Automatic Questioning Triggers:**
The system asks clarifying questions when it detects:
- **Vague requests**: "fix this", "make it better", "optimize my code"
- **Brief requests**: Very short text that lacks details
- **Uncertainty markers**: "not sure", "don't know", "confused"
- **General terms**: "app", "system", "project" without specifics

### 2. **Language & Task Detection**
Once identified as a prompt, the system analyzes to detect:
- Programming language (JavaScript, Python, TypeScript, etc.)
- Task type (debug, test, refactor, explain, architecture)
- Complexity level (simple, moderate, complex)

### 3. **Claude Code Optimization**
Prompts are optimized knowing Claude Code's capabilities:
- File system operations (Read, Write, Edit)
- Code search (Grep, Glob patterns)  
- Git operations and workflow management
- Todo list management for complex tasks
- Browser automation via Playwright MCP
- GitHub integration

### 4. **Interactive Refinement**
When `interactive=true`, the system:
- Generates clarifying questions based on your prompt
- Creates a session to track the conversation
- Refines the prompt based on your answers
- Delivers a highly optimized final prompt

## Example Workflows

### 🎯 **Natural Language Auto-Optimization**

**Input:** Your natural language text
```
"i often write out sentences or things as im doing now, that would be my prompt to fix....i need my natural language translated to a prompt"
```

**Command:**
```
/prompt-engineer auto_optimize text="i often write out sentences or things as im doing now, that would be my prompt to fix....i need my natural language translated to a prompt"
```

**Output:**
```
🚀 Auto-Optimized Prompt for Claude Code:

I need you to help me set up an automated system that can translate my natural, conversational writing style into optimized prompts for Claude Code. Here's what I need:

**Context:**
- I often write in a stream-of-consciousness style with incomplete sentences
- My requests are usually buried in casual language that needs to be extracted and structured
- I want this to work seamlessly without having to manually reformat my thoughts

**Tasks:**
1. **Natural Language Processing Setup:**
   - Create a system that can detect when my casual writing contains actionable requests
   - Build pattern recognition for common request types (fix, create, optimize, explain)
   - Implement automatic extraction of the core technical requirements

2. **Prompt Optimization Pipeline:**
   - Transform informal language into structured, actionable prompts
   - Add proper context and constraints that Claude Code needs
   - Ensure the optimized prompts leverage Claude Code's file system and tool capabilities

**Expected Outcome:**
A system where I can write naturally and get back polished, effective prompts that Claude Code can execute efficiently.

---
Analysis:
- Detected Language: General
- Task Type: code  
- Complexity: complex
- Confidence: 87.3%
```

### 🤖 **Interactive Mode Example**

### Input:
```
"make my app faster"
```

### Interactive Questions:
1. What specific performance issues are you experiencing?
2. What technology stack is your app using?
3. Are there any specific areas of the app that are slower than others?

### Answers:
1. "Page load times are slow and API calls take too long"
2. "React with Node.js backend and PostgreSQL database"  
3. "The dashboard page and user profile pages"

### Optimized Output:
```
I need to optimize the performance of a React application that has slow page load times and API response delays. Here's what I need you to do:

**Context:**
- Technology: React frontend with Node.js backend and PostgreSQL database
- Issues: Slow page loads, API call latency
- Problem areas: Dashboard page and user profile pages

**Tasks:**
1. **Frontend Analysis & Optimization:**
   - Use Grep to find all React components in the dashboard and profile areas
   - Analyze bundle size and identify code splitting opportunities
   - Check for unnecessary re-renders and missing memoization
   - Review image optimization and lazy loading implementation

2. **Backend Performance Review:**
   - Search for API endpoints serving dashboard and profile data
   - Analyze database queries for N+1 problems or missing indexes
   - Check caching implementation and opportunities

3. **Monitoring Setup:**
   - Create performance monitoring for the identified slow pages
   - Add metrics tracking for API response times

Please use your file system tools to analyze the codebase systematically and create a todo list for tracking all optimization tasks.
```

## Benefits

✅ **Saves Time**: No more trial-and-error with prompt wording
✅ **Better Results**: Prompts optimized for Claude Code's specific capabilities  
✅ **Context Aware**: Understands your project and requirements
✅ **Interactive**: Asks clarifying questions when needed
✅ **Systematic**: Structures complex requests properly

## Requirements

- Node.js 16+ 
- TypeScript support (tsx)
- Anthropic API key
- Claude Code CLI

## License

MIT License - feel free to modify and distribute.