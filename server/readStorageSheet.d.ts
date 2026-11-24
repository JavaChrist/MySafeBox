export function readStorageSheet(input: {
  bucket?: string
  path?: string
  downloadUrl?: string
}): Promise<{
  status: number
  body: {
    error?: string
    truncated?: boolean
    sheets?: Array<{ name: string; rows: string[][] }>
  }
}>
