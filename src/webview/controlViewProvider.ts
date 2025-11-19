import * as vscode from 'vscode';

export class ControlViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = 'yapzek.control';

	constructor(private context: vscode.ExtensionContext) {}

	resolveWebviewView(webviewView: vscode.WebviewView): void {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, 'media')],
		};

		webviewView.webview.html = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="UTF-8">
				<title>Yapzek Control</title>
				<link rel="stylesheet" href="${webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'control', 'styles.css'))}">
			</head>
			<body>
				<h1>Yapzek Control</h1>
				<p>Control panel for Yapzek Agent.</p>
				<button data-command="open-chat">Open Chat</button>
				<button data-command="open-settings">Open Settings</button>
				<script src="${webviewView.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri, 'media', 'control', 'main.js'))}"></script>
			</body>
			</html>
		`;

		webviewView.webview.onDidReceiveMessage((message) => {
			switch (message.type) {
				case 'openChat':
					void vscode.commands.executeCommand('yapzekAgent.openChatWindow');
					break;
				case 'openSettings':
					void vscode.commands.executeCommand('workbench.action.openSettings', 'yapzekAgent');
					break;
			}
		});
	}
}
