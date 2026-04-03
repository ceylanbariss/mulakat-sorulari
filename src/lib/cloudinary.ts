export function optimizeCloudinaryUrl(url: string, width: number = 800): string {
  if (!url || !url.includes('res.cloudinary.com')) return url
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`)
}
