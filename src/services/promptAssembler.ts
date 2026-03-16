import type { AssembledPrompt, FileNode, PromptConfig } from '@/types'
import { estimateTokens } from '@/services/tokenEstimator'

const detectLanguage = (filePath: string): string => {
  const extension = filePath.split('.').at(-1)?.toLowerCase() ?? ''

  switch (extension) {
    case 'cjs':
    case 'js':
    case 'mjs':
      return 'javascript'
    case 'cts':
    case 'mts':
    case 'ts':
      return 'typescript'
    case 'tsx':
      return 'tsx'
    case 'jsx':
      return 'jsx'
    case 'json':
      return 'json'
    case 'md':
      return 'markdown'
    case 'html':
    case 'htm':
      return 'html'
    case 'css':
      return 'css'
    case 'scss':
      return 'scss'
    case 'xml':
    case 'pom':
    case 'csproj':
    case 'fsproj':
      return 'xml'
    case 'yml':
    case 'yaml':
      return 'yaml'
    case 'py':
      return 'python'
    case 'rb':
      return 'ruby'
    case 'go':
      return 'go'
    case 'rs':
      return 'rust'
    case 'sh':
    case 'bash':
    case 'zsh':
      return 'bash'
    case 'bat':
    case 'cmd':
      return 'batch'
    case 'ps1':
    case 'psm1':
      return 'powershell'
    case 'sql':
      return 'sql'
    case 'java':
      return 'java'
    case 'kt':
    case 'kts':
      return 'kotlin'
    case 'scala':
      return 'scala'
    case 'cs':
      return 'csharp'
    case 'cpp':
    case 'cc':
    case 'cxx':
      return 'cpp'
    case 'c':
    case 'h':
      return 'c'
    case 'hpp':
      return 'cpp'
    case 'swift':
      return 'swift'
    case 'dart':
      return 'dart'
    case 'r':
      return 'r'
    case 'php':
      return 'php'
    case 'lua':
      return 'lua'
    case 'toml':
      return 'toml'
    case 'ini':
    case 'cfg':
    case 'conf':
    case 'properties':
      return 'ini'
    case 'gradle':
    case 'groovy':
      return 'groovy'
    case 'dockerfile':
      return 'dockerfile'
    case 'makefile':
      return 'makefile'
    case 'tf':
    case 'hcl':
      return 'hcl'
    case 'vue':
      return 'vue'
    case 'svelte':
      return 'svelte'
    default:
      return ''
  }
}

interface TreeBranch {
  [segment: string]: TreeBranch
}

const renderFileTree = (files: FileNode[]): string => {
  const tree: TreeBranch = {}

  for (const file of files) {
    const segments = file.path.split('/').filter(Boolean)
    let currentLevel = tree

    for (const segment of segments) {
      if (!(segment in currentLevel)) {
        currentLevel[segment] = {}
      }

      currentLevel = currentLevel[segment]
    }
  }

  const renderBranch = (branch: TreeBranch, prefix = ''): string[] =>
    Object.entries(branch).flatMap(([name, nested], index, entries) => {
      const isLast = index === entries.length - 1
      const connector = `${prefix}${isLast ? '└── ' : '├── '}${name}`
      const children = renderBranch(
        nested,
        `${prefix}${isLast ? '    ' : '│   '}`,
      )

      return [connector, ...children]
    })

  return renderBranch(tree).join('\n')
}

const formatFileBody = (file: FileNode, config: PromptConfig): string => {
  const content = file.content ?? ''

  if (!config.wrapContentInCodeBlocks) {
    return content
  }

  return `\`\`\`${detectLanguage(file.path)}\n${content}\n\`\`\``
}

const getFileLabel = (file: FileNode, config: PromptConfig): string =>
  config.includeFilePaths ? file.path : file.name

const escapeXml = (value: string): string => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&apos;')

