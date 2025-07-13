function sendMessageToContentScript(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs[0] && tabs[0].url.startsWith("https://sora.chatgpt.com/library")) {
            chrome.tabs.sendMessage(tabs[0].id, { action: action });
        } else {
            alert("This extension only works on the Sora library page.");
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('delete-general').addEventListener('click', () => {
        sendMessageToContentScript('delete_general');
    });

    document.getElementById('delete-restricted').addEventListener('click', () => {
        sendMessageToContentScript('delete_restricted');
    });

    document.getElementById('clear-trash').addEventListener('click', () => {
        sendMessageToContentScript('clear_trash');
    });
});