type AvatarInput = { avatarDataUrl?: string | null }

export function parseAvatarInput(input: AvatarInput): {
  avatarBlob?: Buffer | null
  avatarMimeType?: string | null
} {
  if (input.avatarDataUrl === undefined) return {}
  if (!input.avatarDataUrl) return { avatarBlob: null, avatarMimeType: null }

  const match = input.avatarDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) {
    throw new Error('Avatar must be a valid base64 image data URL.')
  }

  const [, mimeType, base64] = match
  return { avatarBlob: Buffer.from(base64, 'base64'), avatarMimeType: mimeType }
}

export function toAvatarDataUrl(user: {
  avatarBlob?: Buffer | Uint8Array | null
  avatarMimeType?: string | null
  avatarUrl?: string | null
}): string | null {
  if (user.avatarBlob && user.avatarMimeType) {
    const b = Buffer.from(user.avatarBlob)
    return `data:${user.avatarMimeType};base64,${b.toString('base64')}`
  }
  return user.avatarUrl ?? null
}
