// 后台脚本，在扩展的生命周期内持续运行

// 监听扩展安装或更新事件
chrome.runtime.onInstalled.addListener(() => {
  console.log('Flomo笔记插件已安装或更新');
  
  // 初始化设置
  chrome.storage.sync.get(['settings'], function(result) {
    if (!result.settings) {
      chrome.storage.sync.set({
        settings: {
          flomoApi: 'https://flomoapp.com/iwh/MTA0NDIx/1b567d477cb2fbb311e31538d2c96299/',
          aiApiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          aiApiUrl: 'https://api.openai.com/v1/chat/completions'
        }
      });
      console.log('默认设置已初始化');
    }
  });
  
  // 初始化提交统计
  chrome.storage.sync.get(['submissionStats'], function(result) {
    if (!result.submissionStats) {
      chrome.storage.sync.set({ submissionStats: {} });
      console.log('提交统计已初始化');
    }
  });
  
  // 检查Chrome版本和侧边栏API支持情况
  checkSidePanelSupport();
});

// 检查侧边栏API支持情况
function checkSidePanelSupport() {
  const chromeVersion = /Chrome\/([0-9.]+)/.exec(navigator.userAgent);
  if (chromeVersion && chromeVersion[1]) {
    const majorVersion = parseInt(chromeVersion[1].split('.')[0]);
    console.log('Chrome版本:', majorVersion);
    
    if (majorVersion >= 114) {
      console.log('Chrome版本支持侧边栏API');
    } else {
      console.log('Chrome版本过低，不支持侧边栏API，需要Chrome 114+');
    }
  }
  
  if (chrome.sidePanel) {
    console.log('侧边栏API可用');
    
    // 设置侧边栏默认状态
    try {
      chrome.sidePanel.setOptions({
        enabled: true,
        path: 'sidebar/sidebar.html'
      });
      console.log('侧边栏选项已设置');
    } catch (error) {
      console.error('设置侧边栏选项出错:', error);
    }
  } else {
    console.log('侧边栏API不可用，将使用弹出窗口模式');
  }
}

// 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  console.log('插件图标被点击');
  
  // 尝试打开侧边栏（如果支持）
  try {
    if (chrome.sidePanel) {
      console.log('尝试打开侧边栏');
      chrome.sidePanel.open({ windowId: tab.windowId })
        .then(() => {
          console.log('侧边栏已成功打开');
        })
        .catch((error) => {
          console.error('打开侧边栏失败:', error);
          // 如果打开侧边栏失败，可能需要手动触发弹出窗口
          // 但由于manifest中已经配置了default_popup，这里不需要额外操作
        });
    } else {
      // 如果不支持侧边栏，则打开popup
      console.log('当前Chrome版本不支持侧边栏，将打开popup');
      // 这里不需要额外操作，因为manifest中已经配置了default_popup
    }
  } catch (error) {
    console.error('打开侧边栏出错:', error);
  }
});

// 监听来自popup或content script的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('收到消息:', request);
  
  // 处理不同类型的消息
  if (request.action === "getApiUrl") {
    // 获取API URL
    chrome.storage.sync.get(['settings'], function(result) {
      sendResponse({apiUrl: result.settings?.flomoApi || 'https://flomoapp.com/iwh/MTA0NDIx/1b567d477cb2fbb311e31538d2c96299/'});
    });
    return true; // 异步响应需要返回true
  } else if (request.action === "openSidePanel") {
    // 尝试打开侧边栏
    try {
      if (chrome.sidePanel) {
        chrome.sidePanel.open({ windowId: request.windowId })
          .then(() => {
            console.log('通过消息请求打开侧边栏成功');
            sendResponse({ success: true });
          })
          .catch((error) => {
            console.error('通过消息请求打开侧边栏失败:', error);
            sendResponse({ success: false, error: error.message });
          });
      } else {
        sendResponse({ success: false, error: '侧边栏API不可用' });
      }
    } catch (error) {
      console.error('处理openSidePanel消息出错:', error);
      sendResponse({ success: false, error: error.message });
    }
    return true; // 异步响应需要返回true
  }
});
