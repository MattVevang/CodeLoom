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
      return 'html'
    case 'css':
      return 'css'
    case 'scss':
      return 'scss'
    case 'xml':
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
      return 'bash'
    case 'sql':
      return 'sql'
    default:
      return 'text'
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

  if (userPrompt) {
    sections.push(userPrompt)
  }

  if (config.includeFileTree && files.length > 0) {
    sections.push(`## Selected file tree\n\n\`\`\`text\n${renderFileTree(files)}\n\`\`\``)
  }

  if (files.length > 0) {
    sections.push('## Source files')
  }

  files.forEach((file) => {
    sections.push(`### ${getFileLabel(file, config)}\n\n${formatFileBody(file, config)}`)
  })

  return sections.join('\n\n')
}

const buildPlainPrompt = (files: FileNode[], config: PromptConfig): string => {
  const sections: string[] = []
  const userPrompt = config.userPrompt.trim()

  if (userPrompt) {
    sections.push(userPrompt)
  }

  if (config.includeFileTree && files.length > 0) {
    sections.push(`SELECTED FILE TREE\n${renderFileTree(files)}`)
  }

  files.forEach((file) => {
    sections.push(`FILE: ${getFileLabel(file, config)}\n${formatFileBody(file, config)}`)
  })

  return sections.join('\n\n')
}

const buildXmlPrompt = (files: FileNode[], config: PromptConfig): string => {
  const lines = ['<codeLoomPrompt>']
  const userPrompt = config.userPrompt.trim()

  if (userPrompt) {
    lines.push(`  <instruction><![CDATA[${toCData(userPrompt)}]]></instruction>`)
  }

  if (config.includeFileTree && files.length > 0) {
    lines.push(`  <fileTree><![CDATA[${toCData(renderFileTree(files))}]]></fileTree>`)
  }

  lines.push('  <files>')

  files.forEach((file) => {
    const label = escapeXml(getFileLabel(file, config))
    lines.push(`    <file label="${label}">`)
    lines.push(`      <content><![CDATA[${toCData(formatFileBody(file, config))}]]></content>`)
    lines.push('    </file>')
  })

  lines.push('  </files>')
  lines.push('</codeLoomPrompt>')

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
