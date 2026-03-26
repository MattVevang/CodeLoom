# CodeLoom Architecture

## High-Level Architecture

```text
+------------------+      +-------------------+      +------------------+
| Directory Access | ---> | File Tree Builder | ---> | Selection State  |
+------------------+      +-------------------+      +------------------+
          |                           |                         |
          v                           v                         v
+------------------+      +-------------------+      +------------------+
| Content Readers  | ---> | Prompt Assembler  | ---> | Output + Copy    |
+------------------+      +-------------------+      +------------------+
          |                           |
          v                           v
+------------------+      +-------------------+
| Token Estimator  |      | Local LLM Bridge  |
+------------------+      +-------------------+
```

## Tech Stack

- **Vite** for fast local development and production builds.
- **React** for the UI layer.
- **TypeScript** with strict typing for predictable state and service boundaries.
- **Tailwind CSS** for utility-first styling.
- **Zustand** for lightweight client-side state management.
- **Nginx + Docker** for static deployment.

## Directory Structure Overview

```text
src/
  components/   UI building blocks
  hooks/        Reusable browser and UI hooks
  services/     File access, prompt assembly, and bridge logic
  stores/       Zustand stores for files, prompts, and settings
  types/        Shared TypeScript interfaces
  App.tsx       Application shell
  main.tsx      React entry point
public/         Static assets such as the favicon
docs/           Project documentation
```

## Data Flow

1. **File Selection**  
   The user chooses a local directory through the browser.
2. **Tree Building**  
   The app walks the directory handle, applies visibility and ignore rules, and builds a `FileNode` tree.
3. **File Content Reading**  
   Selected files are read on demand and stored locally in memory.
4. **Prompt Assembly**  
   The prompt assembler combines user instructions, optional tree metadata, file paths, and file content into the configured output format.
5. **Output**  
   The assembled prompt is token-estimated, previewed, copied to the clipboard, or forwarded to a local endpoint.

## Client-Side Only Design Rationale

CodeLoom is designed to keep repository content on the user's machine. A browser-only architecture avoids server-side file uploads, reduces operational risk, simplifies deployment to static hosting, and keeps privacy expectations easy to understand.

To harden this model, endpoint configuration is validated so LLM traffic can target only localhost or private-network addresses. This keeps intentional prompt send behavior available while reducing the risk of accidentally wiring the app to public endpoints.

## File System Access API and Fallback

The preferred integration is the browser's File System Access API, which allows CodeLoom to request a directory handle and then read approved files locally. When the API is unavailable, the fallback path is a manual file-selection flow that accepts individual files or drag-and-drop input and then builds a compatible in-memory tree for the rest of the pipeline.

## LLM Bridge Design

The bridge layer targets local chat-completions-style HTTP endpoints. It converts assembled prompt content into a request payload and sends it only when users explicitly trigger send from the output panel. Endpoint configuration is stored in local persisted settings and validated to localhost/private-network hosts.
