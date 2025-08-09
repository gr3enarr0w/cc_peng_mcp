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
- **No external API dependencies** - works entirely with built-in capabilities

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Claude Code

Create or update your `.mcp.json` configuration file:

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "node",
      "args": ["/absolute/path/to/cc_peng_mcp/index.ts"],
      "env": {}
    }
  }
}
```

### 3. Restart Claude Code
```bash
# Exit current session and start new one
claude
```

### 4. Verify Installation
```bash
/mcp
```

You should see `prompt-engineer` listed as connected.

## Usage with Claude Code

### 🎯 **Auto-Optimization (Primary Usage)**
Simply use the tools directly - no setup required:

```
Use the auto_optimize tool to analyze: "fix my React app performance issues"
```

### **Interactive Mode for Complex Requests**
```
Use the engineer_prompt tool with interactive=true for: "create a new authentication system"
```

### **Direct Prompt Engineering**
```
Use the engineer_prompt tool with prompt="optimize my database queries" and language="python"
```

## Available Tools

### `auto_optimize` ⭐ **Primary Tool**
Automatically detects and optimizes natural language text:
- `text` (required): Your natural language text/request  
- `context` (optional): Additional project context
- `interactive` (optional): Force interactive questioning

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

### 2. **Built-in Intelligence**
- **No API calls required** - uses pattern matching and rule-based optimization
- **Language detection** via regex patterns for 10+ programming languages
- **Task type detection** (debug, test, refactor, explain, architecture)
- **Complexity analysis** based on text length and technical indicators

### 3. **Claude Code Optimization**
Prompts are optimized knowing Claude Code's capabilities:
- File system operations (Read, Write, Edit)
- Code search (Grep, Glob patterns)  
- Git operations and workflow management
- Todo list management for complex tasks
- Browser automation via Playwright MCP
- GitHub integration

### 4. **Interactive Refinement**
When needed, the system:
- Generates clarifying questions based on your prompt
- Creates a session to track the conversation
- Refines the prompt based on your answers
- Delivers a highly optimized final prompt

## Example Workflows

### 🎯 **Auto-Optimization Example**

**Input:**
```
"my website is slow and users are complaining"
```

**Auto-Optimized Output:**
```
**Task:** Debug and fix the following issue:

my website is slow and users are complaining

**Requirements:**
- Use file search tools (Grep/Glob) to locate relevant code
- Read and analyze the problematic files
- Identify the root cause and implement a fix
- Test the solution if possible

**Ready to proceed with this task?**
```

### 🤖 **Interactive Mode Example**

**Input:** "make my app better"

**Questions Generated:**
1. What specific aspect needs improvement (performance, readability, maintainability)?
2. What technology stack or programming language are you using?
3. Are there any constraints or requirements I should know about?

**After Answers:** Creates detailed, structured prompt with your specific requirements.

## Benefits

✅ **No Setup Required**: Works immediately after MCP configuration  
✅ **No API Keys**: Uses only built-in Claude Code capabilities  
✅ **Context Aware**: Understands your project and requirements  
✅ **Interactive**: Asks clarifying questions when needed  
✅ **Systematic**: Structures complex requests properly  
✅ **Fast**: No external API calls for instant optimization

## Requirements

- Node.js 16+ 
- TypeScript support (tsx recommended)
- Claude Code CLI
- **No external API keys required**

## Technical Details

### Supported Languages
- JavaScript/Node.js, TypeScript, Python, Java, C++, Rust, Go, PHP, Ruby, C#/.NET

### Task Types
- **Debug**: Bug fixing and error resolution
- **Test**: Unit testing and test creation  
- **Refactor**: Code improvement and restructuring
- **Explain**: Code explanation and documentation
- **Architecture**: System design and patterns
- **Code**: General coding tasks (default)

### Architecture
- **Pure pattern matching** - no machine learning models
- **Rule-based optimization** - deterministic and fast
- **Session management** - for interactive conversations
- **Built-in language detection** - regex-based patterns

## License

MIT License - feel free to modify and distribute.

## Installation Guide

See [INSTALL.md](INSTALL.md) for detailed installation instructions, troubleshooting, and advanced configuration options.