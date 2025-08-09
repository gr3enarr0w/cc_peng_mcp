# Prompt Engineer MCP Server - Installation Guide

A comprehensive Model Context Protocol (MCP) server that provides advanced prompt engineering capabilities for Claude Code, with interactive refinement and automatic optimization.

## Features

- **Auto-Optimization**: Automatically detects and optimizes natural language text for Claude Code
- **Interactive Refinement**: Ask clarifying questions to refine prompts for better results
- **Language Detection**: Automatically detects programming languages and task types
- **Built-in Intelligence**: No external API dependencies - works entirely with Claude Code's built-in capabilities
- **Task-Specific Enhancement**: Optimizes prompts based on detected task type (debug, test, refactor, etc.)

## Quick Start

### 1. Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Claude Code CLI installed and configured

### 2. Installation

Clone or download this repository to a directory of your choice:

```bash
git clone https://github.com/gr3enarr0w/cc_peng_mcp.git prompt-engineer-mcp
# OR download and extract the files to a directory
cd prompt-engineer-mcp
```

Install dependencies:

```bash
npm install
```

### 3. Configure Claude Code

Create or update your `.mcp.json` configuration file. This file can be placed in:
- **Project level**: `.mcp.json` in your project root (for team sharing)
- **User level**: `~/.mcp.json` in your home directory (for personal use)

**Example `.mcp.json` configuration:**

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "node",
      "args": ["/absolute/path/to/prompt-engineer-mcp/index.ts"],
      "env": {}
    }
  }
}
```

**Important**: Replace `/absolute/path/to/prompt-engineer-mcp/` with the actual absolute path to where you installed this MCP server.

### 4. Restart Claude Code

After updating your configuration, restart Claude Code to load the new MCP server:

```bash
# Exit your current Claude Code session
exit

# Start a new session
claude
```

### 5. Verify Installation

Run the `/mcp` command in Claude Code to verify the server is connected:

```
/mcp
```

You should see `prompt-engineer` listed as a connected server.

## Usage Examples

### Basic Prompt Engineering

```
Use the engineer_prompt tool to optimize this: "I need to fix my React app"
```

### Interactive Prompt Engineering

```
Use the engineer_prompt tool with interactive=true to optimize: "My code is slow"
```

### Auto-Optimization

```
Use the auto_optimize tool to analyze: "can you help me make my website faster?"
```

## Available Tools

### 1. `engineer_prompt`

Intelligently engineers and optimizes prompts for Claude Code.

**Parameters:**
- `prompt` (required): The raw user prompt that needs engineering
- `language` (optional): Programming language (auto-detected if not provided)
- `context` (optional): Additional context about the codebase or project
- `interactive` (optional): Enable interactive Q&A refinement (default: false)

### 2. `auto_optimize`

Automatically detects and optimizes natural language text for Claude Code.

**Parameters:**
- `text` (required): The natural language text to analyze and potentially optimize
- `context` (optional): Additional context about the current project
- `interactive` (optional): Enable interactive questioning if unclear (auto-detected)

### 3. `ask_clarification`

Ask clarifying questions during interactive sessions.

**Parameters:**
- `sessionId` (required): The session ID for the prompt engineering session
- `questions` (required): Array of clarifying questions to ask

### 4. `answer_questions`

Provide answers to clarifying questions and continue the engineering process.

**Parameters:**
- `sessionId` (required): The session ID for the prompt engineering session
- `answers` (required): Array of answers to the previously asked questions

## Configuration Options

### Custom Installation Path

If you want to install the MCP server in a different location, update the `args` path in your `.mcp.json`:

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "node",
      "args": ["/Users/username/.mcp-servers/prompt-engineer/index.ts"]
    }
  }
}
```

### Using TypeScript Execution

