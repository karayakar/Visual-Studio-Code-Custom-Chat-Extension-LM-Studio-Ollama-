import { YapzekSettings } from '../settings';
import { ChatMessage, LocalModelClient } from './types';

class OllamaClient implements LocalModelClient {
	private settings: YapzekSettings;

	constructor(settings: YapzekSettings) {
		this.settings = settings;
	}

	async *streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
		const response = await fetch(`${this.settings.endpoint}/api/chat`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: this.settings.model,
				messages,
				stream: true,
				options: { temperature: this.settings.temperature },
			}),
			signal,
		});

		if (!response.ok) {
			throw new Error(`Ollama API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body');
		}

		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				if (signal?.aborted) break;
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.trim()) {
						try {
							const data = JSON.parse(line);
							if (data.done) break;
							if (data.message?.content) {
								yield data.message.content;
							}
						} catch (e) {
							// Ignore invalid JSON
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}
}

class LMStudioClient implements LocalModelClient {
	private settings: YapzekSettings;

	constructor(settings: YapzekSettings) {
		this.settings = settings;
	}

	async *streamChat(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string> {
		const response = await fetch(`${this.settings.endpoint}/v1/chat/completions`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(this.settings.apiKey && { 'Authorization': `Bearer ${this.settings.apiKey}` }),
			},
			body: JSON.stringify({
				model: this.settings.model,
				messages,
				stream: true,
				temperature: this.settings.temperature,
			}),
			signal,
		});

		if (!response.ok) {
			throw new Error(`LM Studio API error: ${response.statusText}`);
		}

		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body');
		}

		const decoder = new TextDecoder();
		let buffer = '';

		try {
			while (true) {
				if (signal?.aborted) break;
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });
				const lines = buffer.split('\n');
				buffer = lines.pop() || '';

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const dataStr = line.slice(6);
						if (dataStr === '[DONE]') break;
						try {
							const data = JSON.parse(dataStr);
							const content = data.choices?.[0]?.delta?.content;
							if (content) {
								yield content;
							}
						} catch (e) {
							// Ignore invalid JSON
						}
					}
				}
			}
		} finally {
			reader.releaseLock();
		}
	}
}

export function createLocalModelClient(settings: YapzekSettings): LocalModelClient {
	switch (settings.provider) {
		case 'ollama':
			return new OllamaClient(settings);
		case 'lmstudio':
			return new LMStudioClient(settings);
		default:
			throw new Error(`Unsupported provider: ${settings.provider}`);
	}
}
