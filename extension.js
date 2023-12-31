const vscode = require('vscode');
const path = require('path');
const axios = require('axios');

let sessionActive = false;
let apiKey = '';
let apiUrl = '';

let eventBody = {
  sessionStarted: null,
  activeFile: null,
  sessionEnded: null,
};

async function activate(context) {
  const fileLocation = vscode.Uri.joinPath(context.extensionUri, 'data.json');
  try {
    // Check if data.json exists
    const fileExists = await vscode.workspace.fs.stat(fileLocation).then(
      () => true,
      () => false
    );

    if (fileExists) {
      // If the file exists, read its content
      const dataBuffer = await vscode.workspace.fs.readFile(fileLocation);
      const storedData = JSON.parse(dataBuffer.toString());
      apiKey = storedData.apiKey;
      apiUrl = storedData.apiUrl;
      // Checking the validity of the stored API key
      const checkResponse = await checkValidityAPI(apiKey);
      await confirmAndSendTelemetryEvent(fileLocation, checkResponse);
    } else {
      // If the file doesn't exist, ask the user for the API key
      apiKey = await vscode.window.showInputBox({
        prompt: 'Enter API Key',
        placeHolder: 'Get it from vscode.tharindu.me',
      });

      // Check the validity of the API key
      const checkResponse = await checkValidityAPI(apiKey);
      await confirmAndSendTelemetryEvent(fileLocation, checkResponse);
    }
  } catch (error) {
    // Handle errors gracefully
    console.error(error);
    vscode.window.showErrorMessage(
      'Error reading data.json. Please check the extension logs.'
    );
  }
}

async function deactivate() {
  const endTime = new Date();
  await sendTelemetryEvent(apiUrl, 'sessionEnded', { endTime });
}

async function confirmAndSendTelemetryEvent(fileLocation, checkResponse) {
  if (!checkResponse.data.profile.valid) {
    vscode.window.showErrorMessage(
      'Stored API Key is invalid. Please re-enter.'
    );
    // Give the user a chance to correct the invalid API key
    apiKey = await vscode.window.showInputBox({
      prompt: 'Enter API Key',
      placeHolder: 'Get it from vscode.tharindu.me',
    });
    //Check validity of the new API key
    checkResponse = await checkValidityAPI(apiKey);
    await confirmAndSendTelemetryEvent(fileLocation, checkResponse);
  } else {
    //Get latest data and save it to data.json
    newUrl = checkResponse.data.profile.data.url;
    newKey = checkResponse.data.profile.data.api;
    dataToStore = { apiKey: newKey, apiUrl: newUrl };
    const dataBuffer = Buffer.from(JSON.stringify(dataToStore), 'utf8');
    await vscode.workspace.fs.writeFile(fileLocation, dataBuffer);

    if (checkResponse.data.profile.data.enabled) {
      //Send start session event
      const startTime = new Date();
      sendTelemetryEvent(newUrl, 'sessionStarted', { startTime });
      sessionActive = true;

      //Listen for changes in the active text editor
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          const activeFile = path.basename(editor.document.fileName);
          const timeSwitched = new Date();
          sendTelemetryEvent(newUrl, 'fileSwitched', {
            activeFile,
            timeSwitched,
          });
        }
      });
    } else {
      vscode.window.showInformationMessage(
        'Extension is disabled. Please enable it from vscode.tharindu.me'
      );
    }
  }
  return;
}

async function checkValidityAPI(apiKey) {
  const checkUrl = `https://vscode.tharindu.me/api/check/${apiKey}`;

  try {
    const checkResponse = await axios.get(checkUrl);
    return checkResponse;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      vscode.window.showErrorMessage('Invalid API Key. Please re-enter.');
      newKey = await vscode.window.showInputBox({
        prompt: 'Enter API Key',
        placeHolder: 'Get it from vscode.tharindu.me',
      });
      return checkValidityAPI(newKey);
    } else {
      // Handle other errors
      console.error(error);
      vscode.window.showErrorMessage('Error checking API validity.');
      throw error; // rethrow the error if it's not a 401
    }
  }
}

async function sendTelemetryEvent(apiUrl, eventName, data) {
  if (!apiUrl) {
    vscode.window.showErrorMessage(
      'API URL is not set. Please set it in extension settings.'
    );
    return;
  }

  switch (eventName) {
    case 'sessionStarted':
      eventBody.sessionStarted = { valid: true, time: data.startTime };
      break;

    case 'fileSwitched':
      eventBody.activeFile = {
        valid: true,
        name: data.activeFile,
        time: data.timeSwitched,
      };
      break;

    case 'sessionEnded':
      eventBody.sessionEnded = { valid: true, time: data.endTime };
      break;

    default:
      break;
  }

  try {
    const response = await axios.post(apiUrl, eventBody, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(
      'Check your receiving URL in extension settings, and restart the VS Code.'
    );
  }
}

module.exports = {
  activate,
  deactivate,
};
