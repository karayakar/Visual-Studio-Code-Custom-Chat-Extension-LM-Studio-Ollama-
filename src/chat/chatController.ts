import * as vscode from 'vscode';
import { getSettings, watchSettings, YapzekSettings } from '../settings';
import { ChatMessage, LocalModelClient } from '../llm/types';
import { createLocalModelClient } from '../llm/localModelClient';
import { Toolbox, ToolPlan, ToolRunSummary } from '../tools/toolbox';

export class ChatController {
	private context: vscode.ExtensionContext;
	private toolbox: Toolbox;
	private client: LocalModelClient;
	private settings: YapzekSettings;
	private webviewPanel: vscode.WebviewPanel | undefined;
	private sidebarWebview: vscode.Webview | undefined;
	private currentAbortController: AbortController | undefined;

	constructor(context: vscode.ExtensionContext, toolbox: Toolbox) {
		this.context = context;
		this.toolbox = toolbox;
		this.settings = getSettings();
		this.client = createLocalModelClient(this.settings);

		watchSettings((next) => {
			this.settings = next;
			this.client = createLocalModelClient(next);
		});
	}

	setWebviewPanel(panel: vscode.WebviewPanel | undefined): void {
		this.webviewPanel = panel;
	}

	setSidebarWebview(webview: vscode.Webview): void {
		this.sidebarWebview = webview;
	}

	async submitPrompt(prompt: string, mode?: string): Promise<void> {
		this.currentAbortController = new AbortController();
		const systemMessage = `${this.settings.systemPrompt}

You have access to tools. To use a tool, output a JSON object in the following format:
\`\`\`json
{
  "tools": [
    {
      "id": "unique_id",
      "tool": "tool_name",
      "args": { "key": "value" }
    }
  ]
}
\`\`\`

Available tools:
- createFile: Create a new file. Args: path (string), content (string)
- writeFile: Write or overwrite a file. Args: path (string), content (string)
- runTerminal: Run a terminal command. Args: command (string)

Example: To create a file named 'test.txt' with 'hello world':
\`\`\`json
{
  "tools": [
    {
      "id": "create_test",
      "tool": "createFile",
      "args": { "path": "test.txt", "content": "hello world" }
    }
  ]
}
\`\`\`
`;

		const messages: ChatMessage[] = [
			{ role: 'system', content: systemMessage },
			{ role: 'user', content: prompt },
		];

		let response = '';
		this.sendToWebviews('start', { requestId: Date.now() });
		try {
			for await (const chunk of this.client.streamChat(messages, this.currentAbortController.signal)) {
				response += chunk;
				this.sendToWebviews('chunk', chunk);
			}
			this.sendToWebviews('done', response);

			// Check if response contains tool plan
			const toolPlan = this.parseToolPlan(response);
			if (toolPlan) {
				await this.executeToolPlan(toolPlan);
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				this.sendToWebviews('done', response); // or something
			} else {
				this.sendToWebviews('error', error instanceof Error ? error.message : String(error));
			}
		} finally {
			this.currentAbortController = undefined;
		}
	}

	private parseToolPlan(response: string): ToolPlan | null {
		// Simple parsing for JSON tool plan
		const match = response.match(/```json\s*(\{[\s\S]*?\})\s*```/);
		if (match) {
			try {
				const plan = JSON.parse(match[1]);
				if (plan.tools && Array.isArray(plan.tools)) {
					return plan as ToolPlan;
				}
			} catch (e) {
				// Ignore
			}
		}
		return null;
	}

	private async executeToolPlan(plan: ToolPlan): Promise<void> {
		this.sendToWebviews('toolStart', plan);
		const results = await this.toolbox.executePlan(plan);
		this.sendToWebviews('toolResults', results);
	}

	private sendToWebviews(type: string, data: any): void {
		const message = { type, data };
		if (this.webviewPanel) {
			this.webviewPanel.webview.postMessage(message);
		}
		if (this.sidebarWebview) {
			this.sidebarWebview.postMessage(message);
		}
	}

	stopCurrentRequest(): void {
		this.currentAbortController?.abort();
	}

	dispose(): void {
		// Cleanup
	}
}
