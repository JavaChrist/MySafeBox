export declare const MAX_DOCX_BYTES: number

export function readStorageDocx(input: {
  bucket?: string
  path?: string
  downloadUrl?: string
}): Promise<{
  status: number
  body?: { error?: string }
  binary?: Buffer
  contentType?: string
}>
