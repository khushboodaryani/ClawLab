export type CommandRisk = "low" | "medium" | "high" | "blocked";
export type LogStream = "stdout" | "stderr";

export type SSEEvent =
  | { type: "snapshot"; session_id: string; session: Session; working_dir: string }
  | { type: "message"; session_id: string; message: ConversationMessage }
  | { type: "requires_approval"; session_id: string; command: string; risk: CommandRisk; blocked: boolean }
  | { type: "log"; content: string; stream: LogStream }
  | { type: "done"; exit_code: number }
  | { type: "error"; content: string };

export interface ConversationMessage {
  role: "user" | "assistant" | "tool" | "system";
  blocks: ContentBlock[];
  usage?: TokenUsage;
}

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: string }
  | { type: "tool_result"; tool_use_id: string; tool_name: string; output: string; is_error: boolean };

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens: number;
  cache_read_input_tokens: number;
}

export interface Session {
  version: number;
  messages: ConversationMessage[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  pendingCommand?: PendingCommand;
}

export interface TerminalLine {
  id: string;
  content: string;
  stream: LogStream | "system";
  timestamp: number;
}

export interface PendingCommand {
  command: string;
  risk: CommandRisk;
  blocked: boolean;
  status: "pending" | "approved" | "denied" | "done";
  exitCode?: number;
}
