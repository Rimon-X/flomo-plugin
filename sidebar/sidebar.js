// 默认设置
const DEFAULT_SETTINGS = {
  flomoApi: 'https://flomoapp.com/iwh/MTA0NDIx/1b567d477cb2fbb311e31538d2c96299/',
  aiApiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  aiApiUrl: 'https://api.openai.com/v1/chat/completions',
  debugMode: false  // 添加调试模式设置
};

// 全局变量
let pageInfo = {
  title: '',
  url: ''
};
let lastTags = '';
let todayCount = 0;
let settings = { ...DEFAULT_SETTINGS };
let currentTags = [];

// 当页面加载完成时执行
document.addEventListener('DOMContentLoaded', async function() {
  // 加载设置
  await loadSettings();
  
  // 加载今日提交计数
  loadTodayCount();
  
  // 获取当前标签页的信息
  getCurrentTabInfo();
  
  // 设置事件监听器
  setupEventListeners();
  
  // 加载上次使用的标签
  initTagsInput();
});

// 加载设置
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['settings'], function(result) {
      if (result.settings) {
        settings = { ...DEFAULT_SETTINGS, ...result.settings };
      }
      
      // 填充设置表单
      document.getElementById('flomo-api').value = settings.flomoApi;
      document.getElementById('ai-api-key').value = settings.aiApiKey;
      document.getElementById('ai-api-url').value = settings.aiApiUrl;
      
      // 设置调试模式复选框
      if (document.getElementById('debug-mode')) {
        document.getElementById('debug-mode').checked = settings.debugMode;
      }
      
      console.log('加载设置:', settings);
      
      resolve();
    });
  });
}

// 保存设置
function saveSettings() {
  const newSettings = {
    flomoApi: document.getElementById('flomo-api').value.trim(),
    aiApiKey: document.getElementById('ai-api-key').value.trim(),
    aiApiUrl: document.getElementById('ai-api-url').value.trim(),
    debugMode: document.getElementById('debug-mode').checked  // 添加调试模式设置
  };
  
  // 验证设置
  if (!newSettings.flomoApi) {
    newSettings.flomoApi = DEFAULT_SETTINGS.flomoApi;
  }
  if (!newSettings.aiApiKey) {
    newSettings.aiApiKey = DEFAULT_SETTINGS.aiApiKey;
  }
  if (!newSettings.aiApiUrl) {
    newSettings.aiApiUrl = DEFAULT_SETTINGS.aiApiUrl;
  }
  
  // 保存设置
  settings = newSettings;
  chrome.storage.sync.set({ settings: newSettings });
  
  // 隐藏设置面板
  document.getElementById('settings-panel').style.display = 'none';
}

// 加载今日提交计数
function loadTodayCount() {
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.sync.get(['submissionStats'], function(result) {
    if (result.submissionStats && result.submissionStats[today]) {
      todayCount = result.submissionStats[today];
    } else {
      todayCount = 0;
    }
    document.getElementById('today-count').textContent = todayCount;
  });
}

// 更新今日提交计数
function updateTodayCount() {
  const today = new Date().toISOString().split('T')[0];
  chrome.storage.sync.get(['submissionStats'], function(result) {
    let stats = result.submissionStats || {};
    stats[today] = (stats[today] || 0) + 1;
    chrome.storage.sync.set({ submissionStats: stats });
    todayCount = stats[today];
    document.getElementById('today-count').textContent = todayCount;
  });
}

// 获取当前标签页信息
function getCurrentTabInfo() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs && tabs.length > 0) {
      const currentTab = tabs[0];
      pageInfo.title = currentTab.title || '';
      pageInfo.url = currentTab.url || '';
      
      // 设置标题和URL
      document.getElementById('title').value = pageInfo.title;
      document.getElementById('url-display').textContent = pageInfo.url;
    }
  });
}

