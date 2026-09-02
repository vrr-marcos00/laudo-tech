export function isHtmlEmpty(html: string): boolean {
  return !html.includes('<img') && html.replace(/<[^>]*>/g, '').trim().length === 0
}
