import * as vscode from 'vscode';
import { ChatController } from './chat/chatController';
import { ChatSidebarProvider } from './webview/sidebarProvider';
import { ChatPanel } from './webview/chatPanel';
import { Toolbox } from './tools/toolbox';
import { ControlViewProvider } from './webview/controlViewProvider';

let controller: ChatController | undefined;
let context: vscode.ExtensionContext;

export function activate(ctx: vscode.ExtensionContext): void {

	context = ctx;
	const toolbox = new Toolbox(context);
	controller = new ChatController(context, toolbox);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ChatSidebarProvider.viewType, new ChatSidebarProvider(context, controller)),
		vscode.window.registerWebviewViewProvider(ControlViewProvider.viewType, new ControlViewProvider(context)),
		vscode.commands.registerCommand('yapzekAgent.openChatSidebar', () => {

			void focusChatView();
		}),
		vscode.commands.registerCommand('yapzekAgent.openChatWindow', () => {

			if (!controller) {
				return;
			}
			ChatPanel.createOrShow(context, controller);
		}),
		vscode.commands.registerCommand('yapzekAgent.explainSelection', () => {

			void prepareClipboardPrompt('Explain the following code:');
		}),
		vscode.commands.registerCommand('yapzekAgent.refactorSelection', () => {

			void prepareClipboardPrompt('Refactor the following code:');
		}),
		vscode.commands.registerCommand('yapzekAgent.generateTests', () => {

			void prepareClipboardPrompt('Generate tests for:');
		}),
		vscode.commands.registerCommand('yapzekAgent.insertSnippet', async () => {

			const snippet = await vscode.window.showInputBox({ prompt: 'Snippet text to insert' });
			if (!snippet) {
				return;
			}
			await toolbox.insertSnippet(snippet);
		}),
		vscode.commands.registerCommand('yapzekAgent.workspaceSearch', async () => {

			const term = await vscode.window.showInputBox({ prompt: 'Literal term to search for' });
			if (!term) {
				return;
			}
			await toolbox.workspaceSearch(term);
		}),
		vscode.commands.registerCommand('yapzekAgent.runTerminalCommand', async () => {

			const command = await vscode.window.showInputBox({ prompt: 'Command to run in Yapzek terminal' });
			if (!command) {
				return;
			}
			await toolbox.runCommand(command);
		}),
	);
}

export function deactivate(): void {

	controller?.dispose();
}

async function focusChatView(): Promise<void> {

	await vscode.commands.executeCommand('workbench.view.extension.yapzek');
	await vscode.commands.executeCommand('yapzek.chat.focus');
}

async function prepareClipboardPrompt(prefix: string): Promise<void> {

	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		void vscode.window.showWarningMessage('Open a file to use this command.');
		return;
	}
	const selection = editor.selection.isEmpty ? editor.document.getText() : editor.document.getText(editor.selection);
	if (!selection.trim()) {
		void vscode.window.showWarningMessage('Selection is empty.');
		return;
	}
	const prompt = `${prefix}\n\n${selection}`;
	if (controller) {
		ChatPanel.createOrShow(context, controller);
		void controller.submitPrompt(prompt);
	} else {
		await vscode.env.clipboard.writeText(prompt);
		await focusChatView();
		void vscode.window.showInformationMessage('Prompt copied to clipboard. Paste it into Yapzek chat.');
	}
}