// 设置事件监听器
function setupEventListeners() {
  // 设置图标点击事件
  document.getElementById('settings-icon').addEventListener('click', function() {
    const settingsPanel = document.getElementById('settings-panel');
    settingsPanel.style.display = settingsPanel.style.display === 'none' ? 'block' : 'none';
  });
  
  // 保存设置按钮点击事件
  document.getElementById('save-settings').addEventListener('click', saveSettings);
  
  // 取消设置按钮点击事件
  document.getElementById('cancel-settings').addEventListener('click', function() {
    document.getElementById('settings-panel').style.display = 'none';
  });
  
  // 生成智能标题按钮点击事件
  document.getElementById('generate-title').addEventListener('click', generateSmartTitle);
  
  // 使用智能标题按钮点击事件
  document.getElementById('use-smart-title').addEventListener('click', useSmartTitle);
  
  // 提交按钮点击事件
  document.getElementById('submit').addEventListener('click', submitToFlomo);
  
  // 标签显示区域双击事件
  document.getElementById('tags-display').addEventListener('dblclick', function() {
    const tagsDisplay = document.getElementById('tags-display');
    const tagsInput = document.getElementById('tags-input');
    
    tagsDisplay.classList.add('hidden');
    tagsInput.classList.remove('hidden');
    tagsInput.value = lastTags;
    tagsInput.focus();
  });
}

// 初始化标签输入
function initTagsInput() {
  const tagsInput = document.getElementById('tags-input');
  
  // 加载上次使用的标签
  chrome.storage.sync.get(['lastTags'], function(result) {
    if (result.lastTags) {
      lastTags = result.lastTags;
      currentTags = lastTags.split(' ').filter(tag => tag.trim());
      displayTags(currentTags);
    }
  });
  
  // 监听标签输入框的键盘事件
  tagsInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      
      const tag = tagsInput.value.trim();
      if (tag) {
        // 添加标签
        if (!currentTags.includes(tag)) {
          currentTags.push(tag);
          displayTags(currentTags);
          
          // 保存最后使用的标签
          lastTags = currentTags.join(' ');
          chrome.storage.sync.set({ lastTags: lastTags });
        }
        
        // 清空输入框
        tagsInput.value = '';
      }
    }
  });
}

// 显示标签
function displayTags(tags) {
  const tagsDisplay = document.getElementById('tags-display');
  tagsDisplay.innerHTML = '';
  
  tags.forEach(tag => {
    const tagElement = document.createElement('div');
    tagElement.className = 'tag';
    tagElement.textContent = tag;
    
    // 添加标签悬停提示
    tagElement.title = `双击编辑标签 "${tag}"`;
    
    // 双击编辑标签
    tagElement.addEventListener('dblclick', () => {
      const tagsInput = document.getElementById('tags-input');
      tagsInput.value = tag;
      tagsInput.focus();
      
      // 移除该标签
      const index = currentTags.indexOf(tag);
      if (index !== -1) {
        currentTags.splice(index, 1);
        displayTags(currentTags);
      }
    });
    
    // 添加删除按钮
    const deleteButton = document.createElement('span');
    deleteButton.className = 'tag-delete';
    deleteButton.textContent = '×';
    deleteButton.title = `删除标签 "${tag}"`;
    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = currentTags.indexOf(tag);
      if (index !== -1) {
        currentTags.splice(index, 1);
        displayTags(currentTags);
      }
    });
    
    tagElement.appendChild(deleteButton);
    tagsDisplay.appendChild(tagElement);
  });
  
  currentTags = tags;
}

