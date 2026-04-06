const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8082";

export async function createSession(workingDir?: string): Promise<{ session_id: string; working_dir: string }> {
  const res = await fetch(`${BASE_URL}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ working_dir: workingDir ?? null }),
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.statusText}`);
  return res.json();
}

export interface ImagePayload {
  media_type: string;
  data: string;
}

export async function sendMessage(
  sessionId: string, 
  message: string, 
  images?: ImagePayload[], 
  model?: string
): Promise<void> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, images, model }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.statusText}`);
}

export async function approveCommand(sessionId: string, approved: boolean): Promise<void> {
  const res = await fetch(`${BASE_URL}/sessions/${sessionId}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approved }),
  });
  if (!res.ok) throw new Error(`Failed to approve command: ${res.statusText}`);
}

export async function browseFolder(): Promise<string> {
  const res = await fetch(`${BASE_URL}/browse`);
  if (!res.ok) throw new Error("Failed to select folder");
  return res.json();
}

export function subscribeToEvents(sessionId: string): EventSource {
  return new EventSource(`${BASE_URL}/sessions/${sessionId}/events`);
}
