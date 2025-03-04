// 内容脚本，在页面中执行
// 这个脚本可以用来与页面交互，例如获取选中的文本等

// 监听来自popup或background的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getSelectedText") {
    // 获取用户选中的文本
    const selectedText = window.getSelection().toString();
    sendResponse({selectedText: selectedText});
  }
});

// 如果需要，可以在这里添加更多与页面交互的功能