// 生成智能标题
async function generateSmartTitle() {
  console.log('开始生成智能标题');
  const summary = document.getElementById('summary').value.trim();
  const thoughts = document.getElementById('thoughts').value.trim();
  
  // 检查是否有足够的内容生成标题
  if (!summary && !thoughts) {
    showError('summary-error', '请先填写摘要或感想');
    console.error('无法生成标题：缺少摘要和感想');
    return;
  }
  
  // 显示生成中状态
  const generateButton = document.getElementById('generate-title');
  const originalText = generateButton.textContent;
  generateButton.disabled = true;
  generateButton.textContent = '生成中...';
  
  try {
    // 检查API密钥是否有效
    if (!settings.aiApiKey || settings.aiApiKey === 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx') {
      throw new Error('请先在设置中配置有效的AI API密钥');
    }
    
    const prompt = `你是一个专业的内容总结助手。请根据以下内容，生成一个8个字以内的简洁标题。

内容包括：
1. 个人感想: ${thoughts || '无'}
2. 用户摘录: ${summary || '无'}
3. 网页标题: ${pageInfo.title || '无'}

请按照以下优先级进行总结：首先考虑个人感想，其次是用户摘录，最后是网页标题。
标题应当简洁明了，能够准确反映内容的核心要点。
请直接返回标题，不要包含任何解释或其他文字。`;

    console.log('发送AI请求生成标题');
    console.log('API URL:', settings.aiApiUrl);
    console.log('API Key前几位:', settings.aiApiKey.substring(0, 5) + '...');
    
    // 使用本地模拟生成标题（当API不可用时）
    if (settings.aiApiKey === 'local' || settings.aiApiUrl === 'local') {
      console.log('使用本地模拟生成标题');
      // 简单地从摘要或感想中提取前几个字作为标题
      let localTitle = '';
      if (thoughts) {
        localTitle = thoughts.substring(0, 8);
      } else if (summary) {
        localTitle = summary.substring(0, 8);
      } else if (pageInfo.title) {
        localTitle = pageInfo.title.substring(0, 8);
      } else {
        localTitle = '新笔记';
      }
      
      // 显示本地生成的标题
      const smartTitleElement = document.getElementById('smart-title');
      smartTitleElement.textContent = localTitle;
      smartTitleElement.style.display = 'block';
      
      // 显示"使用此标题"按钮
      document.getElementById('use-smart-title').classList.remove('hidden');
      return;
    }
    
    // 根据API URL选择正确的请求体格式
    let requestBody;
    let apiProvider = 'unknown';
    
    // 检查是否是OpenAI API
    if (settings.aiApiUrl.includes('openai.com')) {
      apiProvider = 'OpenAI';
      requestBody = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一个专业的内容总结助手。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      };
    } 
    // 检查是否是SiliconFlow API
    else if (settings.aiApiUrl.includes('siliconflow.cn')) {
      apiProvider = 'SiliconFlow';
      requestBody = {
        model: "deepseek-ai/DeepSeek-V3",  // 使用DeepSeek-V3模型
        messages: [
          {
            role: "system",
            content: "你是一个专业的内容总结助手。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 50,
        top_p: 0.7,
        top_k: 50,
        response_format: {
          type: "text"
        }
      };
    }
    // 默认格式
    else {
      apiProvider = '未知提供商';
      requestBody = {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "你是一个专业的内容总结助手。"
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 50
      };
    }
    
    console.log('API提供商:', apiProvider);
    console.log('请求体:', JSON.stringify(requestBody, null, 2));
    
    // 如果开启了调试模式，显示请求详情
    if (settings.debugMode) {
      showDebugInfo(`正在使用 ${apiProvider} API 生成标题，模型: ${requestBody.model}`);
    }
    
    const response = await fetch(settings.aiApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.aiApiKey}`
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log('API响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      
      // 如果开启了调试模式，显示详细错误信息
      if (settings.debugMode) {
        showDebugInfo(`API错误: ${response.status} - ${errorText}`);
      }
      
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('API响应数据:', data);
    
    // 如果开启了调试模式，显示响应数据
    if (settings.debugMode) {
      showDebugInfo(`API响应: ${JSON.stringify(data, null, 2)}`);
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('API返回的数据格式不正确');
    }
    
    const smartTitle = data.choices[0].message.content.trim();
    console.log('生成的智能标题:', smartTitle);
    
    // 显示智能标题
    const smartTitleElement = document.getElementById('smart-title');
    smartTitleElement.textContent = smartTitle;
    smartTitleElement.style.display = 'block';
    
    // 显示"使用此标题"按钮
    document.getElementById('use-smart-title').classList.remove('hidden');
  } catch (error) {
    console.error('生成标题错误:', error);
    showError('title-error', '生成标题失败: ' + error.message);
    
    // 显示错误提示在界面上
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = '提示：请检查AI API设置是否正确，或者尝试更换API密钥。';
    errorElement.style.display = 'block';
    
    const titleErrorElement = document.getElementById('title-error');
    if (titleErrorElement.nextSibling) {
      titleErrorElement.parentNode.insertBefore(errorElement, titleErrorElement.nextSibling);
    } else {
      titleErrorElement.parentNode.appendChild(errorElement);
    }
    
    // 如果开启了调试模式，显示详细错误信息
    if (settings.debugMode) {
      showDebugInfo(`生成标题错误: ${error.message}`);
    }
  } finally {
    // 恢复按钮状态
    generateButton.disabled = false;
    generateButton.textContent = originalText;
  }
}

// 显示调试信息
function showDebugInfo(message) {
  // 检查是否已存在调试信息区域
  let debugElement = document.getElementById('debug-info');
  
  // 如果不存在，创建一个
  if (!debugElement) {
    debugElement = document.createElement('div');
    debugElement.id = 'debug-info';
    debugElement.className = 'debug-info';
    document.body.appendChild(debugElement);
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .debug-info {
        position: fixed;
        bottom: 10px;
        left: 10px;
        right: 10px;
        max-height: 200px;
        overflow-y: auto;
        background-color: #f8f8f8;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 1000;
      }
      .debug-message {
        margin-bottom: 5px;
        padding: 5px;
        border-bottom: 1px solid #eee;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 创建新的消息元素
  const messageElement = document.createElement('div');
  messageElement.className = 'debug-message';
  messageElement.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  
  // 添加到调试区域
  debugElement.appendChild(messageElement);
  
  // 滚动到底部
  debugElement.scrollTop = debugElement.scrollHeight;
}

// 使用智能标题
function useSmartTitle() {
  const smartTitle = document.getElementById('smart-title').textContent;
  document.getElementById('title').value = smartTitle;
  document.getElementById('use-smart-title').classList.add('hidden');
}

// 提交到Flomo
async function submitToFlomo() {
  // 清除所有错误信息
  clearAllErrors();
  
  // 获取提交按钮
  const submitButton = document.getElementById('submit');
  
  // 获取表单数据
  const title = document.getElementById('title').value.trim();
  const summary = document.getElementById('summary').value.trim();
  const thoughts = document.getElementById('thoughts').value.trim();
  
  // 获取标签
  let tags;
  if (document.getElementById('tags-display').classList.contains('hidden')) {
    tags = document.getElementById('tags-input').value.trim();
  } else {
    tags = currentTags.join(' ');
  }
  
  // 验证必填字段
  if (!title) {
    showError('title-error', '请填写标题');
    return;
  }
  
  if (!summary && !thoughts) {
    showError('summary-error', '请至少填写摘要或感想中的一项');
    return;
  }
  
  // 禁用提交按钮，防止重复提交
  submitButton.disabled = true;
  submitButton.textContent = '提交中...';
  
  // 构建发送到Flomo的内容
  let content = `## ${title}\n\n`;
  
  if (summary) {
    content += `## 摘要\n${summary}\n\n`;
  }
  
  if (thoughts) {
    content += `## 感想\n${thoughts}\n\n`;
  }
  
  content += `[原文链接](${pageInfo.url})`;
  
  // 添加标签（如果有）
  if (tags) {
    content += ' ' + tags;
  }
  
  // 准备发送的数据
  const data = {
    content: content
  };
  
  try {
    // 发送请求
    const response = await fetch(settings.flomoApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });
    
    // 检查响应状态
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // 尝试解析JSON响应
    const text = await response.text();
    console.log('原始响应:', text);
    
    let responseData;
    try {
      responseData = text ? JSON.parse(text) : {};
    } catch (e) {
      // 如果无法解析为JSON，但响应成功，则认为操作成功
      if (response.ok) {
        responseData = { success: true };
      } else {
        throw new Error('无法解析响应数据');
      }
    }
    
    console.log('响应数据:', responseData);
    
    // 检查响应中的成功标识
    if (responseData.success || responseData.message === 'success' || responseData.message === '已记录') {
      showStatus('保存成功！', 'success');
      
      // 更新今日提交计数
      updateTodayCount();
      
      // 保存最后使用的标签
      if (tags) {
        lastTags = tags;
        chrome.storage.sync.set({ lastTags: tags });
      }
      
      // 清空表单
      document.getElementById('summary').value = '';
      document.getElementById('thoughts').value = '';
      
      // 隐藏智能标题
      document.getElementById('smart-title').style.display = 'none';
      document.getElementById('use-smart-title').classList.add('hidden');
      
      // 2秒后关闭状态提示
      setTimeout(() => {
        document.getElementById('status').classList.add('hidden');
      }, 2000);
    } else {
      showStatus('提交失败：' + (responseData.message || '未知错误'), 'error');
    }
  } catch (error) {
    console.error('提交错误:', error);
    showStatus('提交出错：' + error.message, 'error');
  } finally {
    // 恢复提交按钮状态
    submitButton.disabled = false;
    submitButton.textContent = '保存到Flomo';
  }
}

// 显示错误信息
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  errorElement.textContent = message;
  errorElement.style.display = 'block';
}

// 清除所有错误信息
function clearAllErrors() {
  const errorElements = document.querySelectorAll('.error-message');
  errorElements.forEach(element => {
    element.textContent = '';
    element.style.display = 'none';
  });
}

// 显示状态信息
function showStatus(message, type) {
  const statusElement = document.getElementById('status');
  statusElement.textContent = message;
  statusElement.className = `status ${type}`; // 'success', 'error', 或 'info'
  statusElement.classList.remove('hidden');
}
