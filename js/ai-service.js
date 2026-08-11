/**
 * Eureka Lite - AI Service（多品牌大模型接入层）
 * ---------------------------------------------------------------
 * 支持用户自带 Key 配置任意兼容 OpenAI Chat Completions 协议的大模型。
 * - chat(messages, options)      : 通用对话，返回纯文本
 * - complete(prompt, options)    : 单轮补全（system + user）
 * - completeJSON(prompt, options): 要求返回 JSON，自动解析
 * - isReady()                    : 是否已配置可用的 Key
 * - getProviders()               : 返回可选品牌清单
 * - saveUserConfig(cfg)          : 保存用户配置到 localStorage
 * - getUserConfig()              : 读取用户配置
 * - clearUserConfig()            : 清除用户配置
 * - test()                       : 连接测试
 *
 * 设计原则：
 * - 任何错误都以 throw 抛出，由调用方决定是否回退到本地模板（graceful degradation）。
 * - 不在控制台打印 Key。
 * - 用户配置（localStorage 'eureka_ai_config'）优先于部署者内置的 window.AI_CONFIG。
 */
const AIService = {
  // 可选大模型品牌（均为 OpenAI Chat Completions 兼容协议）
  // 仅保留纯净英文 label + 技术字段；移除 desc 描述（用户要求 UI 极简）
  PROVIDERS: {
    deepseek: {
      id: 'deepseek',
      label: 'DeepSeek',
      baseUrl: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      models: ['deepseek-chat', 'deepseek-reasoner'],
      keyPrefix: 'sk-',
      docUrl: 'https://platform.deepseek.com/api_keys',
      keyHint: 'sk-xxx (platform.deepseek.com)'
    },
    openai: {
      id: 'openai',
      label: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      model: 'gpt-4o-mini',
      models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      keyPrefix: 'sk-',
      docUrl: 'https://platform.openai.com/api-keys',
      keyHint: 'sk-xxx (platform.openai.com)'
    },
    qwen: {
      id: 'qwen',
      label: 'Qwen',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      model: 'qwen-plus',
      models: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen-long'],
      keyPrefix: 'sk-',
      docUrl: 'https://dashscope.console.aliyun.com/apiKey',
      keyHint: 'sk-xxx (Alibaba Cloud Bailian)'
    },
    ernie: {
      id: 'ernie',
      label: 'ERNIE',
      baseUrl: 'https://qianfan.baidubce.com/v2/chat/completions',
      model: 'ernie-4.0-8k',
      models: ['ernie-4.0-8k', 'ernie-3.5-8k', 'ernie-speed-8k'],
      keyPrefix: 'eb-',
      docUrl: 'https://console.bce.baidu.com/qianfan/ais/console/application',
      keyHint: 'eb-xxx (Baidu Qianfan)'
    },
    glm: {
      id: 'glm',
      label: 'GLM',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      model: 'glm-4-flash',
      models: ['glm-4-flash', 'glm-4-plus', 'glm-4-air', 'glm-4'],
      keyPrefix: '',
      docUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
      keyHint: 'API Key (open.bigmodel.cn)'
    },
    moonshot: {
      id: 'moonshot',
      label: 'Kimi',
      baseUrl: 'https://api.moonshot.cn/v1/chat/completions',
      model: 'moonshot-v1-8k',
      models: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
      keyPrefix: 'sk-',
      docUrl: 'https://platform.moonshot.cn/console/api-keys',
      keyHint: 'sk-xxx (platform.moonshot.cn)'
    },
    doubao: {
      id: 'doubao',
      label: 'Doubao',
      baseUrl: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: 'doubao-seed-1-6-250615',
      models: ['doubao-seed-1-6-250615', 'doubao-pro-32k', 'doubao-lite-32k'],
      keyPrefix: '',
      docUrl: 'https://console.volcengine.com/ark',
      keyHint: 'API Key (Volcano Ark)'
    },
    hunyuan: {
      id: 'hunyuan',
      label: 'Hunyuan',
      baseUrl: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
      model: 'hunyuan-lite',
      models: ['hunyuan-lite', 'hunyuan-standard', 'hunyuan-pro'],
      keyPrefix: '',
      docUrl: 'https://console.cloud.tencent.com/hunyuan/api-key',
      keyHint: 'API Key (Tencent Cloud Hunyuan)'
    }
  },

  // 用户配置存储键
  USER_CFG_KEY: 'eureka_ai_config',

  /**
   * 读取用户自定义配置（localStorage）
   */
  getUserConfig() {
    try {
      const raw = localStorage.getItem(this.USER_CFG_KEY);
      if (!raw) return null;
      const cfg = JSON.parse(raw);
      if (cfg && cfg.provider && cfg.apiKey) return cfg;
    } catch (e) {}
    return null;
  },

  /**
   * 保存用户配置到 localStorage
   */
  saveUserConfig(cfg) {
    try {
      localStorage.setItem(this.USER_CFG_KEY, JSON.stringify({
        provider: cfg.provider,
        apiKey: (cfg.apiKey || '').trim(),
        model: cfg.model || (this.PROVIDERS[cfg.provider]?.model || ''),
        savedAt: Date.now()
      }));
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * 清除用户配置
   */
  clearUserConfig() {
    try { localStorage.removeItem(this.USER_CFG_KEY); } catch (e) {}
  },

  /**
   * 返回可选品牌清单
   */
  getProviders() {
    return Object.values(this.PROVIDERS);
  },

  getProvider(id) {
    return this.PROVIDERS[id] || null;
  },

  /**
   * 内部：解析最终生效的配置
   * 优先级：用户 localStorage 配置 > 部署者内置 window.AI_CONFIG > 空
   */
  _cfg() {
    // 1) 用户自带 Key（最优先）
    const user = this.getUserConfig();
    if (user && user.apiKey) {
      const p = this.PROVIDERS[user.provider];
      if (p) {
        return {
          apiKey: user.apiKey,
          baseUrl: p.baseUrl,
          model: user.model || p.model,
          provider: p.id,
          providerLabel: p.label,
          temperature: 0.7,
          maxTokens: 1200,
          timeoutMs: 30000
        };
      }
    }

    // 2) 部署者内置配置（如本地 ai-config.js 含真实 key）
    const base = window.AI_CONFIG || {};
    if (base && base.apiKey) {
      return {
        apiKey: base.apiKey,
        baseUrl: base.baseUrl || this.PROVIDERS[base.provider || {}] && (this.PROVIDERS[base.provider]?.baseUrl) || 'https://api.deepseek.com/chat/completions',
        model: base.model || 'deepseek-chat',
        provider: base.provider || 'deepseek',
        providerLabel: this.PROVIDERS[base.provider]?.label || 'DeepSeek',
        temperature: typeof base.temperature === 'number' ? base.temperature : 0.7,
        maxTokens: base.maxTokens || 1200,
        timeoutMs: base.timeoutMs || 30000
      };
    }

    // 3) 空配置
    return {
      apiKey: '',
      baseUrl: 'https://api.deepseek.com/chat/completions',
      model: 'deepseek-chat',
      provider: 'deepseek',
      providerLabel: 'DeepSeek',
      temperature: 0.7,
      maxTokens: 1200,
      timeoutMs: 30000
    };
  },

  /**
   * 是否已配置可用 Key（含用户自带 + 内置）
   */
  isReady() {
    const c = this._cfg();
    if (!c.apiKey || c.apiKey.length < 20) return false;
    const p = this.PROVIDERS[c.provider];
    if (p && p.keyPrefix) {
      return c.apiKey.startsWith(p.keyPrefix);
    }
    return true;
  },

  /**
   * 当前生效的 provider 概要（用于 UI 展示）
   */
  status() {
    const user = this.getUserConfig();
    const c = this._cfg();
    return {
      ready: this.isReady(),
      provider: c.provider,
      providerLabel: c.providerLabel,
      fromUser: !!user,
      model: c.model
    };
  },

  /**
   * 通用对话
   */
  async chat(messages, options = {}) {
    const c = this._cfg();
    if (!this.isReady()) {
      throw new Error('AI_NOT_CONFIGURED');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), c.timeoutMs);

    const body = {
      model: c.model,
      messages,
      temperature: options.temperature ?? c.temperature,
      max_tokens: options.maxTokens ?? c.maxTokens,
      stream: false
    };
    if (options.json) {
      body.response_format = { type: 'json_object' };
    }

    try {
      const resp = await fetch(c.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${c.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!resp.ok) {
        let detail = '';
        try {
          const errJson = await resp.json();
          detail = errJson?.error?.message || JSON.stringify(errJson);
        } catch (e) {
          detail = await resp.text().catch(() => '');
        }
        throw new Error(`AI_HTTP_${resp.status}: ${detail}`);
      }

      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error('AI_EMPTY_RESPONSE');
      return content.trim();
    } catch (err) {
      if (err.name === 'AbortError') throw new Error('AI_TIMEOUT');
      throw err;
    } finally {
      clearTimeout(timer);
    }
  },

  /**
   * 单轮补全
   */
  async complete(prompt, options = {}) {
    const messages = [];
    let system = options.system || '';
    // Force English output when UI is in EN mode
    if (typeof I18N !== 'undefined' && I18N.getLang && I18N.getLang() === 'en') {
      system += (system ? '\n\n' : '') + 'You must respond in English only. Do not output Chinese characters unless the user explicitly provided Chinese text that needs to be quoted.';
    }
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    return this.chat(messages, options);
  },

  /**
   * 要求返回 JSON 并解析
   */
  async completeJSON(prompt, options = {}) {
    const sys = (options.system ? options.system + '\n\n' : '') +
      '请只返回一个合法的 JSON 对象，不要包含任何解释文字、注释或 Markdown 代码块标记。';
    const text = await this.complete(prompt, { ...options, system: sys, json: true });
    return this._parseJSON(text);
  },

  _parseJSON(text) {
    if (!text) throw new Error('AI_EMPTY_RESPONSE');
    let t = text.trim();
    t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    try {
      return JSON.parse(t);
    } catch (e) {
      const start = t.indexOf('{');
      const end = t.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        return JSON.parse(t.slice(start, end + 1));
      }
      throw new Error('AI_JSON_PARSE_FAILED');
    }
  },

  /**
   * 连接测试
   */
  async test() {
    if (!this.isReady()) {
      return { ok: false, message: '未配置 API Key' };
    }
    try {
      const r = await this.complete('回复"pong"两个字即可。', { maxTokens: 10, temperature: 0 });
      return { ok: true, message: r };
    } catch (e) {
      return { ok: false, message: e.message || String(e) };
    }
  }
};

window.AIService = AIService;
