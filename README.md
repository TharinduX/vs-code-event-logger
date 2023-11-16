# VS Code Event Logger

## Overview

The VS Code Event Logger Extension is enabling you to display relevant information wherever you need it. This extension sends messages when the editor is started and when a session is initiated, making it easy to track and visualize your coding activities.

## Features

1.  **Session Started Event:**
    When Visual Studio Code is launched, the extension sends an event indicating that the session has started.

2.  **File Switched Event:**
    The extension tracks the currently active file being edited. Whenever you switch to a different file, it sends an event containing the name of the file.

3.  **Session Ended Event:**
    When you close Visual Studio Code, the extension sends a session-ended event to signal the termination of the editing session.

## Installation

1.  Open Visual Studio Code.
2.  Go to the Extensions view.
3.  Search for "VS Code Event Logger" and click Install.

## Activation

After installation, you need to activate the extension by obtaining an API key. Follow these steps:

1.  Visit [https://vscode.tharindu.me](https://vscode.tharindu.me/) to obtain your unique API key.
2.  Set your receiving API endpoint.
3.  Paste your API key into the popup input box and press Enter.

The extension will now send events to the specified API endpoint.

## Contributing

Feel free to contribute to the development of this extension. Report bugs, suggest features, or submit pull requests on the [GitHub repository](https://github.com/TharinduX/vs-code-event-logger).
