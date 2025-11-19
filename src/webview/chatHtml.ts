// @ts-nocheck
import * as vscode from 'vscode';

export function getChatHtml(context: vscode.ExtensionContext, webview: vscode.Webview): string {
	const stylesUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'chat', 'styles.css'));
	const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'chat', 'main.js'));

	return "<!DOCTYPE html>" +
		"<html>" +
		"<head>" +
		"<meta charset=\"UTF-8\">" +
		"<title>Yapzek Chat</title>" +
		"<link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css\">" +
		"<link rel=\"stylesheet\" href=\"" + stylesUri + "\">" +
		"</head>" +
		"<body>" +
		"<div class=\"container\">" +
		"<div class=\"header\">" +
		"<h1>Yapzek Chat</h1>" +
		"</div>" +
		"<div class=\"chat-container\">" +
		"<div id=\"transcript\" class=\"transcript\"></div>" +
		"<div class=\"input-container\">" +
		"<select id=\"mode-select\" class=\"mode-select\">" +
		"<option value=\"ask\">Ask</option>" +
		"<option value=\"edit\">Edit</option>" +
		"<option value=\"agent\">Agent</option>" +
		"</select>" +
		"<div class=\"input-wrapper\">" +
		"<input type=\"text\" id=\"prompt-input\" placeholder=\"Type your message...\" />" +
		"<button id=\"submit-btn\"><i class=\"fas fa-paper-plane\"></i></button>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"</div>" +
		"<script src=\"" + scriptUri + "\"></script>" +
		"</body>" +
		"</html>";
}
