import * as vscode from 'vscode';
import { ChatController } from '../chat/chatController';
import { getChatHtml } from './chatHtml';

export class ChatSidebarProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'yapzek.chat';

	private controller: ChatController;

	constructor(private context: vscode.ExtensionContext, controller: ChatController) {
		this.controller = controller;
	}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
		};

		webviewView.webview.html = getChatHtml(this.context, webviewView.webview);

		this.controller.setSidebarWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((message) => {
			switch (message.type) {
				case 'ready':
					// Webview is ready
					break;
				case 'submitPrompt':
					void this.controller.submitPrompt(message.prompt);
					break;
				case 'stop':
					this.controller.stopCurrentRequest();
					break;
			}
		});
	}
}