const toCData = (value: string): string => value.replaceAll(']]>', ']]]]><![CDATA[>')

const buildMarkdownPrompt = (files: FileNode[], config: PromptConfig): string => {
  const sections: string[] = []
  const userPrompt = config.userPrompt.trim()

  if (files.length > 0) {
    sections.push(
      'The following are files from a project. '
      + 'Each file\'s path and full content are provided. '
      + 'Read all files, then answer the instruction at the end.',
    )
  }

  if (config.includeFileTree && files.length > 0) {
    sections.push(`## Project file tree\n\n\`\`\`text\n${renderFileTree(files)}\n\`\`\``)
  }

  files.forEach((file) => {
    const label = getFileLabel(file, config)
    const body = formatFileBody(file, config)
    sections.push(
      `## File: \`${label}\`\n\nBelow is the full content of \`${label}\`:\n\n${body}`,
    )
  })

  if (userPrompt) {
    sections.push(`---\n\n## Instruction\n\n${userPrompt}`)
  }

  return sections.join('\n\n')
}

const buildPlainPrompt = (files: FileNode[], config: PromptConfig): string => {
  const sections: string[] = []
  const userPrompt = config.userPrompt.trim()

  if (files.length > 0) {
    sections.push(
      'The following are files from a project. '
      + 'Each file\'s path and full content are provided between BEGIN/END markers. '
      + 'Read all files, then answer the instruction at the end.',
    )
  }

  if (config.includeFileTree && files.length > 0) {
    sections.push(`PROJECT FILE TREE:\n${renderFileTree(files)}`)
  }

  files.forEach((file) => {
    const label = getFileLabel(file, config)
    const body = formatFileBody(file, config)
    sections.push(
      `===== BEGIN FILE: ${label} =====\n${body}\n===== END FILE: ${label} =====`,
    )
  })

  if (userPrompt) {
    sections.push(`INSTRUCTION:\n${userPrompt}`)
  }

  return sections.join('\n\n')
}

const buildXmlPrompt = (files: FileNode[], config: PromptConfig): string => {
  const lines = ['<prompt>']
  const userPrompt = config.userPrompt.trim()

  if (files.length > 0) {
    lines.push(
      '  <context>The following files are from a project. '
      + 'Each file element contains the file path and its full source content. '
      + 'Read all files, then answer the instruction at the end.</context>',
    )
  }

  if (config.includeFileTree && files.length > 0) {
    lines.push(`  <fileTree><![CDATA[${toCData(renderFileTree(files))}]]></fileTree>`)
  }

  lines.push('  <files>')

  files.forEach((file) => {
    const label = escapeXml(getFileLabel(file, config))
    const content = file.content ?? ''
    lines.push(`    <file path="${label}">`)
    lines.push(`      <![CDATA[${toCData(content)}]]>`)
    lines.push('    </file>')
  })

  lines.push('  </files>')

  if (userPrompt) {
    lines.push(`  <instruction><![CDATA[${toCData(userPrompt)}]]></instruction>`)
  }

  lines.push('</prompt>')

  return lines.join('\n')
}

export const assemblePrompt = (files: FileNode[], config: PromptConfig): AssembledPrompt => {
  const selectedFiles = files.filter((file) => file.type === 'file')
  const content = (() => {
    switch (config.outputFormat) {
      case 'xml':
        return buildXmlPrompt(selectedFiles, config)
      case 'plain':
        return buildPlainPrompt(selectedFiles, config)
      case 'markdown':
      default:
        return buildMarkdownPrompt(selectedFiles, config)
    }
  })()

  const totalSize = selectedFiles.reduce((total, file) => {
    if (typeof file.size === 'number') {
      return total + file.size
    }

    return total + new TextEncoder().encode(file.content ?? '').length
  }, 0)

  return {
    content,
    tokenEstimate: estimateTokens(content),
    fileCount: selectedFiles.length,
    totalSize,
  }
}
