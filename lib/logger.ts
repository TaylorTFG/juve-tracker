export function logApi(name: string, payload: Record<string, unknown>) {
  console.log(`[${name}]`, JSON.stringify(payload));
}
