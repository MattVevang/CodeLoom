# 🧶 CodeLoom

![License](https://img.shields.io/badge/license-MIT-green)
![Build Status](https://img.shields.io/badge/build-placeholder-lightgrey)
![Version](https://img.shields.io/badge/version-0.0.0-blue)

**Weave your source files and prompts together for local LLM consumption**

CodeLoom is a browser-based workspace for assembling source files, repository context, and task instructions into a prompt-ready package. It is built for privacy-first local workflows, keeping file access, prompt generation, and output handling on the user's machine.

## Features

- 🗂️ **Selective file intake** for choosing only the files that matter
- 🧵 **Prompt assembly** with file trees, file paths, and content formatting controls
- 📏 **Token estimation** to keep prompt size visible before export
- 📋 **Clipboard-ready output** for fast handoff into local workflows
- 🔌 **LLM bridge support** for local chat-completions-style endpoints
- 🔒 **Client-side privacy** with zero server-side repository processing

## Screenshot

> Screenshot placeholder: replace this section with a current CodeLoom UI capture.

## Quick Start

### npm

```bash
npm install
npm run dev
```

### Docker

```bash
docker compose up --build
```

Then open `http://localhost:8080`.

## How It Works

1. **Select Files**  
   Choose a local directory, expand the tree, and mark the files you want to include.
2. **Write Prompt**  
   Add instructions, choose output options, and shape the final context package.
3. **Generate & Copy**  
   Build the prompt, review the token estimate, and copy the result for local model usage.

## Privacy & Security

CodeLoom is designed as a 100% client-side application. File reading, filtering, prompt assembly, and token estimation happen in the browser, and no built-in server sends repository content elsewhere. Container deployment serves only static assets.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Build tooling | Vite |
| UI | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Container runtime | Docker |
| Static serving | Nginx |

## Development

```bash
npm install
npm run dev
npm run build
npm run lint
```

See the [documentation hub](./docs/README.md) for architecture notes, API references, and contribution guidance.

## Deployment Options

- **npm development server** for local iteration
- **Docker** for a portable static deployment on port `8080`
- **Static hosting** by serving the generated `dist/` directory with any standard web server
- **GitHub Pages** via `.github/workflows/pages.yml` on push to `main`

### GitHub Pages URL

- `https://mattvevang.github.io/CodeLoom/`

## Contributing

Contributions are welcome. See [docs/contributing.md](./docs/contributing.md) for setup, workflow, and pull request guidance.

## License

MIT
