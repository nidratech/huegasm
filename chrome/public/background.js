chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'start-listen') {
        chrome.tabCapture.capture({
            audio: true,
            video: false
        }, function (stream) {
            console.log('stream', stream);
            //I can attach all my filter here...
        });
    }
});