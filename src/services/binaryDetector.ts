const textLikeExtensions = [
  'txt',
  'md',
  'json',
  'yaml',
  'yml',
  'xml',
  'html',
  'css',
  'scss',
  'js',
  'jsx',
  'ts',
  'tsx',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'kt',
  'swift',
  'c',
  'cpp',
  'h',
  'hpp',
  'cs',
  'sh',
  'env',
  'toml',
  'ini',
  'sql',
]

export const BINARY_EXTENSIONS = new Set([
  '7z',
  'aac',
  'avi',
  'bin',
  'bmp',
  'dll',
  'dylib',
  'eot',
  'exe',
  'flac',
  'gif',
  'gz',
  'ico',
  'jar',
  'jpeg',
  'jpg',
  'lockb',
  'm4a',
  'mov',
  'mp3',
  'mp4',
  'otf',
  'pdf',
  'png',
  'rar',
  'so',
  'tar',
  'ttf',
  'wav',
  'webm',
  'webp',
  'woff',
  'woff2',
  'xls',
  'xlsx',
  'zip',
])

const getExtension = (fileName: string): string => {
  const normalizedName = fileName.trim().toLowerCase()
  const dotIndex = normalizedName.lastIndexOf('.')

  if (dotIndex <= 0 || dotIndex === normalizedName.length - 1) {
    return ''
  }

  return normalizedName.slice(dotIndex + 1)
}

export const isBinaryFile = (content: string, fileName: string): boolean => {
  const extension = getExtension(fileName)

  if (extension === 'svg') {
    return false
  }

  if (BINARY_EXTENSIONS.has(extension) && !textLikeExtensions.includes(extension)) {
    return true
  }

  if (!content) {
    return false
  }

  if (content.includes('\u0000')) {
    return true
  }

  const suspiciousCharacters = [...content].filter((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint < 9 || (codePoint > 13 && codePoint < 32)
  }).length

  return suspiciousCharacters / content.length > 0.1
}
