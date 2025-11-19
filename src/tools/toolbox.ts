import * as vscode from 'vscode';
import { spawn } from 'child_process';
import * as path from 'path';

export interface ToolPlan {
	tools: ToolCall[];
}

export interface ToolCall {
	id: string;
	tool: string;
	args: Record<string, any>;
}

export interface ToolRunSummary {
	id: string;
	tool: string;
	success: boolean;
	summary: string;
}

export class Toolbox {
	private context: vscode.ExtensionContext;
	private terminal: vscode.Terminal | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	async executePlan(plan: ToolPlan): Promise<ToolRunSummary[]> {
		const results: ToolRunSummary[] = [];
		for (const call of plan.tools) {
			try {
				const result = await this.executeTool(call);
				results.push({
					id: call.id,
					tool: call.tool,
					success: true,
					summary: result,
				});
			} catch (error) {
				results.push({
					id: call.id,
					tool: call.tool,
					success: false,
					summary: `Error: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		}
		return results;
	}

	private async executeTool(call: ToolCall): Promise<string> {
		switch (call.tool) {
			case 'createFile':
				return await this.createFile(call.args.path, call.args.content);
			case 'writeFile':
				return await this.writeFile(call.args.path, call.args.content);
			case 'runTerminal':
				return await this.runTerminal(call.args.command);
			default:
				throw new Error(`Unknown tool: ${call.tool}`);
		}
	}

	private async createFile(filePath: string, content: string): Promise<string> {
		const uri = vscode.Uri.file(path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', filePath));
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
		return `Created file: ${filePath}`;
	}

	private async writeFile(filePath: string, content: string): Promise<string> {
		const uri = vscode.Uri.file(path.resolve(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', filePath));
		await vscode.workspace.fs.writeFile(uri, Buffer.from(content, 'utf8'));
		return `Wrote to file: ${filePath}`;
	}

	private async runTerminal(command: string): Promise<string> {
		const terminal = this.getTerminal();
		terminal.sendText(command);
		terminal.show();
		return `Ran command: ${command}`;
	}

	async insertSnippet(snippet: string): Promise<void> {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			throw new Error('No active editor');
		}
		await editor.edit((editBuilder) => {
			editBuilder.insert(editor.selection.active, snippet);
		});
	}

	async workspaceSearch(term: string): Promise<void> {
		await vscode.commands.executeCommand('workbench.action.findInFiles', {
			query: term,
			isRegex: false,
		});
	}

	async runCommand(command: string): Promise<void> {
		const terminal = this.getTerminal();
		terminal.sendText(command);
		terminal.show();
	}

	private getTerminal(): vscode.Terminal {
		if (!this.terminal || this.terminal.exitStatus !== undefined) {
			this.terminal = vscode.window.createTerminal('Yapzek');
		}
		return this.terminal;
	}
}
