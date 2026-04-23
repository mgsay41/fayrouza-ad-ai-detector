export function parseGeminiJson<T>(raw: string): T {
  let cleaned = raw.trim();

  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  const jsonMatch = cleaned.match(/(\{[\s\S]*\})/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse Gemini JSON response: ${cleaned.slice(0, 200)}`);
  }
}
