const vscode = acquireVsCodeApi();

let currentRequestId = null;
let isWorking = false;

document.addEventListener('DOMContentLoaded', () => {
  vscode.postMessage({ type: 'ready' });
});

window.addEventListener('message', event => {
  const message = event.data;
  switch (message.type) {
    case 'start':
      startResponse(message);
      break;
    case 'chunk':
      appendChunk(message);
      break;
    case 'done':
      completeResponse(message);
      break;
    case 'error':
      handleError(message);
      break;
    case 'toolStart':
      // handle tool start
      break;
    case 'toolResults':
      addToolSummary(message);
      break;
  }
});

function initUI(message) {
  const modeSelect = document.querySelector('[data-mode]');
  modeSelect.innerHTML = '';
  message.modes.forEach(mode => {
    const option = document.createElement('option');
    option.value = mode.id;
    option.textContent = mode.title;
    modeSelect.appendChild(option);
  });
  // Load history if any
  message.history.forEach(addMessage);
}

function addMessage(message) {
  const transcript = document.getElementById('transcript');
  const messageEl = document.createElement('div');
  messageEl.className = `message message--${message.role}`;
  if (message.mode) {
    messageEl.classList.add(`message--${message.mode}`);
  }
  const contentEl = document.createElement('div');
  contentEl.className = 'message__content';
  contentEl.textContent = message.content;
  messageEl.appendChild(contentEl);
  transcript.appendChild(messageEl);
  transcript.scrollTop = transcript.scrollHeight;
}

let currentResponse = '';

function startResponse(message) {
  isWorking = true;
  currentRequestId = message.requestId;
  currentResponse = '';
  updateUI();
  addMessage({ role: 'assistant', content: '' });
}

function appendChunk(message) {
  const transcript = document.getElementById('transcript');
  let lastMessage = transcript.lastElementChild;
  if (!lastMessage || !lastMessage.classList.contains('message--assistant')) {
    addMessage({ role: 'assistant', content: '' });
    lastMessage = transcript.lastElementChild;
  }
  if (lastMessage) {
    const contentEl = lastMessage.querySelector('.message__content');
    currentResponse += message.data;
    contentEl.textContent = currentResponse;
    transcript.scrollTop = transcript.scrollHeight;
  }
}

function completeResponse(message) {
  isWorking = false;
  // Parse think
  const thinkMatch = currentResponse.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    const thinkContent = thinkMatch[1];
    const cleanResponse = currentResponse.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    const lastMessage = document.getElementById('transcript').lastElementChild;
    if (lastMessage) {
      const contentEl = lastMessage.querySelector('.message__content');
      contentEl.textContent = cleanResponse;
      const thinkEl = document.createElement('div');
      thinkEl.className = 'think-section';
      thinkEl.innerHTML = `
        <div class="think-header">
          <span class="think-icon">⟳</span>
          <span>Thinking</span>
          <button class="think-toggle">▼</button>
        </div>
        <div class="think-content">${thinkContent}</div>
      `;
      thinkEl.querySelector('.think-toggle').addEventListener('click', () => {
        const content = thinkEl.querySelector('.think-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
      });
      const icon = thinkEl.querySelector('.think-icon');
      icon.style.animation = 'none';
      lastMessage.appendChild(thinkEl);
    }
  }
  updateUI();
}

function handleError(message) {
  isWorking = false;
  updateUI();
  addMessage({ role: 'assistant', content: `Error: ${message.data}` });
}

function addToolSummary(message) {
  const results = message.data;
  const summary = results.map((result) => `${result.success ? '✅' : '⚠️'} ${result.tool}${result.id ? ` (${result.id})` : ''}: ${result.summary}`).join('\n');
  addMessage({ role: 'assistant', content: `Tool execution:\n${summary}` });
}

function updateStatus(message) {
  const statusEl = document.querySelector('.status');
  statusEl.textContent = message.state === 'working' ? 'Working...' : 'Ready';
}

function clearTranscript() {
  const transcript = document.getElementById('transcript');
  transcript.innerHTML = '';
}

function updateUI() {
  const sendBtn = document.getElementById('submit-btn');
  sendBtn.innerHTML = isWorking ? '<i class="fas fa-stop"></i>' : '<i class="fas fa-paper-plane"></i>';
}

document.addEventListener('DOMContentLoaded', () => {
  vscode.postMessage({ type: 'ready' });

  const promptInput = document.getElementById('prompt-input');
  const submitBtn = document.getElementById('submit-btn');
  const modeSelect = document.getElementById('mode-select');

  const sendMessage = () => {
    if (isWorking) {
      vscode.postMessage({ type: 'stop' });
    } else {
      const text = promptInput.value.trim();
      if (!text) return;
      const mode = modeSelect.value;
      vscode.postMessage({
        type: 'submitPrompt',
        prompt: text,
        mode: mode
      });
      addMessage({ role: 'user', content: text, mode: mode });
      promptInput.value = '';
    }
  };

  submitBtn.addEventListener('click', sendMessage);

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
});
