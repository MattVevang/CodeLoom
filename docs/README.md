# CodeLoom Documentation

CodeLoom is a 100% client-side web app for weaving source files and prompts together for local LLM consumption. It helps you choose files, shape prompt context, estimate payload size, and move the finished result into your preferred local workflow without sending repository data to a server.

## What is CodeLoom?

CodeLoom turns a local project directory into a prompt-ready workspace. You can browse a file tree, pick the files that matter, add task instructions, and generate a clean output package for local model usage.

## Key Features

- **File selection**: Browse a directory tree and choose exactly which files become part of the final prompt.
- **Prompt assembly**: Combine repository context, prompt instructions, and formatting options into one shareable output.
- **Token estimation**: Track rough prompt size before sending content to a local model endpoint.
- **Clipboard support**: Copy the generated prompt in one step.
- **LLM bridge**: Connect to local chat-completions-style endpoints when you want to move from prompt prep to execution.

## Privacy

CodeLoom runs entirely in the browser on the user's machine. File selection, content reading, filtering, prompt assembly, and token estimation happen locally, with zero server-side processing in the app itself.

The app only performs network requests from the browser to user-configured model endpoints (for detection, test, and send/chat flows). No repository contents or assembled prompts are sent to any CodeLoom server.

## Quick Links

- [Architecture](./architecture.md)
- [API Reference](./api.md)
- [Contributing Guide](./contributing.md)