For better performance, you can use `tsx` (TypeScript executor):

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "npx",
      "args": ["tsx", "/absolute/path/to/prompt-engineer-mcp/index.ts"]
    }
  }
}
```

### Alternative: Use Built Binary

You can also build the TypeScript to JavaScript and run the compiled version:

```bash
npm run build
```

Then update your configuration to use the compiled version:

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "node",
      "args": ["/absolute/path/to/prompt-engineer-mcp/dist/index.js"]
    }
  }
}
```

## Troubleshooting

### Common Issues

#### 1. "MCP error -32000: Connection closed"

This usually means:
- The path in `.mcp.json` is incorrect
- Node.js is not installed or not in PATH
- Dependencies are not installed

**Solution:**
- Verify the absolute path is correct
- Run `npm install` in the MCP server directory
- Check Node.js installation with `node --version`

#### 2. "Server not found" or "Unknown tool"

This means the MCP server didn't start properly.

**Solution:**
- Check the server logs by running Claude Code with `--debug` flag
- Verify the `.mcp.json` syntax is valid JSON
- Ensure the server name matches exactly (case-sensitive)

#### 3. TypeScript Errors

If you see TypeScript-related errors:

**Solution:**
- Install TypeScript globally: `npm install -g typescript tsx`
- Or use the built JavaScript version (see "Alternative: Use Built Binary" above)

### Debug Mode

To debug connection issues, start Claude Code with debug logging:

```bash
claude --debug
```

This will show detailed information about MCP server connections and any errors.

### Checking Server Status

Use the `/mcp` slash command in Claude Code to see the status of all MCP servers:

```
/mcp
```

Look for:
- ✅ prompt-engineer (connected)
- ❌ prompt-engineer (connection failed)

## Advanced Configuration

### Multiple Instances

You can run multiple instances of the prompt engineer with different configurations:

```json
{
  "mcpServers": {
    "prompt-engineer-dev": {
      "command": "node",
      "args": ["/path/to/dev/prompt-engineer-mcp/index.ts"]
    },
    "prompt-engineer-prod": {
      "command": "node", 
      "args": ["/path/to/prod/prompt-engineer-mcp/index.ts"]
    }
  }
}
```

### Environment Variables

While this MCP server doesn't require external API keys, you can set environment variables if needed:

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "node",
      "args": ["/absolute/path/to/prompt-engineer-mcp/index.ts"],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "false"
      }
    }
  }
}
```

## Development

### Running in Development Mode

For development, you can use the watch mode:

```bash
npm run dev
```

### Building

To build the TypeScript to JavaScript:

```bash
npm run build
```

### Project Structure

```
prompt-engineer-mcp/
├── index.ts              # Main MCP server implementation
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── README.md             # Project overview
├── INSTALL.md            # This installation guide
├── LICENSE               # License information
└── dist/                 # Built JavaScript files (after npm run build)
```

## Technical Details

### How It Works

1. **Language Detection**: Uses pattern matching to detect programming languages and task types
2. **Optimization Logic**: Built-in algorithms analyze prompts and enhance them with Claude Code-specific instructions
3. **Interactive Sessions**: Maintains session state for multi-turn refinement conversations
4. **No External Dependencies**: Works entirely with built-in capabilities, no API calls required

### Supported Languages

The system can detect and optimize prompts for:
- JavaScript/Node.js
- TypeScript
- Python
- Java
- C++
- Rust
- Go
- PHP
- Ruby
- C#/.NET

### Task Types

Automatically detects and optimizes for:
- **Debug**: Bug fixing and error resolution
- **Test**: Unit testing and test creation
- **Refactor**: Code improvement and restructuring
- **Explain**: Code explanation and documentation
- **Architecture**: System design and patterns
- **Code**: General coding tasks (default)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify your `.mcp.json` configuration
3. Run Claude Code with `--debug` for detailed logs
4. Ensure all dependencies are installed with `npm install`

## Contributing

This MCP server is designed to be lightweight and focused. When contributing:

1. Keep external dependencies minimal
2. Maintain compatibility with Claude Code's MCP protocol
3. Test with various prompt types and scenarios
4. Update documentation for any new features

## License

See LICENSE file for details.