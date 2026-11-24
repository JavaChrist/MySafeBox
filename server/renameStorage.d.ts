export function renameStorageObject(input: {
  token?: string
  bucket?: string
  from?: string
  to?: string
  downloadUrl?: string
  contentType?: string
  customMetadata?: Record<string, string>
}): Promise<{ status: number; body: { error?: string; done?: boolean; detail?: string } }>
