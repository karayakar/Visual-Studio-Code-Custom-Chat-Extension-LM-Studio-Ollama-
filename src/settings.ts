import * as vscode from 'vscode';

export interface YapzekSettings {
	provider: 'ollama' | 'lmstudio';
	endpoint: string;
	model: string;
	temperature: number;
	systemPrompt: string;
	apiKey: string;
}

export function getSettings(): YapzekSettings {
	const config = vscode.workspace.getConfiguration('yapzekAgent');
	return {
		provider: config.get('provider', 'ollama'),
		endpoint: config.get('endpoint', 'http://localhost:11434'),
		model: config.get('model', 'llama3'),
		temperature: config.get('temperature', 0.2),
		systemPrompt: config.get('systemPrompt', 'You are Yapzek, a precise local coding agent running inside VS Code.'),
		apiKey: config.get('apiKey', ''),
	};
}

export function watchSettings(callback: (settings: YapzekSettings) => void): vscode.Disposable {
	return vscode.workspace.onDidChangeConfiguration((event) => {
		if (event.affectsConfiguration('yapzekAgent')) {
			callback(getSettings());
		}
	});
}
