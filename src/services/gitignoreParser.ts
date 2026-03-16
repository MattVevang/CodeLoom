export interface GitignoreRule {
  pattern: string
  negated: boolean
  directoryOnly: boolean
  anchored: boolean
  regex: RegExp
}

export const parseGitignore = (content: string): GitignoreRule[] => content
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && !line.startsWith('#'))
  .map((line) => {
    const negated = line.startsWith('!')
    const rawPattern = negated ? line.slice(1) : line
    const directoryOnly = rawPattern.endsWith('/')
    const pattern = directoryOnly ? rawPattern.slice(0, -1) : rawPattern
    const anchored = pattern.startsWith('/')
    const normalizedPattern = anchored ? pattern.slice(1) : pattern

    return {
      pattern: normalizedPattern,
      negated,
      directoryOnly,
      anchored,
      regex: compileGitignorePattern(normalizedPattern, anchored, directoryOnly),
    }
  })
  .filter((rule) => rule.pattern.length > 0)

export const isIgnored = (filePath: string, rules: GitignoreRule[]): boolean => {
  const normalizedPath = normalizePath(filePath)
  let ignored = false

  for (const rule of rules) {
    if (!rule.regex.test(normalizedPath)) {
      continue
    }

    ignored = !rule.negated
  }

  return ignored
}

const compileGitignorePattern = (
  pattern: string,
  anchored: boolean,
  directoryOnly: boolean,
): RegExp => {
  const hasSlash = pattern.includes('/')
  const regexBody = globToRegex(pattern)
  const prefix = anchored || hasSlash ? '^' : '(^|.*/)'
  const suffix = directoryOnly ? '(?:/.*)?$' : '$'

  return new RegExp(`${prefix}${regexBody}${suffix}`)
}

const globToRegex = (pattern: string): string => {
  let result = ''

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index]
    const next = pattern[index + 1]
    const nextAfterDouble = pattern[index + 2]

    if (character === '*' && next === '*') {
      if (nextAfterDouble === '/') {
        result += '(?:.*/)?'
        index += 2
      } else {
        result += '.*'
        index += 1
      }

      continue
    }

    if (character === '*') {
      result += '[^/]*'
      continue
    }

    if (character === '?') {
      result += '[^/]'
      continue
    }

    result += escapeRegexCharacter(character)
  }

  return result
}

const escapeRegexCharacter = (character: string): string =>
  /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character

const normalizePath = (filePath: string): string => filePath
  .replace(/\\/g, '/')
  .replace(/^\.\//, '')
  .replace(/^\//, '')
  .replace(/\/+/g, '/')
