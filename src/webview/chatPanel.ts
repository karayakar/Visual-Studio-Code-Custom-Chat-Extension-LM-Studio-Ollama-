import * as vscode from 'vscode';
import { ChatController } from '../chat/chatController';
import { getChatHtml } from './chatHtml';

export class ChatPanel {
	public static createOrShow(context: vscode.ExtensionContext, controller: ChatController): void {
		const panel = vscode.window.createWebviewPanel(
			'yapzekChat',
			'Yapzek Chat',
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
			}
		);

		controller.setWebviewPanel(panel);

		panel.webview.html = getChatHtml(context, panel.webview);

		panel.webview.onDidReceiveMessage((message: any) => {
			switch (message.type) {
				case 'ready':
					// Webview is ready
					break;
				case 'submitPrompt':
					void controller.submitPrompt(message.prompt, message.mode);
					break;
				case 'stop':
					controller.stopCurrentRequest();
					break;
			}
		});

		panel.onDidDispose(() => {
			controller.setWebviewPanel(undefined);
		});
	}
}
