const vscode = require('vscode');
const path = require('path');
const axios = require('axios');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  const apiUrl = context.globalState.get('apiUrl');
  const userEmail = context.globalState.get('userEmail');
  const apiKey = context.globalState.get('apiKey');

  // Check if the information has already been collected
  if (!apiUrl || !userEmail || !apiKey) {
    await collectTelemetryData(context);
  }

  const startTime = new Date();
  sendTelemetryEvent(apiUrl, apiKey, 'sessionStarted', {
    startTime,
    email: userEmail,
  });

  // Listen for changes in the active text editor
  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (editor) {
      const activeFile = path.basename(editor.document.fileName);
      const timeSwitched = new Date();
      sendTelemetryEvent(apiUrl, apiKey, 'fileSwitched', {
        activeFile,
        timeSwitched,
        email: userEmail,
      });
    }
  });
}

async function collectTelemetryData(context) {
  const apiUrl = await vscode.window.showInputBox({
    prompt: 'Enter API URL for telemetry events',
    placeHolder: 'https://example.com/api',
  });

  if (!apiUrl) {
    vscode.window.showErrorMessage('API URL is required for telemetry events.');
    return;
  }

  const email = await vscode.window.showInputBox({
    prompt: 'Enter your email',
    placeHolder: 'user@example.com',
  });

  if (!email) {
    vscode.window.showErrorMessage('Email is required for telemetry events.');
    return;
  }

  const apiKey = await vscode.window.showInputBox({
    prompt: 'Enter API key for authentication',
    placeHolder: 'YourAPIKeyHere',
  });

  if (!apiKey) {
    vscode.window.showErrorMessage('API key is required for telemetry events.');
    return;
  }

  // Save the collected data to the extension's global state
  context.globalState.update('apiUrl', apiUrl);
  context.globalState.update('userEmail', email);
  context.globalState.update('apiKey', apiKey);
}

// This method is called when your extension is deactivated
function deactivate() {
  // Deactivation logic if needed
}

async function sendTelemetryEvent(apiUrl, apiKey, eventName, data) {
  // Retrieve the API URL and email from the extension's global state
  const url =
    apiUrl || vscode.workspace.getConfiguration().get('yourExtension.apiUrl');
  const email =
    data.email ||
    vscode.workspace.getConfiguration().get('yourExtension.userEmail');

  if (!url) {
    vscode.window.showErrorMessage(
      'API URL is not set. Please set it in extension settings.'
    );
    return;
  }

  const body = JSON.stringify({ eventName, data });

  try {
    // Use 'axios' library to make a POST request to the API URL with API key
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
}

module.exports = {
  activate,
  deactivate,
};
