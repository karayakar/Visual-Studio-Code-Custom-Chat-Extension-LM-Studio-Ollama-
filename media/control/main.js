const vscode = acquireVsCodeApi();

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('[data-command="open-chat"]').addEventListener('click', () => {
    vscode.postMessage({ type: 'openChat' });
  });

  document.querySelector('[data-command="open-settings"]').addEventListener('click', () => {
    vscode.postMessage({ type: 'openSettings' });
  });
});
