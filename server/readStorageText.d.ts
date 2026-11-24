export function readStorageText(input: {
  bucket?: string
  path?: string
  downloadUrl?: string
}): Promise<{ status: number; body: { error?: string; text?: string } }>
