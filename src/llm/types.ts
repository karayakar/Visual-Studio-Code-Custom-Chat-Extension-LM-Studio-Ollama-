export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

export interface LocalModelClient {
	streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string>;
}