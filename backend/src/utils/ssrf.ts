export function isSafeUrl(raw: string): boolean {
  try {
    const { protocol, hostname } = new URL(raw);
    if (!["http:", "https:"].includes(protocol)) return false;
    if (
      /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(
        hostname
      )
    )
      return false;
    return true;
  } catch {
    return false;
  }
}
