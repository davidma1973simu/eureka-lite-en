/**
 * Eureka Lite - Main Application
 * Entry point and router
 */

// 导出全景图时内嵌的自包含样式（含变量与全景图样式，保证下载/图片渲染正确）
const PANORAMA_EXPORT_CSS = `
:root{
  --reveal-primary:#E07A2F;--inspire-primary:#7F77DD;--shape-primary:#0F6E56;--exam-primary:#64748B;
  --text-primary:#1f2937;--text-secondary:#6b7280;--border-color:#e5e7eb;--surface:#fff;
  --bg-secondary:#f8fafc;--space-xs:4px;--space-sm:8px;--space-md:16px;--space-lg:24px;--space-xl:32px;
  --radius-lg:14px;--radius-sm:8px;--shadow-sm:0 1px 3px rgba(0,0,0,.06);
}
body{font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;background:#f3f4f6;margin:0;padding:32px 16px;color:var(--text-primary);}
.panorama-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;max-width:1000px;margin:0 auto;}
@media(max-width:760px){.panorama-grid{grid-template-columns:1fr;}}
.panorama-block{background:var(--surface);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:16px;box-shadow:var(--shadow-sm);}
.reveal-block{border-top:4px solid var(--reveal-primary);}
.inspire-block{border-top:4px solid var(--inspire-primary);}
.shape-block{border-top:4px solid var(--shape-primary);}
.exam-block{border-top:4px solid var(--exam-primary);}
.panorama-block-head{display:flex;align-items:center;gap:8px;margin-bottom:12px;}
.panorama-block-head h3{margin:0;font-size:18px;color:var(--text-primary);}
.panorama-icon{font-size:20px;}
.panorama-row{display:flex;gap:12px;padding:4px 0;font-size:14px;line-height:1.5;}
.panorama-key{flex:0 0 96px;color:var(--text-secondary);font-weight:600;}
.panorama-sub{margin:12px 0 6px;font-weight:700;font-size:14px;color:var(--text-primary);}
.panorama-list{margin:0;padding-left:18px;font-size:14px;}
.panorama-list li{margin:3px 0;}
.panorama-empty{color:var(--text-secondary);list-style:none;padding-left:0;}
.panorama-pitch{background:var(--bg-secondary);border-left:3px solid var(--exam-primary);padding:12px;border-radius:8px;font-size:14px;line-height:1.6;}
.panorama-iter-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:4px;}
.panorama-iter-table th,.panorama-iter-table td{border:1px solid var(--border-color);padding:6px 8px;text-align:left;vertical-align:top;}
.panorama-iter-table thead th{background:var(--bg-secondary);font-weight:700;}
.panorama-iter-table tbody th{background:var(--bg-secondary);font-weight:600;width:120px;}
`;

// Eureka Pro 产品地址（Pro Dashboard 线上版）
const EUREKA_PRO_URL = 'https://davidma1973simu.github.io/workbuddy-agents-marketplace/eureka-dashboard/';
const PRO_UNLOCK_POINTS = 1200;
const PROJECT_COMPLETE_POINTS = 600;

/**
 * 示例项目每屏操作指南（isExample 时显示）
 * 结构: { stage: { screenNum: { action, input, output, reason } } }
 */
const SCREEN_GUIDES = {
  reveal: {
    1: { action: '描述目标用户与场景', input: '用户在什么场景下、有什么痛点', output: '场景卡片（目标用户+场景描述）', reason: '定义创新的起点，明确"为谁、在哪儿、有什么问题"' },
    2: { action: '绘制用户旅程地图', input: '用户在不同接触点上的行为/思考/感受', output: '5格用户旅程（含关键发现）', reason: '可视化用户的全流程体验，找到干预的最佳触点' },
    3: { action: 'FIND 四步推导洞察', input: '旅程中的关键发现', output: 'FIND 洞察链（事实→解读→需求→洞见）', reason: '从表面现象深入到根因，确保方案打中真正的问题' },
    4: { action: '设定商业假设', input: '项目的商业目标和成功假设', output: '商业目标+共识假设', reason: '把创新与商业价值挂钩，确保方向可行' },
    5: { action: '全局回顾确认', input: '前四屏的产出汇总', output: 'Reveal 整合确认卡', reason: '串联所有洞察，确保进入下一阶段前方向一致' }
  },
  inspire: {
    1: { action: '从 POV 重构 HMW 机遇', input: 'Reveal 产出的 POV（目标用户/场景/洞察）', output: '3-4 个维度的 HMW 创新机遇问题', reason: '把用户洞察转化为可行动的创新方向，拓宽思路' },
    2: { action: '收集灵感卡片', input: 'HMW 方向', output: '三组灵感源（新趋势/跨界/外行视角）', reason: '用外部知识激发创意，避免闭门造车' },
    3: { action: 'NCO 交叉生成创意', input: '灵感卡片 + HMW 方向', output: '3 个具体创意方案', reason: '将灵感与方向交叉组合，产出可落地的创意' },
    4: { action: '四维打分筛选最佳创意', input: '所有创意', output: 'Top 2 最佳创意 + 评分', reason: '用结构化评估选择最值得深入的方向' },
    5: { action: '阶段总结确认', input: '最佳创意', output: 'Inspire 整合确认卡', reason: '确认创意方向，为 Shape 阶段做准备' }
  },
  shape: {
    1: { action: '四维拷问方案假设', input: '最佳创意', output: '价值/增长/技术/商业四维假设清单', reason: '暴露方案的潜在风险，提前识别关键假设' },
    2: { action: '构建概念方案', input: '四维拷问结果', output: 'MVP 方案描述（核心功能/特性/边界）', reason: '把创意打磨成可执行的最小可行方案' },
    3: { action: '绘制用户故事板', input: 'MVP 方案', output: '6 格用户故事板', reason: '从用户视角审视方案，确保体验流畅' },
    4: { action: '阶段总结确认', input: '概念方案 + 故事板', output: 'Shape 整合确认卡', reason: '锁定方案，进入验证阶段' }
  },
  exam: {
    1: { action: '制定测试计划', input: '概念方案', output: '测试目的/方法/标准', reason: '明确要验证什么、怎么验证、成功的标准' },
    2: { action: '记录测试报告', input: '测试执行情况', output: '有效价值/无效价值/新问题/新机会', reason: '用真实反馈验证方案，发现盲点和新机会' },
    3: { action: '四维度评价', input: '测试结论', output: '用户/商业/可行/创新四维评分', reason: '结构化评估方案的综合价值' },
    4: { action: '撰写电梯演讲 + 迭代计划', input: '方案 + 验证结论', output: '30秒/60秒演讲 + 30-60-90天迭代计划', reason: '把方案价值讲清楚，规划下一步行动' },
    5: { action: '确认完成项目', input: '全部 Exam 产出', output: 'Exam 整合确认卡', reason: '回顾验证成果，决定是否 Go/No-Go' }
  }
};

// Main App Class
class EurekaLite {
  constructor() {
    this.container = document.getElementById('app');
    this.router = this.initRouter();
    this.currentAIMode = null;
    this.aiModeHistory = [];
  }

  /**
   * Initialize router
   */
  initRouter() {
    return {
      home: () => this.renderHome(),
      reveal: () => this.renderModule('reveal'),
      inspire: () => this.renderModule('inspire'),
      shape: () => this.renderModule('shape'),
      exam: () => this.renderModule('exam'),
      projects: () => this.renderProjects(),
      profile: () => this.renderProfile()
    };
  }

  /**
   * Start the app
   */
  start() {
    // Initialize state
    AppState.init();

    // Render current page
    this.render(AppState.currentPage);

    // Listen to state changes
    AppState.events.on('pageChange', ({ currentPage }) => {
      this.render(currentPage);
    });

    // 抽屉状态变化时同步 DOM
    AppState.events.on('drawerToggle', () => {
      this.updateDrawer();
    });
  }

  /**
   * Render a page
   */
  render(page) {
    const renderer = this.router[page];
    if (renderer) {
      renderer();
    } else {
      this.renderHome();
    }
    // 渲染完成后确保 drawer DOM 状态与 AppState 一致
    this.updateDrawer();
  }

  /**
   * Set container content
   */
  setContent(html) {
    this.container.innerHTML = window.I18N && window.I18N.applyTo ? window.I18N.applyTo(html) : html;
  }

  // ========== HOME PAGE ==========

  renderHome() {
    const user = AppState.user;
    const recentProjects = window.EurekaStorage.getRecentProjects(3);

    this.setContent(this.getHomeTemplate(user, recentProjects));
    this.attachHomeEvents();

    // 【R4】首访自动展示新手引导
    try {
      if (!localStorage.getItem('eureka_seen_intro')) {
        setTimeout(() => {
          this.showIntroModal();
          localStorage.setItem('eureka_seen_intro', 'true');
        }, 600);
      }
    } catch (e) {}
  }

  /**
   * AI 面板（首页 / 模块通用）。所有面向用户的文案均经 I18N.t 包裹，
   * EN 模式返回英文、ZH 模式回退中文，避免 runtimeZh2en 局部匹配产生的残缺中文。
   */
  getAIPanelHTML(opts) {
    opts = opts || {};
    const dark = opts.dark ? ' ai-panel-dark' : '';
    const prefillId = opts.prefillId || 'homePrefillBtn';
    const T = (k, f) => I18N.t(k, f);
    return `
      <!-- AI Panel -->
      <div class="ai-panel${dark}" id="aiPanel">
        <div class="ai-panel-header">
          <span class="ai-panel-title">💡 ${T('ai.assistant', 'AI 助手')}</span>
          <div class="ai-panel-header-actions">
            <button class="ai-settings-btn" id="aiSettingsBtn" title="${T('ai.settingsTitle', '配置 AI 模型')}">⚙</button>
            <button class="ai-panel-close" id="aiPanelClose">✕</button>
          </div>
        </div>
        <div class="ai-panel-body">
          <div class="ai-panel-status" id="aiPanelStatus"></div>

          <!-- Mode selection (vertical cards) -->
          <div class="ai-mode-buttons" id="aiModeButtons">
            <button class="ai-mode-btn ${this.currentAIMode === 'brainstorm' ? 'active' : ''}" data-action="brainstorm">
              <span class="ai-mode-card-title">💭 ${T('ai.mode.brainstorm', '帮我想')}</span>
              <span class="ai-mode-card-subtitle">${T('ai.mode.brainstormSub', '智能提问，补充思考维度')}</span>
            </button>
            <button class="ai-mode-btn ${this.currentAIMode === 'critique' ? 'active' : ''}" data-action="critique">
              <span class="ai-mode-card-title">🔍 ${T('ai.mode.critique', '批判我')}</span>
              <span class="ai-mode-card-subtitle">${T('ai.mode.critiqueSub', '识别盲点与潜在风险')}</span>
            </button>
            <button class="ai-mode-btn ${this.currentAIMode === 'research' ? 'active' : ''}" data-action="research">
              <span class="ai-mode-card-title">🔎 ${T('ai.mode.research', '查一查')}</span>
              <span class="ai-mode-card-subtitle">${T('ai.mode.researchSub', '补充事实依据与案例')}</span>
            </button>
          </div>

          <!-- Mode chat area -->
          <div class="ai-mode-chat ${this.currentAIMode ? 'active' : ''}" id="aiModeChat">
            <div class="ai-mode-messages" id="aiModeMessages"></div>
            <div class="ai-input-area">
              <textarea id="aiModeInput" rows="1" placeholder="${T('ai.inputPlaceholder', '描述你的想法，我会帮你补充思考角度...')}"></textarea>
              <button id="aiModeSendBtn">${T('ai.send', '发送')}</button>
            </div>
          </div>

          <!-- Quick actions -->
          <div class="ai-suggestion-section">
            <div class="ai-suggestion-section-title">${T('ai.quickActions', '快捷操作')}</div>
            <button class="ai-suggestion-btn" data-action="suggest">📝 ${T('ai.suggest', '给我填写建议')}</button>
            <button class="ai-suggestion-btn" data-action="example">📚 ${T('ai.example', '参考案例')}</button>
            <button class="ai-suggestion-btn" data-action="prefill" id="${prefillId}">✨ ${T('ai.prefill', '帮我预填')}</button>
            <button class="ai-suggestion-btn" data-action="feedback">💬 ${T('ai.feedback', '给我反馈')}</button>
          </div>
        </div>
      </div>
    `;
  }

  getHomeTemplate(user, recentProjects) {
    const greeting = AppState.getGreeting();
    const userName = user?.name || I18N.t('user.friend', '朋友');
    const aiStatus = (window.AIService && window.AIService.status()) || { ready: false };
    const aiBanner = aiStatus.ready
      ? `<div class="ai-banner ai-banner-ok" id="aiBanner">
           <span>🟢 AI 已就绪：${aiStatus.providerLabel}${aiStatus.model ? ' · ' + aiStatus.model : ''}</span>
           <button class="ai-banner-btn" id="aiBannerSettings">⚙ 更换</button>
         </div>`
      : `<div class="ai-banner ai-banner-warn" id="aiBanner">
           <span>⚠️ AI 尚未配置：所有「AI 帮我…」功能暂不可用</span>
           <button class="ai-banner-btn" id="aiBannerSettings">去配置</button>
         </div>`;

    return `
      <!-- Header -->
      <header class="home-header home-header-dark">
        <div class="home-header-left">
          <button class="home-menu-btn" id="menuBtn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <div class="home-logo">
            <div class="home-logo-icon">E</div>
            <span class="home-logo-text">Eureka Lite</span>
          </div>
        </div>
        <div class="home-header-right">
          <button class="home-notification-btn" id="notifBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            ${user?.streak > 0 ? '<span class="notification-dot"></span>' : ''}
          </button>
          <button class="home-lang-btn" id="langToggleBtn" onclick="window.I18N.toggleLang();window.location.reload();" style="background:transparent;border:1px solid rgba(255,255,255,0.35);color:#fff;border-radius:16px;padding:4px 12px;font-size:13px;cursor:pointer;margin-right:8px;">${typeof I18N !== 'undefined' ? I18N.t('home.lang.toggle.en','中文') : '中文'}</button>
          <div class="home-avatar" id="avatarBtn">${userName.charAt(0)}</div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="home-main">
        ${aiBanner}
        <!-- Greeting -->
        <section class="home-greeting">
          <h1 class="greeting-time">${greeting}${userName !== '朋友' ? '，' + userName : ''}</h1>
          <p class="greeting-sub">今天我能帮你做些什么？</p>
        </section>

        <!-- Categories -->
        <section class="home-categories">
          <div class="category-list">
            <button class="category-item ${AppState.selectedCategory === 'product' ? 'selected' : ''}" data-category="product">
              <span class="category-icon">🛠️</span>
              <span class="category-text">Product Innovation</span>
            </button>
            <button class="category-item ${AppState.selectedCategory === 'service' ? 'selected' : ''}" data-category="service">
              <span class="category-icon">🎨</span>
              <span class="category-text">Service Experience</span>
            </button>
            <button class="category-item ${AppState.selectedCategory === 'problem' ? 'selected' : ''}" data-category="problem">
              <span class="category-icon">🔍</span>
              <span class="category-text">Complex Problem</span>
            </button>
            <button class="category-item ${AppState.selectedCategory === 'explore' ? 'selected' : ''}" data-category="explore">
              <span class="category-icon">💡</span>
              <span class="category-text">Explore & Validate</span>
            </button>
            <button class="category-item ${AppState.selectedCategory === 'quick' ? 'selected' : ''}" data-category="quick">
              <span class="category-icon">⚡</span>
              <span class="category-text">给我的一天注入活力</span>
            </button>
          </div>
        </section>

        ${this.getHomeProjectsSection(recentProjects)}
      </main>

      <!-- Bottom Input Area -->
      <div class="home-input-area">
        <div class="home-input-wrapper">
          <div class="home-input-container">
            <input
              type="text"
              class="home-input"
              id="mainInput"
              placeholder="描述你的问题或想法..."
              autocomplete="off"
            />
            <div class="home-input-actions">
              <button class="home-input-btn voice" id="voiceBtn" title="语音输入">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
              <button class="home-submit-btn" id="submitBtn" disabled>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Assistant FAB -->
      <button class="ai-fab" id="aiFab" title="AI助手">
        <div class="ai-fab-avatar">🤖</div>
        <span class="ai-fab-label">AI助手</span>
      </button>

      ${this.getAIPanelHTML({ dark: false, prefillId: 'homePrefillBtn' })}

      <!-- Drawer Overlay -->
      <div class="drawer-overlay" id="drawerOverlay"></div>
    `;
  }

  getRecentProjectItem(project) {
    const stageInfo = Utils.getStageInfo(project.stage);
    const progress = Utils.getProjectProgress(project);
    const categoryInfo = Utils.getCategoryInfo(project.category);

    return `
      <div class="recent-item" data-project-id="${project.id}">
        <div class="recent-item-icon" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color};">
          ${categoryInfo.icon}
        </div>
        <div class="recent-item-content">
          <div class="recent-item-title">${project.title || '未命名项目'}</div>
          <div class="recent-item-meta">
            ${stageInfo.name} · ${Utils.formatRelativeTime(project.updatedAt)}
          </div>
        </div>
        <div class="recent-item-progress">
          <div class="progress-mini">
            <div class="progress-mini-fill ${project.stage}" style="width: ${progress}%;"></div>
          </div>
        </div>
      </div>
    `;
  }

  // 项目卡片（首页「我的项目」与项目列表页共用）
  getProjectCardHtml(project) {
    const stageInfo = Utils.getStageInfo(project.stage);
    const categoryInfo = Utils.getCategoryInfo(project.category);
    const progress = Utils.getProjectProgress(project);
    const actionHtml = project.isExample
      ? '<span class="badge badge-example" style="background:#F59E0B;color:#fff;font-size:11px;">📘 示例</span>'
      : '<button class="project-delete-btn" data-project-id="' + project.id + '" title="删除项目" aria-label="删除项目">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<polyline points="3 6 5 6 21 6"></polyline>'
        + '<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'
        + '<line x1="10" y1="11" x2="10" y2="17"></line>'
        + '<line x1="14" y1="11" x2="14" y2="17"></line>'
        + '</svg></button>';
    return `
      <div class="project-card home-project-card" data-project-id="${project.id}">
        <div class="project-card-header">
          <div class="project-card-icon" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color};">
            ${categoryInfo.icon}
          </div>
          <div class="project-card-info">
            <h3 class="project-card-title">${this.escapeHtml(project.title || '未命名项目')}</h3>
            <p class="project-card-meta">${categoryInfo.name} · ${stageInfo.name} · ${Utils.formatRelativeTime(project.updatedAt)}</p>
          </div>
          <span class="badge badge-${project.status === 'completed' ? 'success' : 'primary'}" style="
            background: ${project.status === 'completed' ? 'var(--success)' : stageInfo.color};
          ">
            ${project.status === 'completed' ? '已完成' : '进行中'}
          </span>
          ${actionHtml}
        </div>
        <div class="progress-bar" style="margin-top: var(--space-md);">
          <div class="progress-bar-fill" style="width: ${progress}%; background: ${stageInfo.color};"></div>
        </div>
        <div class="progress-indicator">
          <span>${stageInfo.name} 第 ${project.currentScreen}/${stageInfo.screens} 屏</span>
          <span>${progress}%</span>
        </div>
      </div>`;
  }

  // 首页「我的项目」区块
  getHomeProjectsSection(projects) {
    const items = (projects && projects.length)
      ? projects.map(p => this.getProjectCardHtml(p)).join('')
      : `<div class="home-projects-empty">还没有项目，开始你的第一个 RISE 练习吧
          <div style="margin-top: var(--space-md); display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-primary" id="homeStartBtn">立即开始</button>
            <button class="btn btn-secondary" id="homeExampleBtn">📋 Load example project</button>
          </div>
        </div>`;
    return `
      <section class="home-projects">
        <div class="home-projects-head">
          <h2 class="home-projects-title">我的项目</h2>
          <div style="display:flex;gap:10px;align-items:center">
            <button class="home-projects-more" id="homeExampleBtnTop" style="color:#fff;background:#E07A2F;border:1px solid #E07A2F;border-radius:20px;padding:4px 16px;font-size:13px;font-weight:600;white-space:nowrap;box-shadow:0 2px 8px rgba(224,122,47,0.3)">📚 Try the example project</button>
            <button class="home-projects-more" id="homeProjectsMore">查看全部 ›</button>
          </div>
        </div>
        <div class="home-projects-list">${items}</div>
      </section>`;
  }

  attachHomeEvents() {
    // Menu button
    document.getElementById('menuBtn')?.addEventListener('click', () => {
      AppState.openDrawer();
      this.renderDrawer();
    });

    // Close drawer when clicking main content area
    this.container?.addEventListener('click', (e) => {
      if (AppState.drawerOpen && !e.target.closest('#drawer') && !e.target.closest('#menuBtn')) {
        AppState.closeDrawer();
        this.updateDrawer();
      }
    });

    // Avatar button
    document.getElementById('avatarBtn')?.addEventListener('click', () => {
      AppState.navigate('profile');
    });

    // Notification button
    document.getElementById('notifBtn')?.addEventListener('click', () => {
      this.showToast('暂无新通知');
    });

    // View all projects
    document.getElementById('viewAllProjects')?.addEventListener('click', () => {
      AppState.navigate('projects');
    });

    // Recommend button - AI powered recommendation
    document.getElementById('recommendBtn')?.addEventListener('click', () => {
      this.showAIRecommendation();
    });

    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const category = pill.dataset.category;
        this.selectCategory(category);
      });
    });

    // Recent project items
    document.querySelectorAll('.recent-item').forEach(item => {
      item.addEventListener('click', () => {
        const projectId = item.dataset.projectId;
        AppState.navigate('reveal', { projectId });
      });
    });

    // 首页「我的项目」卡片
    document.querySelectorAll('.home-project-card').forEach(card => {
      card.addEventListener('click', () => {
        const projectId = card.dataset.projectId;
        AppState.navigate('reveal', { projectId });
      });
    });

    // 首页「我的项目」卡片删除按钮
    document.querySelectorAll('.project-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const project = window.EurekaStorage.getProject(projectId);
        if (project) this.showDeleteConfirmModal(project);
      });
    });

    // 查看全部项目
    document.getElementById('homeProjectsMore')?.addEventListener('click', () => {
      AppState.navigate('projects');
    });

    // 首页空状态「立即开始」
    document.getElementById('homeStartBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
      document.getElementById('mainInput')?.focus();
    });

    // 首页空状态「加载示例项目」
    document.getElementById('homeExampleBtn')?.addEventListener('click', () => {
      this.loadExampleProject();
    });
    // 首页「我的项目」头部「体验示例项目」入口（始终可见，不依赖空状态）
    document.getElementById('homeExampleBtnTop')?.addEventListener('click', () => {
      this.loadExampleProject();
    });

    // Category items
    document.querySelectorAll('.category-item').forEach(item => {
      item.addEventListener('click', () => {
        const category = item.dataset.category;
        if (category === 'quick') {
          // "给我的一天注入活力" - keep existing random recommendation
          this.showAIRecommendation();
        } else {
          // Show modal prompt for the selected category
          this.showCategoryPromptModal(category);
        }
      });
    });

    // Main input
    const mainInput = document.getElementById('mainInput');
    const submitBtn = document.getElementById('submitBtn');

    // Restore saved input
    this.restoreHomeInput(mainInput);

    mainInput?.addEventListener('input', (e) => {
      const hasValue = e.target.value.trim().length > 0;
      submitBtn.disabled = !hasValue;
      this.saveHomeInput(e.target.value);
    });

    // Submit button
    submitBtn?.addEventListener('click', () => {
      const value = mainInput.value.trim();
      if (value) {
        this.startProject(value);
      }
    });

    // Voice button - Basic voice input
    document.getElementById('voiceBtn')?.addEventListener('click', () => {
      this.startVoiceInput();
    });

    // AI FAB
    document.getElementById('aiFab')?.addEventListener('click', () => {
      AppState.toggleAiPanel();
      this.updateAiPanel();
    });

    // AI Panel close
    document.getElementById('aiPanelClose')?.addEventListener('click', () => {
      AppState.closeAiPanel();
      this.updateAiPanel();
    });

    // AI suggestions
    document.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleAiAction(action);
      });
    });

    // AI mode buttons
    document.querySelectorAll('.ai-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.openAiPanel();
        this.selectAIMode(btn.dataset.action);
      });
    });

    // AI mode chat send button
    document.getElementById('aiModeSendBtn')?.addEventListener('click', () => this.sendAIModeMessage());
    document.getElementById('aiModeInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAIModeMessage();
      }
    });

    // AI 设置入口（AI 面板内的齿轮按钮 + 首页横幅按钮）
    document.getElementById('aiSettingsBtn')?.addEventListener('click', () => {
      this.showAIConfigModal();
    });
    document.getElementById('aiBannerSettings')?.addEventListener('click', () => {
      this.showAIConfigModal();
    });

    // 刷新 AI 状态展示
    this.refreshAiStatusUI();

    // Drawer overlay
    document.getElementById('drawerOverlay')?.addEventListener('click', () => {
      AppState.closeDrawer();
      this.updateDrawer();
    });
  }

  /**
   * Save home input to localStorage
   */
  saveHomeInput(value) {
    try {
      localStorage.setItem('eureka_home_input', JSON.stringify({
        value,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Save home input failed:', e);
    }
  }

  /**
   * Restore home input from localStorage
   */
  restoreHomeInput(input) {
    if (!input) return;

    try {
      const saved = localStorage.getItem('eureka_home_input');
      if (saved) {
        const data = JSON.parse(saved);
        // Only restore if less than 24 hours old
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000 && data.value) {
          input.value = data.value;
          // Trigger input event to update UI
          input.dispatchEvent(new Event('input'));
        }
      }
    } catch (e) {
      console.warn('Restore home input failed:', e);
    }
  }

  /**
   * Clear home input from localStorage
   */
  clearHomeInput() {
    localStorage.removeItem('eureka_home_input');
  }

  /**
   * Show AI recommendation modal (给我的一天注入活力)
   */
  showAIRecommendation() {
    // Encouraging quotes (≤15 chars)
    const encouragements = [
      'Your idea can change the world!',
      'Innovation starts today!',
      'Every idea has value!',
      'Take the first brave step!',
      'Inspiration is all around you!',
      'Dare to think and do!',
      'Today brings a new breakthrough!',
      'Great ideas deserve to be seen!'
    ];

    // Design thinking tips (≤15 chars)
    const designTips = [
      'Start from the user’s view',
      'Ask why a few more times',
      'Observe the user’s pain points',
      'Validate quickly with prototypes',
      'Do not jump to conclusions',
      'Find inspiration across fields',
      'Focus on the core problem',
      'Iterate in small steps',
      'Diverge first, then converge',
      'Listen to user stories'
    ];

    // Example ideas for inspiration
    const examples = [
      { text: 'Design a smart cup that auto-reminds you to drink water', category: 'product' },
      { text: 'Offer home companion services for elderly community members', category: 'service' },
      { text: 'Solve low classroom engagement among students', category: 'problem' },
      { text: 'Test whether gamified learning improves grades', category: 'explore' },
      { text: 'Design a lunch-break neck pillow for office workers', category: 'product' },
      { text: 'Improve the hospital registration queuing experience', category: 'service' }
    ];

    const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
    const randomTip = designTips[Math.floor(Math.random() * designTips.length)];
    const randomExample = examples[Math.floor(Math.random() * examples.length)];

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="max-width: 420px;">
        <div class="modal-header">
          <span class="modal-title">⚡ Spark energy into my day</span>
          <button class="ai-panel-close" id="energyClose">✕</button>
        </div>
        <div class="modal-body">
          <!-- Encouragement -->
          <div style="text-align: center; margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-lg); font-weight: 600; color: var(--reveal-primary); margin-bottom: var(--space-xs);">
              ${randomEncouragement}
            </div>
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
              💡 ${randomTip}
            </div>
          </div>

          <!-- Example -->
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-sm);">Reference example:</div>
            <div id="energyExample" style="padding: var(--space-md); background: rgba(224,122,47,0.08); border: 1px solid rgba(224,122,47,0.4); border-radius: var(--radius-md); cursor: pointer; transition: all var(--transition-fast);" data-example="${randomExample.text}" data-category="${randomExample.category}">
              <div style="font-size: var(--font-size-sm); color: var(--text-primary); margin-bottom: var(--space-xs);">${randomExample.text}</div>
              <div style="font-size: var(--font-size-xs); color: var(--reveal-primary);">Click to fill the input ↓</div>
            </div>
          </div>

          <!-- Start button -->
          <button class="btn btn-primary" id="startEnergyBtn" style="width: 100%; background: var(--reveal-primary);">
            Start writing
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close
    modal.querySelector('#energyClose')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Example click
    const exampleEl = modal.querySelector('#energyExample');
    exampleEl?.addEventListener('click', () => {
      const text = exampleEl.dataset.example;
      const category = exampleEl.dataset.category;
      const mainInput = document.getElementById('mainInput');
      if (mainInput) {
        mainInput.value = text;
        mainInput.dispatchEvent(new Event('input'));
        mainInput.focus();
      }
      this.selectCategory(category);
      modal.remove();
    });
    exampleEl?.addEventListener('mouseenter', () => {
      exampleEl.style.borderColor = 'var(--reveal-primary)';
      exampleEl.style.background = 'rgba(224, 122, 47, 0.08)';
    });
    exampleEl?.addEventListener('mouseleave', () => {
      exampleEl.style.borderColor = 'transparent';
      exampleEl.style.background = 'var(--bg-hover)';
    });

    // Start button
    modal.querySelector('#startEnergyBtn')?.addEventListener('click', () => {
      const mainInput = document.getElementById('mainInput');
      if (mainInput) {
        mainInput.focus();
      }
      modal.remove();
    });
  }

  /**
   * Show category prompt modal
   * When user clicks a category capsule, show encouraging prompt
   */
  showCategoryPromptModal(category) {
    const categoryConfig = {
      product: {
        icon: '🛠️',
        name: 'Product Innovation',
        color: '#E07A2F',
        prompt: 'What product features do you want to offer, and for whom?',
        placeholder: 'e.g. I want to design a smart water bottle for college students that reminds them to drink and logs intake',
        examples: [
          'Design a portable neck pillow for office workers that auto-adjusts support to cervical curvature',
          'Design a large-font smartphone for the elderly with one-tap emergency call',
          'Design a smart running shoe for fitness lovers that analyzes gait in real time and suggests improvements'
        ]
      },
      service: {
        icon: '🎨',
        name: 'Service Experience',
        color: '#7F77DD',
        prompt: 'What service experience do you want to offer, and for whom?',
        placeholder: 'e.g. I want to offer residents a convenient parcel-collection service so office workers stop worrying about pickup',
        examples: [
          'Offer 24/7 online parenting advice for new parents, easing parenting anxiety',
          'Offer regular home companionship and health checks for seniors living alone',
          'Offer one-on-one career planning and resume help for workplace newcomers'
        ]
      },
      problem: {
        icon: '🔍',
        name: 'Complex Problem',
        color: '#0F6E56',
        prompt: 'What complex problem are you facing? Describe its background and current state.',
        placeholder: 'e.g. Our company handles customer complaints inefficiently and needs to optimize internal collaboration',
        examples: [
          'Internal meetings are inefficient, often run over time and lack clear decisions',
          'Students show low class engagement; traditional teaching fails to spark interest',
          'Community waste sorting is hard to enforce; residents engage little and sort inaccurately'
        ]
      },
      explore: {
        icon: '💡',
        name: 'Explore & Validate',
        color: '#64748B',
        prompt: 'What idea or hypothesis do you want to explore and validate?',
        placeholder: 'e.g. I want to test this hypothesis: if traffic jams were predictable in advance, would people’s travel habits change',
        examples: [
          'Test whether "gamified learning" improves students’ math scores',
          'Explore whether remote work boosts team creativity',
          'Test whether personalized recommendations lift purchase conversion'
        ]
      }
    };

    const config = categoryConfig[category];
    if (!config) return;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="max-width: 420px;">
        <div class="modal-header">
          <span class="modal-title">${config.icon} ${config.name}</span>
          <button class="ai-panel-close" id="catModalClose">✕</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-base); color: var(--text-primary); margin-bottom: var(--space-sm); font-weight: 500;">
              ${config.prompt}
            </div>
            <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-md);">
              Describe your idea; AI will help polish it into a professional statement
            </div>
          </div>
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-sm);">Reference example:</div>
            ${config.examples.map(ex => `
              <div class="category-example" style="padding: var(--space-sm); background: ${config.color}12; border: 1px solid ${config.color}55; border-radius: var(--radius-sm); margin-bottom: var(--space-xs); font-size: var(--font-size-sm); color: var(--text-primary); cursor: pointer; transition: all var(--transition-fast);" data-example="${ex}">
                ${ex}
              </div>
            `).join('')}
          </div>
          <button class="btn btn-primary" id="catModalStart" style="width: 100%; background: ${config.color};">
            Start writing
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close button
    modal.querySelector('#catModalClose')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Example click - fill input and close modal
    modal.querySelectorAll('.category-example').forEach(el => {
      el.addEventListener('click', () => {
        const example = el.dataset.example;
        const mainInput = document.getElementById('mainInput');
        if (mainInput) {
          mainInput.value = example;
          mainInput.dispatchEvent(new Event('input'));
          mainInput.focus();
        }
        this.selectCategory(category);
        modal.remove();
      });
      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.borderColor = config.color;
        el.style.background = `${config.color}15`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.borderColor = 'transparent';
        el.style.background = 'var(--bg-hover)';
      });
    });

    // Start button - just focus input with placeholder hint
    modal.querySelector('#catModalStart')?.addEventListener('click', () => {
      const mainInput = document.getElementById('mainInput');
      if (mainInput) {
        mainInput.placeholder = config.placeholder;
        mainInput.focus();
      }
      this.selectCategory(category);
      modal.remove();
    });
  }

  /**
   * 语音输入入口：优先讯飞（国内稳定），未配置则回退 Web Speech API
   * 交互：点击开始录音，再次点击结束（切换式）
   */
  startVoiceInput() {
    // 已在录音中 → 结束
    if (this._voiceRecording) {
      this._stopVoiceInput();
      return;
    }
    // 优先讯飞
    if (window.XfyunIAT && window.XfyunIAT.isConfigured(window.VOICE_CONFIG)) {
      this._startXfyunVoice();
      return;
    }
    // 回退浏览器原生
    this._startWebSpeech();
  }

  _setVoiceBtnState(active) {
    const btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.toggle('recording', !!active);
    this._voiceRecording = !!active;
  }

  _stopVoiceInput() {
    if (this._xfyunIat) { try { this._xfyunIat.stop(); } catch (e) {} }
    if (this._webRecognition) { try { this._webRecognition.stop(); } catch (e) {} }
  }

  _startXfyunVoice() {
    const input = document.getElementById('mainInput');
    const baseText = input ? input.value : '';
    const iat = new window.XfyunIAT(window.VOICE_CONFIG);
    this._xfyunIat = iat;

    iat.on('start', () => {
      this._setVoiceBtnState(true);
      this.showToast('🎤 正在聆听，说完再点一次麦克风结束', 'toast-success');
    });
    iat.on('partial', ({ text }) => {
      if (input && text) {
        input.value = (baseText ? baseText : '') + text;
        input.dispatchEvent(new Event('input'));
      }
    });
    iat.on('result', ({ text }) => {
      if (input && text) {
        input.value = (baseText ? baseText : '') + text;
        input.dispatchEvent(new Event('input'));
        this.saveHomeInput(input.value);
      }
      this.showToast('✓ 已识别', 'toast-success');
    });
    iat.on('error', ({ code, message }) => {
      this._setVoiceBtnState(false);
      this._xfyunIat = null;
      this.showToast('语音识别出错：' + (message || code));
    });
    iat.on('end', () => {
      this._setVoiceBtnState(false);
      this._xfyunIat = null;
    });

    iat.start();
  }

  /**
   * Fallback: Web Speech API（Google，国内/非Chrome可能不可用）
   */
  _startWebSpeech() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.showToast('抱歉，您的浏览器不支持语音输入');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    this._webRecognition = recognition;

    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      this._setVoiceBtnState(true);
      this.showToast('🎤 请说话...', 'toast-success');
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const input = document.getElementById('mainInput');
      if (input) {
        input.value = transcript;
        input.dispatchEvent(new Event('input'));
        this.saveHomeInput(transcript);
      }
      this.showToast('✓ 已识别', 'toast-success');
    };

    recognition.onerror = (event) => {
      this._setVoiceBtnState(false);
      this._webRecognition = null;
      if (event.error === 'no-speech') {
        this.showToast('未检测到语音，请重试');
      } else if (event.error === 'network') {
        this.showToast('语音服务连接失败（Web Speech 需连 Google，国内建议配置讯飞）');
      } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.showToast('麦克风未授权，请在浏览器允许麦克风权限');
      } else {
        this.showToast('语音识别出错');
      }
    };

    recognition.onend = () => {
      this._setVoiceBtnState(false);
      this._webRecognition = null;
    };

    try {
      recognition.start();
    } catch (e) {
      this._setVoiceBtnState(false);
      this.showToast('语音输入启动失败');
    }
  }

  selectCategory(category) {
    AppState.selectCategory(category);

    // Update UI - highlight selected category
    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.toggle('selected', item.dataset.category === category);
    });
  }

  clearSelection() {
    AppState.clearCategory();

    document.querySelectorAll('.category-item').forEach(item => {
      item.classList.remove('selected');
    });
  }

  startProject(title) {
    // First show AI analysis modal instead of direct navigation
    this.showAIAnalysisModal(title);
  }

  /**
   * 【R6】加载示例项目：基于 MOMOS 完整四阶段数据，供新手照学
   */
  loadExampleProject() {
    // Dedup: if an example project already exists (flagged isExample, or title starts with "Example:"), open it instead of recreating
    const all = window.EurekaStorage.getProjects();
    const existing = all.find(p => p.isExample) || all.find(p => (p.title || '').startsWith('Example:'));
    if (existing) {
      if (!existing.isExample) {
        window.EurekaStorage.updateProject(existing.id, { isExample: true });
        existing.isExample = true;
      }
      this.normalizeExampleHmw(existing.id);
      AppState.currentProjectId = existing.id;
      this.showToast('Example project opened (not recreated to avoid duplicates)');
      this.showPanorama(existing);
      return;
    }

    const sceneContent = `Target user: 25-35 knowledge workers (PMs / designers / freelancers / managers)\nScenario: Every workday they handle lots of fragmented info (meeting notes, ideas, todos, project feedback) scattered across WeChat, Feishu, email, whiteboards and memos. They often "remember having an idea or some info, but cannot find it", causing repeated discussions, missed decisions and broken threads.`;

    const journeyCards = [
      { stage: 'Morning standup', challenge: 'Recalls a related data point or conclusion during discussion but cannot find the source', think: 'I think I saw it, but... where was it?', feel: 'Awkward + anxious', do: 'Skip it, then dig through every tool after the meeting', discovery: 'Cross-tool fragmentation is the biggest productivity killer', isKeyFinding: true },
      { stage: 'Eureka moment', challenge: 'A great idea hits, but there is no quick way to capture it', think: 'Jot it on WeChat / send myself a message', feel: 'Afraid it will slip away', do: 'Scribble it somewhere random', discovery: 'The more casual the capture, the harder to retrieve', isKeyFinding: true },
      { stage: 'Project retro', challenge: 'Needs to review key decisions and discussions', think: 'Where did everyone’s discussion notes go?', feel: 'Helpless', do: 'Scour every chat and doc', discovery: 'Info should auto-archive by topic/project, not by tool', isKeyFinding: true },
      { stage: 'Collaborating', challenge: 'A colleague mentions a previously discussed plan, but you forgot the details', think: 'Why did we pick A over B again?', feel: 'Unsure', do: 'Re-discuss, wasting the team’s time', discovery: 'The reasoning behind a decision is more valuable than the conclusion', isKeyFinding: false },
      { stage: 'Personal retro', challenge: 'Weekly review of what you produced and how you grew', think: 'What did I actually accomplish this week?', feel: 'Vague', do: 'Flip through calendar / multiple PM entries', discovery: 'Personal knowledge needs "auto-aggregation", not "manual organizing"', isKeyFinding: true }
    ];

    const project = window.EurekaStorage.addProject({
      title: 'Example: MOMOS — Smart fragmented-info aggregation & knowledge management',
      category: 'product',
      description: 'A knowledge-management tool that auto-aggregates scattered fragmented info for knowledge workers and archives it by topic/project (full 4-stage example; view/learn only, not editable)',
      stage: 'reveal',
      currentScreen: 1,
      isExample: true
    });
    const id = project.id;

    // —— Reveal stage ——
    window.EurekaStorage.updateCard(id, 'scene', { content: sceneContent });
    window.EurekaStorage.updateCard(id, 'journey', { content: JSON.stringify(journeyCards) });
    window.EurekaStorage.updateCard(id, 'projectBriefing', { content: JSON.stringify({
      targetUser: '25-35 knowledge workers (PMs / designers / managers) using multiple tools for fragmented info',
      scene: 'Info is scattered across WeChat / Feishu / email / memos / whiteboards, causing hard retrieval, repeated discussion and missed decisions',
      insight: 'The user’s pain is not "too little info" but "too much and too scattered" — what is missing is not a capture tool but auto-aggregation and topic-based archiving'
    }) });
    window.EurekaStorage.updateCard(id, 'businessGoal', { content: JSON.stringify({
      goal: 'Build a tool that auto-aggregates fragmented info across tools, archives it intelligently by topic/project, and supports fast review and search',
      consensus: 'Knowledge workers clearly pay to "save search time"; Notion/Feishu Docs have already educated the market'
    }) });
    // Note: findInsight is not pre-filled here; R3 strictly generates FIND tabs from R2 journey "key findings",
    // avoiding extra FIND tabs in the example that are inconsistent with R2.

    // —— Inspire stage ——
    window.EurekaStorage.updateCard(id, 'hmw', { content: JSON.stringify({
      dimensions: {
        amplify: [
          { id: 'hmw1', text: 'How might we make capturing and archiving info feel effortless, so knowledge settles naturally?' },
          { id: 'hmw3', text: 'How might we make a piece of info appear at zero cost exactly when the user needs it?' }
        ],
        remove: [
          { id: 'hmw2', text: 'How might we free knowledge workers from "I remember having it, but cannot find it"?' }
        ],
        flip: [
          { id: 'hmw4', text: 'How might we integrate existing tools (without building our own storage) to aggregate cross-platform info?' }
        ],
        diverge: [
          { id: 'hmw5', text: 'If info could proactively push relevant context like a "second brain", what would work become?' }
        ]
      },
      selectedIds: ['hmw2', 'hmw3']
    }) });
    window.EurekaStorage.updateCard(id, 'ideas', { content: JSON.stringify([
      { id: 'idea1', title: 'MOMOS info hub: browser extension + WeChat bot + Feishu bot, one-tap forward to auto-archive', description: 'Capture info across clients via extensions and chatbots; AI auto-tags topics and archives, no need to open the App' },
      { id: 'idea2', title: 'Smart weekly recap: auto-generate an "info map" each week showing key topics and links', description: 'From this week’s captured info, AI builds a topic map, key decision points and a todo-progress summary' },
      { id: 'idea3', title: 'Topic-card search: find anything previously saved with natural language', description: 'Supports fuzzy semantic search; "that plan about user growth we mentioned" finds it without exact keywords' }
    ]) });

    // —— Shape stage ——
    window.EurekaStorage.updateCard(id, 'shapeSummary', { content: JSON.stringify({
      concept: {
        oneLiner: 'MOMOS: a smart info aggregator that lets knowledge workers stop "looking for things" — you just capture, we organize and retrieve',
        features: [
          'One-tap browser forward extension (Chrome/Edge)',
          'WeChat / Feishu bot forward & archive',
          'AI auto topic-tagging and summarization',
          'Natural-language semantic search',
          'Weekly "info map" smart recap',
          'Topic-card browsing with related recommendations'
        ],
        characteristics: ['Effortless capture (no App to open)', 'AI auto-organizing (zero manual work)', 'Cross-tool aggregation (connects existing tools, builds none)', 'Privacy-first (local + optional cloud sync)'],
        boundaries: ['Not a chat tool (does not replace WeChat/Feishu)', 'Not a doc editor (does not replace Notion/Feishu Docs)', 'First version supports text forwarding only, no files'],
        feasibility: 'Browser sidebar + bot approach can validate the MVP quickly without building a new App'
      },
      storyboard: [
        { title: 'Install extension', desc: 'User installs the MOMOS browser extension and authorizes the WeChat bot and Feishu bot' },
        { title: 'Daily capture', desc: 'Sees a valuable point in a meeting, selects text and hits a shortcut -> auto-sent to MOMOS, AI tags and archives' },
        { title: 'WeChat forward', desc: 'Forwards an article in WeChat to the MOMOS bot -> auto summary and classification into the right topic' },
        { title: 'Review & find', desc: 'During a project retro, searches MOMOS for "user segmentation decision basis" -> instantly finds a screenshot and conclusion from 3 months ago' },
        { title: 'Info map', desc: 'Sunday gets a smart recap push: 42 items captured this week, auto-grouped into 5 topics with a relation graph' },
        { title: 'Decision trace', desc: 'Each project decision auto-pushes related history, helping make more complete judgments' }
      ]
    }) });

    // —— Exam stage ——
    window.EurekaStorage.updateCard(id, 'examSummary', { content: JSON.stringify({
      testPlan: {
        purpose: 'Validate whether "one-tap forward + auto-archive" truly cuts time spent finding info',
        duration: '14 days',
        participants: '8 people (3 PMs, 2 designers, 3 managers)',
        method: 'First 7 days without MOMOS, log daily "info-finding" time; next 7 days with MOMOS, compare the change'
      },
      testReport: {
        effectiveValue: '7/8 testers cut daily "info-finding" time from 23 to 4 minutes (-83%); "info security" score rose from 5.2 to 8.7',
        invalidValue: '1 tester felt AI tags were imprecise; some items landed in wrong topics and needed manual fix',
        newProblems: 'The browser extension cannot install in some corporate intranets; bot forwarding occasionally lags',
        newOpportunities: '2 testers asked to "share a team info map", showing demand for a team version'
      },
      elevator: {
        pitch: 'MOMOS lets knowledge workers find any previously saved info in 4 seconds — no scrolling chats, no hunting docs, no recalling where it was stored. Internal test cut daily "info-finding" time from 23 to 4 minutes.',
        iteration: [
          { category: 'Product', actions: ['Improve AI tag accuracy', 'Support intranet-deployable extension', 'Add team info-map feature'] },
          { category: 'Growth', actions: ['Beta promote in PM/designer communities', 'Ship an "info-finds-you" efficiency comparer', 'Partner with Feishu/Notion communities'] },
          { category: 'Business', actions: ['Free personal tier (core features) + Pro smart-analysis subscription', 'Team tier per seat', 'Enterprise private deployment'] }
        ]
      }
    }) });
    window.EurekaStorage.updateCard(id, 'examFourDimEval', { content: JSON.stringify({
      scores: { userValue: 5, businessValue: 4, feasibility: 4, innovation: 4 },
      reasons: {
        userValue: 'Hits knowledge workers’ frequent pain; -83% "finding time" is a very noticeable gain',
        businessValue: 'Free personal tier drives acquisition; Pro/team tiers are clear; enterprise private deployment has premium room',
        feasibility: 'Browser extension + bot MVP can ship in 4 weeks without a new App',
        innovation: 'The trio of "effortless capture + AI auto-archive + multi-dimensional recap" is clearly differentiated'
      }
    }) });

    // Reload the latest project (with all cards) and show the full panorama for one-tap experience
    AppState.currentProjectId = id;
    const saved = window.EurekaStorage.getProject(id);
    this.showToast('MOMOS example project loaded with full 4-stage data ready; view the panorama directly ~');
    this.showPanorama(saved);
  }
  /**
   * 兼容旧示例项目：将 HMW 维度键归一到标准 4 维（amplify/remove/flip/diverge）。
   * 旧示例曾使用 user/scenario/ecosystem 等键，会导致 Inspire 的 HMW 屏渲染崩溃，
   * 进而使 Reveal「完成」后无法跳转到 Inspire 阶段。该方法幂等、非破坏（保留条目内容）。
   */
  normalizeExampleHmw(id) {
    const STANDARD = ['amplify', 'remove', 'flip', 'diverge'];
    const LEGACY = { user: 'amplify', scenario: 'remove', ecosystem: 'flip' };
    const proj = window.EurekaStorage.getProject(id);
    if (!proj || !proj.cards || !proj.cards.hmw) return;
    let raw = proj.cards.hmw;
    if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
    let data;
    try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
    if (!data || !data.dimensions) return;
    const hasLegacy = Object.keys(data.dimensions).some(k => !STANDARD.includes(k));
    if (!hasLegacy) return; // 已是标准结构，无需处理
    const newDims = { amplify: [], remove: [], flip: [], diverge: [] };
    let n = 1;
    Object.keys(data.dimensions).forEach(k => {
      const target = LEGACY[k] || 'diverge';
      (data.dimensions[k] || []).forEach(item => {
        newDims[target].push({ id: item.id || ('hmw' + n), text: item.text });
        n++;
      });
    });
    data.dimensions = newDims;
    window.EurekaStorage.updateCard(id, 'hmw', { content: JSON.stringify(data) });
  }

  /**
   * Show AI analysis modal before creating project
   * 1. Repeat and understand user input
   * 2. Classify into category
   * 3. Rewrite to professional format
   */
  showAIAnalysisModal(originalInput) {
    if (!originalInput || !originalInput.trim()) return;

    const result = this.classifyAndRewrite(originalInput);
    const categoryName = this.getCategoryName(result.category);
    const categoryConfig = {
      product:  { icon: '🛠️', color: '#E07A2F' },
      service:  { icon: '🎨', color: '#7F77DD' },
      problem:  { icon: '🔍', color: '#0F6E56' },
      explore:  { icon: '💡', color: '#64748B' }
    };
    const config = categoryConfig[result.category] || categoryConfig.product;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.id = 'aiAnalysisModal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 460px;">
        <div class="modal-header">
          <span class="modal-title">🧩 Smart structuring of your input (local)</span>
          <button class="ai-panel-close" id="analysisClose">✕</button>
        </div>
        <div class="modal-body">

          <!-- Step 1: Understanding -->
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-xs);">📝 I understand you want:</div>
            <div style="padding: var(--space-sm) var(--space-md); background: var(--bg-hover); border-radius: var(--radius-md); font-size: var(--font-size-sm); color: var(--text-primary); line-height: 1.6;">
              ${this.escapeHtml(originalInput)}
            </div>
          </div>

          <!-- Step 2: Classification -->
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-xs);">🏷️ I classified it as:</div>
            <div style="display: flex; align-items: center; gap: var(--space-sm); padding: var(--space-sm) var(--space-md); background: ${config.color}15; border: 1px solid ${config.color}40; border-radius: var(--radius-md);">
              <span style="font-size: 20px;">${config.icon}</span>
              <span style="font-weight: 600; color: ${config.color};">${categoryName}</span>
            </div>
          </div>

          <!-- Step 3: Rewritten -->
          <div style="margin-bottom: var(--space-lg);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-xs);">✨ I polished it into a professional statement:</div>
            <div id="rewrittenText" style="padding: var(--space-md); background: rgba(224, 122, 47, 0.08); border: 1px solid rgba(224, 122, 47, 0.25); border-radius: var(--radius-md); font-size: var(--font-size-base); color: var(--text-primary); line-height: 1.6; min-height: 48px;">
              ${this.escapeHtml(result.rewritten)}
            </div>
            <button class="btn btn-ghost btn-sm" id="editRewrittenBtn" style="margin-top: var(--space-xs); font-size: 12px;">✏️ Edit this statement</button>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn-secondary" id="cancelAnalysis" style="flex: 1;">Edit input</button>
            <button class="btn btn-primary" id="confirmAnalysis" style="flex: 1; background: ${config.color};">Confirm & use</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close
    modal.querySelector('#analysisClose')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    // Edit rewritten text
    modal.querySelector('#editRewrittenBtn')?.addEventListener('click', () => {
      const rewrittenEl = modal.querySelector('#rewrittenText');
      if (!rewrittenEl) return;
      const currentText = rewrittenEl.textContent;
      // Use DOM createElement to avoid quote escaping issues
      rewrittenEl.innerHTML = '';
      const input = document.createElement('input');
      input.type = 'text';
      input.id = 'rewriteEditInput';
      input.value = currentText;
      Object.assign(input.style, {
        width: '100%',
        padding: 'var(--space-sm)',
        border: '1px solid var(--reveal-primary)',
        borderRadius: 'var(--radius-sm)',
        fontSize: 'var(--font-size-base)',
        background: 'var(--bg-card)',
        color: 'var(--text-primary)',
        boxSizing: 'border-box'
      });
      rewrittenEl.appendChild(input);
      input.focus();
      input.select();

      const saveEdit = () => {
        rewrittenEl.textContent = input.value;
      };
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveEdit();
      });
      input.addEventListener('blur', saveEdit);
    });

    // Cancel - go back to edit input
    modal.querySelector('#cancelAnalysis')?.addEventListener('click', () => {
      modal.remove();
      const mainInput = document.getElementById('mainInput');
      if (mainInput) {
        mainInput.value = originalInput;
        mainInput.focus();
        mainInput.dispatchEvent(new Event('input'));
      }
    });

    // Confirm - create project and navigate
    modal.querySelector('#confirmAnalysis')?.addEventListener('click', () => {
      const finalText = modal.querySelector('#rewrittenText')?.textContent || result.rewritten;
      modal.remove();
      this.createProjectAfterAnalysis(originalInput, finalText, result.category);
    });
  }

  /**
   * Create project after AI analysis is confirmed
   */
  createProjectAfterAnalysis(originalInput, rewrittenText, category) {
    const project = window.EurekaStorage.addProject({
      title: rewrittenText,
      originalTitle: originalInput,
      category: category,
      type: 'practice',
      stage: 'reveal',
      currentScreen: 1
    });

    // Add points for starting
    window.EurekaStorage.addPoints(10, '开始新练习');

    // Clear saved home input
    this.clearHomeInput();

    // Show classification result toast
    this.showToast(`已归类为「${this.getCategoryName(category)}」`, 'toast-success');

    AppState.navigate('reveal', { projectId: project.id });
  }

  /**
   * AI classify and rewrite user input
   * @param {string} input - User's raw input
   * @returns {Object} - { category, rewritten }
   */
  classifyAndRewrite(input) {
    if (!input || input.trim().length < 3) {
      return { category: AppState.selectedCategory || 'product', rewritten: input };
    }

    const text = input.trim();
    const lowerText = text.toLowerCase();

    // Classification rules
    let category = AppState.selectedCategory;

    if (!category || category === 'quick') {
      // Auto-classify based on content
      const scores = {
        product: 0,
        service: 0,
        problem: 0,
        explore: 0
      };

      // Product indicators
      const productWords = ['产品', '设计', '开发', '硬件', 'app', '应用', '平台', '工具', '设备', '系统', '软件', '功能', '跑鞋', '手机', '杯子', '手表', '耳机', '键盘', '鼠标'];
      productWords.forEach(w => { if (lowerText.includes(w)) scores.product += 2; });

      // Service indicators
      const serviceWords = ['服务', '体验', '流程', '咨询', '陪伴', '指导', '辅导', '培训', '课程', '上门', '在线', '客服', '售后'];
      serviceWords.forEach(w => { if (lowerText.includes(w)) scores.service += 2; });

      // Problem indicators
      const problemWords = ['问题', '困难', '痛点', '挑战', '麻烦', '效率低', '不好', '不足', '缺陷', '投诉', '纠纷', '矛盾', '冲突'];
      problemWords.forEach(w => { if (lowerText.includes(w)) scores.problem += 2; });

      // Explore indicators
      const exploreWords = ['假设', '验证', '探索', '研究', '调查', '测试', '实验', '试点', '想法', '概念', '假设', '是否', '能不能', '会不会'];
      exploreWords.forEach(w => { if (lowerText.includes(w)) scores.explore += 2; });

      // Action verbs classification
      if (/设计|开发|制作|打造|创建|发明|构建/.test(text)) scores.product += 3;
      if (/提供|优化|改善|改进|提升|解决|处理/.test(text)) scores.service += 3;
      if (/解决|处理|应对|克服|化解|缓解/.test(text)) scores.problem += 3;
      if (/验证|探索|研究|调查|测试|看看|试试/.test(text)) scores.explore += 3;

      // Choose category with highest score
      const maxScore = Math.max(...Object.values(scores));
      if (maxScore > 0) {
        category = Object.entries(scores).find(([k, v]) => v === maxScore)[0];
      } else {
        category = 'product'; // Default
      }
    }

    // Rewrite to professional description
    const rewritten = this.rewriteToProfessional(text, category);

    return { category, rewritten };
  }

  /**
   * Rewrite user input to professional description
   * @param {string} text - User input
   * @param {string} category - Category
   */
  rewriteToProfessional(text, category) {
    // EN build: user input is already in English, do not rewrite into Chinese templates
    if (typeof I18N !== 'undefined' && I18N.getLang() === 'en') {
      return text;
    }
    // Extract key elements
    const targetMatch = text.match(/(?:为|给|针对)(.+?)(?:设计|开发|提供|解决|验证|探索)/);
    const actionMatch = text.match(/(?:设计|开发|提供|解决|验证|探索)(.+?)(?:，|。|$)/);
    const featureMatch = text.match(/(?:具备|拥有|能够|可以|支持)(.+?)(?:功能|特性|能力|服务|体验)/);

    const target = targetMatch ? targetMatch[1].trim() : '';
    const action = actionMatch ? actionMatch[1].trim() : text;
    const feature = featureMatch ? featureMatch[1].trim() : '';

    switch (category) {
      case 'product':
        if (target && feature) {
          return `我要为${target}设计一款具备${feature}功能的产品`;
        } else if (target) {
          return `我要为${target}设计一款${action}`;
        } else if (feature) {
          return `我要设计一款具备${feature}功能的产品`;
        }
        return `我要设计一款${action}`;

      case 'service':
        if (target && feature) {
          return `我要为${target}提供一种${feature}的Service Experience`;
        } else if (target) {
          return `我要为${target}提供${action}`;
        }
        return `我要提供一种${action}的服务`;

      case 'problem':
        if (target) {
          return `我要解决${target}面临的${action}问题`;
        }
        return `我要解决${action}的问题`;

      case 'explore':
        if (target) {
          return `我要Explore & Validate${target}是否${action}`;
        }
        return `我要Explore & Validate：${action}`;

      default:
        return text;
    }
  }

  /**
   * Get category display name
   */
  getCategoryName(category) {
    if (typeof I18N !== 'undefined' && I18N.getLang() === 'en') {
      const names = {
        product: 'Product Innovation',
        service: 'Service Experience',
        problem: 'Complex Problem',
        explore: 'Explore & Validate',
        quick: 'Quick Start'
      };
      return names[category] || category;
    }
    const names = {
      product: 'Product Innovation',
      service: 'Service Experience',
      problem: 'Complex Problem',
      explore: 'Explore & Validate',
      quick: '快速开始'
    };
    return names[category] || category;
  }

  getCategoryActionLabel(category) {
    const labels = {
      product: I18N.t('cat.product', '设计一款产品'),
      service: I18N.t('cat.service', '提供一种服务'),
      problem: I18N.t('cat.problem', '解决一个问题'),
      explore: I18N.t('cat.explore', '探索一个方向')
    };
    return labels[category] || I18N.t('cat.default', '实现一个想法');
  }

  /**
   * Get project context from Reveal Screen 1 saved data
   */
  getProjectContext(project) {
    if (!project?.id) return { targetUser: '', sceneDesc: '' };

    try {
      // Try project.cards directly
      const sceneCard = project.cards?.scene;
      if (sceneCard?.content) {
        const targetMatch = sceneCard.content.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
        const sceneMatch = sceneCard.content.match(/【场景描述】(.+)$/s);
        return {
          targetUser: targetMatch ? targetMatch[1].trim() : '',
          sceneDesc: sceneMatch ? sceneMatch[1].trim() : ''
        };
      }

      // Fallback to draft
      const draftKey = `eureka_draft_${project.id}_reveal_1`;
      const draft = localStorage.getItem(draftKey);
      if (draft) {
        const draftData = JSON.parse(draft);
        const targetMatch = draftData.content?.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
        const sceneMatch = draftData.content?.match(/【场景描述】(.+)$/s);
        return {
          targetUser: targetMatch ? targetMatch[1].trim() : '',
          sceneDesc: sceneMatch ? sceneMatch[1].trim() : ''
        };
      }
    } catch (e) {
      console.warn('Get project context failed:', e);
    }

    return { targetUser: '', sceneDesc: '' };
  }

  /**
   * Generate HTML for journey cards
   */
  getJourneyCardsHTML(count) {
    const sections = [
      { label: '触点 / 阶段', fields: [
        { name: 'stage', placeholder: '例如：发现需求' },
        { name: 'challenge', placeholder: '面对的挑战是...' }
      ]},
      { label: '所思 · 所感 · 所做', fields: [
        { name: 'think', placeholder: '用户在想什么？' },
        { name: 'feel', placeholder: '用户的情绪如何？' },
        { name: 'do', placeholder: '用户做了什么？' }
      ]},
      { label: '发现', fields: [
        { name: 'discovery', placeholder: '这个触点有什么发现？' }
      ]}
    ];

    return Array.from({ length: count }, (_, i) => {
      const cardIndex = i + 1;
      return `
        <div class="journey-card" data-card-index="${cardIndex}">
          <div class="journey-card-header">
            <span class="journey-card-number">步骤 ${cardIndex}</span>
          </div>
          ${sections.map(section => `
            <div class="journey-card-section">
              <span class="journey-section-label">${section.label}</span>
              ${section.fields.map(field => `
                <textarea
                  class="journey-card-input textarea-sm"
                  data-field="${field.name}"
                  data-card="${cardIndex}"
                  placeholder="${field.placeholder}"
                  rows="2"
                ></textarea>
              `).join('')}
              ${section.label === '发现' ? `
                <div class="journey-keyfinding-row">
                  <input
                    type="checkbox"
                    class="journey-keyfinding-toggle"
                    id="keyFinding_${cardIndex}"
                    data-card="${cardIndex}"
                  />
                  <label class="journey-keyfinding-label" for="keyFinding_${cardIndex}">
                    标记为关键发现
                  </label>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      `;
    }).join('') + `
      <button class="journey-add-card-btn" id="addJourneyCardBtn">
        <span class="journey-add-card-icon">+</span>
        <span class="journey-add-card-text">添加步骤</span>
      </button>
    `;
  }

  renderDrawer() {
    const user = AppState.user;
    const userName = user?.name || I18N.t('user.friend', '朋友');

    const drawerHTML = `
      <div class="drawer" id="drawer">
        <div class="drawer-header">
          <div class="drawer-user">
            <div class="drawer-avatar">${userName.charAt(0)}</div>
            <div>
              <div class="drawer-user-name">${userName}</div>
              <div class="drawer-user-stats">
                <span class="points-display" title="完成 2 个 Lite 项目解锁 Eureka Pro">
                  <span class="points-icon">⭐</span>
                  <span class="points-value">${user?.points || 0}</span>
                  <span class="points-target">/ ${PRO_UNLOCK_POINTS}</span>
                </span>
                ${user?.unlockedPro ? '<span class="pro-badge">✨ Pro 已解锁</span>' : ''}
              </div>
            </div>
          </div>
        </div>
        <nav class="drawer-nav">
          <div class="drawer-nav-item" data-page="home">
            <span class="drawer-nav-item-icon">🏠</span>
            <span>首页</span>
          </div>
          <div class="drawer-nav-item" data-page="projects">
            <span class="drawer-nav-item-icon">📁</span>
            <span>我的项目</span>
          </div>
          <div class="drawer-nav-item" data-page="profile">
            <span class="drawer-nav-item-icon">👤</span>
            <span>个人中心</span>
          </div>
          <div class="drawer-nav-item" data-action="glossary">
            <span class="drawer-nav-item-icon">📖</span>
            <span>术语表（RISE/POV/HMW…）</span>
          </div>
          <div class="drawer-nav-item" data-action="intro">
            <span class="drawer-nav-item-icon">👋</span>
            <span>新手引导（3分钟看懂）</span>
          </div>
        </nav>
      </div>
    `;

    // Insert drawer
    const existingDrawer = document.getElementById('drawer');
    if (existingDrawer) {
      existingDrawer.remove();
    }
    document.body.insertAdjacentHTML('beforeend', drawerHTML);

    // Show overlay
    document.getElementById('drawerOverlay').classList.add('open');

    // Attach drawer events
    document.querySelectorAll('.drawer-nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const page = item.dataset.page;
        const action = item.dataset.action;
        AppState.closeDrawer();
        if (action === 'glossary') { this.showGlossaryModal(); return; }
        if (action === 'intro') { this.showIntroModal(); return; }
        if (page) AppState.navigate(page);
      });
    });
    // 同步 drawer open 状态（因模板没有硬编码 open）
    this.updateDrawer();
  }

  updateDrawer() {
    const drawer = document.getElementById('drawer');
    const overlay = document.getElementById('drawerOverlay');

    if (drawer) {
      drawer.classList.toggle('open', AppState.drawerOpen);
    }
    overlay?.classList.toggle('open', AppState.drawerOpen);
  }

  /**
   * 术语表弹窗（R4）
   */
  showGlossaryModal() {
    const terms = [
      { t: 'RISE', d: 'A four-stage product innovation framework: Reveal (Insight) → Inspire (Ideation) → Shape (Build) → Exam (Validate), advancing in iterative waves.' },
      { t: 'Reveal', d: 'Stage 1: Dig deep into real user needs and uncover genuine innovation opportunities beneath the surface.' },
      { t: 'Inspire', d: 'Stage 2: Turn insights into a large quantity of creative ideas first, then refine for quality.' },
      { t: 'Shape', d: 'Stage 3: Polish ideas into a minimum viable concept (MVP) and user stories that can be validated.' },
      { t: 'Exam', d: 'Stage 4: Test solutions with real users, gather feedback, and decide whether to iterate, pivot, or proceed.' },
      { t: 'FIND', d: 'A four-step insight method: Fact → Interpret → Need → Distill (POV). From observation to essence.' },
      { t: 'POV', d: 'Point of View statement: a single sentence that clarifies the innovation opportunity using "target user + need + insight, because + root cause".' },
      { t: 'HMW', d: 'How Might We: a reframing of insights into open, divergent questions, e.g. "How might we help…"' },
      { t: 'NCO', d: 'Three lenses for inspiration: New, Cool, and Outsider. Use them to break fixed thinking patterns.' },
      { t: 'TAM/SAM/SOM', d: 'Three market-size tiers: Total Available Market (TAM) → Serviceable Addressable Market (SAM) → Serviceable Obtainable Market (SOM), narrowing from large to reachable.' },
      { t: 'MVP', d: 'Minimum Viable Product: the lowest-cost prototype used to validate the core hypothesis.' }
    ];
    const items = terms.map(x => `
      <div class="glossary-item">
        <div class="glossary-term">${x.t}</div>
        <div class="glossary-desc">${x.d}</div>
      </div>`).join('');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal glossary-modal">
        <div class="modal-header">
          <span class="modal-title">📖 Glossary</span>
          <button class="ai-panel-close" id="glossaryClose">✕</button>
        </div>
        <div class="modal-body glossary-body">${items}</div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#glossaryClose')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }

  /**
   * 新手引导弹窗（R4）：一张图看懂 RISE
   */
  showIntroModal() {
    const flow = [
      { key: 'reveal', icon: '🔍', name: 'Reveal', tag: 'Reveal', tip: 'Who / What scenario / What pain point', color: '#E07A2F' },
      { key: 'inspire', icon: '💡', name: 'Inspire', tag: 'Inspire', tip: 'Frame HMWs, diverge and select ideas', color: '#7F77DD' },
      { key: 'shape', icon: '🛠️', name: 'Shape', tag: 'Shape', tip: 'Shape MVP and user storyboard', color: '#0F6E56' },
      { key: 'exam', icon: '✅', name: 'Exam', tag: 'Exam', tip: 'Real testing, four-dimension evaluation, elevator pitch', color: '#64748B' }
    ];
    const nodes = flow.map((s, i) => `
      <div class="intro-flow-node" style="--node-color:${s.color}">
        <div class="intro-flow-badge" style="background:${s.color}">${s.icon}</div>
        <div class="intro-flow-name">${s.name} <span class="intro-flow-tag">${s.tag}</span></div>
        <div class="intro-flow-tip">${s.tip}</div>
        ${i < flow.length - 1 ? '<div class="intro-flow-arrow">→</div>' : ''}
      </div>`).join('');
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal intro-modal">
        <div class="modal-header">
          <span class="modal-title">👋 Eureka at a Glance</span>
          <button class="ai-panel-close" id="introClose">✕</button>
        </div>
        <div class="modal-body">
          <p class="ai-config-tip" style="text-align:center;margin-bottom:18px">Eureka uses the <b>RISE four-step</b> framework to turn a fuzzy idea into a testable solution.<br>Follow the top navigation, one step at a time.</p>
          <div class="intro-flow">${nodes}</div>
          <p class="ai-config-tip" style="margin-top:18px;text-align:center">Tip: click 🤖 at the bottom-right to open the AI assistant. Each stage shows a guide on first entry. AI requires a Key in ⚙ settings.</p>
          <div style="text-align:center;margin-top:22px"><button class="btn btn-primary" id="introGot" style="background:#E07A2F !important;color:#fff !important;border:none;box-shadow:0 2px 8px rgba(224,122,47,0.35)">Start my innovation →</button></div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#introClose')?.addEventListener('click', close);
    modal.querySelector('#introGot')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }

  /**
   * Pro 解锁祝贺弹窗
   */
  showProUnlockModal(points) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal pro-unlock-modal">
        <div class="pro-unlock-hero">🎉</div>
        <h2 class="pro-unlock-title">恭喜解锁 Eureka Pro！</h2>
        <p class="pro-unlock-body">你已完成 2 个完整的 RISE 创新项目，累计获得 <b>${points}</b> 积分。</p>
        <p class="pro-unlock-body">感谢你持续的参与和实践——从模糊想法到可验证方案，每一步都在沉淀真正的Product Innovation能力。</p>
        <div class="pro-unlock-actions">
          <button class="btn btn-secondary" id="proUnlockClose">稍后再说</button>
          <a class="btn btn-primary" id="proUnlockGo" href="${EUREKA_PRO_URL}" target="_blank" rel="noopener" style="background:#E07A2F !important;color:#fff !important;border:none;box-shadow:0 2px 8px rgba(224,122,47,0.35)">🚀 进入 Eureka Pro</a>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#proUnlockClose')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  }

  /**
   * 删除项目二次确认弹窗
   */
  showDeleteConfirmModal(project) {
    // 示例项目不可删除
    if (project.isExample) {
      this.showToast('📋 示例项目仅供查看，不可删除');
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">确认删除项目？</span>
          <button class="ai-panel-close" id="deleteConfirmClose">✕</button>
        </div>
        <div class="modal-body">
          <p>你即将删除项目 <b>${this.escapeHtml(project.title || '未命名项目')}</b>。</p>
          <p class="ai-config-tip" style="color:var(--error);margin-top:8px">删除后数据将无法恢复，请确认。</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="deleteConfirmCancel">取消</button>
          <button class="btn btn-danger" id="deleteConfirmOk">确认删除</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#deleteConfirmClose')?.addEventListener('click', close);
    modal.querySelector('#deleteConfirmCancel')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('#deleteConfirmOk')?.addEventListener('click', () => {
      window.EurekaStorage.deleteProject(project.id);
      this.showToast('项目已删除');
      close();
      if (AppState.currentPage === 'projects') {
        this.renderProjects();
      } else {
        this.renderHome();
      }
    });
  }

  updateAiPanel() {
    const fab = document.getElementById('aiFab');
    const panel = document.getElementById('aiPanel');

    fab?.classList.toggle('active', AppState.aiPanelOpen);
    panel?.classList.toggle('open', AppState.aiPanelOpen);
  }

  /**
   * 刷新所有 AI 状态展示（首页横幅 + AI 面板状态条）
   */
  refreshAiStatusUI() {
    const st = (window.AIService && window.AIService.status()) || { ready: false };
    const T = (k, f) => I18N.t(k, f);
    // 首页横幅
    const banner = document.getElementById('aiBanner');
    if (banner) {
      if (st.ready) {
        banner.className = 'ai-banner ai-banner-ok';
        banner.innerHTML = `<span>🟢 ${T('ai.status.ready', 'AI 已就绪')}${st.providerLabel}${st.model ? ' · ' + st.model : ''}${st.fromUser ? ' (' + T('ai.yours', '你的 Key') + ')' : ''}</span>
          <button class="ai-banner-btn" id="aiBannerSettings">⚙ ${T('ai.change', '更换')}</button>`;
      } else {
        banner.className = 'ai-banner ai-banner-warn';
        banner.innerHTML = `<span>⚠️ ${T('ai.status.notReady', 'AI 尚未配置：所有「AI 帮我…」功能暂不可用')}</span>
          <button class="ai-banner-btn" id="aiBannerSettings">${T('ai.configure', '去配置')}</button>`;
      }
      banner.querySelector('#aiBannerSettings')?.addEventListener('click', () => this.showAIConfigModal());
    }
    // AI 面板状态条
    document.querySelectorAll('#aiPanelStatus').forEach(el => {
      if (st.ready) {
        el.className = 'ai-panel-status ok';
        el.innerHTML = `🟢 ${T('ai.status.configured', '已配置')}${st.providerLabel}${st.model ? ' · ' + st.model : ''} · <a href="javascript:void(0)" id="panelAiSettings">${T('ai.change', '更换')}</a>`;
      } else {
        el.className = 'ai-panel-status warn';
        el.innerHTML = `⚠️ ${T('ai.status.keyNotSet', '未配置 Key')} · <a href="javascript:void(0)" id="panelAiSettings">${T('ai.configure', '去配置')}</a>`;
      }
      el.querySelector('#panelAiSettings')?.addEventListener('click', () => this.showAIConfigModal());
    });
  }

  /**
   * AI 配置弹窗：仅含「大模型品牌选择 + API Key 输入」
   */
  showAIConfigModal() {
    const providers = (window.AIService && window.AIService.getProviders()) || [];
    const saved = (window.AIService && window.AIService.getUserConfig()) || null;
    const defaultProvider = saved?.provider || 'deepseek';

    const brandCards = providers.map(p => `
      <div class="ai-brand-card ${p.id === defaultProvider ? 'selected' : ''}" data-provider="${p.id}" data-baseurl="${p.baseUrl}">
        <div class="ai-brand-name">${p.label}</div>
        <div class="ai-brand-desc">${p.desc}</div>
      </div>`).join('');

    const provider = providers.find(p => p.id === defaultProvider) || providers[0];
    const modelOptions = (provider?.models || []).map(m => `<option value="${m}" ${m === (saved?.model || provider.model) ? 'selected' : ''}>${m}</option>`).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open ai-config-overlay';
    modal.id = 'aiConfigModal';
    modal.innerHTML = `
      <div class="modal ai-config-modal">
        <div class="modal-header ai-config-header">
          <span class="modal-title">⚙ 配置 AI 大模型</span>
          <button class="ai-panel-close" id="aiConfigClose">✕</button>
        </div>
        <div class="modal-body ai-config-body">
          <p class="ai-config-tip">选择你的大模型品牌，填入自己的 API Key 即可启用全部「AI 帮我…」功能。Key 仅保存在本机浏览器（localStorage），不会上传。</p>

          <div class="ai-config-section-title">① 选择大模型品牌</div>
          <div class="ai-brand-grid">${brandCards}</div>

          <div class="ai-config-section-title">② 填入 API Key</div>
          <div class="ai-config-row">
            <input type="password" class="ai-config-key" id="aiConfigKey" placeholder="${provider?.keyHint || '粘贴你的 API Key'}" value="${saved?.apiKey || ''}" autocomplete="off" />
            <a class="ai-config-doclink" id="aiConfigDoc" href="${provider?.docUrl || '#'}" target="_blank" rel="noopener">如何获取 ↗</a>
          </div>

          <div class="ai-config-section-title">③ 选择模型（默认即可）</div>
          <select class="ai-config-model" id="aiConfigModel">
            ${modelOptions}
          </select>

          <div class="ai-config-status" id="aiConfigStatus"></div>

          <div class="ai-config-actions">
            <button class="btn btn-ghost" id="aiConfigClear">清除配置</button>
            <button class="btn btn-primary" id="aiConfigSave" style="background: #E07A2F; color: #fff; border: none; box-shadow: 0 2px 8px rgba(224,122,47,0.35);">保存并测试连接</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const close = () => { modal.remove(); this.refreshAiStatusUI(); };
    modal.querySelector('#aiConfigClose')?.addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', escHandler); }
    });

    // 品牌选择
    let selectedProvider = defaultProvider;
    const brandEls = modal.querySelectorAll('.ai-brand-card');
    const keyInput = modal.querySelector('#aiConfigKey');
    const modelSelect = modal.querySelector('#aiConfigModel');
    const docLink = modal.querySelector('#aiConfigDoc');
    const statusEl = modal.querySelector('#aiConfigStatus');

    brandEls.forEach(card => {
      card.addEventListener('click', () => {
        brandEls.forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedProvider = card.dataset.provider;
        const p = providers.find(x => x.id === selectedProvider);
        if (p) {
          keyInput.placeholder = p.keyHint || '粘贴你的 API Key';
          docLink.href = p.docUrl || '#';
          modelSelect.innerHTML = (p.models || []).map(m => `<option value="${m}">${m}</option>`).join('');
        }
      });
    });

    // 保存 + 测试
    modal.querySelector('#aiConfigSave')?.addEventListener('click', async () => {
      const apiKey = keyInput.value.trim();
      const p = providers.find(x => x.id === selectedProvider);
      if (!apiKey) {
        statusEl.className = 'ai-config-status err';
        statusEl.textContent = '❌ 请先填入 API Key';
        return;
      }
      if (p?.keyPrefix && !apiKey.startsWith(p.keyPrefix)) {
        statusEl.className = 'ai-config-status err';
        statusEl.textContent = `❌ Key 格式不正确，应以「${p.keyPrefix}」开头`;
        return;
      }
      const model = modelSelect.value || p?.model;
      statusEl.className = 'ai-config-status loading';
      statusEl.textContent = '⏳ 正在保存并测试连接...';
      const ok = window.AIService.saveUserConfig({ provider: selectedProvider, apiKey, model });
      if (!ok) {
        statusEl.className = 'ai-config-status err';
        statusEl.textContent = '❌ 保存失败（浏览器存储不可用）';
        return;
      }
      const res = await window.AIService.test();
      if (res.ok) {
        statusEl.className = 'ai-config-status ok';
        statusEl.textContent = `✅ 连接成功！${res.message} AI 已就绪。`;
        setTimeout(close, 1200);
      } else {
        statusEl.className = 'ai-config-status err';
        statusEl.textContent = `⚠️ 已保存，但连接测试失败：${res.message}（Key 已保存，可稍后重试）`;
      }
    });

    // 清除
    modal.querySelector('#aiConfigClear')?.addEventListener('click', () => {
      window.AIService.clearUserConfig();
      keyInput.value = '';
      statusEl.className = 'ai-config-status';
      statusEl.textContent = '已清除本地配置';
      this.refreshAiStatusUI();
    });
  }

  async handleAiAction(action) {
    const stage = AppState.currentStage || 'reveal';
    const screen = AppState.currentScreen || 1;
    const project = AppState.currentProject;

    // Get user's current input (handles screenInput / targetUserInput+sceneDescInput / screenInput2)
    const userInput = this.getCurrentScreenUserInput() || project?.title || '';
    const aiOn = !!(window.AIService && window.AIService.isReady());

    switch (action) {
      case 'suggest':
      case 'feedback': {
        this.showLoadingToast(aiOn ? '🤖 DeepSeek 正在分析您的内容...' : '正在分析您的内容...');
        try {
          const suggestions = await AIAssistant.getSuggestionsAI(stage, screen, userInput, project);
          const hint = AIAssistant.getHint(stage, screen, userInput);
          this.showAiSuggestions(suggestions, hint, userInput);
        } catch (e) {
          const suggestions = AIAssistant.getSuggestions(stage, screen, userInput);
          this.showAiSuggestions(suggestions, AIAssistant.getHint(stage, screen, userInput), userInput);
        }
        break;
      }
      case 'example':
        this.showLoadingToast('正在查找案例...');
        setTimeout(() => {
          const category = project?.category || 'product';
          const examples = AIAssistant.getNCOInspiration(category, 3, userInput);
          this.showAiExamples(examples);
        }, 400);
        break;
      case 'prefill': {
        this.showLoadingToast(aiOn ? '🤖 DeepSeek 正在生成草稿...' : '正在规范化您的内容...');
        try {
          const prefill = await AIAssistant.generatePrefillContentAI(
            { stage, screen, type: 'text' },
            userInput,
            project
          );
          if (prefill?.content) {
            // 有Original则显示 diff 对比，无Original则直接填入预览
            if (userInput && userInput.trim().length >= 5) {
              this.showPrefillDiff(userInput, prefill);
            } else {
              this.showPrefillDiff('(blank, AI generated a draft from the project context)', prefill);
            }
          } else {
            this.showToast('暂无生成建议，请补充更多项目信息');
          }
        } catch (e) {
          console.error('[AI] prefill failed:', e);
          if (e.message === 'AI_NOT_CONFIGURED') {
            this.showToast('AI 尚未配置：点右下角 🤖 → ⚙ 填入你的大模型 Key 即可启用');
            setTimeout(() => this.showAIConfigModal(), 800);
          } else {
            this.showToast('AI 生成失败：' + (e.message || '请检查网络或 API Key'));
          }
        }
        break;
      }
    }
  }

  /**
   * Select an AI mode and show the chat interface
   */
  async selectAIMode(mode) {
    const modes = {
      brainstorm: { icon: '💭', title: '帮我想', subtitle: '智能提问，补充思考维度，提供创意激发和案例推荐', placeholder: '描述你的想法，我会帮你补充思考角度...' },
      critique: { icon: '🔍', title: '批判我', subtitle: '像投资人一样诚恳质疑，帮你识别盲点和潜在风险', placeholder: '抛出你的方案或假设，我会帮你挑刺...' },
      research: { icon: '🔎', title: '查一查', subtitle: '补充事实依据，指出需要验证的假设和调研方向', placeholder: '告诉我你想验证什么，我会帮你找方向...' }
    };
    const info = modes[mode];
    if (!info) return;

    this.currentAIMode = mode;
    this.aiModeHistory = [];

    // 清空上一模式的 DOM 消息，避免所有模式的内容堆叠展示
    const messagesContainer = document.getElementById('aiModeMessages');
    if (messagesContainer) messagesContainer.innerHTML = '';

    // Update UI
    const chat = document.getElementById('aiModeChat');
    const buttons = document.querySelectorAll('.ai-mode-btn');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.action === mode);
    });

    if (chat) {
      chat.classList.add('active');
      const input = document.getElementById('aiModeInput');
      if (input) {
        input.placeholder = info.placeholder;
        input.value = '';
      }

      // 自动滚动到对话区，让用户看到点击后的反馈
      const body = document.querySelector('.ai-panel-body');
      if (body) {
        setTimeout(() => chat.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
      }
    }

    // Generate initial AI message based on current context
    const { stage, screen, project } = this.getAIContext();
    const ctxLines = this.buildAIContextLines(stage, screen, project);
    const initialPrompt = `基于当前项目上下文，请主动提出引导性问题或建议，帮助用户开始思考。不要问"你想聊什么"，直接给出有价值的切入点。`;

    this.addAIModeMessage('ai', '...', true);
    try {
      const result = await AIAssistant.generateAIModeResponse(mode, ctxLines.join('\n'), initialPrompt);
      // 若用户已切换模式，则丢弃过期回复
      if (this.currentAIMode !== mode) return;
      this.updateLastAIMessage(result);
    } catch (e) {
      if (this.currentAIMode !== mode) return;
      const fallback = await AIAssistant.generateAIModeResponse(mode, '', '');
      this.updateLastAIMessage(typeof fallback === 'string' ? fallback : 'AI 模式暂不可用');
    }
  }

  /**
   * Send a message in the current AI mode chat
   */
  async sendAIModeMessage() {
    const input = document.getElementById('aiModeInput');
    const text = input?.value.trim();
    if (!text || !this.currentAIMode) return;

    this.addAIModeMessage('user', text);
    input.value = '';

    const { stage, screen, project } = this.getAIContext();
    const ctxLines = this.buildAIContextLines(stage, screen, project);
    const history = this.aiModeHistory.map(m => `${m.role === 'user' ? '用户' : 'AI'}：${m.text}`).join('\n');
    const prompt = `以下是我们之前的对话：\n${history}\n\n请基于当前项目上下文继续回应用户。`;

    const requestMode = this.currentAIMode;
    this.addAIModeMessage('ai', '...', true);
    try {
      const result = await AIAssistant.generateAIModeResponse(requestMode, ctxLines.join('\n'), prompt);
      if (this.currentAIMode !== requestMode) return;
      this.updateLastAIMessage(result);
    } catch (e) {
      if (this.currentAIMode !== requestMode) return;
      this.updateLastAIMessage('抱歉，AI 响应失败，请检查网络或 API Key 配置。');
    }
  }

  /**
   * Add a message to the AI mode chat
   */
  addAIModeMessage(role, text, isLoading = false) {
    const container = document.getElementById('aiModeMessages');
    if (!container) return;
    const msg = { role, text, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), isLoading };
    this.aiModeHistory.push(msg);

    const div = document.createElement('div');
    div.className = `ai-message ${role}`;
    div.dataset.loading = isLoading ? 'true' : 'false';

    if (role === 'ai') {
      // AI 回复放在可编辑文本域中，方便用户修改、复制
      div.innerHTML = `<textarea class="ai-message-textarea" rows="4" ${isLoading ? 'disabled' : ''}>${this.escapeHtml(text)}</textarea><div class="ai-message-time">${msg.time}</div>`;
    } else {
      div.innerHTML = `<div>${this.escapeHtml(text).replace(/\n/g, '<br>')}</div><div class="ai-message-time">${msg.time}</div>`;
    }
    container.appendChild(div);

    // AI 文本域自动撑开高度，并监听用户编辑
    const textarea = div.querySelector('.ai-message-textarea');
    if (textarea) {
      this.autoResizeTextarea(textarea);
      textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));
    }

    container.scrollTop = container.scrollHeight;
    return div;
  }

  /**
   * Auto-resize a textarea to fit its content
   */
  autoResizeTextarea(textarea) {
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  /**
   * Update the last AI message (used for streaming/fallback)
   */
  updateLastAIMessage(text) {
    const container = document.getElementById('aiModeMessages');
    if (!container) return;
    const lastAi = Array.from(container.querySelectorAll('.ai-message.ai')).pop();
    if (lastAi) {
      lastAi.dataset.loading = 'false';
      const textarea = lastAi.querySelector('.ai-message-textarea');
      if (textarea) {
        textarea.disabled = false;
        textarea.value = text;
        this.autoResizeTextarea(textarea);
      } else {
        lastAi.querySelector('div').innerHTML = this.escapeHtml(text).replace(/\n/g, '<br>');
      }
      const msg = this.aiModeHistory.filter(m => m.role === 'ai').pop();
      if (msg) msg.text = text;
    } else {
      this.addAIModeMessage('ai', text);
    }
  }

  /**
   * Get current AI context
   */
  getAIContext() {
    return {
      stage: AppState.currentStage || 'reveal',
      screen: AppState.currentScreen || 1,
      project: AppState.currentProject
    };
  }

  /**
   * Build context lines for AI mode
   */
  buildAIContextLines(stage, screen, project) {
    const stageInfo = Utils.getStageInfo(stage);
    const ctxLines = [
      `当前阶段: ${stageInfo?.name || stage}`,
      `当前屏: ${screen}`,
      `项目标题: ${project?.title || '未命名'}`,
      `项目类别: ${project?.category || '未设定'}`
    ];
    if (project?.cards) {
      const brief = project.cards.projectBriefing;
      if (brief) {
        let b = brief;
        if (typeof b === 'object' && b.content) b = b.content;
        if (typeof b === 'string') { try { b = JSON.parse(b); } catch(e) {} }
        if (b && b.targetUser) ctxLines.push(`目标用户: ${String(b.targetUser).slice(0, 80)}`);
      }
    }
    const input = document.getElementById('screenInput');
    if (input?.value?.trim()) ctxLines.push(`当前输入框内容: ${input.value.trim().slice(0, 200)}`);
    return ctxLines;
  }

  /**
   * Get the current user input text for AI prefill, accounting for different screen layouts
   */
  getCurrentScreenUserInput() {
    const targetUserInput = document.getElementById('targetUserInput');
    const sceneDescInput = document.getElementById('sceneDescInput');
    if (targetUserInput || sceneDescInput) {
      const targetUser = targetUserInput?.value?.trim() || '';
      const sceneDesc = sceneDescInput?.value?.trim() || '';
      if (targetUser || sceneDesc) {
        return `【目标用户】${targetUser}\n【场景描述】${sceneDesc}`;
      }
    }
    const screenInput = document.getElementById('screenInput');
    if (screenInput) return screenInput.value || '';
    const screenInput2 = document.getElementById('screenInput2');
    return screenInput2?.value || AppState.currentProject?.title || '';
  }

  /**
   * Apply AI prefill content to the correct input fields for the current screen
   */
  applyPrefillContent(content) {
    const stage = AppState.currentStage;
    const screen = AppState.currentScreen;
    const targetUserInput = document.getElementById('targetUserInput');
    const sceneDescInput = document.getElementById('sceneDescInput');
    const screenInput = document.getElementById('screenInput');
    const screenInput2 = document.getElementById('screenInput2');

    if (targetUserInput || sceneDescInput) {
      // Reveal Screen 1: parse structured sections and apply to the two fields
      const targetMatch = content.match(/【目标用户】\s*([\s\S]*?)(?=\n\s*【|$)/);
      const sceneMatch = content.match(/【(?:场景描述|使用场景)】\s*([\s\S]*?)(?=\n\s*【|$)/);
      const painMatch = content.match(/【(?:痛点\/挑战|痛点)】\s*([\s\S]*?)(?=\n\s*【|$)/);

      if (targetMatch && targetUserInput) {
        targetUserInput.value = targetMatch[1].trim();
        targetUserInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      if (sceneDescInput) {
        const parts = [sceneMatch?.[1], painMatch?.[1]].filter(Boolean).map(s => s.trim()).filter(Boolean);
        if (parts.length) {
          sceneDescInput.value = parts.join('\n\n');
          sceneDescInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      this.saveCurrentScreenContent(stage, screen);
      return;
    }

    if (screenInput) {
      screenInput.value = content;
      screenInput.dispatchEvent(new Event('input', { bubbles: true }));
      this.saveCurrentScreenContent(stage, screen);
    } else if (screenInput2) {
      screenInput2.value = content;
      screenInput2.dispatchEvent(new Event('input', { bubbles: true }));
      this.saveCurrentScreenContent(stage, screen);
    }
  }

  /**
   * Show prefill diff - compare original with revised
   */
  showPrefillDiff(original, prefill) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <div class="modal-header">
          <span class="modal-title">✨ Normalization rewrite preview</span>
          <button class="ai-panel-close">✕</button>
        </div>
        <div class="modal-body">
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--text-muted); margin-bottom: var(--space-xs);">Original</div>
            <div style="padding: var(--space-sm); background: var(--bg-hover); border-radius: var(--radius-sm); font-size: var(--font-size-sm); color: var(--text-secondary);">${this.escapeHtml(original)}</div>
          </div>
          <div style="text-align: center; margin: var(--space-sm) 0; color: var(--text-muted);">↓</div>
          <div style="margin-bottom: var(--space-md);">
            <div style="font-size: var(--font-size-xs); color: var(--reveal-primary); margin-bottom: var(--space-xs);">${prefill.title || 'After rewrite'}</div>
            <div style="padding: var(--space-md); background: rgba(231, 76, 60, 0.05); border: 1px solid rgba(231, 76, 60, 0.2); border-radius: var(--radius-md); font-size: var(--font-size-sm); white-space: pre-wrap;">${this.escapeHtml(prefill.content)}</div>
          </div>
          <div style="display: flex; gap: var(--space-sm);">
            <button class="btn btn-secondary" id="prefillCancel" style="flex: 1;">Keep original</button>
            <button class="btn btn-primary" id="prefillApply" style="flex: 1; background: var(--reveal-primary);">Apply rewrite</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.ai-panel-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#prefillCancel')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#prefillApply')?.addEventListener('click', () => {
      this.applyPrefillContent(prefill.content);
      modal.remove();
      this.showToast('✨ 内容已更新');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  escapeHtml(text) {
    // 标准 HTML 转义：必须转义引号，否则含 " 的内容注入 value="..." 属性会被截断
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Show AI suggestions in a modal
   * @param {Array} suggestions - Array of suggestion strings
   * @param {string} hint - Additional hint text
   * @param {string} userInput - User's original input (for context)
   */
  showAiSuggestions(suggestions, hint, userInput = '') {
    const suggestionsHtml = suggestions.map(s => {
      // Highlight suggestions that start with ✓
      if (s.startsWith('✓')) {
        return `<li style="padding: var(--space-sm); margin-bottom: var(--space-xs); background: rgba(231, 76, 60, 0.05); border-radius: var(--radius-sm); color: var(--text-primary);">
          <span style="color: var(--reveal-primary);">${s.substring(0, s.indexOf('：') + 1)}</span>${s.substring(s.indexOf('：') + 1)}
        </li>`;
      }
      return `<li style="padding: var(--space-xs) 0; color: var(--text-secondary);">${s}</li>`;
    }).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">💡 Writing suggestions</span>
          <button class="ai-panel-close">✕</button>
        </div>
        <div class="modal-body">
          ${userInput && userInput.length > 10 ? `
            <div style="margin-bottom: var(--space-md); padding: var(--space-sm); background: var(--bg-hover); border-radius: var(--radius-sm); font-size: var(--font-size-xs); color: var(--text-muted);">
              Based on your content:
              <div style="color: var(--text-secondary); margin-top: var(--space-xs);">"${userInput.substring(0, 50)}${userInput.length > 50 ? '...' : ''}"</div>
            </div>
          ` : ''}
          <ul style="list-style: none; padding: 0;">
            ${suggestionsHtml}
          </ul>
          ${hint ? `<p style="margin-top: var(--space-md); color: var(--text-secondary); font-size: var(--font-size-sm);">${hint}</p>` : ''}
          <div style="margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-color);">
            <button class="btn btn-secondary btn-sm" id="prefillBtn" style="width: 100%;">
              ✨ Normalize & rewrite
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.ai-panel-close')?.addEventListener('click', () => modal.remove());
    modal.querySelector('#prefillBtn')?.addEventListener('click', () => {
      modal.remove();
      this.handleAiAction('prefill');
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Show AI examples in a modal
   */
  showAiExamples(examples) {
    const examplesHtml = examples.map(ex => `
      <div style="padding: var(--space-md); background: var(--bg-hover); border-radius: var(--radius-md); margin-bottom: var(--space-sm);">
        <span style="font-size: var(--font-size-xs); padding: 2px 8px; background: var(--reveal-primary); color: white; border-radius: var(--radius-sm);">${ex.type}</span>
        <h4 style="margin: var(--space-sm) 0; font-size: var(--font-size-base);">${ex.title}</h4>
        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-xs);">${ex.description}</p>
        <p style="font-size: var(--font-size-xs); color: var(--text-muted);">Source:${ex.source}</p>
      </div>
    `).join('');

    const modal = document.createElement('div');
    modal.className = 'modal-overlay open';
    modal.innerHTML = `
      <div class="modal" style="max-height: 70vh; overflow-y: auto;">
        <div class="modal-header">
          <span class="modal-title">📚 Reference cases</span>
          <button class="ai-panel-close">✕</button>
        </div>
        <div class="modal-body">
          ${examplesHtml}
          <p style="margin-top: var(--space-md); color: var(--text-secondary); font-size: var(--font-size-xs);">
            For reference only, to spark ideas
          </p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('.ai-panel-close')?.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  showLoadingToast(message) {
    this.showToast(message);
  }

  showToast(message, type = '') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    // Create toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Show
    setTimeout(() => toast.classList.add('show'), 10);

    // Hide after 3s
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ========== MODULE PAGES (Reveal, Inspire, Shape, Exam) ==========

  renderModule(stage) {
    const stageInfo = Utils.getStageInfo(stage);
    // Always refresh project data from storage to ensure we have the latest
    const project = window.EurekaStorage.getProject(AppState.currentProjectId) || AppState.currentProject;
    if (project) {
      AppState.currentProject = project;
    }

    this.setContent(this.getModuleTemplate(stage, stageInfo, project));
    this.attachModuleEvents(stage, stageInfo, project);
  }

  getModuleTemplate(stage, stageInfo, project) {
    const totalScreens = stageInfo.screens;
    const currentScreen = project?.currentScreen || 1;
    const progress = totalScreens > 0 ? (currentScreen / totalScreens) * 100 : 0;
    const stageOrder = ['reveal', 'inspire', 'shape', 'exam'];
    const stageIdx = stageOrder.indexOf(stage);

    return `
      <!-- Header -->
      <header class="nav-header nav-header-light theme-${stageInfo.theme}">
        <div class="nav-logo">
          <button class="btn-icon btn-ghost" id="backBtn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div class="nav-logo-icon" style="background: ${stageInfo.color};">${stageInfo.icon}</div>
          <span style="color: var(--text-primary);">${stageInfo.name}</span>
        </div>
        <button class="btn-icon btn-ghost" id="closeBtn" style="color: var(--text-primary);">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </header>

      <!-- RISE Stepper -->
      <nav class="rise-stepper" id="riseStepper">
        <div class="rise-stepper-inner">
          ${stageOrder.map((s, i) => {
            const info = Utils.getStageInfo(s);
            const isActive = s === stage;
            const isCompleted = i < stageIdx;
            const screenDefs = info.screenDefs || [];
            const activeStyle = isActive ? ` style="color: ${info.color};"` : '';
            const dotStyle = isActive ? ` style="background: ${info.color}; box-shadow: 0 0 0 3px ${info.color}33;"` : '';
            return `
              <div class="rise-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" data-stage="${s}" data-screen-count="${screenDefs.length}"${activeStyle}>
                <span class="rise-step-dot"${dotStyle}></span>
                <span>${info.name}</span>
              </div>
              ${i < 3 ? '<span class="rise-step-arrow">›</span>' : ''}
            `;
          }).join('')}
        </div>
      </nav>

      <!-- Progress Bar -->
      <div style="position: fixed; top: 104px; left: 0; right: 0; padding: 0 var(--space-md); z-index: 99;">
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${progress}%; background: ${stageInfo.color};"></div>
        </div>
        <div class="progress-indicator">
          <span>${window.I18N.getLang() === 'en' ? `Screen ${currentScreen} / ${totalScreens}` : `第 ${currentScreen} / ${totalScreens} 屏`}</span>
          <span>${Math.round(progress)}%</span>
        </div>
      </div>

      <!-- Main Content -->
      <main class="module-main theme-${stageInfo.theme}" style="padding: 140px var(--space-md) 100px;">
        <div class="module-content" id="moduleContent">
          ${project?.isExample ? (() => {
            const guide = (SCREEN_GUIDES[stage] || {})[currentScreen];
            return `
              <div class="example-banner">
                <span class="example-banner-icon">📘</span>
                <span><b>示例项目 · 仅供查看</b> — 点右上角 ✕ 或左下按钮退出，自己创建一个新项目来动手实践。</span>
              </div>
              ${guide ? `
              <div class="example-step-guide">
                <div class="example-step-guide-row"><span class="example-step-guide-label">🎯 做什么</span><span>${guide.action}</span></div>
                <div class="example-step-guide-row"><span class="example-step-guide-label">📥 Input什么</span><span>${guide.input}</span></div>
                <div class="example-step-guide-row"><span class="example-step-guide-label">📤 Output什么</span><span>${guide.output}</span></div>
                <div class="example-step-guide-row"><span class="example-step-guide-label">❓ 为什么</span><span>${guide.reason}</span></div>
              </div>` : ''}
            `;
          })() : ''}
          ${this.getScreenContent(stageInfo.name.toLowerCase(), currentScreen, project)}
        </div>
      </main>

      <!-- Bottom Navigation -->
      <div class="bottom-nav">
        <div class="bottom-nav-left">
          ${currentScreen > 1 ? `
            <button class="btn btn-secondary" id="prevBtn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              上一步
            </button>
          ` : ''}
        </div>
        <div class="bottom-nav-center">
          ${Array.from({ length: totalScreens }, (_, i) => `
            <div class="step-dot ${i + 1 === currentScreen ? 'active' : ''}" style="
              width: 8px; height: 8px; border-radius: 50%;
              background: ${i + 1 === currentScreen ? stageInfo.color : 'var(--border-color)'};
              transition: all 0.2s;
            "></div>
          `).join('')}
        </div>
        <div class="bottom-nav-right">
          ${currentScreen < totalScreens ? `
            <button class="btn btn-primary" id="nextBtn" style="background: ${stageInfo.color};">
              下一步
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          ` : `
            <button class="btn btn-primary" id="completeBtn" style="background: ${stageInfo.color};">
              完成
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          `}
        </div>
      </div>

      <!-- Task Completion Capsule -->
      <div class="task-completion-capsule" id="taskCompletionCapsule">
        <span class="task-completion-capsule-icon">🎉</span>
        <div class="task-completion-capsule-body">
          <div class="task-completion-capsule-title" id="capsuleTitle">已保存！</div>
          <div class="task-completion-capsule-desc" id="capsuleDesc">内容已保存</div>
          <div class="task-completion-capsule-footer">
            <button class="task-completion-capsule-btn" id="capsuleNextBtn">
              下一个任务 →
            </button>
          </div>
        </div>
      </div>

      <!-- AI Assistant FAB -->
      <!-- Project Info Capsule -->
      <button class="info-capsule" id="infoCapsule" title="查看项目信息">
        <span class="info-capsule-icon">💾</span>
      </button>

      <!-- Project Info Panel -->
      <div class="info-panel" id="infoPanel">
        <div class="info-panel-header">
          <span class="info-panel-title">📋 项目信息摘要</span>
          <button class="info-panel-close" id="infoPanelClose">✕</button>
        </div>
        <div class="info-panel-body" id="infoPanelBody">
          <div class="info-panel-empty">加载中...</div>
        </div>
      </div>

      <button class="ai-fab" id="aiFab" title="AI助手">
        <div class="ai-fab-avatar">🤖</div>
        <span class="ai-fab-label">AI助手</span>
      </button>

      ${this.getAIPanelHTML({ dark: true, prefillId: 'modulePrefillBtn' })}

      <!-- Stage Brief Modal -->
      ${this.getStageBriefTemplate(stageInfo.name.toLowerCase())}
    `;
  }

  /**
   * Stage briefing modal - shown when entering a stage
   */
  getStageBriefTemplate(stage) {
    const stageBriefs = {
      reveal: {
        icon: '🔍',
        name: 'Reveal',
        themeColor: 'var(--reveal-primary)',
        purpose: '深入挖掘用户真实需求，从表面现象中找到真正的创新机会。',
        tasks: [
          '描述创新场景与目标用户',
          '绘制用户旅程地图，标记关键发现',
          '用 FIND 四步法分析每个关键发现（事实→解释→需求→洞察）',
          '对齐商业目标与利益相关方假设',
          '生成项目简报，汇总所有洞察'
        ],
        input: '创新主题（项目名称与描述）',
        output: '项目简报（目标用户、场景、洞察、利益相关方、商业假设）',
        tip: '💡 提示：FIND 分析会自动为每个关键发现创建独立的分析标签页'
      },
      inspire: {
        icon: '💡',
        name: 'Inspire',
        themeColor: 'var(--inspire-primary)',
        purpose: '基于 Reveal 的洞察，激发多样化创意，找到突破性的解决方案。',
        tasks: [
          '将洞察转化为 HMW（How Might We）问题',
          '使用多种创意方法激发灵感（SCAMPER、六顶思考帽等）',
          '构建灵感库，收集和整理创意',
          '评估和筛选最佳创意',
          '识别创新机遇'
        ],
        input: '项目简报（来自 Reveal 阶段）',
        output: '最佳创意列表、创新机遇分析',
        tip: '💡 提示：每个 HMW 问题都可以产生多个创意，不要过早收敛'
      },
      shape: {
        icon: '🎨',
        name: 'Shape',
        themeColor: 'var(--shape-primary)',
        purpose: '将精选的创意转化为可执行的解决方案概念，定义产品功能和用户体验。',
        tasks: [
          '用四维度拷问筛选创意（可行性、期望度、存续度、顺应度）',
          '构建解决方案概念',
          '设计功能特性列表',
          '撰写用户体验故事',
          '准备向利益相关方展示的方案'
        ],
        input: '项目简报（来自 Reveal）+ 最佳创意（来自 Inspire）',
        output: '概念方案、功能特性列表、用户体验故事',
        tip: '💡 提示：用户体验故事要从用户视角描述，包含场景、动机和期望结果'
      },
      exam: {
        icon: '✅',
        name: 'Exam',
        themeColor: 'var(--exam-primary)',
        purpose: '通过结构化验证评估解决方案概念，收集反馈并决定下一步行动。',
        tasks: [
          '准备原型或概念展示材料',
          '收集潜在用户和利益相关方的反馈',
          '评估商业可行性和市场适配度',
          '分析风险与应对策略',
          '做出迭代、 pivot 或推进的决策'
        ],
        input: '概念方案 + 用户故事（来自 Shape 阶段）',
        output: '验证结果、反馈分析报告、迭代决策',
        tip: '💡 提示：尽早验证，低成本试错。不要等完美才开始验证'
      }
    };

    const brief = stageBriefs[stage];
    if (!brief) return '';

    return `
      <div class="stage-brief-overlay" id="stageBriefOverlay">
        <div class="stage-brief-modal">
          <button class="stage-brief-close" id="stageBriefClose" title="Close">✕</button>
          <div class="stage-brief-header" style="border-bottom: 3px solid ${brief.themeColor};">
            <div class="stage-brief-icon">${brief.icon}</div>
            <div>
              <h2 class="stage-brief-title">${brief.name} Stage Guide</h2>
              <p class="stage-brief-purpose">${brief.purpose}</p>
            </div>
          </div>
          <div class="stage-brief-body">
            <div class="stage-brief-section">
              <h3 class="stage-brief-section-title">📋 Tasks in this stage</h3>
              <ul class="stage-brief-tasks">
                ${brief.tasks.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
            <div class="stage-brief-io">
              <div class="stage-brief-input">
                <span class="stage-brief-io-label">📥 Input</span>
                <p>${brief.input}</p>
              </div>
              <div class="stage-brief-output">
                <span class="stage-brief-io-label">📤 Output</span>
                <p>${brief.output}</p>
              </div>
            </div>
            <div class="stage-brief-tip">${brief.tip}</div>
          </div>
          <div class="stage-brief-footer">
            <label class="stage-brief-dont-show">
              <input type="checkbox" id="dontShowBrief" />
              <span>Don't show this guide again</span>
            </label>
            <button class="btn btn-primary stage-brief-start-btn" id="startStageBtn" style="background: ${brief.themeColor};">
              Start ${brief.name}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Show stage brief modal - only on first screen of each stage
   */
  showStageBrief(stage, currentScreen) {
    const overlay = document.getElementById('stageBriefOverlay');
    if (!overlay) return;

    // Hide on non-first screens
    if (currentScreen !== 1) {
      overlay.style.display = 'none';
      // Restore fixed buttons visibility
      const capsule = document.getElementById('infoCapsule');
      const fab = document.getElementById('aiFab');
      if (capsule) capsule.style.display = '';
      if (fab) fab.style.display = '';
      return;
    }

    // Check if user dismissed this stage's brief before
    const dismissed = localStorage.getItem(`stage_brief_dismissed_${stage}`);
    if (dismissed === 'true') {
      overlay.style.display = 'none';
      // Make sure fixed buttons are visible
      const capsule = document.getElementById('infoCapsule');
      const fab = document.getElementById('aiFab');
      if (capsule) capsule.style.display = '';
      if (fab) fab.style.display = '';
      return;
    }

    // Show modal - hide fixed buttons so they don't show through the overlay
    overlay.style.display = 'flex';
    const capsule = document.getElementById('infoCapsule');
    const fab = document.getElementById('aiFab');
    if (capsule) capsule.style.display = 'none';
    if (fab) fab.style.display = 'none';

    const saveDismissalIfChecked = () => {
      const dontShow = document.getElementById('dontShowBrief');
      if (dontShow && dontShow.checked) {
        localStorage.setItem(`stage_brief_dismissed_${stage}`, 'true');
      }
    };
    const closeBrief = () => {
      saveDismissalIfChecked();
      overlay.style.display = 'none';
      if (capsule) capsule.style.display = '';
      if (fab) fab.style.display = '';
      document.removeEventListener('keydown', briefEsc);
    };
    const briefEsc = (e) => { if (e.key === 'Escape') closeBrief(); };

    // Close button (X)
    const closeBtn = document.getElementById('stageBriefClose');
    if (closeBtn) closeBtn.onclick = closeBrief;
    // Click overlay background to close
    overlay.onclick = (e) => { if (e.target === overlay) closeBrief(); };
    // ESC to close
    document.addEventListener('keydown', briefEsc);

    // Bind start button
    const startBtn = document.getElementById('startStageBtn');
    if (startBtn) {
      startBtn.onclick = () => {
        saveDismissalIfChecked();
        closeBrief();
      };
    }
  }

  getScreenContent(stage, screen, project) {
    // Screen content templates for each stage
    const screens = {
      reveal: [
        {
          title: 'R1 描述你的场景',
          subtitle: 'Describe a concrete user scenario或挑战',
          dialogue: true,
          hint: 'The more specific, the better，可以描述一个真实发生过的场景'
        },
        {
          title: 'R2 探索用户旅程',
          subtitle: '从用户视角走一遍完整流程',
          journey: true,
          hint: 'Mark the key touchpoints和可能的体验断裂点'
        },
        {
          title: 'R3 洞察用户痛点',
          subtitle: '用 FIND 框架挖掘深层需求',
          find: true,
          hint: '从 Fact → Interpret → Need → Distill 逐步推导'
        },
        {
          title: 'R4 对齐商业目标',
          subtitle: '探索利益相关方需求，生成可验证的商业假设',
          stakeholder: true,
          hint: '先探索利益相关方需求，再基于洞察生成可验证的商业假设'
        },
        {
          title: 'R5 项目简报',
          subtitle: '汇总你的创新资产',
          briefing: true,
          hint: '查看、编辑和保存你的项目简报，作为创新资产留存'
        }
      ],
      inspire: [
        {
          title: 'I1 重构用户问题',
          subtitle: '从 POV 出发，四维重构创新机遇',
          hmw: true,
          hint: '基于 Reveal 洞察，从四个维度重构 HMW 问题，勾选最多 2 个最佳 HMW'
        },
        {
          title: 'I2 寻找灵感',
          subtitle: 'NCO：New / Cool / Outsider',
          type: 'nco',
          hint: '每类 3 张共 9 张灵感卡片，收藏喜欢的、刷新或自定义添加'
        },
        {
          title: 'I3 生成创意',
          subtitle: '基于灵感，做"强制连接"',
          type: 'ideas',
          hint: '用已选 HMW + 已收藏灵感，让 AI 做交叉创新，也可手动添加'
        },
        {
          title: 'I4 筛选最佳创意',
          subtitle: '四维打分，选出最佳',
          type: 'filter',
          hint: '对创意进行可行性/用户价值/商业价值/创新程度打分，勾选最佳创意'
        },
        {
          title: 'I5 Inspire 阶段总结',
          subtitle: '确认启发成果',
          type: 'summary',
          hint: '核对 POV、最佳 HMW 与最佳创意，确认后进入 Shape'
        }
      ],
      shape: [
        {
          title: 'S1 四维拷问',
          subtitle: '从用户 / 商业 / 技术 / 生态 四个维度拷问你的创意',
          type: 'shapeFourDim',
          hint: '点击「AI 帮我生成拷问问题」，然后逐题填写你的回答'
        },
        {
          title: 'S2 最小概念方案',
          subtitle: '定义核心功能与边界（什么做，什么不做）',
          type: 'shapeMinConcept',
          hint: '基于前面所有内容，明确方案一句话定义、功能特性与边界'
        },
        {
          title: 'S3 用户体验故事板',
          subtitle: '六个场景讲完一个完整故事',
          type: 'shapeStoryboard',
          hint: '每行 3 张共 2 行；每屏一张卡片，描述用户经历的关键时刻'
        },
        {
          title: 'S4 Shape 整合确认',
          subtitle: '确认你的构建成果',
          type: 'shapeSummary',
          hint: '核对概念方案与用户故事，确认后进入 Exam'
        }
      ],
      exam: [
        {
          title: 'E1 设计测试计划',
          subtitle: '为验证做好准备',
          type: 'examTestPlan',
          hint: '明确测试目的、场景、待验证假设与用户价值'
        },
        {
          title: 'E2 测试报告',
          subtitle: '记录真实的测试发现',
          type: 'examTestReport',
          hint: '诚实记录：验证了什么、错在哪里、发现了什么'
        },
        {
          title: 'E3 四维度评价',
          subtitle: '基于测试发现，对方案做四维评估',
          type: 'examFourDimEval',
          hint: '用事实和数据支撑每个维度的评分'
        },
        {
          title: 'E4 电梯演讲 & 迭代计划',
          subtitle: '30秒讲清价值，规划下一步',
          type: 'examElevator',
          hint: '用模板或 AI 生成电梯演讲，制定 30-60-90 天迭代计划'
        },
        {
          title: 'E5 Exam 整合确认',
          subtitle: '确认你的验证成果',
          type: 'examSummary',
          hint: '核对测试产出与呈现计划，确认完成项目'
        }
      ]
    };

    const stageScreens = screens[stage] || screens.reveal;
    const screenData = stageScreens[screen - 1] || stageScreens[0];

    if (screenData.cards) {
      return `
        <div class="screen-content animate-fade-in-up">
          <h2 class="screen-title">${screenData.title}</h2>
          <p class="screen-subtitle">${screenData.subtitle}</p>

          <div class="screen-cards-area">
            <div class="screen-hint">
              <span class="hint-icon">💡</span>
              <span>${screenData.hint}</span>
            </div>

            <div class="nco-cards">
              ${this.getNCOCards(AppState.selectedCategory)}
            </div>

            <button class="btn btn-secondary" id="addCardBtn" style="width: 100%; margin-top: var(--space-md);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              添加灵感卡片
            </button>
          </div>
        </div>
      `;
    }

    // Journey cards template for Reveal Screen 2
    if (screenData.journey) {
      const projectTitle = this.escapeHtml(project?.title || project?.originalTitle || '未命名项目');
      const context = this.getProjectContext(project);
      return `
        <div class="screen-content animate-fade-in-up">
          <h2 class="screen-title">${screenData.title}</h2>
          <p class="screen-subtitle">${screenData.subtitle}</p>

          <div class="journey-context-bar">
            <div class="journey-context-item">
              <span class="journey-context-label">📌 项目</span>
              <span class="journey-context-value">${projectTitle}</span>
            </div>
            <div class="journey-context-item">
              <span class="journey-context-label">👤 目标用户</span>
              <span class="journey-context-value">${context.targetUser || '（请在上一屏填写）'}</span>
            </div>
            <div class="journey-context-item">
              <span class="journey-context-label">📍 场景</span>
              <span class="journey-context-value">${context.sceneDesc || '（请在上一屏填写）'}</span>
            </div>
          </div>

          <div class="screen-hint">
            <span class="hint-icon">💡</span>
            <span>${screenData.hint}</span>
          </div>

          <div class="journey-cards-scroll" id="journeyCardsContainer">
            ${this.getJourneyCardsHTML(5)}
          </div>

          <div class="journey-findings-summary" id="journeyFindingsSummary">
            <div class="journey-findings-summary-header">
              <span class="journey-findings-summary-title">🔑 关键发现汇总</span>
              <span class="journey-findings-count" id="keyFindingsCount">0</span>
            </div>
            <div class="journey-findings-list" id="keyFindingsList">
              <div class="journey-finding-item-empty">勾选卡片上的「关键发现」，内容将自动汇总到这里</div>
            </div>
          </div>
        </div>
      `;
    }

    // Dialogue-style template for Reveal Screen 1
    if (screenData.dialogue) {
      const projectTitle = this.escapeHtml(project?.title || project?.originalTitle || I18N.t('project.yours', '你的项目'));
      const category = project?.category || 'product';
      const categoryLabel = this.getCategoryActionLabel(category);
      return `
        <div class="screen-content animate-fade-in-up">
          <div class="reveal-dialogue">
            <div class="dialogue-context">
              <span class="dialogue-badge">${I18N.t('dialogue.badge', '项目')}</span>
              <span class="dialogue-project-title">${projectTitle}</span>
            </div>

            <div class="dialogue-question">
              <h2 class="screen-title">${I18N.t('r1.dialogue', 'R1 你期望「{category}」，但你能告诉我...').replace('{category}', categoryLabel)}</h2>
              <p class="screen-subtitle">${I18N.t('r1.questionSub', '目标用户是谁？他在什么场景下使用呢？')}</p>
            </div>

            <div class="screen-hint">
              <span class="hint-icon">💡</span>
              <span>${screenData.hint}</span>
            </div>

            <div class="input-wrapper dialogue-input-wrapper">
              <label class="input-label">${I18N.t('r1.targetUserLabel', '👤 目标用户是谁？')}</label>
              <input type="text" class="input" id="targetUserInput" placeholder="${I18N.t('r1.targetUserPh', '例如：25-35岁的上班族、大学生、新手妈妈...')}" />
              <button class="ai-prefill-btn" id="aiPrefillTargetUser" data-field="targetUser">
                <span>${I18N.t('ai.quick.prefill', '🧩 智能预填(local)')}</span>
              </button>
            </div>

            <div class="input-wrapper dialogue-input-wrapper" style="margin-top: var(--space-lg);">
              <label class="input-label">${I18N.t('r1.sceneLabel', '📍 在什么场景下使用？')}</label>
              <textarea class="input textarea" id="sceneDescInput" placeholder="${I18N.t('r1.scenePh', '例如：在通勤路上，用户经常因为忘记带水杯而口渴...')}" rows="3"></textarea>
              <button class="ai-prefill-btn" id="aiPrefillSceneDesc" data-field="sceneDesc">
                <span>${I18N.t('ai.quick.prefill', '🧩 智能预填(local)')}</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    // FIND 四步法模板 for Reveal Screen 3
    if (screenData.find) {
      return this.getFindTemplate(project);
    }

    // 利益相关方 + 商业假设模板 for Reveal Screen 4
    if (screenData.stakeholder) {
      return this.getStakeholderTemplate(project);
    }

    // 项目简报模板 for Reveal Screen 5
    if (screenData.briefing) {
      return this.getProjectBriefingTemplate(project);
    }

    // HMW 四维重构模板 for Inspire Screen 1
    if (screenData.hmw) {
      return this.getHmwTemplate(project);
    }

    // NCO 灵感卡片模板 for Inspire Screen 2
    if (screenData.type === 'nco') {
      return this.getInspireNcoTemplate(project);
    }

    // 创意生成模板 for Inspire Screen 3
    if (screenData.type === 'ideas') {
      return this.getInspireIdeasTemplate(project);
    }

    // 四维筛选模板 for Inspire Screen 4
    if (screenData.type === 'filter') {
      return this.getInspireFilterTemplate(project);
    }

    // 阶段总结模板 for Inspire Screen 5
    if (screenData.type === 'summary') {
      return this.getInspireSummaryTemplate(project);
    }

    // Shape 四屏
    if (screenData.type === 'shapeFourDim') return this.getShapeFourDimTemplate(project);
    if (screenData.type === 'shapeMinConcept') return this.getShapeMinConceptTemplate(project);
    if (screenData.type === 'shapeStoryboard') return this.getShapeStoryboardTemplate(project);
    if (screenData.type === 'shapeSummary') return this.getShapeSummaryTemplate(project);

    // Exam 五屏
    if (screenData.type === 'examFourDimEval') return this.getExamFourDimEvalTemplate(project);
    if (screenData.type === 'examTestPlan') return this.getExamTestPlanTemplate(project);
    if (screenData.type === 'examTestReport') return this.getExamTestReportTemplate(project);
    if (screenData.type === 'examElevator') return this.getExamElevatorTemplate(project);
    if (screenData.type === 'examSummary') return this.getExamSummaryTemplate(project);

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">${screenData.title}</h2>
        <p class="screen-subtitle">${screenData.subtitle}</p>

        <div class="screen-form">
          <div class="screen-hint">
            <span class="hint-icon">💡</span>
            <span>${screenData.hint}</span>
          </div>

          <div class="input-wrapper">
            <label class="input-label">${screenData.inputLabel}</label>
            <textarea
              class="input textarea"
              id="screenInput"
              placeholder="${screenData.inputPlaceholder}"
              rows="4"
            ></textarea>
          </div>

          ${screenData.inputLabel2 ? `
          <div class="input-wrapper" style="margin-top: var(--space-md);">
            <label class="input-label">${screenData.inputLabel2}</label>
            <textarea
              class="input textarea"
              id="screenInput2"
              placeholder="${screenData.inputPlaceholder2}"
              rows="3"
            ></textarea>
          </div>
          ` : ''}

          <button class="btn btn-secondary" id="aiPrefillBtn" style="margin-top: var(--space-md);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            AI 帮我预填
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate FIND 四步法 HTML template
   * F(事实) → I(解释) → N(需求) → D(凝练)
   */
  getFindTemplate(project) {
    // Get all key findings from T2 journey cards
    let keyFindings = [];
    if (project?.cards?.journey) {
      try {
        let journeyRaw = project.cards.journey;
        if (typeof journeyRaw === 'object' && journeyRaw !== null && journeyRaw.content) {
          journeyRaw = journeyRaw.content;
        }
        const journeyData = typeof journeyRaw === 'string'
          ? JSON.parse(journeyRaw)
          : journeyRaw;
        const allWithDiscovery = (journeyData || []).filter(card => card.discovery && card.discovery.trim());
        // 优先只取勾选了「关键发现」的卡片；若一个都没勾选，则兼容旧数据取全部有发现内容的卡片
        const checked = allWithDiscovery.filter(card => card.isKeyFinding === true);
        keyFindings = checked.length > 0 ? checked : allWithDiscovery;
      } catch (e) {
        console.warn('Failed to parse journey data:', e);
        keyFindings = [];
      }
    }

    // Load saved FIND data — support both old format (flat) and new format (findings array)
    let findings = [];
    let activeFindingIndex = 0;
    if (project?.cards?.findInsight) {
      try {
        let findRaw = project.cards.findInsight;
        if (typeof findRaw === 'object' && findRaw !== null && findRaw.content) {
          findRaw = findRaw.content;
        }
        const saved = typeof findRaw === 'string' ? JSON.parse(findRaw) : findRaw;

        if (Array.isArray(saved.findings)) {
          // New format: multiple findings
          findings = saved.findings;
          activeFindingIndex = saved.activeFindingIndex || 0;
        } else if (saved.fact !== undefined) {
          // Old format: migrate to new format
          findings = [{
            sourceFinding: '',
            fact: saved.fact || '',
            interpret: saved.interpret || '',
            need: saved.need || '',
            distill: saved.distill || '',
            completedSteps: saved.completedSteps || [],
            factOutput: saved.factOutput || '',
            interpretOutput: saved.interpretOutput || '',
            needOutput: saved.needOutput || '',
            distillOutput: saved.distillOutput || ''
          }];
          activeFindingIndex = 0;
        }
      } catch (e) {
        findings = [];
      }
    }

    // 🔄 严格同步：R3 的关键发现必须完全来自上一屏（R2 用户旅程地图）的关键发现产出。
    // 1) 以当前 R2 的关键发现为唯一来源重建 findings 列表
    // 2) 已填写的内容按 sourceFinding/fact 匹配后完整保留
    // 3) 不在 R2 中的旧/示例数据会被清理，避免多出莫名其妙的标签页
    let findingsChanged = false;
    const oldFindings = findings.slice();
    const newFindings = [];
    keyFindings.forEach(kf => {
      const src = (kf.discovery || '').trim();
      if (!src) return;
      const existing = oldFindings.find(f =>
        (f.sourceFinding || '').trim() === src || (f.fact || '').trim() === src
      );
      if (existing) {
        newFindings.push({
          ...existing,
          sourceFinding: src,
          fact: (existing.fact || '').trim() ? existing.fact : src
        });
      } else {
        newFindings.push({
          sourceFinding: src,
          fact: src,
          interpret: '',
          need: '',
          distill: '',
          completedSteps: [],
          factOutput: '',
          interpretOutput: '',
          needOutput: '',
          distillOutput: ''
        });
      }
    });

    if (newFindings.length !== oldFindings.length) {
      findingsChanged = true;
    } else {
      for (let i = 0; i < newFindings.length; i++) {
        if ((newFindings[i].sourceFinding || '').trim() !== (oldFindings[i].sourceFinding || '').trim()) {
          findingsChanged = true;
          break;
        }
      }
    }
    findings = newFindings;

    // 如果当前激活的标签页已被清理，回到第一个
    const stillActive = findings[activeFindingIndex];
    if (!stillActive && findings.length > 0) {
      activeFindingIndex = 0;
      findingsChanged = true;
    }

    // 🔴 持久化：同步后的 findings 立即写入 storage
    // 否则 saveFindData() 会因 findings 为空而提前 return，导致 AI 结果永远无法保存
    if (findingsChanged) {
      try {
        const initJson = JSON.stringify({ findings, activeFindingIndex });
        this.saveScreenContent('reveal', 3, initJson);
        this.autoSaveScreenContent('reveal', 3, initJson);
        console.log(`[FIND] ✅ 已严格同步 ${findings.length} 个关键发现（仅来自 R2 用户旅程）`);
      } catch (e) {
        console.warn('[FIND] ⚠️ findings 同步持久化失败:', e);
      }
    }

    // Ensure activeFindingIndex is valid
    if (activeFindingIndex >= findings.length) activeFindingIndex = 0;

    // The active finding to render FIND steps for
    const activeFinding = findings[activeFindingIndex] || null;
    const completedSteps = activeFinding?.completedSteps || [];

    const steps = [
      {
        key: 'fact',
        icon: '🔍',
        title: I18N.t('find.fact.title', 'F（事实）'),
        desc: I18N.t('find.fact.desc', 'FIND 逻辑链条的起点\n\n事实(Fact) = 从用户旅程中观察到的、可验证的具体现象。\n\n⚠️ 注意：请从上方标签页选择一个"关键发现"，将其作为你分析的事实基础。\n\n接下来 AI 会基于这个事实追问：为什么会这样？'),
        label: I18N.t('find.fact.label', '描述你从用户旅程中发现的关键事实：'),
        placeholder: I18N.t('find.fact.placeholder', '例如：用户在寻找停车场时，花了15分钟才找到车位，期间查看了3个App...'),
        outputLabel: I18N.t('find.fact.outputLabel', 'AI 解释建议 →'),
        btnText: I18N.t('find.fact.btnText', '确认事实，生成解释(I) →')
      },
      {
        key: 'interpret',
        icon: '💡',
        title: I18N.t('find.interpret.title', 'I（解释）'),
        desc: I18N.t('find.interpret.desc', 'Why：这个事实为什么会发生？\n\n解释(Interpretation) = 基于事实挖掘背后的系统性/结构性原因。\n\n📎 要点：不要归因于"用户操作不当"，要问"为什么系统让用户容易出错？"\n\n接下来 AI 会基于事实+解释追问：用户真正需要什么？'),
        label: I18N.t('find.interpret.label', '结合上方AI解释，补充你认为的根本原因：'),
        placeholder: I18N.t('find.interpret.placeholder', '例如：因为现有的停车App信息更新不及时，且缺乏实时预测能力...'),
        outputLabel: I18N.t('find.interpret.outputLabel', 'AI 需求建议 →'),
        btnText: I18N.t('find.interpret.btnText', '确认解释，生成需求(N) →')
      },
      {
        key: 'need',
        icon: '❤️',
        title: I18N.t('find.need.title', 'N（需求）'),
        desc: I18N.t('find.need.desc', 'Why：用户潜意识里真正需要的是什么？\n\n需求(Need) = 从事实+解释推导出的核心痛点/渴望，不是用户说想要什么。\n\n📎 要点：区分"想要"(stated want)和"需要"(latent need)\n\n最后一步：凝练为一句洞察(POV)'),
        label: I18N.t('find.need.label', '基于事实+解释，提炼用户的真正需求：'),
        placeholder: I18N.t('find.need.placeholder', '例如：用户需要的不是一个更好的停车App，而是"停车时的确定感和掌控感"...'),
        outputLabel: I18N.t('find.need.outputLabel', 'AI 洞察建议(POV) →'),
        btnText: I18N.t('find.need.btnText', '确认需求，生成洞察(D) →')
      },
      {
        key: 'distill',
        icon: '✨',
        title: I18N.t('find.distill.title', 'D（凝练为洞察/POV）'),
        desc: I18N.t('find.distill.desc', 'So What：这意味着什么创新机会？\n\n将 Fact + Interpret + Need 凝练为一句话 POV 陈述。\n\n格式：「目标用户」+「核心需求」，因为「根本原因」。\n\n这就是你的创新北极星！'),
        label: I18N.t('find.distill.label', '整合 F-I-N 三步，写出一句话洞察(POV)：'),
        placeholder: I18N.t('find.distill.placeholder', '例如：「25-35岁上班族」需要「在3分钟内找到确定可用的停车位」，因为「信息碎片化导致决策焦虑」...'),
        outputLabel: I18N.t('find.distill.outputLabel', ''),
        btnText: I18N.t('find.distill.btnText', '✅ 确认并保存 FIND 洞察')
      }
    ];

    const allCompleted = findings.length > 0 && findings.every(f => (f.completedSteps || []).length === 4);

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">${I18N.t('r3.title', 'R3 洞察用户痛点')}</h2>
        <p class="screen-subtitle">${I18N.t('r3.sub', '用 FIND 框架从关键发现中挖掘深层需求')}</p>

        <div class="screen-hint">
          <span class="hint-icon">💡</span>
          <span>${I18N.t('r3.findHint', '每个关键发现对应一套独立的 FIND 四步法，点击上方标签页切换')}</span>
        </div>

        <!-- Key Findings Tabs -->
        ${findings.length > 0 ? `
        <div class="find-tabs" id="findTabs">
          <div class="find-tabs-header">
            <span class="find-tabs-title">${I18N.t('r3.keyFindingsTitle', '🔍 关键发现（{n}）').replace('{n}', findings.length)}</span>
          </div>
          <div class="find-tabs-list" id="findTabsList">
            ${findings.map((f, i) => {
              const isCompleted = (f.completedSteps || []).length === 4;
              const stepCount = (f.completedSteps || []).length;
              const tabTextRaw = (f.sourceFinding || f.fact || f.need || f.distill || I18N.t('find.tabFallback', '发现') + (i + 1)).trim();
              const tabText = this.escapeHtml(tabTextRaw.substring(0, 30));
              const showEllipsis = tabTextRaw.length > 30 ? '...' : '';
              return `
                <div class="find-tab ${i === activeFindingIndex ? 'active' : ''} ${isCompleted ? 'completed' : ''}"
                     data-index="${i}" id="findTab_${i}">
                  <span class="find-tab-badge">${isCompleted ? '✓' : (stepCount || '〇')}</span>
                  <span class="find-tab-text">${tabText}${showEllipsis}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : `
        <div class="find-empty">
          <p>${I18N.t('find.empty', '暂无关键发现。请先在「用户旅程地图」中勾选关键发现，或直接在此输入 Fact 事实。')}</p>
        </div>
        `}

        <!-- FIND Steps for Active Finding -->
        ${activeFinding ? `
        <div class="find-container" id="findContainer" data-active-index="${activeFindingIndex}">
          ${steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key);
            const isActive = index === 0 || completedSteps.includes(steps[index - 1]?.key);
            const isLocked = !isActive;
            let outputValue = activeFinding[step.key + 'Output'] || '';
            const inputValue = activeFinding[step.key] || '';

            // Clean up old data that may include label text
            if (outputValue) {
              const labelPatterns = ['AI 解释建议', 'AI 需求建议', 'AI 洞察建议'];
              for (const p of labelPatterns) {
                if (outputValue.startsWith(p)) {
                  outputValue = outputValue.slice(p.length).trim();
                  break;
                }
              }
            }

            return `
              <div class="find-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''}"
                   data-step="${step.key}" data-index="${index}">
                <div class="find-step-header">
                  <span class="find-step-title">
                    <span class="find-step-icon">${step.icon}</span>
                    ${step.title}
                  </span>
                  ${isCompleted ? '<span class="find-step-status">' + I18N.t('find.confirmed', '✓ 已确认') + '</span>' : ''}
                </div>

                <div class="find-step-body">
                  <div class="find-step-desc">
                    <div class="find-step-desc-title">${step.key === 'fact' ? I18N.t('find.fact.descTitle', '🚀 FIND 逻辑链条起点') : step.key === 'interpret' ? I18N.t('find.interpret.descTitle', 'Why：这个现象为什么会发生？') : step.key === 'need' ? I18N.t('find.need.descTitle', 'Need：用户潜意识里真正需要的是什么？') : I18N.t('find.distill.descTitle', 'Distill：整合为一句结构化的 POV')}</div>
                    ${step.desc.replace(/\n/g, '<br>')}
                  </div>

                  <div class="find-step-input-wrapper">
                    <label class="find-step-input-label">${step.label}</label>
                    <textarea
                      class="find-step-input"
                      id="findInput_${step.key}"
                      data-step="${step.key}"
                      placeholder="${step.placeholder}"
                      rows="3"
                    >${this.escapeHtml(inputValue)}</textarea>
                  </div>

                  ${outputValue ? `
                    <div class="find-step-output" id="findOutput_${step.key}">
                      <div class="find-step-output-label">${step.outputLabel}</div>
                      ${this.escapeHtml(outputValue)}
                    </div>
                  ` : ''}

                  <button class="find-step-btn" id="findBtn_${step.key}" data-step="${step.key}" ${isCompleted ? 'disabled' : ''}>
                    ${isCompleted ? I18N.t('find.confirmed', '✓ 已确认') : step.btnText}
                  </button>
                </div>

                ${isCompleted ? `
                  <div class="find-step-summary">${this.escapeHtml(inputValue)}</div>
                ` : ''}
              </div>
            `;
          }).join('')}

          <div class="find-complete-banner ${allCompleted ? 'show' : ''}" id="findCompleteBanner">
            ${I18N.t('find.complete', '🎉 当前关键发现的 FIND 分析完成')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate Stakeholder + Business Hypothesis HTML template
   * Part 1: 利益相关方需求探索
   * Part 2: 商业假设生成
   */
  getStakeholderTemplate(project) {
    // Load saved data
    let stakeholderData = {};
    let hypothesisData = {};
    if (project?.cards?.businessGoal) {
      try {
        let bgRaw = project.cards.businessGoal;
        if (typeof bgRaw === 'object' && bgRaw !== null && bgRaw.content) {
          bgRaw = bgRaw.content;
        }
        const saved = typeof bgRaw === 'string'
          ? JSON.parse(bgRaw)
          : bgRaw;
        stakeholderData = saved.stakeholders || {};
        hypothesisData = saved.hypothesis || {};
      } catch (e) {
        stakeholderData = {};
        hypothesisData = {};
      }
    }

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">R4 · Align Business Goals</h2>
        <p class="screen-subtitle">Explore stakeholder needs and generate testable business hypotheses</p>

        <div class="screen-hint">
          <span class="hint-icon">💡</span>
          <span>Explore stakeholder needs first, then generate testable business hypotheses from your insights</span>
        </div>

        <!-- Part 1: Stakeholder needs exploration -->
        <div class="stakeholder-section" id="stakeholderSection">
          <div class="stakeholder-header">
            <h3 class="stakeholder-title">🤝 Stakeholder Needs Exploration</h3>
            <p class="stakeholder-desc">AI will identify key stakeholders based on your project theme, target users, and scenario, helping you map each party's needs and potential conflicts.</p>
          </div>

          <button class="btn btn-secondary" id="generateStakeholdersBtn" style="margin-bottom: var(--space-lg);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            ⚡ AI Identify Stakeholders
          </button>

          <div class="stakeholder-cards" id="stakeholderCards">
            ${this.getStakeholderCardsHTML(stakeholderData)}
          </div>

          <div class="stakeholder-consensus" id="stakeholderConsensus" style="display: ${stakeholderData.consensus ? 'block' : 'none'};">
            <div class="consensus-label">🤝 AI Consensus Suggestion</div>
            <div class="consensus-content" id="consensusContent">${stakeholderData.consensus || ''}</div>
          </div>

          <button class="btn btn-primary" id="generateConsensusBtn" style="margin-top: var(--space-md); display: ${stakeholderData.stakeholders?.length > 1 ? 'inline-flex' : 'none'};">
            🤝 Reach Consensus
          </button>
        </div>

        <!-- Part 2: Business hypotheses -->
        <div class="hypothesis-section" id="hypothesisSection" style="margin-top: var(--space-2xl);">
          <div class="hypothesis-header">
            <h3 class="hypothesis-title">💡 Business Hypotheses</h3>
            <p class="hypothesis-desc">Based on your FIND insights and stakeholder needs, AI will generate testable business hypotheses. Format: If [solution], then [target user] will [action], because [insight].</p>
          </div>

          <button class="btn btn-secondary" id="generateHypothesisBtn" style="margin-bottom: var(--space-lg);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            ⚡ AI Generate Business Hypotheses
          </button>

          <div class="hypothesis-cards" id="hypothesisCards">
            ${this.getHypothesisCardsHTML(hypothesisData)}
          </div>

          <div class="hypothesis-confirmed" id="hypothesisConfirmed" style="display: ${hypothesisData.confirmed ? 'flex' : 'none'};">
            <span>✅</span>
            <span>Business hypotheses confirmed — you can proceed to the next stage</span>
          </div>

          <button class="btn btn-primary" id="confirmHypothesisBtn" style="margin-top: var(--space-md); display: ${hypothesisData.hypotheses?.length > 0 ? 'inline-flex' : 'none'};">
            ✅ Confirm & Submit
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Generate stakeholder cards HTML (12-point scoring system)
   */
  getStakeholderCardsHTML(data) {
    const stakeholders = data.stakeholders || [];
    if (stakeholders.length === 0) {
      return '<div class="stakeholder-empty">Click the "AI Identify Stakeholders" button to let AI analyze for you</div>';
    }
    return stakeholders.map((s, i) => {
      const totalScore = (s.needs || []).reduce((sum, n) => sum + (parseInt(n.score) || 0), 0);
      const needs = s.needs || [
        { label: 'Need 1', score: 3 },
        { label: 'Need 2', score: 3 },
        { label: 'Need 3', score: 3 },
        { label: 'Need 4', score: 3 }
      ];
      return `
      <div class="stakeholder-card" data-index="${i}">
        <div class="stakeholder-card-header">
          <span class="stakeholder-card-icon">${s.icon || '👤'}</span>
          <input class="stakeholder-card-name" value="${this.escapeHtml(s.name || '')}" placeholder="Stakeholder name" data-field="name" />
          <span class="stakeholder-score-badge ${totalScore === 12 ? 'complete' : 'incomplete'}">${totalScore}/12</span>
        </div>
        <div class="stakeholder-card-body">
          ${needs.map((need, ni) => `
            <div class="stakeholder-need-row" data-need-index="${ni}">
              <div class="stakeholder-need-label-wrapper">
                <span class="stakeholder-need-index">Need ${ni + 1}</span>
                <input class="stakeholder-need-label" value="${this.escapeHtml(need.label || '')}" placeholder="Need description..." data-field="need-label" data-need="${ni}" />
              </div>
              <div class="stakeholder-score-control">
                <span class="stakeholder-score-label">Score</span>
                <button class="stakeholder-score-btn minus" data-action="minus" data-stakeholder="${i}" data-need="${ni}">−</button>
                <input class="stakeholder-score-input" type="number" value="${need.score || 3}" min="0" max="12" data-field="need-score" data-stakeholder="${i}" data-need="${ni}" readonly />
                <button class="stakeholder-score-btn plus" data-action="plus" data-stakeholder="${i}" data-need="${ni}">+</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `}).join('');
  }

  /**
   * Generate hypothesis cards HTML (Market hypothesis format: TAM/SAM/SOM/Competitors/Alignment/Notes)
   */
  getHypothesisCardsHTML(data) {
    const h = data || {};
    const hasContent = h.tam || h.sam || h.som || h.competitors || h.alignment;
    if (!hasContent) {
      return '<div class="hypothesis-empty">Click the "AI Generate Business Hypotheses" button to let AI generate for you</div>';
    }
    return `
      <div class="market-hypothesis-grid">
        <div class="market-hypothesis-card">
          <div class="market-hypothesis-header">
            <span class="market-hypothesis-icon">🌍</span>
            <span class="market-hypothesis-title">TAM · Total Addressable Market</span>
          </div>
          <p class="market-hypothesis-desc">Globally or nationwide, how large is the total pool of potential users or enterprises for this problem? (headcount, company count, revenue estimate)</p>
          <textarea class="market-hypothesis-input" id="hypothesisTAM" placeholder="e.g. 2 million people buy cars in the country each year" rows="3">${this.escapeHtml(h.tam || '')}</textarea>
        </div>
        <div class="market-hypothesis-card">
          <div class="market-hypothesis-header">
            <span class="market-hypothesis-icon">🎯</span>
            <span class="market-hypothesis-title">SAM · Serviceable Addressable Market</span>
          </div>
          <p class="market-hypothesis-desc">How large is the segment we can actually serve? (consider region, industry, scale filters)</p>
          <textarea class="market-hypothesis-input" id="hypothesisSAM" placeholder="e.g. city buyers of premium SUVs above $30k, roughly 200k people" rows="3">${this.escapeHtml(h.sam || '')}</textarea>
        </div>
        <div class="market-hypothesis-card">
          <div class="market-hypothesis-header">
            <span class="market-hypothesis-icon">💡</span>
            <span class="market-hypothesis-title">SOM · Serviceable Obtainable Market</span>
          </div>
          <p class="market-hypothesis-desc">In Phase 1 (1-2 years), what share can we realistically capture? What assumptions is this based on?</p>
          <textarea class="market-hypothesis-input" id="hypothesisSOM" placeholder="e.g. aligned with SAM, capture >30% share" rows="3">${this.escapeHtml(h.som || '')}</textarea>
        </div>
        <div class="market-hypothesis-card">
          <div class="market-hypothesis-header">
            <span class="market-hypothesis-icon">🔍</span>
            <span class="market-hypothesis-title">Competitors / Existing Solutions</span>
          </div>
          <p class="market-hypothesis-desc">How do users currently solve this problem? Who are the main competitors? What are their strengths and weaknesses?</p>
          <textarea class="market-hypothesis-input" id="hypothesisCompetitors" placeholder="e.g. existing products mostly assist driving with high risk and cost" rows="3">${this.escapeHtml(h.competitors || '')}</textarea>
        </div>
      </div>
      <div class="market-hypothesis-card full-width" style="margin-top: var(--space-md);">
        <div class="market-hypothesis-header">
          <span class="market-hypothesis-icon">🏢</span>
          <span class="market-hypothesis-title">Strategic Alignment</span>
        </div>
        <p class="market-hypothesis-desc">Does this direction align with our team/organization's strategic goals? Is there internal support? What resistance might appear?</p>
        <textarea class="market-hypothesis-input" id="hypothesisAlignment" placeholder="e.g. fully aligned with the company's intelligence and user-centric strategy" rows="3">${this.escapeHtml(h.alignment || '')}</textarea>
      </div>
      <div class="market-hypothesis-card full-width" style="margin-top: var(--space-md);">
        <div class="market-hypothesis-header">
          <span class="market-hypothesis-icon">📝</span>
          <span class="market-hypothesis-title">Market Notes (optional)</span>
        </div>
        <textarea class="market-hypothesis-input" id="hypothesisNotes" placeholder="Additional information..." rows="2">${this.escapeHtml(h.notes || '')}</textarea>
      </div>
    `;
  }

  /**
   * Generate Project Briefing HTML template (Reveal Screen 5)
   * 一页纸项目简报 - 汇总所有创新资产
   */
  getProjectBriefingTemplate(project) {
    // Load data from T1-T4
    let sceneData = {};
    let journeyData = [];
    let findData = {};
    let businessGoalData = {};

    // T1: 场景描述 — support { content, timestamp } wrapper
    if (project?.cards?.scene) {
      try {
        let raw = project.cards.scene;
        // Unwrap { content, timestamp }
        if (typeof raw === 'object' && raw !== null && raw.content) {
          raw = raw.content;
        }
        if (typeof raw === 'string') {
          // Try JSON first, fallback to combined text format
          try {
            sceneData = JSON.parse(raw);
          } catch (jsonErr) {
            // Not JSON — treat as combined text format: 【目标用户】xxx\n【场景描述】yyy
            sceneData = { combined: raw };
          }
        } else {
          sceneData = raw || {};
        }
      } catch (e) {
        // Fallback: parse combined format from draft
        const draftKey = `eureka_draft_${project.id}_reveal_1`;
        const draft = localStorage.getItem(draftKey);
        if (draft) {
          const draftData = JSON.parse(draft);
          sceneData = { combined: draftData.content };
        }
      }
    }

    // T2: 用户旅程
    if (project?.cards?.journey) {
      try {
        let journeyRaw = project.cards.journey;
        if (typeof journeyRaw === 'object' && journeyRaw !== null && journeyRaw.content) {
          journeyRaw = journeyRaw.content;
        }
        journeyData = typeof journeyRaw === 'string'
          ? JSON.parse(journeyRaw)
          : journeyRaw;
      } catch (e) {
        journeyData = [];
      }
    }

    // T3: FIND 洞察 — support both old and new format
    // New format: { findings: [{ sourceFinding, fact, interpret, need, distill }] }
    // Old format: { fact, interpret, need, distill }
    let allDistills = [];
    if (project?.cards?.findInsight) {
      try {
        let findRaw = project.cards.findInsight;
        if (typeof findRaw === 'object' && findRaw !== null && findRaw.content) {
          findRaw = findRaw.content;
        }
        const findData = typeof findRaw === 'string' ? JSON.parse(findRaw) : findRaw;
        if (Array.isArray(findData.findings)) {
          // New format: collect all completed findings' distill
          findData.findings.forEach(f => {
            if (f.distill && f.distill.trim()) {
              allDistills.push({
                source: f.sourceFinding || '',
                distill: f.distill
              });
            }
          });
        } else if (findData.distill) {
          // Old format
          allDistills.push({ source: '', distill: findData.distill });
        }
      } catch (e) {
        allDistills = [];
      }
    }

    // T4: 商业目标
    if (project?.cards?.businessGoal) {
      try {
        let bgRaw = project.cards.businessGoal;
        if (typeof bgRaw === 'object' && bgRaw !== null && bgRaw.content) {
          bgRaw = bgRaw.content;
        }
        businessGoalData = typeof bgRaw === 'string'
          ? JSON.parse(bgRaw)
          : bgRaw;
      } catch (e) {
        businessGoalData = {};
      }
    }

    // Parse T1 combined format
    let targetUser = '';
    let sceneDesc = '';
    if (sceneData.combined) {
      const targetMatch = sceneData.combined.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
      const sceneMatch = sceneData.combined.match(/【场景描述】(.+?)$/s);
      if (targetMatch) targetUser = targetMatch[1].trim();
      if (sceneMatch) sceneDesc = sceneMatch[1].trim();
    }

    // Get key findings from journey
    const keyFindings = journeyData.filter(card => card.discovery && card.discovery.trim());

    // Get stakeholders (new 12-point format)
    const stakeholders = businessGoalData.stakeholders?.stakeholders || businessGoalData.stakeholders || [];

    // Get hypothesis (new market format)
    const hypothesis = businessGoalData.hypothesis || {};

    return `
      <div class="screen-content animate-fade-in-up">
        <div class="briefing-header">
          <h2 class="screen-title">R5 📋 项目简报</h2>
          <p class="screen-subtitle">创新资产汇总 - 可查看、编辑和保存</p>
          <button class="btn btn-primary" id="saveBriefingBtn" style="margin-top: var(--space-md);">
            💾 保存简报
          </button>
        </div>

        <div class="briefing-cards" id="briefingContainer">
          <!-- Card 1: 项目背景与用户洞察 -->
          <div class="briefing-card card-reveal">
            <div class="briefing-card-header">
              <span class="briefing-card-icon">🎯</span>
              <h3 class="briefing-card-title">项目背景与用户洞察</h3>
            </div>
            <div class="briefing-card-body">
              <div class="briefing-field-compact">
                <label class="briefing-field-label">👤 目标用户</label>
                <textarea id="briefingTargetUser" rows="2" placeholder="目标用户描述...">${this.escapeHtml(targetUser)}</textarea>
              </div>
              <div class="briefing-field-compact">
                <label class="briefing-field-label">📍 场景挑战</label>
                <textarea id="briefingScene" rows="2" placeholder="场景描述...">${this.escapeHtml(sceneDesc)}</textarea>
              </div>
              ${keyFindings.length > 0 ? `
              <div class="briefing-field-compact">
                <label class="briefing-field-label">💡 关键发现 (${keyFindings.length}) — 可直接编辑</label>
                <div class="briefing-mini-list">
                  ${keyFindings.map((f, i) => `
                    <div class="briefing-mini-item" style="border-left-color: var(--reveal-primary);">
                      <span class="briefing-mini-stage">${f.stage || '阶段' + (i + 1)}</span>
                      <textarea class="briefing-mini-textarea" id="briefingFinding_${i}" rows="2">${this.escapeHtml(f.discovery || '')}</textarea>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
              ${allDistills.length > 0 ? `
              <div class="briefing-field-compact">
                <label class="briefing-field-label">🔍 FIND 洞察 (${allDistills.length}) — 可直接编辑</label>
                <div class="briefing-mini-list">
                  ${allDistills.map((d, i) => `
                    <div class="briefing-mini-item" style="border-left-color: var(--inspire-primary);">
                      ${d.source ? `<span class="briefing-mini-stage">${this.escapeHtml(d.source.substring(0, 20))}${d.source.length > 20 ? '...' : ''}</span>` : ''}
                      <textarea class="briefing-mini-textarea" id="briefingDistill_${i}" rows="2">${this.escapeHtml(d.distill || '')}</textarea>
                    </div>
                  `).join('')}
                </div>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Card 2: 利益相关方与共识 -->
          <div class="briefing-card card-inspire">
            <div class="briefing-card-header">
              <span class="briefing-card-icon">🤝</span>
              <h3 class="briefing-card-title">利益相关方与共识</h3>
            </div>
            <div class="briefing-card-body">
              ${stakeholders.length > 0 ? stakeholders.map((s, i) => {
                const needs = s.needs || [];
                const totalScore = needs.reduce((sum, n) => sum + (parseInt(n.score) || 0), 0);
                return `
                <div class="briefing-stakeholder-compact">
                  <span class="briefing-stakeholder-icon">${s.icon || '👤'}</span>
                  <div class="briefing-stakeholder-info">
                    <div class="briefing-stakeholder-name">${this.escapeHtml(s.name || '')} <span class="briefing-stakeholder-score">(${totalScore}/12)</span></div>
                    <div class="briefing-stakeholder-needs">
                      ${needs.map(n => `<span class="briefing-need-tag">${this.escapeHtml(n.label || '')} ${n.score || 0}分</span>`).join('')}
                    </div>
                  </div>
                </div>
                `;
              }).join('') : '<div class="briefing-empty">暂无利益相关方</div>'}
              <div class="briefing-field-compact" style="margin-top: var(--space-sm);">
                <label class="briefing-field-label">🤝 团队愿景共识</label>
                <textarea id="briefingConsensus" rows="3" placeholder="团队达成的共识...">${this.escapeHtml(businessGoalData.consensus || '')}</textarea>
              </div>
            </div>
          </div>

          <!-- Card 3: 商业与市场假设 -->
          <div class="briefing-card card-shape">
            <div class="briefing-card-header">
              <span class="briefing-card-icon">💡</span>
              <h3 class="briefing-card-title">商业与市场假设</h3>
            </div>
            <div class="briefing-card-body">
              ${hypothesis.tam || hypothesis.sam ? `
              <div class="briefing-market-grid">
                <div class="briefing-market-cell"><strong>TAM</strong><textarea id="briefingTAM" rows="2" placeholder="TAM...">${this.escapeHtml(hypothesis.tam || '')}</textarea></div>
                <div class="briefing-market-cell"><strong>SAM</strong><textarea id="briefingSAM" rows="2" placeholder="SAM...">${this.escapeHtml(hypothesis.sam || '')}</textarea></div>
                <div class="briefing-market-cell"><strong>SOM</strong><textarea id="briefingSOM" rows="2" placeholder="SOM...">${this.escapeHtml(hypothesis.som || '')}</textarea></div>
                <div class="briefing-market-cell"><strong>Competitors</strong><textarea id="briefingCompetitors" rows="2" placeholder="Competitor analysis...">${this.escapeHtml(hypothesis.competitors || '')}</textarea></div>
              </div>
              <div class="briefing-market-cell full" style="margin-top: var(--space-sm);">
                <strong>Strategic Alignment</strong>
                <textarea id="briefingAlignment" rows="2" placeholder="Strategic alignment...">${this.escapeHtml(hypothesis.alignment || '')}</textarea>
              </div>
              <div class="briefing-market-cell full" style="margin-top: var(--space-xs);">
                <strong>Notes</strong>
                <textarea id="briefingNotes" rows="2" placeholder="Notes...">${this.escapeHtml(hypothesis.notes || '')}</textarea>
              </div>
              ` : '<div class="briefing-empty">No business hypotheses yet</div>'}
            </div>
          </div>
        </div>

        <div class="briefing-footer">
          <button class="btn btn-primary" id="confirmBriefingBtn">✓ 确认并提交简报</button>
        </div>
      </div>
    `;
  }

  getNCOCards(category) {
    const inspirations = AIAssistant.getNCOInspiration(category);

    return inspirations.map(item => `
      <div class="nco-card">
        <div class="nco-card-type" style="
          background: ${item.type === 'New' ? 'var(--reveal-primary)' : item.type === 'Cool' ? 'var(--inspire-primary)' : 'var(--shape-primary)'};
        ">${item.type}</div>
        <h4 class="nco-card-title">${item.title}</h4>
        <p class="nco-card-desc">${item.description}</p>
        <div class="nco-card-source">Source:${item.source}</div>
      </div>
    `).join('');
  }

  /* =========================================================
     Inspire 重构屏 (Screen 2-5) 方法
     ========================================================= */

  // ---- 存储工具 ----
  _ncoBaseKey(pid) { return `eureka_inspire_nco_base_${pid}`; }
  _ncoStateKey(pid) { return `eureka_inspire_nco_${pid}`; }
  _filterKey(pid) { return `eureka_inspire_filter_${pid}`; }

  _readCardJSON(cardType, project) {
    const proj = project || window.EurekaStorage.getProject(AppState.currentProjectId);
    const raw = proj?.cards?.[cardType];
    if (!raw) return null;
    let data = raw;
    if (typeof data === 'object' && data !== null && data.content !== undefined) data = data.content;
    if (typeof data === 'string') { try { return JSON.parse(data); } catch (e) { return null; } }
    return data;
  }

  // ---- NCO 状态 ----
  getNcoBase(projectId) {
    try {
      const raw = localStorage.getItem(this._ncoBaseKey(projectId));
      if (raw) { const arr = JSON.parse(raw); if (Array.isArray(arr) && arr.length) return arr; }
    } catch (e) {}
    const project = window.EurekaStorage.getProject(projectId);
    const category = project?.category || 'product';
    const ctx = this.getInspireContextText(project);
    return AIAssistant.getNcoInspirations(category, ctx, 3);
  }

  setNcoBase(projectId, cards) {
    try { localStorage.setItem(this._ncoBaseKey(projectId), JSON.stringify(cards)); } catch (e) {}
  }

  getNcoState(projectId) {
    try {
      const raw = localStorage.getItem(this._ncoStateKey(projectId));
      if (raw) { const s = JSON.parse(raw); return { favorites: s.favorites || [], customCards: s.customCards || [] }; }
    } catch (e) {}
    const saved = this._readCardJSON('ncoInspiration');
    if (saved && (saved.favorites || saved.customCards)) return { favorites: saved.favorites || [], customCards: saved.customCards || [] };
    return { favorites: [], customCards: [] };
  }

  setNcoState(projectId, state) {
    try { localStorage.setItem(this._ncoStateKey(projectId), JSON.stringify(state)); } catch (e) {}
  }

  // ---- 已选 HMW ----
  getSelectedHmws(project) {
    const raw = project?.cards?.hmw;
    if (!raw) return [];
    let data = raw;
    if (typeof data === 'object' && data !== null && data.content !== undefined) data = data.content;
    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { return []; } }
    if (!data || !data.dimensions) return [];
    const byId = {};
    Object.keys(data.dimensions).forEach(k => (data.dimensions[k] || []).forEach(it => { byId[it.id] = it.text; }));
    return (data.selectedIds || []).map(id => byId[id]).filter(Boolean);
  }

  getInspireContextText(project) {
    const pov = this.extractPovFromProject(project);
    const hmws = this.getSelectedHmws(project);
    return [project?.title, pov.targetUser, pov.sceneChallenge, pov.userProblem, pov.insight, pov.goal, ...hmws]
      .filter(Boolean).join('\n');
  }

  // ---- 创意 ----
  getIdeas(project) {
    const data = this._readCardJSON('ideas');
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.ideas)) return data.ideas;
    return [];
  }

  setIdeas(ideas) {
    if (!AppState.currentProjectId) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'ideas', { content: JSON.stringify(ideas), timestamp: Date.now() });
  }

  _newId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); }

  // ---- 筛选状态 ----
  getFilterState(projectId) {
    try {
      const raw = localStorage.getItem(this._filterKey(projectId));
      if (raw) { const s = JSON.parse(raw); return { scores: s.scores || {}, bestIds: s.bestIds || [] }; }
    } catch (e) {}
    const saved = this._readCardJSON('filteredIdeas');
    if (saved && (saved.scores || saved.bestIds)) return { scores: saved.scores || {}, bestIds: saved.bestIds || [] };
    return { scores: {}, bestIds: [] };
  }

  setFilterState(projectId, state) {
    try { localStorage.setItem(this._filterKey(projectId), JSON.stringify(state)); } catch (e) {}
  }

  // ---- Screen 2: NCO 模板 ----
  getInspireNcoTemplate(project) {
    const projectId = project.id;
    const baseCards = this.getNcoBase(projectId);
    const state = this.getNcoState(projectId);
    const isFav = (c) => state.favorites.some(f => f.type === c.type && f.title === c.title && f.description === c.description);
    const typeMeta = {
      New: { label: 'New · 全新做法', color: 'var(--reveal-primary)', sub: '从零构思的颠覆性方案' },
      Cool: { label: 'Cool · 有趣炫酷', color: 'var(--inspire-primary)', sub: '让人眼前一亮的体验' },
      Outsider: { label: 'Outsider · 跨界借鉴', color: 'var(--shape-primary)', sub: '来自其他领域的解法' }
    };
    const sectionsHtml = ['New', 'Cool', 'Outsider'].map(type => {
      const m = typeMeta[type];
      const cardsHtml = baseCards.filter(c => c.type === type).map(c => this.getInspCardHtml(c, isFav(c), false, baseCards.indexOf(c))).join('');
      return `
        <div class="nco-section">
          <div class="nco-section-header">
            <span class="nco-section-tag" style="background:${m.color}">${type}</span>
            <span class="nco-section-title">${m.label}</span>
            <span class="nco-section-sub">${m.sub}</span>
          </div>
          <div class="nco-grid">${cardsHtml}</div>
        </div>`;
    }).join('');

    const favHtml = state.favorites.length
      ? state.favorites.map((c, i) => this.getInspCardHtml(c, true, false, i, true)).join('')
      : '<div class="inspire-context-empty">还没有收藏的灵感，点击卡片右上角 ☆ 即可收藏。</div>';

    const customHtml = state.customCards.length
      ? state.customCards.map((c, i) => this.getInspCardHtml(c, false, true, i)).join('')
      : '';

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">I2 寻找灵感</h2>
        <p class="screen-subtitle">NCO：New / Cool / Outsider —— 从不同视角收集启发</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>每类 3 张共 9 张灵感卡片，点击 ☆ 收藏喜欢的；也可用「刷新」获取新灵感，或「添加」自定义灵感。</span></div>
        <div class="nco-toolbar">
          <button class="btn-ai" id="ncoRefreshBtn">🔄 刷新灵感</button>
          <button class="btn-add" id="ncoAddBtn">➕ 添加灵感卡片</button>
        </div>
        ${sectionsHtml}
        <div class="nco-section">
          <div class="nco-section-header">
            <span class="nco-section-title">⭐ 我的收藏</span>
            <span class="nco-section-sub">${I18N.t('nco.fav','已收藏 {n} 张').replace('{n}', state.favorites.length)}</span>
          </div>
          <div class="nco-grid" id="ncoFavGrid">${favHtml}</div>
        </div>
        ${customHtml ? `
        <div class="nco-section">
          <div class="nco-section-header"><span class="nco-section-title">📝 自定义灵感</span><span class="nco-section-sub">${I18N.t('nco.custom','{n} 张').replace('{n}', state.customCards.length)}</span></div>
          <div class="nco-grid" id="ncoCustomGrid">${customHtml}</div>
        </div>` : ''}
      </div>`;
  }

  getInspCardHtml(card, faved = false, isCustom = false, idx = null, removable = false) {
    const colorMap = { New: 'var(--reveal-primary)', Cool: 'var(--inspire-primary)', Outsider: 'var(--shape-primary)' };
    const color = colorMap[card.type] || 'var(--inspire-primary)';
    const esc = (s) => this.escapeHtml(s || '');
    let starAttr = '';
    let star = '';
    if (removable) {
      starAttr = `data-fav-index="${idx}"`;
      star = `<button class="fav-btn active" data-fav-remove ${starAttr} title="取消收藏">★</button>`;
    } else if (isCustom) {
      starAttr = `data-custom-index="${idx}"`;
      star = `<button class="fav-btn" data-custom-remove ${starAttr} title="删除">✕</button>`;
    } else {
      // 用 base 数组下标定位卡片，避免属性中嵌入含引号文本
      starAttr = `data-nco-index="${idx}"`;
      star = `<button class="fav-btn ${faved ? 'active' : ''}" data-fav-toggle ${starAttr} title="收藏">${faved ? '★' : '☆'}</button>`;
    }
    return `
      <div class="insp-card ${faved ? 'favorited' : ''} ${isCustom ? 'custom' : ''}">
        <span class="insp-card-type" style="background:${color}">${esc(card.type)}</span>
        <h4 class="insp-card-title">${esc(card.title)}</h4>
        <p class="insp-card-desc">${esc(card.description)}</p>
        <div class="insp-card-source">Source:${esc(card.source)}</div>
        ${star}
      </div>`;
  }

  attachInspireNcoEvents(project) {
    const stage = 'inspire';
    const projectId = project.id;

    document.getElementById('ncoRefreshBtn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '🔄 生成中...';
      try {
        const ctx = this.getInspireContextText(project);
        const cards = await AIAssistant.generateNcoInspirationsAI(ctx, 3);
        this.setNcoBase(projectId, cards);
        this.setNcoState(projectId, this.getNcoState(projectId));
        this.renderModule(stage);
      } catch (err) {
        console.error('[NCO] refresh failed:', err);
        this.showToast('刷新失败：' + (err.message || '请检查网络或 API Key'));
        btn.disabled = false;
        btn.textContent = orig;
      }
    });

    document.getElementById('ncoAddBtn')?.addEventListener('click', () => {
      this.openFormModal({
        title: '添加灵感卡片',
        fields: [
          { key: 'title', label: '标题', type: 'text', placeholder: '灵感标题' },
          { key: 'description', label: '描述', type: 'textarea', placeholder: '一句话描述这个灵感' },
          { key: 'type', label: '类型', type: 'select', options: ['New', 'Cool', 'Outsider'], placeholder: '选择类型' },
          { key: 'source', label: '来源', type: 'text', placeholder: '例如：个人经验' }
        ]
      }).then(res => {
        if (!res) return;
        if (!res.title || !res.title.trim()) { this.showToast('请填写标题'); return; }
        const state = this.getNcoState(projectId);
        state.customCards.push({
          type: res.type || 'New',
          title: res.title.trim(),
          description: (res.description || '').trim(),
          source: res.source || '自定义'
        });
        this.setNcoState(projectId, state);
        this.saveNcoData();
        this.renderModule(stage);
      });
    });

    document.querySelectorAll('[data-fav-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gi = parseInt(btn.dataset.ncoIndex);
        const base = this.getNcoBase(projectId);
        const card = base[gi];
        if (!card) return;
        const state = this.getNcoState(projectId);
        const i = state.favorites.findIndex(f => f.type === card.type && f.title === card.title && f.description === card.description);
        if (i >= 0) state.favorites.splice(i, 1);
        else state.favorites.push(card);
        this.setNcoState(projectId, state);
        this.saveNcoData();
        this.renderModule(stage);
      });
    });

    document.querySelectorAll('[data-fav-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.favIndex);
        const state = this.getNcoState(projectId);
        if (!isNaN(i)) state.favorites.splice(i, 1);
        this.setNcoState(projectId, state);
        this.saveNcoData();
        this.renderModule(stage);
      });
    });

    document.querySelectorAll('[data-custom-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.customIndex);
        const state = this.getNcoState(projectId);
        if (!isNaN(i)) state.customCards.splice(i, 1);
        this.setNcoState(projectId, state);
        this.saveNcoData();
        this.renderModule(stage);
      });
    });
  }

  saveNcoData() {
    if (!AppState.currentProjectId) return;
    const state = this.getNcoState(AppState.currentProjectId);
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'ncoInspiration', {
      content: JSON.stringify(state), timestamp: Date.now()
    });
  }

  // ---- Screen 3: 创意生成模板 ----
  getInspireIdeasTemplate(project) {
    const hmws = this.getSelectedHmws(project);
    const state = this.getNcoState(project.id);
    const favs = state.favorites;
    const ideas = this.getIdeas(project);

    const hmwHtml = hmws.length
      ? hmws.map(h => `<div class="inspire-context-item"><span class="ctx-tag">HMW</span>${this.escapeHtml(h)}</div>`).join('')
      : '<div class="inspire-context-empty">尚未在上一屏选定最佳 HMW（最多 2 个）</div>';

    const favHtml = favs.length
      ? favs.map(c => `<div class="inspire-context-item"><span class="ctx-tag">${this.escapeHtml(c.type)}</span>${this.escapeHtml(c.title)}</div>`).join('')
      : '<div class="inspire-context-empty">尚未收藏灵感（Screen 2）</div>';

    const ideasHtml = ideas.length
      ? ideas.map(i => this.getIdeaCardHtml(i)).join('')
      : '<div class="inspire-context-empty">尚无创意，点击下方按钮让 AI 帮你强制连接，或手动添加。</div>';

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">I3 生成创意</h2>
        <p class="screen-subtitle">基于最佳 HMW 与已收藏灵感，做"强制连接"</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>把 HMW 问题与灵感卡片交叉组合，产生大量创意；Quantity first, then quality。</span></div>
        <div class="inspire-context-bar">
          <div class="inspire-context-title">🎯 已选最佳 HMW（${hmws.length}/2）</div>
          <div class="inspire-context-list">${hmwHtml}</div>
          <div class="inspire-context-title" style="margin-top:var(--space-sm)">⭐ 已收藏灵感（${favs.length}）</div>
          <div class="inspire-context-list">${favHtml}</div>
        </div>
        <div class="ideas-list" id="ideasList">${ideasHtml}</div>
        <div style="display:flex;gap:var(--space-sm);">
          <button class="btn-ai" id="aiForceBtn" style="flex:1">✨ AI 强制连接生成</button>
          <button class="btn-add" id="addIdeaBtn" style="flex:1">➕ 手动添加创意</button>
        </div>
      </div>`;
  }

  getIdeaCardHtml(idea) {
    const esc = (s) => this.escapeHtml(s || '');
    return `
      <div class="idea-card" data-id="${idea.id}">
        <div class="idea-card-actions">
          <button class="idea-del-btn" data-idea-del="${idea.id}" title="删除">✕</button>
        </div>
        <h4 class="idea-card-title">${esc(idea.title)}</h4>
        <p class="idea-card-desc">${esc(idea.description)}</p>
        ${idea.source ? `<span class="idea-card-source">${esc(idea.source)}</span>` : ''}
      </div>`;
  }

  attachInspireIdeasEvents(project) {
    const stage = 'inspire';
    const projectId = project.id;

    document.getElementById('aiForceBtn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      const orig = btn.textContent;
      btn.disabled = true;
      btn.textContent = '✨ AI 连接中...';
      try {
        const hmws = this.getSelectedHmws(project);
        const state = this.getNcoState(projectId);
        const ctx = this.getInspireContextText(project);
        const newIdeas = await AIAssistant.generateForcedConnectionIdeas(hmws, state.favorites, ctx);
        const ideas = this.getIdeas(project);
        newIdeas.forEach(idea => ideas.push({
          id: this._newId('idea'),
          title: idea.title,
          description: idea.description,
          source: idea.source || 'AI 强制连接'
        }));
        this.setIdeas(ideas);
        this.renderModule(stage);
      } catch (err) {
        console.error('[Ideas] AI force failed:', err);
        this.showToast('AI 生成失败：' + (err.message || '请检查网络或 API Key'));
        btn.disabled = false;
        btn.textContent = orig;
      }
    });

    document.getElementById('addIdeaBtn')?.addEventListener('click', () => {
      this.openFormModal({
        title: '手动添加创意',
        fields: [
          { key: 'title', label: '创意名称', type: 'text', placeholder: '给你的创意起个名字' },
          { key: 'description', label: '创意描述', type: 'textarea', placeholder: '一句话说明创意核心' }
        ]
      }).then(res => {
        if (!res) return;
        if (!res.title || !res.title.trim()) { this.showToast('请填写创意名称'); return; }
        const ideas = this.getIdeas(project);
        ideas.push({
          id: this._newId('idea'),
          title: res.title.trim(),
          description: (res.description || '').trim(),
          source: '手动添加'
        });
        this.setIdeas(ideas);
        this.renderModule(stage);
      });
    });

    document.querySelectorAll('[data-idea-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.ideaDel;
        const ideas = this.getIdeas(project).filter(i => i.id !== id);
        this.setIdeas(ideas);
        this.renderModule(stage);
      });
    });
  }

  saveIdeasData() {
    // 创意已在每次变更时通过 setIdeas 持久化，这里无需额外操作
  }

  // ---- Screen 4: 四维筛选模板 ----
  getInspireFilterTemplate(project) {
    const projectId = project.id;
    const ideas = this.getIdeas(project);
    if (!ideas.length) {
      return `
        <div class="screen-content animate-fade-in-up">
          <h2 class="screen-title">I4 筛选最佳创意</h2>
          <p class="screen-subtitle">四维打分，选出最佳</p>
          <div class="screen-hint"><span class="hint-icon">💡</span><span>请先在上一屏（生成创意）产生一些创意，再回来打分筛选。</span></div>
        </div>`;
    }
    const fstate = this.getFilterState(projectId);
    const scored = ideas.map(idea => {
      const s = fstate.scores[idea.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
      const total = s.feasibility + s.userValue + s.businessValue + s.innovation;
      return { ...idea, s, total, best: fstate.bestIds.includes(idea.id) };
    }).sort((a, b) => b.total - a.total);

    const cardsHtml = scored.map(idea => this.getFilterCardHtml(idea)).join('');
    const bestItems = scored.filter(i => i.best)
      .map(i => `<div class="filter-summary-item">✓ ${this.escapeHtml(i.title)}（总分 ${i.total}）</div>`).join('');

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">I4 筛选最佳创意</h2>
        <p class="screen-subtitle">四维打分，选出最值得深入的创意</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>对每条创意从可行性 / 用户价值 / 商业价值 / 创新程度打分（1-5），可让 AI 辅助评分，勾选最佳创意（可多选）。</span></div>
        <div class="filter-grid" id="filterGrid">${cardsHtml}</div>
        <div class="filter-summary">
          <div class="filter-summary-title">🏆 最佳创意已选定（${scored.filter(i => i.best).length}）</div>
          <div id="filterSummaryList">${bestItems || '<div class="inspire-context-empty">勾选卡片左侧，确认最佳创意</div>'}</div>
        </div>
      </div>`;
  }

  getFilterCardHtml(idea) {
    const esc = (s) => this.escapeHtml(s || '');
    const dims = [
      { key: 'feasibility', label: '可行性 Feasibility' },
      { key: 'userValue', label: '用户价值 User Value' },
      { key: 'businessValue', label: '商业价值 Business Value' },
      { key: 'innovation', label: '创新程度 Innovation' }
    ];
    const rowsHtml = dims.map(d => `
      <div class="dim-score-row">
        <span class="dim-score-label">${d.label}</span>
        <span class="dim-score-control">
          <button class="dim-score-btn" data-score="${idea.id}" data-metric="${d.key}" data-delta="-1">-</button>
          <span class="dim-score-val" id="dim_${d.key}_${idea.id}">${idea.s[d.key]}</span>
          <button class="dim-score-btn" data-score="${idea.id}" data-metric="${d.key}" data-delta="1">+</button>
        </span>
      </div>`).join('');

    return `
      <div class="idea-filter-card ${idea.best ? 'selected' : ''}" data-idea="${idea.id}">
        <div class="idea-filter-head">
          <input type="checkbox" class="idea-filter-check" data-best="${idea.id}" ${idea.best ? 'checked' : ''} />
          <div>
            <h4 class="idea-filter-title">${esc(idea.title)}</h4>
            ${idea.description ? `<p class="idea-filter-desc">${esc(idea.description)}</p>` : ''}
            ${idea.source ? `<span class="idea-card-source">${esc(idea.source)}</span>` : ''}
          </div>
        </div>
        <div class="dim-scores">${rowsHtml}</div>
        <div class="idea-filter-total">
          <span class="idea-ai-score-btn" data-ai-score="${idea.id}">🤖 AI 辅助评分</span>
          <span>总分 <span class="idea-filter-total-score" id="total_${idea.id}">${idea.total}</span>/20</span>
        </div>
      </div>`;
  }

  attachInspireFilterEvents(project) {
    const stage = 'inspire';
    const projectId = project.id;

    const persist = () => {
      const fstate = this.getFilterState(projectId);
      const ideas = this.getIdeas(project);
      const enriched = ideas.map(i => ({
        ...i,
        scores: fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 },
        best: fstate.bestIds.includes(i.id)
      }));
      window.EurekaStorage.updateCard(projectId, 'filteredIdeas', {
        content: JSON.stringify({ ideas: enriched, scores: fstate.scores, bestIds: fstate.bestIds }),
        timestamp: Date.now()
      });
    };

    const updateSummary = () => {
      const fstate = this.getFilterState(projectId);
      const ideas = this.getIdeas(project);
      const best = ideas.filter(i => fstate.bestIds.includes(i.id))
        .map(i => {
          const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
          const total = s.feasibility + s.userValue + s.businessValue + s.innovation;
          return `<div class="filter-summary-item">✓ ${this.escapeHtml(i.title)}（总分 ${total}）</div>`;
        }).join('');
      const list = document.getElementById('filterSummaryList');
      if (list) list.innerHTML = best || '<div class="inspire-context-empty">勾选卡片左侧，确认最佳创意</div>';
      const title = document.querySelector('.filter-summary-title');
      if (title) title.textContent = `🏆 最佳创意已选定（${fstate.bestIds.length}）`;
    };

    document.querySelectorAll('[data-score]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.score;
        const metric = btn.dataset.metric;
        const delta = parseInt(btn.dataset.delta);
        const valEl = document.getElementById(`dim_${metric}_${id}`);
        if (!valEl) return;
        let val = parseInt(valEl.textContent) || 3;
        val = Math.max(1, Math.min(5, val + delta));
        valEl.textContent = val;
        const fstate = this.getFilterState(projectId);
        fstate.scores[id] = fstate.scores[id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
        fstate.scores[id][metric] = val;
        this.setFilterState(projectId, fstate);
        const total = ['feasibility', 'userValue', 'businessValue', 'innovation']
          .reduce((sum, k) => sum + (fstate.scores[id][k] || 3), 0);
        const totalEl = document.getElementById(`total_${id}`);
        if (totalEl) totalEl.textContent = total;
        persist();
      });
    });

    document.querySelectorAll('[data-best]').forEach(check => {
      check.addEventListener('change', () => {
        const id = check.dataset.best;
        const fstate = this.getFilterState(projectId);
        const card = check.closest('.idea-filter-card');
        if (check.checked) {
          if (!fstate.bestIds.includes(id)) fstate.bestIds.push(id);
          if (card) card.classList.add('selected');
        } else {
          fstate.bestIds = fstate.bestIds.filter(x => x !== id);
          if (card) card.classList.remove('selected');
        }
        this.setFilterState(projectId, fstate);
        persist();
        updateSummary();
      });
    });

    document.querySelectorAll('[data-ai-score]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.aiScore;
        const ideas = this.getIdeas(project);
        const idea = ideas.find(i => i.id === id);
        if (!idea) return;
        const orig = btn.textContent;
        btn.disabled = true;
        btn.textContent = '🤖 评分中...';
        try {
          const ctx = this.getInspireContextText(project);
          const scores = await AIAssistant.scoreIdeaAI(idea, ctx);
          const fstate = this.getFilterState(projectId);
          fstate.scores[id] = scores;
          this.setFilterState(projectId, fstate);
          ['feasibility', 'userValue', 'businessValue', 'innovation'].forEach(k => {
            const el = document.getElementById(`dim_${k}_${id}`);
            if (el) el.textContent = scores[k];
          });
          const total = scores.feasibility + scores.userValue + scores.businessValue + scores.innovation;
          const totalEl = document.getElementById(`total_${id}`);
          if (totalEl) totalEl.textContent = total;
          persist();
          this.showToast('✨ AI 已完成评分');
        } catch (err) {
          console.error('[Filter] AI score failed:', err);
          this.showToast('AI 评分失败：' + (err.message || '请检查网络或 API Key'));
        } finally {
          btn.disabled = false;
          btn.textContent = orig;
        }
      });
    });
  }

  saveFilterData() {
    // 分数与最佳选择已在每次变更时即时持久化（persist + setFilterState）
  }

  // ---- Screen 5: 阶段总结模板 ----
  getInspireSummaryTemplate(project) {
    const pov = this.extractPovFromProject(project);
    const hmws = this.getSelectedHmws(project);
    const ideas = this.getIdeas(project);
    const fstate = this.getFilterState(project.id);

    let bestIdeas = ideas.filter(i => fstate.bestIds.includes(i.id)).map(i => {
      const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
      const total = s.feasibility + s.userValue + s.businessValue + s.innovation;
      return { ...i, s, total };
    });
    if (bestIdeas.length === 0 && ideas.length) {
      bestIdeas = ideas.map(i => {
        const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
        const total = s.feasibility + s.userValue + s.businessValue + s.innovation;
        return { ...i, s, total };
      }).sort((a, b) => b.total - a.total).slice(0, 3);
    }

    const hmwHtml = hmws.length
      ? hmws.map(h => `<div class="summary-hmw-item"><span class="summary-tag">HMW</span>${this.escapeHtml(h)}</div>`).join('')
      : '<div class="summary-empty">尚未选定最佳 HMW</div>';

    const ideaHtml = bestIdeas.length
      ? bestIdeas.map(i => `
        <div class="summary-idea-item">
          <strong>${this.escapeHtml(i.title)}</strong>
          ${i.description ? `<div class="idea-card-desc">${this.escapeHtml(i.description)}</div>` : ''}
          <div class="summary-idea-total">四维总分 ${i.total}/20 ｜ 可行性 ${i.s.feasibility} · 用户 ${i.s.userValue} · 商业 ${i.s.businessValue} · 创新 ${i.s.innovation}</div>
        </div>`).join('')
      : '<div class="summary-empty">尚未生成/选定创意</div>';

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">I5 Inspire 阶段总结</h2>
        <p class="screen-subtitle">确认你的启发成果，准备进入 Shape</p>

        <div class="inspire-summary-card">
          <div class="summary-block-title">📌 POV 摘要</div>
          <div class="summary-row"><span class="summary-key">目标用户</span><span>${this.escapeHtml(pov.targetUser || '—')}</span></div>
          <div class="summary-row"><span class="summary-key">场景挑战</span><span>${this.escapeHtml(pov.sceneChallenge || '—')}</span></div>
          <div class="summary-row"><span class="summary-key">用户问题</span><span>${this.escapeHtml(pov.userProblem || '—')}</span></div>
          <div class="summary-row"><span class="summary-key">核心洞察</span><span>${this.escapeHtml(pov.insight || '—')}</span></div>
          <div class="summary-row"><span class="summary-key">目标</span><span>${this.escapeHtml(pov.goal || '—')}</span></div>
        </div>

        <div class="inspire-summary-card">
          <div class="summary-block-title">🏆 最佳 HMW（${hmws.length}）</div>
          ${hmwHtml}
        </div>

        <div class="inspire-summary-card">
          <div class="summary-block-title">💡 最佳创意（${bestIdeas.length}）</div>
          ${ideaHtml}
        </div>

        <div class="confirm-actions">
          <button class="btn btn-secondary" id="summaryBackBtn">返回修改</button>
          <button class="btn btn-confirm-primary" id="summaryConfirmBtn">确认完成，进入 Shape</button>
        </div>
      </div>`;
  }

  attachInspireSummaryEvents(project) {
    document.getElementById('summaryBackBtn')?.addEventListener('click', () => {
      this.goToScreen('inspire', 4);
    });
    document.getElementById('summaryConfirmBtn')?.addEventListener('click', () => {
      this.saveInspireSummary(project);
      this.completeStage('inspire');
    });
  }

  saveInspireSummary(project) {
    if (!AppState.currentProjectId) return;
    const pov = this.extractPovFromProject(project);
    const hmws = this.getSelectedHmws(project);
    const ideas = this.getIdeas(project);
    const fstate = this.getFilterState(project.id);
    let bestIdeas = ideas.filter(i => fstate.bestIds.includes(i.id)).map(i => {
      const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
      return {
        id: i.id, title: i.title, description: i.description, source: i.source,
        scores: s, total: s.feasibility + s.userValue + s.businessValue + s.innovation
      };
    });
    if (bestIdeas.length === 0 && ideas.length) {
      bestIdeas = ideas.map(i => {
        const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
        return { id: i.id, title: i.title, description: i.description, source: i.source, scores: s, total: s.feasibility + s.userValue + s.businessValue + s.innovation };
      }).sort((a, b) => b.total - a.total).slice(0, 3);
    }
    const summary = { pov, bestHmws: hmws, bestIdeas, createdAt: Date.now() };
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'inspireSummary', {
      content: JSON.stringify(summary), timestamp: Date.now()
    });
  }

  // ---- 通用表单弹窗（NCO 添加 / 创意添加 复用）----
  openFormModal({ title, fields }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;padding:var(--space-md);';
      const fieldHtml = fields.map(f => {
        const id = 'fm_' + f.key;
        const lblStyle = 'display:block;font-size:var(--font-size-base);font-weight:700;color:var(--text-primary);margin-bottom:6px;margin-top:4px;padding-left:8px;border-left:3px solid var(--reveal-primary);';
        if (f.type === 'textarea') {
          return `<div style="margin-bottom:var(--space-md)"><label style="${lblStyle}">${this.escapeHtml(f.label)}</label><textarea id="${id}" rows="3" placeholder="${this.escapeHtml(f.placeholder || '')}" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);color:var(--text-primary);padding:var(--space-sm);font-family:inherit;"></textarea></div>`;
        }
        if (f.type === 'select') {
          const opts = (f.options || []).map(o => `<option value="${this.escapeHtml(o)}">${this.escapeHtml(o)}</option>`).join('');
          return `<div style="margin-bottom:var(--space-md)"><label style="${lblStyle}">${this.escapeHtml(f.label)}</label><select id="${id}" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);color:var(--text-primary);padding:var(--space-sm);font-family:inherit;">${opts}</select></div>`;
        }
        return `<div style="margin-bottom:var(--space-md)"><label style="${lblStyle}">${this.escapeHtml(f.label)}</label><input id="${id}" type="text" placeholder="${this.escapeHtml(f.placeholder || '')}" style="width:100%;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:var(--radius-sm);color:var(--text-primary);padding:var(--space-sm);font-family:inherit;" /></div>`;
      }).join('');

      overlay.innerHTML = `
        <div style="background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-md);padding:var(--space-lg);width:100%;max-width:420px;">
          <h3 style="margin:0 0 var(--space-md);color:var(--text-primary);font-size:var(--font-size-lg);">${this.escapeHtml(title)}</h3>
          ${fieldHtml}
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md);">
            <button id="fmCancel" class="btn btn-secondary" style="flex:1;">取消</button>
            <button id="fmSave" class="btn btn-primary" style="flex:1;">保存</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);

      const close = (val) => { overlay.remove(); resolve(val); };
      overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
      overlay.querySelector('#fmCancel').addEventListener('click', () => close(null));
      overlay.querySelector('#fmSave').addEventListener('click', () => {
        const res = {};
        fields.forEach(f => { res[f.key] = overlay.querySelector('#fm_' + f.key)?.value?.trim() || ''; });
        close(res);
      });
    });
  }

  /**
   * Generate HMW 四维重构 HTML template (Inspire Screen 1)
   */
  getHmwTemplate(project) {
    // Extract POV data from project briefing and FIND insights
    const pov = this.extractPovFromProject(project);

    // Load saved HMW data
    const savedHmw = this.getSavedHmwData(project);
    const dimensions = savedHmw.dimensions || { amplify: [], remove: [], flip: [], diverge: [] };
    const evaluations = savedHmw.evaluations || {};
    const selectedIds = savedHmw.selectedIds || [];

    const dimConfig = {
      amplify: { icon: '✅', label: '发挥积极', desc: '将问题的负面要素转换成正面目标来追求', color: '#22C55E' },
      remove: { icon: '❌', label: '移除消极', desc: '假设阻碍因素不存在，我们能做什么？', color: '#EF4444' },
      flip: { icon: '🔄', label: '假设转换', desc: '颠覆核心假设，从反向或全新角度重构', color: '#7F77DD' },
      diverge: { icon: '🚀', label: '脑洞大开', desc: '打破常规边界，探索最疯狂的解决路径', color: '#F59E0B' }
    };

    // Collect all items for evaluation matrix
    // 防御：示例项目历史数据中维度键可能不是标准的 4 维，
    // 用兼容配置兜底，避免渲染 Inspire 时整体崩溃（否则会导致无法跳转到 Inspire 阶段）
    const effConfig = { ...dimConfig };
    Object.keys(dimensions || {}).forEach(k => {
      if (!effConfig[k]) effConfig[k] = { icon: '💡', label: k, desc: '', color: '#E07A2F' };
    });

    const allItems = [];
    Object.keys(dimensions).forEach(key => {
      (dimensions[key] || []).forEach(item => {
        allItems.push({ ...item, dimKey: key, dimLabel: (effConfig[key] || effConfig[k] || dimConfig[key] || { label: key }).label });
      });
    });

    const totalCount = allItems.length;

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">I1 重构用户问题</h2>
        <p class="screen-subtitle">从 POV 出发，四维重构创新机遇</p>

        <!-- POV Section -->
        <div class="hmw-pov-section">
          <div class="hmw-section-header">
            <span class="hmw-section-icon">🎯</span>
            <span class="hmw-section-title">用户观点问题 (POV)</span>
            <span class="hmw-section-badge">来自 Reveal</span>
          </div>
            <div class="hmw-pov-grid">
            <div class="hmw-pov-field">
              <label class="hmw-pov-label">目标用户 ${pov.from?.targetUser ? '<span class="hmw-from-reveal">来自 Reveal</span>' : ''}</label>
              <input type="text" class="hmw-pov-input" id="hmwPovTargetUser" placeholder="例如：城市驾驶者" value="${this.escapeHtml(pov.targetUser)}" />
            </div>
            <div class="hmw-pov-field">
              <label class="hmw-pov-label">场景挑战 ${pov.from?.sceneChallenge ? '<span class="hmw-from-reveal">来自 Reveal</span>' : ''}</label>
              <input type="text" class="hmw-pov-input" id="hmwPovScene" placeholder="例如：在繁忙市区寻找停车位" value="${this.escapeHtml(pov.sceneChallenge)}" />
            </div>
            <div class="hmw-pov-field">
              <label class="hmw-pov-label">用户问题 ${pov.from?.userProblem ? '<span class="hmw-from-reveal">来自 Reveal</span>' : ''}</label>
              <input type="text" class="hmw-pov-input" id="hmwPovProblem" placeholder="用户面临的核心问题" value="${this.escapeHtml(pov.userProblem)}" />
            </div>
            <div class="hmw-pov-field">
              <label class="hmw-pov-label">洞察 ${pov.from?.insight ? '<span class="hmw-from-reveal">来自 Reveal</span>' : ''}</label>
              ${pov.insightList && pov.insightList.length > 1 ? `
                <div class="hmw-pov-insight-list" style="margin-bottom:8px;padding:8px 10px;background:rgba(127,119,221,0.08);border-radius:8px;font-size:13px;line-height:1.6;">
                  ${pov.insightList.map((it, i) => `
                    <div class="hmw-pov-insight-item" style="margin-bottom:6px;">
                      <strong>${i + 1}.</strong> ${it.sourceFinding ? `<span style="color:#7F77DD;font-weight:500;">[${this.escapeHtml(it.sourceFinding)}]</span> ` : ''}${this.escapeHtml(it.insight)}
                    </div>
                  `).join('')}
                </div>
                <textarea class="hmw-pov-input" id="hmwPovInsight" placeholder="来自 FIND 的核心洞察" rows="3">${this.escapeHtml(pov.insight)}</textarea>
              ` : `
                <input type="text" class="hmw-pov-input" id="hmwPovInsight" placeholder="来自 FIND 的核心洞察" value="${this.escapeHtml(pov.insight)}" />
              `}
            </div>
            <div class="hmw-pov-field full-width">
              <label class="hmw-pov-label">目标 ${pov.from?.goal ? '<span class="hmw-from-reveal">来自 Reveal</span>' : ''}</label>
              <input type="text" class="hmw-pov-input" id="hmwPovGoal" placeholder="我们期望达成的改变" value="${this.escapeHtml(pov.goal)}" />
            </div>
          </div>
        </div>

        <!-- Four Dimensions Section -->
        <div class="hmw-dimensions-section">
          <div class="hmw-section-header">
            <span class="hmw-section-icon">💡</span>
            <span class="hmw-section-title">HMW 四维重构</span>
            <span class="hmw-section-count" id="hmwTotalCount">${I18N.t('hmw.generated','已产出 {n} 条').replace('{n}', totalCount)}</span>
          </div>
          <div class="hmw-dimensions-hint">
            点击各维度展开，AI 生成建议或手动添加 HMW。目标：每个维度 1-2 条，总计 6-8 条。
          </div>
          <div class="hmw-dimensions-list">
            ${Object.keys(effConfig).map(key => {
              const cfg = effConfig[key];
              const items = dimensions[key] || [];
              return `
                <div class="hmw-dimension-card" data-dim="${key}">
                  <div class="hmw-dimension-header">
                    <div class="hmw-dimension-icon" style="background:${cfg.color}20;color:${cfg.color}">${cfg.icon}</div>
                    <div class="hmw-dimension-info">
                      <div class="hmw-dimension-label">${cfg.label}</div>
                      <div class="hmw-dimension-desc">${cfg.desc}</div>
                    </div>
                    <div class="hmw-dimension-count">${I18N.t('hmw.count','{n} 条').replace('{n}', items.length)}</div>
                    <div class="hmw-dimension-arrow">▼</div>
                  </div>
                  <div class="hmw-dimension-body">
                    <button class="hmw-ai-gen-btn" data-dim="${key}">
                      <span>✨</span> AI 生成该维度的 HMW 建议
                    </button>
                    <div class="hmw-items-list" data-dim="${key}">
                      ${items.map(item => this.getHmwItemHtml(item, cfg.color)).join('')}
                    </div>
                    <div class="hmw-add-row">
                      <input type="text" class="hmw-add-input" data-dim="${key}" placeholder="我们如何才能...？（手动输入）" />
                      <button class="hmw-add-btn" data-dim="${key}">+ 添加</button>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Evaluation Matrix -->
        ${allItems.length > 0 ? `
        <div class="hmw-eval-section">
          <div class="hmw-section-header">
            <span class="hmw-section-icon">📊</span>
            <span class="hmw-section-title">HMW 评估打分矩阵</span>
          </div>
          <div class="hmw-eval-hint">
            对每条 HMW 进行三维打分（1-5分）。勾选最终入选的 1-2 个最佳 HMW。注意：不要只看总分，高用户价值的颠覆性选项也值得入选。
          </div>
          <div class="hmw-eval-table-wrap">
            <table class="hmw-eval-table">
              <thead>
                <tr>
                  <th style="width:40px;"></th>
                  <th>HMW 创新机遇</th>
                  <th style="width:120px;">👤 用户价值</th>
                  <th style="width:120px;">💰 商业价值</th>
                  <th style="width:120px;">⚙️ 可行性</th>
                  <th style="width:60px;">Σ 总分</th>
                </tr>
              </thead>
              <tbody>
                ${allItems.map(item => {
                  const ev = evaluations[item.id] || { userValue: 3, businessValue: 3, feasibility: 3 };
                  const total = (ev.userValue || 3) + (ev.businessValue || 3) + (ev.feasibility || 3);
                  const isSelected = selectedIds.includes(item.id);
                  return `
                    <tr class="hmw-eval-row ${isSelected ? 'selected' : ''}" data-id="${item.id}">
                      <td>
                        <input type="checkbox" class="hmw-eval-check" data-id="${item.id}" ${isSelected ? 'checked' : ''} />
                      </td>
                      <td>
                        <span class="hmw-eval-dim-tag" style="background:${(effConfig[item.dimKey] || dimConfig[item.dimKey] || { color: '#E07A2F' }).color}20;color:${(effConfig[item.dimKey] || dimConfig[item.dimKey] || { color: '#E07A2F' }).color}">${item.dimLabel}</span>
                        <span class="hmw-eval-text">${this.escapeHtml(item.text)}</span>
                      </td>
                      <td>
                        <div class="hmw-score-control">
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="userValue" data-delta="-1">-</button>
                          <span class="hmw-score-val" id="score_uv_${item.id}">${ev.userValue}</span>
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="userValue" data-delta="1">+</button>
                        </div>
                      </td>
                      <td>
                        <div class="hmw-score-control">
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="businessValue" data-delta="-1">-</button>
                          <span class="hmw-score-val" id="score_bv_${item.id}">${ev.businessValue}</span>
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="businessValue" data-delta="1">+</button>
                        </div>
                      </td>
                      <td>
                        <div class="hmw-score-control">
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="feasibility" data-delta="-1">-</button>
                          <span class="hmw-score-val" id="score_fe_${item.id}">${ev.feasibility}</span>
                          <button class="hmw-score-btn" data-id="${item.id}" data-metric="feasibility" data-delta="1">+</button>
                        </div>
                      </td>
                      <td>
                        <span class="hmw-total-score" id="score_total_${item.id}">${total}</span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
        ` : ''}

        <!-- Selected Best HMW -->
        ${selectedIds.length > 0 ? `
        <div class="hmw-selected-section">
          <div class="hmw-section-header">
            <span class="hmw-section-icon">🏆</span>
            <span class="hmw-section-title">最佳 HMW 已选定</span>
            <span class="hmw-section-count">(${selectedIds.length}/2)</span>
          </div>
          <div class="hmw-selected-list">
            ${selectedIds.map(id => {
              const item = allItems.find(i => i.id === id);
              if (!item) return '';
              return `
                <div class="hmw-selected-item">
                  <span class="hmw-selected-badge">✓ 最佳 HMW</span>
                  <span class="hmw-selected-text">${this.escapeHtml(item.text)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Extract POV data from Reveal stage outputs
   */
  extractPovFromProject(project) {
    const pov = { targetUser: '', sceneChallenge: '', userProblem: '', insight: '', goal: '', from: {}, insightList: [] };

    // Try project briefing first
    if (project?.cards?.projectBriefing) {
      try {
        let raw = project.cards.projectBriefing;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const briefing = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (briefing.targetUser) { pov.targetUser = briefing.targetUser; pov.from.targetUser = true; }
        if (briefing.scene) { pov.sceneChallenge = briefing.scene; pov.from.sceneChallenge = true; }
      } catch (e) {}
    }

    // Fallback: parse from T1 scene card
    if (!pov.targetUser && project?.cards?.scene) {
      try {
        let raw = project.cards.scene;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        if (typeof raw === 'string') {
          const targetMatch = raw.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
          const sceneMatch = raw.match(/【场景描述】(.+?)$/s);
          if (targetMatch) { pov.targetUser = targetMatch[1].trim(); pov.from.targetUser = true; }
          if (sceneMatch) { pov.sceneChallenge = sceneMatch[1].trim(); pov.from.sceneChallenge = true; }
        }
      } catch (e) {}
    }

    // Extract user problem: prefer journey discovery (first key finding)
    if (project?.cards?.journey) {
      try {
        let raw = project.cards.journey;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const journeyData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const discoveries = (journeyData || []).filter(c => c.discovery && c.discovery.trim());
        if (discoveries.length > 0) {
          pov.userProblem = discoveries[0].discovery.trim();
          pov.from.userProblem = true;
        }
      } catch (e) {}
    }

    // Extract insight from FIND distill — aggregate ALL findings' insights
    if (project?.cards?.findInsight) {
      try {
        let raw = project.cards.findInsight;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const findData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (Array.isArray(findData.findings)) {
          const collected = [];
          findData.findings.forEach(f => {
            const source = (f.sourceFinding || f.fact || '').trim();
            let insight = '';
            if (f.distill?.trim()) insight = f.distill.trim();
            else if (f.distillOutput?.trim()) insight = f.distillOutput.trim();
            else if (f.needOutput?.trim()) insight = f.needOutput.trim();
            else if (f.interpretOutput?.trim()) insight = f.interpretOutput.trim();
            else if (f.need?.trim()) insight = f.need.trim();
            if (insight) collected.push({ sourceFinding: source, insight });
          });
          if (collected.length > 0) {
            pov.insightList = collected;
            if (collected.length === 1) {
              pov.insight = collected[0].insight;
            } else {
              pov.insight = collected.map((it, i) => {
                const prefix = it.sourceFinding ? `【${it.sourceFinding}】` : `Insight ${i + 1}`;
                return `${i + 1}. ${prefix} ${it.insight}`;
              }).join('\n\n');
            }
            pov.from.insight = true;
          }
        } else if (findData.distillOutput || findData.distill) {
          pov.insight = findData.distillOutput || findData.distill; pov.from.insight = true;
          pov.insightList = [{ sourceFinding: '', insight: pov.insight }];
        } else if (findData.needOutput || findData.need) {
          pov.insight = findData.needOutput || findData.need; pov.from.insight = true;
          pov.insightList = [{ sourceFinding: '', insight: pov.insight }];
        }
      } catch (e) {}
    }

    // 再 fallback：从 projectBriefing 取 insight（Reveal T5 项目简报）
    if (!pov.insight && project?.cards?.projectBriefing) {
      try {
        let raw = project.cards.projectBriefing;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const bg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (bg?.insight) { pov.insight = bg.insight; pov.from.insight = true; }
      } catch (e) {}
    }

    // ★ 关键新增：从 Inspire 屏幕草稿中读取用户手工编辑过的 insight/goal
    if (AppState.currentProjectId) {
      try {
        const draftKey = `draft_${AppState.currentProjectId}_inspire_1`;
        const draftRaw = localStorage.getItem(draftKey);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw);
          const draftPov = draft?.pov;
          if (draftPov?.insight?.trim() && !pov.insight) {
            pov.insight = draftPov.insight.trim(); pov.from.insight = true;
          }
          if (draftPov?.goal?.trim() && !pov.goal) {
            pov.goal = draftPov.goal.trim(); pov.from.goal = true;
          }
        }
      } catch (e) {}
    }
    // 也从 hmw card 中读取（saveHmwData 的持久化结果）
    if ((!pov.insight || !pov.goal) && project?.cards?.hmw) {
      try {
        let raw = project.cards.hmw;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const hmwData = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (hmwData?.pov) {
          if (!pov.insight && hmwData.pov.insight?.trim()) { pov.insight = hmwData.pov.insight.trim(); pov.from.insight = true; }
          if (!pov.goal && hmwData.pov.goal?.trim()) { pov.goal = hmwData.pov.goal.trim(); pov.from.goal = true; }
        }
      } catch (e) {}
    }

    // Extract goal from business goal (Reveal Screen 4) — 增强解析实际存储结构
    if (!pov.goal && project?.cards?.businessGoal) {
      try {
        let raw = project.cards.businessGoal;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const bg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        // 实际存储结构: { stakeholders: {...}, hypothesis: {...} }
        // 尝试多层嵌套查找
        const tryGet = (obj, ...paths) => {
          for (const p of paths) {
            const val = p.split('.').reduce((o, k) => o?.[k], obj);
            if (val && typeof val === 'string' && val.trim()) return val.trim();
          }
          return null;
        };
        const found = tryGet(bg,
          'consensus',           // stakeholders.consensus
          'stakeholders.consensus',
          'goal',
          'hypothesis.goal',
          'hypothesis.alignment'
        );
        if (found) { pov.goal = found; pov.from.goal = true; }
      } catch (e) {}
    }

    // fallback：从 projectBriefing 取 goal/consensus（合并去重，避免重复块与越界变量）
    if (!pov.goal && project?.cards?.projectBriefing) {
      try {
        let raw = project.cards.projectBriefing;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const bg = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const g = (typeof bg?.goal === 'string' && bg.goal.trim()) ? bg.goal.trim()
          : (typeof bg?.consensus === 'string' && bg.consensus.trim()) ? bg.consensus.trim() : '';
        if (g) { pov.goal = g; pov.from.goal = true; }
      } catch (e) {}
    }

    // Normalize insightList so downstream can always iterate
    if (pov.insight && (!pov.insightList || pov.insightList.length === 0)) {
      pov.insightList = [{ sourceFinding: '', insight: pov.insight }];
    }

    return pov;
  }

  /**
   * Get saved HMW data from project card or draft
   */
  getSavedHmwData(project) {
    // Try card first
    if (project?.cards?.hmw) {
      try {
        let raw = project.cards.hmw;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        if (typeof raw === 'string') return JSON.parse(raw);
        return raw || {};
      } catch (e) {}
    }

    // Fallback: try draft
    if (AppState.currentProjectId) {
      try {
        const draft = localStorage.getItem(`eureka_draft_${AppState.currentProjectId}_inspire_1`);
        if (draft) {
          const parsed = JSON.parse(draft);
          if (parsed.content) return JSON.parse(parsed.content);
        }
      } catch (e) {}
    }

    return {};
  }

  /**
   * Generate HTML for a single HMW item
   */
  getHmwItemHtml(item, color) {
    return `
      <div class="hmw-item" data-id="${item.id}">
        <span class="hmw-item-text">${this.escapeHtml(item.text)}</span>
        <button class="hmw-item-delete" data-id="${item.id}" title="删除">✕</button>
      </div>
    `;
  }

  attachModuleEvents(stage, stageInfo, project) {
    const totalScreens = stageInfo.screens;

    // Get current screen from AppState (not closure)
    const getCurrentScreen = () => AppState.currentScreen || project?.currentScreen || 1;

    // Show stage brief modal only on first screen of each stage
    this.showStageBrief(stage, getCurrentScreen());

    // Close drawer when clicking main content area
    this.container?.addEventListener('click', (e) => {
      if (AppState.drawerOpen && !e.target.closest('#drawer') && !e.target.closest('#menuBtn')) {
        AppState.closeDrawer();
        this.updateDrawer();
      }
    });

    // Back button - return to previous screen or home
    document.getElementById('backBtn')?.addEventListener('click', () => {
      const currentScreen = getCurrentScreen();
      if (currentScreen > 1) {
        // Save current content and go to previous screen
        this.saveAndGoToPreviousScreen(stage);
      } else {
        AppState.navigate('home');
      }
    });

    // Close button
    document.getElementById('closeBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
    });

    // Step navigation — 点击弹出屏幕选择菜单（支持直达具体任务）
    const stepperEl = document.getElementById('riseStepper');
    document.querySelectorAll('#riseStepper .rise-step').forEach(step => {
      step.addEventListener('click', (e) => {
        const targetStage = step.dataset.stage;
        const screenCount = parseInt(step.dataset.screenCount) || 1;
        const stageInfo = Utils.getStageInfo(targetStage);
        const screenDefs = stageInfo.screenDefs || [];

        // 【R5 导航守卫】未完成的阶段禁止向前跳转
        const order = ['reveal', 'inspire', 'shape', 'exam'];
        const targetIdx = order.indexOf(targetStage);
        const currentStage = AppState.currentStage || project?.stage || 'reveal';
        const currentIdx = order.indexOf(currentStage);
        if (targetIdx > currentIdx) {
          const completed = project?.completedStages || [];
          const priorDone = order.slice(0, targetIdx).every(s => completed.includes(s));
          if (!priorDone) {
            this.showToast(`请先完成「${Utils.getStageInfo(order[targetIdx - 1]).name}」阶段，再进入「${stageInfo.name}」`);
            return;
          }
        }

        // 如果只有1屏或当前已在目标模块首屏，直接跳转
        if (screenCount <= 1) {
          AppState.navigate(targetStage, { projectId: AppState.currentProjectId, stage: targetStage });
          return;
        }

        // 移除已有菜单
        const existing = document.getElementById('riseScreenPicker');
        if (existing) { existing.remove(); }
        // 再次点击同一阶段则关闭菜单
        if (step._pickerOpen) { step._pickerOpen = false; return; }
        step._pickerOpen = true;

        // 创建屏幕选择下拉菜单
        const picker = document.createElement('div');
        picker.id = 'riseScreenPicker';
        picker.className = 'rise-screen-picker';
        picker.innerHTML = `
          <div class="rise-picker-header">跳转到 ${stageInfo.name} 的任务</div>
          ${screenDefs.map((def, idx) => `
            <div class="rise-picker-item" data-stage="${targetStage}" data-screen="${idx + 1}">
              <span class="rise-picker-num">${idx + 1}</span>
              <span class="rise-picker-info">
                <span class="rise-picker-title">${def.title}</span>
                <span class="rise-picker-sub">${def.subtitle}</span>
              </span>
            </div>
          `).join('')}
        `;
        stepperEl.appendChild(picker);

        // 点击屏幕项 → 跳转
        picker.querySelectorAll('.rise-picker-item').forEach(item => {
          item.addEventListener('click', () => {
            const s = item.dataset.stage;
            const sc = parseInt(item.dataset.screen);
            picker.remove();
            step._pickerOpen = false;
            this.goToScreen(s, sc);
          });
        });

        // 点击外部关闭
        setTimeout(() => {
          const closePicker = (ev) => {
            if (!picker.contains(ev.target) && !ev.target.closest('.rise-step')) {
              picker.remove();
              step._pickerOpen = false;
              document.removeEventListener('click', closePicker);
            }
          };
          document.addEventListener('click', closePicker);
        }, 0);
      });
    });

    // Previous button
    document.getElementById('prevBtn')?.addEventListener('click', () => {
      const currentScreen = getCurrentScreen();
      if (currentScreen > 1) {
        this.saveAndGoToPreviousScreen(stage);
      }
    });

    // Next button
    document.getElementById('nextBtn')?.addEventListener('click', () => {
      const currentScreen = getCurrentScreen();
      if (currentScreen < totalScreens) {
        this.saveAndGoNext(stage, currentScreen + 1);
      }
    });

    // Complete button
    document.getElementById('completeBtn')?.addEventListener('click', () => {
      const cur = AppState.currentScreen || project?.currentScreen || 1;
      if (stage === 'inspire' && cur === 5) this.saveInspireSummary(project);
      if (stage === 'shape' && cur === 4) this.saveShapeSummary(project);
      if (stage === 'exam' && cur === 5) this.saveExamSummary(project);
      this.completeStage(stage);
    });

    // AI Prefill button (generic) - handles screenInput / targetUserInput+sceneDescInput / screenInput2
    document.getElementById('aiPrefillBtn')?.addEventListener('click', async (e) => {
      const screenNum = getCurrentScreen();
      const hasInput = document.getElementById('screenInput') || document.getElementById('screenInput2') || document.getElementById('targetUserInput') || document.getElementById('sceneDescInput');
      if (!hasInput) return;
      const btn = e.currentTarget;
      const aiOn = !!(window.AIService && window.AIService.isReady());
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = aiOn ? '🤖 DeepSeek 生成中...' : 'AI 生成中...';
      try {
        const originalInput = this.getCurrentScreenUserInput();
        const prefill = await AIAssistant.generatePrefillContentAI(
          { stage, screen: screenNum, type: 'text' },
          originalInput,
          AppState.currentProject
        );
        if (prefill?.content) {
          if (originalInput && originalInput.trim().length >= 5) {
            this.showPrefillDiff(originalInput, prefill);
          } else {
            this.applyPrefillContent(prefill.content);
            this.showToast('✨ AI 已生成初稿，你可以继续编辑修订');
          }
        } else {
          this.showToast('暂无生成建议，请补充更多项目信息');
        }
      } catch (err) {
        console.error('[AI] aiPrefillBtn failed:', err);
        if (err.message === 'AI_NOT_CONFIGURED') {
          this.showToast('AI 尚未配置：点右下角 🤖 → ⚙ 填入你的大模型 Key 即可启用');
          setTimeout(() => this.showAIConfigModal(), 800);
        } else {
          this.showToast('AI 生成失败：' + (err.message || '请检查网络或 API Key'));
        }
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });

    // AI Prefill for Reveal Screen 1 - Target User
    document.getElementById('aiPrefillTargetUser')?.addEventListener('click', () => {
      const input = document.getElementById('targetUserInput');
      if (input) {
        const prefill = AIAssistant.generateRevealPrefill(
          project, 'targetUser'
        );
        if (prefill) {
          input.value = prefill;
          input.dispatchEvent(new Event('input'));
          this.showToast('✨ 已智能预填(local)，你可以编辑修订');
        }
      }
    });

    // AI Prefill for Reveal Screen 1 - Scene Description
    document.getElementById('aiPrefillSceneDesc')?.addEventListener('click', () => {
      const input = document.getElementById('sceneDescInput');
      if (input) {
        const prefill = AIAssistant.generateRevealPrefill(
          project, 'sceneDesc'
        );
        if (prefill) {
          input.value = prefill;
          input.dispatchEvent(new Event('input'));
          this.showToast('✨ 已智能预填(local)，你可以编辑修订');
        }
      }
    });

    // Journey Card: Key Finding toggles
    document.querySelectorAll('.journey-keyfinding-toggle').forEach(toggle => {
      toggle.addEventListener('change', () => {
        this.updateKeyFindingsSummary();
        this.saveCurrentScreenContent(stage, AppState.currentScreen || 1);
      });
    });

    // Journey Card: Add new card button
    document.getElementById('addJourneyCardBtn')?.addEventListener('click', () => {
      const container = document.getElementById('journeyCardsContainer');
      const existingCards = container.querySelectorAll('.journey-card');
      const newIndex = existingCards.length + 1;

      const cardHTML = `
        <div class="journey-card" data-card-index="${newIndex}">
          <div class="journey-card-header">
            <span class="journey-card-number">步骤 ${newIndex}</span>
          </div>
          <div class="journey-card-section">
            <span class="journey-section-label">触点 / 阶段</span>
            <textarea class="journey-card-input textarea-sm" data-field="stage" data-card="${newIndex}" placeholder="例如：发现需求" rows="2"></textarea>
            <textarea class="journey-card-input textarea-sm" data-field="challenge" data-card="${newIndex}" placeholder="面对的挑战是..." rows="2"></textarea>
          </div>
          <div class="journey-card-section">
            <span class="journey-section-label">所思 · 所感 · 所做</span>
            <textarea class="journey-card-input textarea-sm" data-field="think" data-card="${newIndex}" placeholder="用户在想什么？" rows="2"></textarea>
            <textarea class="journey-card-input textarea-sm" data-field="feel" data-card="${newIndex}" placeholder="用户的情绪如何？" rows="2"></textarea>
            <textarea class="journey-card-input textarea-sm" data-field="do" data-card="${newIndex}" placeholder="用户做了什么？" rows="2"></textarea>
          </div>
          <div class="journey-card-section">
            <span class="journey-section-label">发现</span>
            <textarea class="journey-card-input textarea-sm" data-field="discovery" data-card="${newIndex}" placeholder="这个触点有什么发现？" rows="2"></textarea>
            <div class="journey-keyfinding-row">
              <input type="checkbox" class="journey-keyfinding-toggle" id="keyFinding_${newIndex}" data-card="${newIndex}" />
              <label class="journey-keyfinding-label" for="keyFinding_${newIndex}">标记为关键发现</label>
            </div>
          </div>
        </div>
      `;

      // Insert before the add button
      const addBtn = document.getElementById('addJourneyCardBtn');
      addBtn.insertAdjacentHTML('beforebegin', cardHTML);

      // Attach events to new card
      const newCard = container.querySelector(`.journey-card[data-card-index="${newIndex}"]`);
      newCard.querySelectorAll('.journey-card-input').forEach(input => {
        input.addEventListener('input', () => {
          clearTimeout(window.journeySaveTimeout);
          window.journeySaveTimeout = setTimeout(() => {
            this.saveCurrentScreenContent(stage, AppState.currentScreen || 1);
          }, 500);
        });
      });

      newCard.querySelector('.journey-keyfinding-toggle')?.addEventListener('change', () => {
        this.updateKeyFindingsSummary();
        this.saveCurrentScreenContent(stage, AppState.currentScreen || 1);
      });

      // Scroll to new card
      newCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    // Task Completion Capsule - Next button
    document.getElementById('capsuleNextBtn')?.addEventListener('click', () => {
      const currentScreen = getCurrentScreen();
      if (currentScreen < totalScreens) {
        this.hideTaskCompletionCapsule();
        this.saveAndGoNext(stage, currentScreen + 1);
      } else {
        this.hideTaskCompletionCapsule();
        this.completeStage(stage);
      }
    });

    // AI FAB
    document.getElementById('aiFab')?.addEventListener('click', () => {
      AppState.toggleAiPanel();
      this.updateAiPanel();
    });

    // AI Panel close
    document.getElementById('aiPanelClose')?.addEventListener('click', () => {
      AppState.closeAiPanel();
      this.updateAiPanel();
    });

    // AI suggestions
    document.querySelectorAll('.ai-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleAiAction(action);
      });
    });

    // AI mode buttons
    document.querySelectorAll('.ai-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AppState.openAiPanel();
        this.selectAIMode(btn.dataset.action);
      });
    });

    // AI mode chat send button
    document.getElementById('aiModeSendBtn')?.addEventListener('click', () => this.sendAIModeMessage());
    document.getElementById('aiModeInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendAIModeMessage();
      }
    });

    // AI 设置入口（模块内 AI 面板齿轮）
    document.getElementById('aiSettingsBtn')?.addEventListener('click', () => {
      this.showAIConfigModal();
    });

    // 刷新 AI 状态展示
    this.refreshAiStatusUI();

    // Auto-save: Input event listeners for real-time saving
    const currentScreenNum = AppState.currentScreen || project?.currentScreen || 1;
    this.setupAutoSave(stage, currentScreenNum);

    // Restore saved content from localStorage
    this.restoreScreenContent(stage, currentScreenNum);

    // FIND step events (Reveal Screen 3)
    this.attachFindEvents(stage, project);

    // Stakeholder + Hypothesis events (Reveal Screen 4)
    this.attachStakeholderEvents(stage, project);

    // Project Briefing events (Reveal Screen 5)
    this.attachBriefingEvents(stage, project);

    // HMW 四维重构 events (Inspire Screen 1)
    this.attachHmwEvents(stage, project);

    // Inspire 重构屏事件 (Screen 2-5)
    if (stage === 'inspire') {
      const cur = AppState.currentScreen || project?.currentScreen || 1;
      if (cur === 2) this.attachInspireNcoEvents(project);
      else if (cur === 3) this.attachInspireIdeasEvents(project);
      else if (cur === 4) this.attachInspireFilterEvents(project);
      else if (cur === 5) this.attachInspireSummaryEvents(project);
    }

    // Shape 四屏事件 (Screen 1-4)
    if (stage === 'shape') {
      const cur = AppState.currentScreen || project?.currentScreen || 1;
      if (cur === 1) this.attachShapeFourDimEvents(project);
      else if (cur === 2) this.attachShapeMinConceptEvents(project);
      else if (cur === 3) this.attachShapeStoryboardEvents(project);
      else if (cur === 4) this.attachShapeSummaryEvents(project);
    }

    // Exam 五屏事件
    if (stage === 'exam') {
      const cur = AppState.currentScreen || project?.currentScreen || 1;
      if (cur === 1) this.attachExamTestPlanEvents(project);
      else if (cur === 2) this.attachExamTestReportEvents(project);
      else if (cur === 3) this.attachExamFourDimEvents(project);
      else if (cur === 4) this.attachExamElevatorEvents(project);
      else if (cur === 5) this.attachExamSummaryEvents(project);
    }

    // Info Capsule - Project info quick view
    this.attachInfoCapsuleEvents(project);
  }

  /**
   * Setup auto-save for screen inputs
   */
  setupAutoSave(stage, screen) {
    const inputs = document.querySelectorAll('#screenInput, #screenInput2, #targetUserInput, #sceneDescInput');
    let saveTimeout = null;

    inputs.forEach(input => {
      if (!input) return;

      // Listen for input events
      input.addEventListener('input', (e) => {
        // Debounce: save after 500ms of no typing
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          this.autoSaveScreenContent(stage, screen, e.target.value);
        }, 500);
      });

      // Also save on blur (when user leaves the field)
      input.addEventListener('blur', () => {
        this.autoSaveScreenContent(stage, screen, input.value);
      });
    });

    // Journey card inputs - save all cards as JSON on any input change
    const journeyInputs = document.querySelectorAll('.journey-card-input');
    if (journeyInputs.length > 0) {
      journeyInputs.forEach(input => {
        input.addEventListener('input', () => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            this.saveCurrentScreenContent(stage, screen);
          }, 500);
        });
      });
    }

    // FIND step inputs - save on any input change
    const findInputs = document.querySelectorAll('.find-step-input');
    if (findInputs.length > 0) {
      findInputs.forEach(input => {
        input.addEventListener('input', () => {
          clearTimeout(saveTimeout);
          saveTimeout = setTimeout(() => {
            this.saveFindData(stage, screen);
          }, 500);
        });
      });
    }
  }

  /**
   * Auto-save screen content to localStorage
   */
  autoSaveScreenContent(stage, screen, content) {
    if (!AppState.currentProjectId) return;
    if (!content || !content.trim()) return;

    const key = `eureka_draft_${AppState.currentProjectId}_${stage}_${screen}`;
    const draftData = {
      content,
      timestamp: Date.now()
    };

    try {
      localStorage.setItem(key, JSON.stringify(draftData));
    } catch (e) {
      console.warn('Auto-save failed:', e);
    }
  }

  /**
   * Restore saved content from localStorage
   */
  restoreScreenContent(stage, screen) {
    if (!AppState.currentProjectId) return;

    const key = `eureka_draft_${AppState.currentProjectId}_${stage}_${screen}`;

    try {
      let saved = localStorage.getItem(key);
      let draftData = null;

      if (saved) {
        draftData = JSON.parse(saved);
      } else {
        // Fallback: restore from project.cards if draft not found
        const project = window.EurekaStorage.getProject(AppState.currentProjectId);
        const cardTypeMap = {
          reveal: ['scene', 'journey', 'findInsight', 'businessGoal', 'projectBriefing'],
          inspire: ['hmw', 'ncoInspiration', 'ideas', 'filteredIdeas', 'bestIdea'],
          shape: ['shapeFourDim', 'shapeMinConcept', 'shapeStoryboard', 'shapeSummary'],
          exam: ['examTestPlan', 'examTestReport', 'examFourDimEval', 'examElevator', 'examSummary']
        };
        const cardTypes = cardTypeMap[stage] || [];
        const cardType = cardTypes[screen - 1];
        if (cardType && project?.cards?.[cardType]) {
          const cardData = project.cards[cardType];
          draftData = {
            content: typeof cardData === 'string' ? cardData : (cardData.content || JSON.stringify(cardData)),
            timestamp: Date.now()
          };
        }
      }

      if (draftData && draftData.content) {
        const input = document.getElementById('screenInput');
        const input2 = document.getElementById('screenInput2');
        const targetUserInput = document.getElementById('targetUserInput');
        const sceneDescInput = document.getElementById('sceneDescInput');

        if (draftData.content) {
          // Reveal Screen 1: parse combined format
          if (targetUserInput && sceneDescInput) {
            const targetMatch = draftData.content.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
            const sceneMatch = draftData.content.match(/【场景描述】(.+)$/s);
            if (targetMatch && !targetUserInput.value.trim()) {
              targetUserInput.value = targetMatch[1].trim();
            }
            if (sceneMatch && !sceneDescInput.value.trim()) {
              sceneDescInput.value = sceneMatch[1].trim();
            }
            return;
          }

          // Reveal Screen 2: journey cards JSON
          const journeyCards = document.querySelectorAll('.journey-card');
          if (journeyCards.length > 0) {
            try {
              const cardsData = JSON.parse(draftData.content);
              if (Array.isArray(cardsData)) {
                cardsData.forEach((cardData, index) => {
                  const card = document.querySelector(`.journey-card[data-card-index="${index + 1}"]`);
                  if (card) {
                    const cardIndex = index + 1;
                    const setField = (name, value) => {
                      const el = card.querySelector(`[data-field="${name}"][data-card="${cardIndex}"]`);
                      if (el && value) el.value = value;
                    };
                    setField('stage', cardData.stage);
                    setField('challenge', cardData.challenge);
                    setField('think', cardData.think);
                    setField('feel', cardData.feel);
                    setField('do', cardData.do);
                    setField('discovery', cardData.discovery);

                    const toggle = card.querySelector(`#keyFinding_${cardIndex}`);
                    if (toggle && cardData.isKeyFinding) {
                      toggle.checked = true;
                    }
                  }
                });
                // Update findings summary after restore
                this.updateKeyFindingsSummary();
              }
            } catch (e) {
              console.warn('Restore journey cards failed:', e);
            }
            return;
          }

          // Reveal Screen 3: FIND data JSON (new format: { findings, activeFindingIndex })
          const findContainer = document.getElementById('findContainer');
          if (findContainer) {
            try {
              const savedData = JSON.parse(draftData.content);
              const restoreFinding = (data) => {
                const setFindInput = (key, value) => {
                  const el = document.getElementById(`findInput_${key}`);
                  if (el && value && !el.value.trim()) el.value = value;
                };
                setFindInput('fact', data.fact);
                setFindInput('interpret', data.interpret);
                setFindInput('need', data.need);
                setFindInput('distill', data.distill);

                // Restore AI output content for each step
                const setFindOutput = (key, value) => {
                  const stepBody = document.querySelector(`.find-step[data-step="${key}"] .find-step-body`);
                  if (value && stepBody) {
                    let el = document.getElementById(`findOutput_${key}`);
                    if (!el) {
                      el = document.createElement('div');
                      el.className = 'find-step-output';
                      el.id = `findOutput_${key}`;
                      const btn = document.getElementById(`findBtn_${key}`);
                      if (btn) {
                        stepBody.insertBefore(el, btn);
                      } else {
                        stepBody.appendChild(el);
                      }
                    }
                    const outputLabel = key === 'fact' ? 'AI 解释建议' :
                      key === 'interpret' ? 'AI 需求建议' :
                      key === 'need' ? 'AI 洞察建议' : '';
                    // Clean up old data that may include label text
                    let cleanValue = value;
                    const labelPatterns = ['AI 解释建议', 'AI 需求建议', 'AI 洞察建议'];
                    for (const p of labelPatterns) {
                      if (cleanValue.startsWith(p)) {
                        cleanValue = cleanValue.slice(p.length).trim();
                        break;
                      }
                    }
                    el.innerHTML = `<div class="find-step-output-label">${outputLabel}</div>${cleanValue}`;
                  }
                };
                setFindOutput('fact', data.factOutput);
                setFindOutput('interpret', data.interpretOutput);
                setFindOutput('need', data.needOutput);
                setFindOutput('distill', data.distillOutput);

                const completedSteps = data.completedSteps || [];
                completedSteps.forEach(stepKey => {
                  const stepEl = document.querySelector(`.find-step[data-step="${stepKey}"]`);
                  const btn = document.getElementById(`findBtn_${stepKey}`);
                  if (stepEl) {
                    stepEl.classList.add('completed');
                    stepEl.classList.remove('locked');
                  }
                  if (btn) {
                    btn.disabled = true;
                    btn.textContent = '✓ 已确认';
                  }
                  const summaryEl = stepEl?.querySelector('.find-step-summary');
                  if (summaryEl) {
                    summaryEl.textContent = data[stepKey] || '';
                    summaryEl.style.display = 'block';
                  }
                });

                const steps = ['fact', 'interpret', 'need', 'distill'];
                steps.forEach((stepKey, index) => {
                  if (completedSteps.includes(stepKey)) {
                    const nextStep = steps[index + 1];
                    if (nextStep) {
                      const nextEl = document.querySelector(`.find-step[data-step="${nextStep}"]`);
                      if (nextEl) {
                        nextEl.classList.remove('locked');
                        nextEl.classList.add('active');
                      }
                    }
                  }
                });

                if (completedSteps.length === 4) {
                  const banner = document.getElementById('findCompleteBanner');
                  if (banner) banner.classList.add('show');
                }
              };

              // New format
              if (Array.isArray(savedData.findings)) {
                const activeIdx = savedData.activeFindingIndex || 0;
                findContainer.dataset.activeIndex = activeIdx;
                // Highlight active tab (template already renders correct finding's steps)
                document.querySelectorAll('.find-tab').forEach((tab, i) => {
                  tab.classList.toggle('active', i === activeIdx);
                });
                // Restore current finding's data
                const finding = savedData.findings[activeIdx];
                if (finding) restoreFinding(finding);
              }
              // Old format migration
              else if (savedData.fact !== undefined) {
                restoreFinding(savedData);
              }
            } catch (e) {
              console.warn('Restore FIND data failed:', e);
            }
            return;
          }

          // If current input is empty, restore from draft
          if (input && !input.value.trim()) {
            input.value = draftData.content;
          } else if (input2 && !input2.value.trim() && !input?.value.trim()) {
            input2.value = draftData.content;
          }
        }

        // Reveal Screen 4: Stakeholder + Hypothesis data JSON
        const stakeholderCards = document.getElementById('stakeholderCards');
        if (stakeholderCards) {
          try {
            const t4Data = JSON.parse(draftData.content);
            if (t4Data.stakeholders || t4Data.hypotheses) {
              // Restore stakeholder cards
              if (t4Data.stakeholders?.stakeholders) {
                stakeholderCards.innerHTML = this.getStakeholderCardsHTML(t4Data.stakeholders);
                this.attachStakeholderCardEvents(stage);

                // Restore consensus
                if (t4Data.stakeholders.consensus) {
                  const consensusSection = document.getElementById('stakeholderConsensus');
                  const consensusContent = document.getElementById('consensusContent');
                  if (consensusSection) consensusSection.style.display = 'block';
                  if (consensusContent) consensusContent.textContent = t4Data.stakeholders.consensus;
                }

                // Show consensus button if 2+ stakeholders
                if (t4Data.stakeholders.stakeholders.length > 1) {
                  const consensusBtn = document.getElementById('generateConsensusBtn');
                  if (consensusBtn) consensusBtn.style.display = 'inline-flex';
                }
              }

              // Restore hypothesis cards
              const hypothesisCardsEl = document.getElementById('hypothesisCards');
              if (hypothesisCardsEl && t4Data.hypotheses?.hypotheses) {
                hypothesisCardsEl.innerHTML = this.getHypothesisCardsHTML(t4Data.hypotheses);
                this.attachHypothesisCardEvents(stage);

                // Show confirm button if has hypotheses
                if (t4Data.hypotheses.hypotheses.length > 0) {
                  const confirmBtn = document.getElementById('confirmHypothesisBtn');
                  if (confirmBtn) confirmBtn.style.display = 'inline-flex';
                }

                // Show confirmed badge
                if (t4Data.hypotheses.confirmed) {
                  const confirmedEl = document.getElementById('hypothesisConfirmed');
                  if (confirmedEl) confirmedEl.style.display = 'flex';
                }
              }

              return;
            }
          } catch (e) {
            console.warn('Restore T4 data failed:', e);
          }
        }

        // Reveal Screen 5: Project Briefing data
        const briefingContainer = document.getElementById('briefingContainer');
        if (briefingContainer) {
          try {
            const project = window.EurekaStorage.getProject(AppState.currentProjectId);
            const briefingSaved = project?.cards?.projectBriefing;
            if (briefingSaved) {
              const briefingData = typeof briefingSaved === 'string'
                ? JSON.parse(briefingSaved.content || briefingSaved)
                : briefingSaved.content ? JSON.parse(briefingSaved.content) : briefingSaved;

              // Restore fields
              const themeEl = document.getElementById('briefingTheme');
              const targetUserEl = document.getElementById('briefingTargetUser');
              const sceneEl = document.getElementById('briefingScene');
              const insightEl = document.getElementById('briefingInsight');
              const consensusEl = document.getElementById('briefingConsensus');

              if (themeEl && briefingData.theme) themeEl.value = briefingData.theme;
              if (targetUserEl && briefingData.targetUser) targetUserEl.value = briefingData.targetUser;
              if (sceneEl && briefingData.scene) sceneEl.value = briefingData.scene;
              if (insightEl && briefingData.insight) insightEl.value = briefingData.insight;
              if (consensusEl && briefingData.consensus) consensusEl.value = briefingData.consensus;

              // Restore market hypothesis data (if editable fields exist in briefing)
              if (briefingData.hypothesis) {
                const tamEl = document.getElementById('briefingTAM');
                const samEl = document.getElementById('briefingSAM');
                const somEl = document.getElementById('briefingSOM');
                const compEl = document.getElementById('briefingCompetitors');
                const alignEl = document.getElementById('briefingAlignment');
                const notesEl = document.getElementById('briefingNotes');
                if (tamEl && briefingData.hypothesis.tam) tamEl.value = briefingData.hypothesis.tam;
                if (samEl && briefingData.hypothesis.sam) samEl.value = briefingData.hypothesis.sam;
                if (somEl && briefingData.hypothesis.som) somEl.value = briefingData.hypothesis.som;
                if (compEl && briefingData.hypothesis.competitors) compEl.value = briefingData.hypothesis.competitors;
                if (alignEl && briefingData.hypothesis.alignment) alignEl.value = briefingData.hypothesis.alignment;
                if (notesEl && briefingData.hypothesis.notes) notesEl.value = briefingData.hypothesis.notes;
              }
            }
          } catch (e) {
            console.warn('Restore briefing data failed:', e);
          }
          return;
        }

        // If current input is empty, restore saved content
        if (input && !input.value.trim()) {
          input.value = draftData.content;
        } else if (input2 && !input2.value.trim() && !input?.value.trim()) {
          input2.value = draftData.content;
        }
      }
    } catch (e) {
      console.warn('Restore failed:', e);
    }
  }

  /**
   * Clear draft after saving to card
   */
  clearDraft(stage, screen) {
    if (!AppState.currentProjectId) return;
    const key = `eureka_draft_${AppState.currentProjectId}_${stage}_${screen}`;
    localStorage.removeItem(key);
  }

  goToScreen(stage, screen) {
    if (!AppState.currentProjectId) return;

    window.EurekaStorage.updateProject(AppState.currentProjectId, {
      currentScreen: screen
    });

    AppState.navigate(stage, { projectId: AppState.currentProjectId, screen });
  }

  /**
   * Save current screen and go to previous screen
   * Preserves content of the screen we're going back to
   */
  saveAndGoToPreviousScreen(stage) {
    const currentScreen = AppState.currentScreen || 1;
    const previousScreen = currentScreen - 1;

    if (previousScreen < 1) return;

    // Save current screen content
    this.saveCurrentScreenContent(stage, currentScreen);

    // Don't clear draft for the screen we're going back to
    // We want to preserve the content there

    // Go to previous screen
    this.goToScreen(stage, previousScreen);
  }

  /**
   * Update key findings summary based on checked toggles
   */
  updateKeyFindingsSummary() {
    const summaryList = document.getElementById('keyFindingsList');
    const countEl = document.getElementById('keyFindingsCount');
    if (!summaryList || !countEl) return;

    const keyFindings = [];
    document.querySelectorAll('.journey-keyfinding-toggle:checked').forEach(toggle => {
      const cardIndex = toggle.dataset.card;
      const discoveryInput = document.querySelector(`.journey-card-input[data-field="discovery"][data-card="${cardIndex}"]`);
      const stageInput = document.querySelector(`.journey-card-input[data-field="stage"][data-card="${cardIndex}"]`);
      const discovery = discoveryInput?.value?.trim();
      const stage = stageInput?.value?.trim();
      if (discovery) {
        keyFindings.push({ stage: stage || `步骤 ${cardIndex}`, discovery });
      }
    });

    countEl.textContent = keyFindings.length;

    if (keyFindings.length === 0) {
      summaryList.innerHTML = `<div class="journey-finding-item-empty">勾选卡片上的「关键发现」，内容将自动汇总到这里</div>`;
      return;
    }

    summaryList.innerHTML = keyFindings.map((item, i) => `
      <div class="journey-finding-item">
        <span class="journey-finding-item-icon">${i + 1}.</span>
        <div>
          <div style="font-size: var(--font-size-xs); color: var(--reveal-primary); margin-bottom: 2px;">${item.stage}</div>
          <div>${this.escapeHtml(item.discovery)}</div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Save current screen content helper
   */
  saveCurrentScreenContent(stage, screen) {
    // 获取当前 project（函数参数可能没有传入，从存储补取）
    const _p = window.EurekaStorage.getProject(AppState.currentProjectId);

    // Inspire 重构屏：数据已随交互即时持久化，这里做镜像兜底
    if (stage === 'inspire') {
      const sc = screen || AppState.currentScreen || 1;
      if (sc === 2) { this.saveNcoData(); return; }
      if (sc === 3) { this.saveIdeasData(); return; }
      if (sc === 4) { this.saveFilterData(); return; }
      // Screen 5 仅在用户确认时写入 inspireSummary
      return;
    }

    // Shape 四屏：数据已随交互即时持久化
    if (stage === 'shape') {
      const sc = screen || AppState.currentScreen || 1;
      if (sc === 1) { this.saveShapeFourDimData(_p); return; }
      if (sc === 2) { this.saveShapeMinConceptData(_p); return; }
      if (sc === 3) { this.saveShapeStoryboardData(_p); return; }
      // Screen 4 仅在用户确认时写入 shapeSummary
      return;
    }

    // Exam 五屏：自定义屏即时持久化
    if (stage === 'exam') {
      const sc = screen || AppState.currentScreen || 1;
      if (sc === 1) { this.saveExamTestPlanData(_p); return; }
      if (sc === 2) { this.saveExamTestReportData(_p); return; }
      if (sc === 3) { this.saveExamFourDimData(_p); return; }
      if (sc === 4) { this.saveExamElevatorData(_p); return; }
      if (sc === 5) return; // 仅在用户确认时写入 examSummary
    }

    const screenInput = document.getElementById('screenInput');
    const screenInput2 = document.getElementById('screenInput2');
    const targetUserInput = document.getElementById('targetUserInput');
    const sceneDescInput = document.getElementById('sceneDescInput');

    // Reveal Screen 1: combine target user + scene description
    if (targetUserInput || sceneDescInput) {
      const targetUser = targetUserInput?.value?.trim() || '';
      const sceneDesc = sceneDescInput?.value?.trim() || '';
      if (targetUser || sceneDesc) {
        const combined = `【目标用户】${targetUser}\n【场景描述】${sceneDesc}`;
        this.saveScreenContent(stage, screen, combined);
        // Keep draft for backup until stage complete
        this.autoSaveScreenContent(stage, screen, combined);
      }
      return;
    }

    // Reveal Screen 2: journey cards
    const journeyCards = document.querySelectorAll('.journey-card');
    if (journeyCards.length > 0) {
      const cardsData = Array.from(journeyCards).map(card => {
        const cardIndex = card.dataset.cardIndex;
        const getField = (name) => card.querySelector(`[data-field="${name}"][data-card="${cardIndex}"]`)?.value?.trim() || '';
        const isKeyFinding = card.querySelector(`#keyFinding_${cardIndex}`)?.checked || false;
        return {
          stage: getField('stage'),
          challenge: getField('challenge'),
          think: getField('think'),
          feel: getField('feel'),
          do: getField('do'),
          discovery: getField('discovery'),
          isKeyFinding
        };
      }).filter(card => card.stage || card.challenge || card.think || card.feel || card.do || card.discovery);

      if (cardsData.length > 0) {
        const json = JSON.stringify(cardsData);
        this.saveScreenContent(stage, screen, json);
        this.autoSaveScreenContent(stage, screen, json);
      }
      return;
    }

    // Reveal Screen 3: FIND data
    const findContainer = document.getElementById('findContainer');
    if (findContainer) {
      this.saveFindData(stage, screen);
      return;
    }

    // Inspire Screen 1: HMW data
    const hmwContainer = document.querySelector('.hmw-dimensions-section');
    if (hmwContainer) {
      this.saveHmwData(stage);
      return;
    }

    if (screenInput && screenInput.value.trim()) {
      this.saveScreenContent(stage, screen, screenInput.value);
      this.autoSaveScreenContent(stage, screen, screenInput.value);
    }
    if (screenInput2 && screenInput2.value.trim()) {
      this.saveScreenContent(stage, screen, screenInput2.value);
      this.autoSaveScreenContent(stage, screen, screenInput2.value);
    }
  }

  /**
   * Read findings array from saved data (supports old and new format)
   */
  getFindFindings() {
    const project = window.EurekaStorage.getProject(AppState.currentProjectId);
    if (!project?.cards?.findInsight) return [];
    try {
      let raw = project.cards.findInsight;
      if (typeof raw === 'object' && raw !== null && raw.content) {
        raw = raw.content;
      }
      const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (Array.isArray(saved.findings)) return saved.findings;
      // Migrate old format
      if (saved.fact !== undefined) {
        return [{
          sourceFinding: '',
          fact: saved.fact || '',
          interpret: saved.interpret || '',
          need: saved.need || '',
          distill: saved.distill || '',
          completedSteps: saved.completedSteps || [],
          factOutput: saved.factOutput || '',
          interpretOutput: saved.interpretOutput || '',
          needOutput: saved.needOutput || '',
          distillOutput: saved.distillOutput || ''
        }];
      }
    } catch (e) {
      console.warn('getFindFindings failed:', e);
    }
    return [];
  }

  /**
   * Save full findings array back to storage
   */
  saveFindFindings(stage, screen, findings, activeIndex) {
    const json = JSON.stringify({ findings, activeFindingIndex: activeIndex || 0 });
    this.saveScreenContent(stage, screen, json);
    this.autoSaveScreenContent(stage, screen, json);
  }

  /**
   * Save FIND step data — saves the active finding's data into the findings array
   */
  saveFindData(stage, screen) {
    const factInput = document.getElementById('findInput_fact');
    if (!factInput) return;

    const container = document.getElementById('findContainer');
    const activeIndex = container ? parseInt(container.dataset.activeIndex) || 0 : 0;

    const findings = this.getFindFindings();
    if (activeIndex < 0 || activeIndex >= findings.length) return;

    // Read current UI state
    const completedSteps = [];
    document.querySelectorAll('.find-step-btn').forEach(btn => {
      if (btn.disabled && btn.textContent.includes('已确认')) {
        const stepKey = btn.dataset.step;
        if (stepKey && !completedSteps.includes(stepKey)) {
          completedSteps.push(stepKey);
        }
      }
    });

    // Helper: extract AI output content without the label
    const getOutputContent = (key) => {
      const el = document.getElementById(`findOutput_${key}`);
      if (!el) return '';
      const clone = el.cloneNode(true);
      const label = clone.querySelector('.find-step-output-label');
      if (label) label.remove();
      return clone.textContent.trim();
    };

    findings[activeIndex] = {
      ...findings[activeIndex],
      fact: document.getElementById('findInput_fact')?.value?.trim() || '',
      factOutput: getOutputContent('fact'),
      interpret: document.getElementById('findInput_interpret')?.value?.trim() || '',
      interpretOutput: getOutputContent('interpret'),
      need: document.getElementById('findInput_need')?.value?.trim() || '',
      needOutput: getOutputContent('need'),
      distill: document.getElementById('findInput_distill')?.value?.trim() || '',
      distillOutput: getOutputContent('distill'),
      completedSteps
    };

    this.saveFindFindings(stage, screen, findings, activeIndex);
  }

  /**
   * Attach events for FIND steps (new: supports multiple findings via tabs)
   */
  attachFindEvents(stage, project) {
    const findContainer = document.getElementById('findContainer');
    if (!findContainer) {
      console.warn('[FIND] findContainer not found, skipping event attachment');
      return;
    }

    const buttons = document.querySelectorAll('.find-step-btn');
    console.log('[FIND] Attaching events to', buttons.length, 'buttons');

    // Tab switching: save current data, switch active tab, re-render
    document.querySelectorAll('.find-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        // Save current finding data before switching
        this.saveFindData(stage, AppState.currentScreen || 1);

        const newIndex = parseInt(tab.dataset.index);
        const findings = this.getFindFindings();
        if (newIndex < 0 || newIndex >= findings.length) return;

        // Update activeFindingIndex in saved data
        const project = window.EurekaStorage.getProject(AppState.currentProjectId);
        if (project?.cards?.findInsight) {
          try {
            let raw = project.cards.findInsight;
            if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
            const saved = typeof raw === 'string' ? JSON.parse(raw) : raw;
            saved.activeFindingIndex = newIndex;
            this.saveFindFindings(stage, AppState.currentScreen || 1, saved.findings || findings, newIndex);
          } catch (e) {
            this.saveFindFindings(stage, AppState.currentScreen || 1, findings, newIndex);
          }
        }

        // Re-render the entire module to reflect the switched finding
        this.renderModule('reveal');
      });
    });

    // Find step buttons
    document.querySelectorAll('.find-step-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        console.log('[FIND] Button clicked, step=', btn.dataset.step, 'disabled=', btn.disabled);
        try {
          const stepKey = btn.dataset.step;
          const input = document.getElementById(`findInput_${stepKey}`);
          if (!input || !input.value.trim()) {
            this.showToast(I18N.t('find.emptyInput', 'Please fill in the content first'));
            return;
          }

          // Show loading state
          btn.classList.add('loading');
          const originalText = btn.textContent;
          btn.textContent = 'AI thinking...';

          // Collect context from previous steps of the CURRENT finding + project context
          const findings = this.getFindFindings();
          const container = document.getElementById('findContainer');
          const activeIndex = container ? parseInt(container.dataset.activeIndex) || 0 : 0;
          const currentFinding = findings[activeIndex] || {};
          const project = window.EurekaStorage.getProject(AppState.currentProjectId);
          const projectCtx = this.getProjectContext(project);
          const context = {
            fact: currentFinding.fact || '',
            interpret: currentFinding.interpret || '',
            need: currentFinding.need || '',
            distill: currentFinding.distill || '',
            scene: this.getSceneContext(),
            finding: currentFinding.sourceFinding || input.value.trim(),
            targetUser: projectCtx.targetUser || '',
            sceneDesc: projectCtx.sceneDesc || ''
          };

          // Call AI to generate next step
          let result;
          try {
            console.log('[FIND] Calling AI for step', stepKey);
            result = await AIAssistant.generateFindStep(stepKey, input.value.trim(), context);
            console.log('[FIND] AI result length=', result ? result.length : 0);
          } catch (e) {
            console.error('AI generation failed:', e);
            result = null;
          }

          btn.classList.remove('loading');
          btn.textContent = originalText;

          if (result) {
            const outputId = `findOutput_${stepKey}`;
            let outputEl = document.getElementById(outputId);
            const stepBody = btn.closest('.find-step-body');

            if (!outputEl && stepBody) {
              outputEl = document.createElement('div');
              outputEl.className = 'find-step-output';
              outputEl.id = outputId;
              stepBody.insertBefore(outputEl, btn);
            }

            const outputLabel = stepKey === 'fact' ? 'I 解释（Why? 为什么会发生）' :
              stepKey === 'interpret' ? 'N 需求（Why? 真正需要什么）' :
              stepKey === 'need' ? 'D 洞察/POV（So What? 创新机会）' :
              stepKey === 'distill' ? '✨ 最终 POV（创新北极星）' : '';

            if (outputEl) {
              outputEl.innerHTML = `<div class="find-step-output-label">${outputLabel}</div>${result}`;
            }

            // Mark step as completed
            btn.disabled = true;
            btn.textContent = '✓ 已确认';

            const stepEl = btn.closest('.find-step');
            if (stepEl) stepEl.classList.add('completed');

            // Show summary
            let summaryEl = stepEl?.querySelector('.find-step-summary');
            if (!summaryEl && stepEl) {
              summaryEl = document.createElement('div');
              summaryEl.className = 'find-step-summary';
              stepEl.appendChild(summaryEl);
            }
            if (summaryEl) {
              summaryEl.textContent = input.value.trim();
              summaryEl.style.display = 'block';
            }

            // Unlock next step
            const nextStepIndex = parseInt(stepEl?.dataset?.index) + 1;
            const nextStepEl = document.querySelector(`.find-step[data-index="${nextStepIndex}"]`);
            if (nextStepEl) {
              nextStepEl.classList.remove('locked');
              nextStepEl.classList.add('active');
              const nextInput = nextStepEl.querySelector('.find-step-input');
              if (nextInput && !nextInput.value.trim()) {
                nextInput.value = result;
              }
              setTimeout(() => {
                nextStepEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            } else {
              const banner = document.getElementById('findCompleteBanner');
              if (banner) banner.classList.add('show');
            }

            // Save to current finding
            this.saveFindData(stage, AppState.currentScreen || 1);
            console.log('[FIND] Data saved, step completed');

            // Update tab badge without full re-render
            this.updateFindTabBadges();
          } else {
            this.showToast('AI 生成失败：请确认已在 ⚙ 配置大模型 Key（右下角 🤖 → ⚙）');
          }
        } catch (err) {
          console.error('[FIND] Button click handler error:', err);
          this.showToast('处理出错，请刷新页面重试');
        }
      });
    });
  }

  /**
   * Update FIND tab badges after step completion (without full re-render)
   */
  updateFindTabBadges() {
    const findings = this.getFindFindings();
    const container = document.getElementById('findContainer');
    const activeIndex = container ? parseInt(container.dataset.activeIndex) || 0 : 0;
    findings.forEach((f, i) => {
      const tab = document.getElementById(`findTab_${i}`);
      if (!tab) return;
      const isCompleted = (f.completedSteps || []).length === 4;
      const stepCount = (f.completedSteps || []).length;
      const badge = tab.querySelector('.find-tab-badge');
      if (badge) {
        badge.textContent = isCompleted ? '✓' : (stepCount || '〇');
      }
      tab.classList.toggle('completed', isCompleted);
    });
  }

  /**
   * Get scene context for AI generation
   */
  getSceneContext() {
    const project = window.EurekaStorage.getProject(AppState.currentProjectId);
    if (!project?.cards?.scene) return '';
    try {
      let raw = project.cards.scene;
      if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
      const scene = typeof raw === 'string' ? JSON.parse(raw) : raw;
      return `目标用户：${scene.targetUser || ''}\n场景描述：${scene.sceneDesc || ''}`;
    } catch (e) {
      return '';
    }
  }

  /**
   * Attach events for Stakeholder + Business Hypothesis screen
   */
  attachStakeholderEvents(stage, project) {
    // AI 识别利益相关方
    document.getElementById('generateStakeholdersBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('generateStakeholdersBtn');
      btn.classList.add('loading');
      btn.innerHTML = '<span>AI thinking...</span>';

      let result;
      try {
        result = await AIAssistant.generateStakeholders(project);
      } catch (e) {
        console.error('AI stakeholder generation failed:', e);
        result = null;
      }

      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        ⚡ AI identify stakeholders
      `;

      if (result && result.stakeholders) {
        const cardsContainer = document.getElementById('stakeholderCards');
        if (cardsContainer) {
          cardsContainer.innerHTML = this.getStakeholderCardsHTML({ stakeholders: result.stakeholders });
        }
        this.saveStakeholderData(stage);
        this.attachStakeholderCardEvents(stage);
      } else {
        this.showToast('AI 生成失败：请确认已在 ⚙ 配置大模型 Key（右下角 🤖 → ⚙）');
      }
    });

    // AI 生成商业假设
    document.getElementById('generateHypothesisBtn')?.addEventListener('click', async () => {
      const btn = document.getElementById('generateHypothesisBtn');
      btn.classList.add('loading');
      btn.innerHTML = '<span>AI thinking...</span>';

      let result;
      try {
        const findData = this.getFindDataForHypothesis();
        const stakeholders = this.getStakeholderDataFromUI();
        result = await AIAssistant.generateBusinessHypothesis(findData, stakeholders, project);
      } catch (e) {
        console.error('AI hypothesis generation failed:', e);
        result = null;
      }

      btn.classList.remove('loading');
      btn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
        ⚡ AI generate business hypothesis
      `;

      if (result && (result.tam || result.sam || result.competitors)) {
        const cardsContainer = document.getElementById('hypothesisCards');
        if (cardsContainer) {
          cardsContainer.innerHTML = this.getHypothesisCardsHTML(result);
        }
        // Show confirm button
        const confirmBtn = document.getElementById('confirmHypothesisBtn');
        if (confirmBtn) confirmBtn.style.display = 'inline-flex';
        this.saveStakeholderData(stage);
        this.attachHypothesisCardEvents(stage);
      } else {
        this.showToast('AI 生成失败：请确认已在 ⚙ 配置大模型 Key（右下角 🤖 → ⚙）');
      }
    });

    // 确认并提交按钮
    document.getElementById('confirmHypothesisBtn')?.addEventListener('click', () => {
      const confirmedEl = document.getElementById('hypothesisConfirmed');
      if (confirmedEl) confirmedEl.style.display = 'flex';
      this.saveStakeholderData(stage, true);
      this.showToast('商业假设已确认！');

      // Navigate to next screen (T5: Project Briefing) if not on last screen
      const currentScreen = AppState.currentScreen || 1;
      const stageInfo = Utils.getStageInfo(stage);
      if (currentScreen < stageInfo.screens) {
        setTimeout(() => {
          this.saveAndGoNext(stage, currentScreen + 1);
        }, 800);
      }
    });

    // Attach existing card events
    this.attachStakeholderCardEvents(stage);
    this.attachHypothesisCardEvents(stage);
  }

  /**
   * Attach events for Project Briefing screen (Reveal Screen 5)
   */
  attachBriefingEvents(stage, project) {
    // Check if briefing elements exist
    const briefingContainer = document.getElementById('briefingContainer');
    if (!briefingContainer) return;

    // Save button
    document.getElementById('saveBriefingBtn')?.addEventListener('click', () => {
      this.saveBriefingData(stage);
      this.showToast('✅ 项目简报已保存');
    });

    // Confirm button
    document.getElementById('confirmBriefingBtn')?.addEventListener('click', () => {
      this.saveBriefingData(stage);
      this.showToast('✅ 项目简报已确认并提交');
      // Mark stage as complete
      this.completeStage(stage);
    });

    // Auto-save on input changes
    document.querySelectorAll('#briefingContainer input, #briefingContainer textarea').forEach(el => {
      el.addEventListener('input', () => {
        // Debounced save
        clearTimeout(this._briefingSaveTimeout);
        this._briefingSaveTimeout = setTimeout(() => {
          this.saveBriefingData(stage);
        }, 1000);
      });
    });
  }

  /**
   * Attach events for HMW 四维重构 screen (Inspire Screen 1)
   */
  attachHmwEvents(stage, project) {
    const hmwContainer = document.querySelector('.hmw-dimensions-section');
    if (!hmwContainer) return;

    // Dimension card expand/collapse
    document.querySelectorAll('.hmw-dimension-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('.hmw-dimension-icon')) return;
        const card = header.closest('.hmw-dimension-card');
        card.classList.toggle('expanded');
        const arrow = header.querySelector('.hmw-dimension-arrow');
        if (arrow) arrow.textContent = card.classList.contains('expanded') ? '▲' : '▼';
      });
    });

    // AI generate suggestions
    document.querySelectorAll('.hmw-ai-gen-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dimKey = btn.dataset.dim;
        const pov = this.getHmwPovFromInputs();
        btn.classList.add('loading');
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span>⏳</span> AI thinking...';

        try {
          const suggestions = await AIAssistant.generateHmwSuggestions(dimKey, pov);
          if (suggestions && suggestions.length > 0) {
            const listEl = document.querySelector(`.hmw-items-list[data-dim="${dimKey}"]`);
            suggestions.forEach(text => {
              const id = 'hmw_' + dimKey + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
              const item = { id, text, dimKey };
              const html = this.getHmwItemHtml(item, this.getDimColor(dimKey));
              listEl.insertAdjacentHTML('beforeend', html);
            });
            this.updateHmwDimensionCount(dimKey);
            this.updateHmwTotalCount();
            this.saveHmwData(stage);
            this.renderModule('inspire');
            this.showToast('✨ AI 已生成 ' + suggestions.length + ' 条建议');
          }
        } catch (e) {
          console.error('AI HMW generation failed:', e);
          this.showToast('AI 生成失败：请确认已在 ⚙ 配置大模型 Key（右下角 🤖 → ⚙）');
        }

        btn.classList.remove('loading');
        btn.disabled = false;
        btn.innerHTML = originalText;
      });
    });

    // Manual add HMW
    document.querySelectorAll('.hmw-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const dimKey = btn.dataset.dim;
        const input = document.querySelector(`.hmw-add-input[data-dim="${dimKey}"]`);
        const text = input?.value?.trim();
        if (!text) return;

        const id = 'hmw_' + dimKey + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        const listEl = document.querySelector(`.hmw-items-list[data-dim="${dimKey}"]`);
        const item = { id, text, dimKey };
        const html = this.getHmwItemHtml(item, this.getDimColor(dimKey));
        listEl.insertAdjacentHTML('beforeend', html);
        input.value = '';
        this.updateHmwDimensionCount(dimKey);
        this.updateHmwTotalCount();
        this.saveHmwData(stage);
        this.renderModule('inspire');
      });
    });

    // Delete HMW item
    hmwContainer.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.hmw-item-delete');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const item = document.querySelector(`.hmw-item[data-id="${id}"]`);
        if (item) {
          const dimCard = item.closest('.hmw-dimension-card');
          item.remove();
          if (dimCard) {
            const dimKey = dimCard.dataset.dim;
            this.updateHmwDimensionCount(dimKey);
          }
          this.updateHmwTotalCount();
          this.saveHmwData(stage);
          this.renderModule('inspire');
        }
      }
    });

    // POV inputs auto-save
    document.querySelectorAll('.hmw-pov-input').forEach(input => {
      input.addEventListener('input', () => {
        clearTimeout(this._hmwSaveTimeout);
        this._hmwSaveTimeout = setTimeout(() => {
          this.saveHmwData(stage);
        }, 500);
      });
    });

    // Evaluation score buttons
    document.querySelectorAll('.hmw-score-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const metric = btn.dataset.metric;
        const delta = parseInt(btn.dataset.delta);
        const valEl = document.getElementById(`score_${metric === 'userValue' ? 'uv' : metric === 'businessValue' ? 'bv' : 'fe'}_${id}`);
        if (!valEl) return;
        let val = parseInt(valEl.textContent) || 3;
        val = Math.max(1, Math.min(5, val + delta));
        valEl.textContent = val;

        // Update total
        const uv = parseInt(document.getElementById(`score_uv_${id}`)?.textContent || 3);
        const bv = parseInt(document.getElementById(`score_bv_${id}`)?.textContent || 3);
        const fe = parseInt(document.getElementById(`score_fe_${id}`)?.textContent || 3);
        const totalEl = document.getElementById(`score_total_${id}`);
        if (totalEl) totalEl.textContent = uv + bv + fe;

        this.saveHmwData(stage);
      });
    });

    // Evaluation checkbox — enforce max 2 selected best HMW
    document.querySelectorAll('.hmw-eval-check').forEach(check => {
      check.addEventListener('change', () => {
        const checked = Array.from(document.querySelectorAll('.hmw-eval-check:checked'));
        if (check.checked && checked.length > 2) {
          check.checked = false;
          this.showToast('建议精选不超过 2 个最佳 HMW');
          return;
        }
        const id = check.dataset.id;
        const row = document.querySelector(`.hmw-eval-row[data-id="${id}"]`);
        if (row) row.classList.toggle('selected', check.checked);
        this.saveHmwData(stage);
        // Re-render to show selected section
        this.renderModule('inspire');
      });
    });
  }

  getHmwPovFromInputs() {
    return {
      targetUser: document.getElementById('hmwPovTargetUser')?.value?.trim() || '',
      sceneChallenge: document.getElementById('hmwPovScene')?.value?.trim() || '',
      userProblem: document.getElementById('hmwPovProblem')?.value?.trim() || '',
      insight: document.getElementById('hmwPovInsight')?.value?.trim() || '',
      goal: document.getElementById('hmwPovGoal')?.value?.trim() || ''
    };
  }

  getDimColor(dimKey) {
    const colors = { amplify: '#22C55E', remove: '#EF4444', flip: '#7F77DD', diverge: '#F59E0B' };
    return colors[dimKey] || '#7F77DD';
  }

  updateHmwDimensionCount(dimKey) {
    const card = document.querySelector(`.hmw-dimension-card[data-dim="${dimKey}"]`);
    if (!card) return;
    const count = card.querySelectorAll('.hmw-item').length;
    const countEl = card.querySelector('.hmw-dimension-count');
    if (countEl) countEl.textContent = I18N.t('hmw.count','{n} 条').replace('{n}', count);
  }

  updateHmwTotalCount() {
    const total = document.querySelectorAll('.hmw-item').length;
    const el = document.getElementById('hmwTotalCount');
    if (el) el.textContent = I18N.t('hmw.generated','已产出 {n} 条').replace('{n}', total);
  }

  saveHmwData(stage) {
    const pov = this.getHmwPovFromInputs();
    const dimensions = { amplify: [], remove: [], flip: [], diverge: [] };

    document.querySelectorAll('.hmw-item').forEach(item => {
      const dimCard = item.closest('.hmw-dimension-card');
      const dimKey = dimCard?.dataset.dim;
      if (!dimKey || !dimensions[dimKey]) return;
      dimensions[dimKey].push({
        id: item.dataset.id,
        text: item.querySelector('.hmw-item-text')?.textContent?.trim() || ''
      });
    });

    const evaluations = {};
    document.querySelectorAll('.hmw-eval-row').forEach(row => {
      const id = row.dataset.id;
      const uv = parseInt(document.getElementById(`score_uv_${id}`)?.textContent || 3);
      const bv = parseInt(document.getElementById(`score_bv_${id}`)?.textContent || 3);
      const fe = parseInt(document.getElementById(`score_fe_${id}`)?.textContent || 3);
      evaluations[id] = { userValue: uv, businessValue: bv, feasibility: fe };
    });

    const selectedIds = Array.from(document.querySelectorAll('.hmw-eval-check:checked')).map(c => c.dataset.id);

    const data = { pov, dimensions, evaluations, selectedIds, timestamp: Date.now() };
    const json = JSON.stringify(data);

    this.saveScreenContent(stage, 1, json);
    this.autoSaveScreenContent(stage, 1, json);
  }

  /**
   * Attach events for Info Capsule (project info quick view)
   */
  attachInfoCapsuleEvents(project) {
    const capsule = document.getElementById('infoCapsule');
    const panel = document.getElementById('infoPanel');
    const closeBtn = document.getElementById('infoPanelClose');
    const body = document.getElementById('infoPanelBody');

    if (!capsule || !panel || !body) return;

    // Toggle panel
    capsule.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      if (!isOpen) {
        // Generate and show project info
        body.innerHTML = this.getProjectInfoHTML(project);
        panel.classList.add('open');
      } else {
        panel.classList.remove('open');
      }
    });

    // Close panel
    closeBtn?.addEventListener('click', () => {
      panel.classList.remove('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (panel.classList.contains('open') && !panel.contains(e.target) && !capsule.contains(e.target)) {
        panel.classList.remove('open');
      }
    });
  }

  /**
   * Generate HTML for project info summary panel
   */
  getProjectInfoHTML(project) {
    if (!project) return '<div class="info-panel-empty">暂无项目信息</div>';

    const sections = [];

    // Project title
    sections.push({
      icon: '📁',
      title: '项目名称',
      content: project.title || project.originalTitle || '未命名项目'
    });

    // T1: Scene
    if (project.cards?.scene) {
      let sceneContent = '';
      try {
        const sceneData = typeof project.cards.scene === 'string'
          ? JSON.parse(project.cards.scene)
          : project.cards.scene;
        sceneContent = sceneData.combined || sceneData.targetUser || sceneData.sceneDesc || JSON.stringify(sceneData);
      } catch (e) {
        sceneContent = String(project.cards.scene);
      }
      sections.push({ icon: '🎯', title: '场景描述', content: sceneContent });
    }

    // T2: Journey
    if (project.cards?.journey) {
      let journeyContent = '';
      try {
        const journeyData = typeof project.cards.journey === 'string'
          ? JSON.parse(project.cards.journey)
          : project.cards.journey;
        if (Array.isArray(journeyData)) {
          journeyContent = journeyData.map((c, i) =>
            `${c.stage || `阶段${i+1}`}: ${c.discovery || ''}${c.keyFinding ? ' ⭐' : ''}`
          ).join('\n');
        }
      } catch (e) {
        journeyContent = String(project.cards.journey);
      }
      sections.push({ icon: '🗺️', title: '用户旅程', content: journeyContent });
    }

    // T3: FIND Insight — support both old and new format
    if (project.cards?.findInsight) {
      let findContent = '';
      try {
        const findRaw = typeof project.cards.findInsight === 'string'
          ? JSON.parse(project.cards.findInsight)
          : project.cards.findInsight;
        // New format: { findings: [{ sourceFinding, fact, interpret, need, distill }] }
        if (Array.isArray(findRaw.findings)) {
          findContent = findRaw.findings.map((f, i) => {
            const parts = [];
            if (f.sourceFinding) parts.push(`发现${i+1}来源: ${f.sourceFinding}`);
            if (f.fact) parts.push(`F: ${f.fact}`);
            if (f.interpret) parts.push(`I: ${f.interpret}`);
            if (f.need) parts.push(`N: ${f.need}`);
            if (f.distill) parts.push(`D: ${f.distill}`);
            return parts.join('\n');
          }).join('\n\n');
        } else {
          // Old format
          findContent = `Fact: ${findRaw.fact || ''}\nInterpret: ${findRaw.interpret || ''}\nNeed: ${findRaw.need || ''}\nDistill: ${findRaw.distill || ''}`;
        }
      } catch (e) {
        findContent = String(project.cards.findInsight);
      }
      sections.push({ icon: '💡', title: 'FIND 洞察', content: findContent });
    }

    // T4: Business Goal
    if (project.cards?.businessGoal) {
      let bgContent = '';
      try {
        const bgData = typeof project.cards.businessGoal === 'string'
          ? JSON.parse(project.cards.businessGoal)
          : project.cards.businessGoal;
        const stakeholders = bgData.stakeholders?.stakeholders || [];
        const hypotheses = bgData.hypotheses?.hypotheses || [];
        const consensus = bgData.stakeholders?.consensus || '';
        bgContent = '';
        if (stakeholders.length > 0) {
          bgContent += '利益相关方:\n' + stakeholders.map(s => `• ${s.name}: ${s.need}`).join('\n') + '\n\n';
        }
        if (consensus) {
          bgContent += `共识: ${consensus}\n\n`;
        }
        if (hypotheses.length > 0) {
          bgContent += '假设:\n' + hypotheses.map((h, i) => `H${i+1}: ${h.content}`).join('\n');
        }
      } catch (e) {
        bgContent = String(project.cards.businessGoal);
      }
      if (bgContent.trim()) {
        sections.push({ icon: '🤝', title: '商业目标', content: bgContent });
      }
    }

    // T5: Project Briefing
    if (project.cards?.projectBriefing) {
      let briefContent = '';
      try {
        const briefData = typeof project.cards.projectBriefing === 'string'
          ? JSON.parse(project.cards.projectBriefing)
          : project.cards.projectBriefing;
        const d = briefData.content ? JSON.parse(briefData.content) : briefData;
        briefContent = `主题: ${d.theme || ''}\n用户: ${d.targetUser || ''}\n洞察: ${d.insight || ''}`;
      } catch (e) {
        briefContent = String(project.cards.projectBriefing);
      }
      sections.push({ icon: '📋', title: '项目简报', content: briefContent });
    }

    if (sections.length === 0) {
      return '<div class="info-panel-empty">暂无已保存的内容</div>';
    }

    return sections.map(s => `
      <div class="info-section">
        <div class="info-section-header">
          <span class="info-section-icon">${s.icon}</span>
          <span class="info-section-title">${s.title}</span>
        </div>
        <div class="info-section-content ${!s.content.trim() ? 'empty' : ''}">${this.escapeHtml(s.content).replace(/\n/g, '<br>')}</div>
      </div>
    `).join('');
  }

  /**
   * Save briefing data to project.cards.projectBriefing
   */
  saveBriefingData(stage) {
    if (!AppState.currentProjectId) return;

    const theme = document.getElementById('briefingTheme')?.value || '';
    const targetUser = document.getElementById('briefingTargetUser')?.value || '';
    const scene = document.getElementById('briefingScene')?.value || '';
    const insight = document.getElementById('briefingInsight')?.value || '';
    const consensus = document.getElementById('briefingConsensus')?.value || '';

    // Collect market hypothesis data from briefing (if editable fields exist)
    const hypothesis = {
      tam: document.getElementById('briefingTAM')?.value || '',
      sam: document.getElementById('briefingSAM')?.value || '',
      som: document.getElementById('briefingSOM')?.value || '',
      competitors: document.getElementById('briefingCompetitors')?.value || '',
      alignment: document.getElementById('briefingAlignment')?.value || '',
      notes: document.getElementById('briefingNotes')?.value || ''
    };

    const briefingData = {
      theme,
      targetUser,
      scene,
      insight,
      consensus,
      hypothesis,
      timestamp: Date.now()
    };

    // Save to project.cards.projectBriefing
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'projectBriefing', {
      content: JSON.stringify(briefingData),
      timestamp: Date.now()
    });
  }

  /**
   * Attach events to stakeholder cards (input changes)
   */
  attachStakeholderCardEvents(stage) {
    // Input changes on stakeholder cards
    document.querySelectorAll('.stakeholder-card input, .stakeholder-card textarea').forEach(el => {
      el.addEventListener('input', () => {
        this.saveStakeholderData(stage);
      });
    });

    // Score adjustment buttons (+/-)
    document.querySelectorAll('.stakeholder-score-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.action;
        const card = btn.closest('.stakeholder-card');
        const row = btn.closest('.stakeholder-need-row');
        const scoreInput = row.querySelector('.stakeholder-score-input');
        let currentScore = parseInt(scoreInput.value) || 0;

        if (action === 'plus' && currentScore < 12) {
          currentScore++;
        } else if (action === 'minus' && currentScore > 0) {
          currentScore--;
        }
        scoreInput.value = currentScore;

        // Update total score badge
        const allScores = Array.from(card.querySelectorAll('.stakeholder-score-input')).map(inp => parseInt(inp.value) || 0);
        const total = allScores.reduce((a, b) => a + b, 0);
        const badge = card.querySelector('.stakeholder-score-badge');
        if (badge) {
          badge.textContent = `${total}/12`;
          badge.className = `stakeholder-score-badge ${total === 12 ? 'complete' : 'incomplete'}`;
        }

        this.saveStakeholderData(stage);
      });
    });
  }

  /**
   * Attach events to hypothesis inputs (market hypothesis format)
   */
  attachHypothesisCardEvents(stage) {
    document.querySelectorAll('.market-hypothesis-input').forEach(el => {
      el.addEventListener('input', () => {
        this.saveStakeholderData(stage);
      });
    });
  }

  /**
   * Get stakeholder data from UI (12-point scoring system)
   */
  getStakeholderDataFromUI() {
    const stakeholders = [];
    document.querySelectorAll('.stakeholder-card').forEach(card => {
      const name = card.querySelector('[data-field="name"]')?.value || '';
      const icon = card.querySelector('.stakeholder-card-icon')?.textContent || '👤';
      const needs = [];
      card.querySelectorAll('.stakeholder-need-row').forEach(row => {
        const label = row.querySelector('[data-field="need-label"]')?.value || '';
        const score = parseInt(row.querySelector('[data-field="need-score"]')?.value) || 0;
        needs.push({ label, score });
      });
      stakeholders.push({ name, icon, needs });
    });
    return { stakeholders };
  }

  /**
   * Get hypothesis data from UI (Market hypothesis format)
   */
  getHypothesisDataFromUI() {
    const tam = document.getElementById('hypothesisTAM')?.value || '';
    const sam = document.getElementById('hypothesisSAM')?.value || '';
    const som = document.getElementById('hypothesisSOM')?.value || '';
    const competitors = document.getElementById('hypothesisCompetitors')?.value || '';
    const alignment = document.getElementById('hypothesisAlignment')?.value || '';
    const notes = document.getElementById('hypothesisNotes')?.value || '';
    const confirmed = document.getElementById('hypothesisConfirmed')?.style.display === 'flex';
    return { tam, sam, som, competitors, alignment, notes, confirmed };
  }

  /**
   * Get FIND data for hypothesis generation — supports both old and new format
   */
  getFindDataForHypothesis() {
    const result = { fact: '', interpret: '', need: '', distill: '', allDistills: [] };
    if (!AppState.currentProjectId) return result;
    const project = window.EurekaStorage.getProject(AppState.currentProjectId);
    if (!project?.cards?.findInsight) return result;

    try {
      let raw = project.cards.findInsight;
      if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
      const findData = typeof raw === 'string' ? JSON.parse(raw) : raw;

      // New format: { findings: [{ sourceFinding, fact, interpret, need, distill }] }
      if (Array.isArray(findData.findings)) {
        const completed = (findData.findings || []).filter(f => (f.completedSteps || []).length === 4);
        result.allDistills = completed.map(f => f.distill || '');
        // Use the first completed finding for backward compatibility
        if (completed.length > 0) {
          result.fact = completed[0].fact || '';
          result.interpret = completed[0].interpret || '';
          result.need = completed[0].need || '';
          result.distill = completed[0].distill || '';
        }
        // If multiple findings, concatenate distills
        if (completed.length > 1) {
          result.distill = completed.map((f, i) => `发现${i+1}：${f.distill || ''}`).join('\n');
        }
      } else {
        // Old format
        result.fact = findData.fact || '';
        result.interpret = findData.interpret || '';
        result.need = findData.need || '';
        result.distill = findData.distill || '';
      }
    } catch (e) {
      console.warn('getFindDataForHypothesis failed:', e);
    }
    return result;
  }

  /**
   * Save stakeholder + hypothesis data
   */
  saveStakeholderData(stage, confirmed = false) {
    if (!AppState.currentProjectId) return;
    const stakeholderData = this.getStakeholderDataFromUI();
    const hypothesisData = this.getHypothesisDataFromUI();
    if (confirmed) hypothesisData.confirmed = true;
    const content = JSON.stringify({
      stakeholders: stakeholderData,
      hypothesis: hypothesisData
    });
    this.saveScreenContent(stage, AppState.currentScreen || 1, content);
  }

  /**
   * Get FIND context from previous steps + project context
   */
  getFindContext() {
    const fact = document.getElementById('findInput_fact')?.value?.trim() || '';
    const interpret = document.getElementById('findInput_interpret')?.value?.trim() || '';
    const need = document.getElementById('findInput_need')?.value?.trim() || '';
    const project = window.EurekaStorage.getProject(AppState.currentProjectId);
    const projectCtx = this.getProjectContext(project);
    return {
      fact, interpret, need,
      targetUser: projectCtx.targetUser || '',
      sceneDesc: projectCtx.sceneDesc || ''
    };
  }

  /**
   * 检查当前屏幕是否已有内容（防止"空跑到终点"）
   * 规则：屏幕上任意一个输入框/文本域/下拉有非空白内容，或存在勾选项，即视为已填写。
   */
  screenHasContent() {
    const root = document.getElementById('moduleContent');
    if (!root) return true; // 找不到容器时放行，避免误伤
    const fields = root.querySelectorAll('input, textarea, select');
    for (const f of fields) {
      if (f.type === 'checkbox' || f.type === 'radio') {
        if (f.checked) return true;
      } else if ((f.value || '').trim().length > 0) {
        return true;
      }
    }
    // 卡片型屏幕（旅程/NCO/灵感/创意）可能没有 input（用 contenteditable 或 JS 渲染）
    if (root.querySelector('.journey-card, .nco-card, .insp-card, .idea-card, .stakeholder-row, .briefing-field')) {
      return true;
    }
    return false;
  }

  /**
   * 检查某阶段是否已有实质内容（用于完成阶段守卫）
   */
  stageHasContent(stage) {
    const project = window.EurekaStorage.getProject(AppState.currentProjectId);
    if (!project?.cards) return false;
    const map = {
      reveal: ['scene', 'journey', 'findInsight', 'businessGoal', 'projectBriefing'],
      inspire: ['hmw', 'ncoInspiration', 'ideas', 'filteredIdeas', 'bestIdea'],
      shape: ['shapeFourDim', 'shapeMinConcept', 'shapeStoryboard', 'shapeSummary'],
      exam: ['examTestPlan', 'examTestReport', 'examFourDimEval', 'examElevator', 'examSummary']
    };
    const types = map[stage] || [];
    for (const t of types) {
      const c = project.cards[t];
      const raw = c?.content;
      if (typeof raw === 'string' && raw.trim().length > 15) return true;
      if (raw && typeof raw === 'object' && Object.keys(raw).length) return true;
    }
    return false;
  }

  saveAndGoNext(stage, screen) {
    // 【R3 流程校验】当前屏完全空白时禁止进入下一步
    if (!this.screenHasContent()) {
      this.showToast('这一屏还没有内容，先填写一点再继续吧～');
      const capsule = document.getElementById('taskCompletionCapsule');
      if (capsule) capsule.classList.remove('show');
      return;
    }

    // Save current screen content
    const currentScreen = AppState.currentScreen || 1;
    this.saveCurrentScreenContent(stage, currentScreen);

    // Show completion capsule before navigating
    this.showTaskCompletionCapsule(stage, currentScreen);

    // Delay navigation to let user see the capsule
    setTimeout(() => {
      this.hideTaskCompletionCapsule();
      this.goToScreen(stage, screen);
    }, 2500);
  }

  saveScreenContent(stage, screen, content) {
    if (!AppState.currentProjectId || !content.trim()) return;

    const cardTypeMap = {
      reveal: ['scene', 'journey', 'findInsight', 'businessGoal', 'projectBriefing'],
      inspire: ['hmw', 'ncoInspiration', 'ideas', 'filteredIdeas', 'bestIdea'],
      shape: ['shapeFourDim', 'shapeMinConcept', 'shapeStoryboard', 'shapeSummary'],
      exam: ['examTestPlan', 'examTestReport', 'examFourDimEval', 'examElevator', 'examSummary']
    };

    const cardTypes = cardTypeMap[stage] || [];
    const cardType = cardTypes[screen - 1];

    if (cardType) {
      window.EurekaStorage.updateCard(AppState.currentProjectId, cardType, {
        content,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Show task completion capsule with stage-specific output summary
   */
  showTaskCompletionCapsule(stage, screen) {
    const capsule = document.getElementById('taskCompletionCapsule');
    const titleEl = document.getElementById('capsuleTitle');
    const descEl = document.getElementById('capsuleDesc');
    const nextBtn = document.getElementById('capsuleNextBtn');
    if (!capsule || !titleEl || !descEl) return;

    // Stage/screen specific output descriptions
    const outputMap = {
      'reveal-1': {
        title: 'Saved! Output: a concrete "User Persona" + complete "Jobs-To-Be-Done (JTBD)"',
        desc: 'Your team can systematically organize the insights from exploration and produce a concrete "User Persona", clearly and completely defining the user\'s core "Jobs-To-Be-Done (JTBD)" in this scenario.',
        nextLabel: 'Next: Explore the user journey →'
      },
      'reveal-2': {
        title: 'Saved! Output: a complete "User Journey Map" + key-touchpoint findings',
        desc: 'From the user\'s perspective, you mapped the complete flow, marked key touchpoints, emotional shifts, and experience breakpoints, and identified key findings worth exploring further.',
        nextLabel: 'Next: Uncover user pain points →'
      },
      'reveal-3': {
        title: 'Saved! Output: FIND deep insights',
        desc: 'Using the Fact → Interpret → Need → Distill framework, you uncovered deep needs and pain-point insights from the key findings in the user journey.',
        nextLabel: 'Next: Align with business goals →'
      },
      'reveal-4': {
        title: 'Saved! Output: "Business Value Hypothesis"',
        desc: 'You clarified stakeholders, the business value hypothesis, and its link to business goals, providing commercial constraints and direction for later ideation.',
        nextLabel: 'Finish Reveal →'
      },
      'inspire-1': {
        title: 'Saved! Output: a clear "How-Might-We (HMW) question"',
        desc: 'Using the "How might we help..." format, you defined the target user, scenario, and desired change, laying the foundation for ideation.',
        nextLabel: 'Next: Find inspiration →'
      },
      'inspire-2': {
        title: 'Saved! Output: a multi-dimensional "Inspiration Library"',
        desc: 'You collected rich inspiration sources across three dimensions — New / Cool / Outsider — providing raw material for idea generation.',
        nextLabel: 'Next: Generate ideas →'
      },
      'inspire-3': {
        title: 'Saved! Output: a large set of "Ideas"',
        desc: 'Quantity before quality — you produced a wealth of ideas, allowing wild ones, giving plenty of options for later screening.',
        nextLabel: 'Next: Screen for the best idea →'
      },
      'inspire-4': {
        title: 'Saved! Output: the "Best Idea" and its rationale',
        desc: 'Weighing feasibility, user value, and business potential, you picked the idea most worth pursuing and gave a clear rationale for the choice.',
        nextLabel: 'Finish Inspire →'
      },
      'inspire-5': {
        title: 'Saved! Output: Inspire stage summary',
        desc: 'You consolidated the POV, best HMW, and best idea into deliverable inspiration outcomes for the Shape stage.',
        nextLabel: 'Enter Shape →'
      },
      'shape-1': {
        title: 'Saved! Output: "Four-Dimension Challenge" analysis',
        desc: 'You honestly challenged the idea across four dimensions — user, business, technology, ecosystem — identifying potential risks and opportunities.',
        nextLabel: 'Next: Define the MVP →'
      },
      'shape-2': {
        title: 'Saved! Output: "Minimum Concept (MVP)"',
        desc: 'You defined the core features and boundaries — what is in and what is out — giving clear direction for rapid validation.',
        nextLabel: 'Next: User experience story →'
      },
      'shape-3': {
        title: 'Saved! Output: "User Experience Storyboard"',
        desc: 'Through six scenes — Aware → Try → Use → Aha → Grow → Share — you told the complete story of the user and the product.',
        nextLabel: 'Finish Shape →'
      },
      'exam-1': {
        title: 'Saved! Output: "Prototype Plan"',
        desc: 'You designed the simplest usable prototype so users can quickly experience the core value, preparing for testing.',
        nextLabel: 'Next: Test plan →'
      },
      'exam-2': {
        title: 'Saved! Output: "Test Execution Plan"',
        desc: 'You made a detailed plan to find target users and observe real usage, ensuring the test does not lead users but lets them explore naturally.',
        nextLabel: 'Next: Test report →'
      },
      'exam-3': {
        title: 'Saved! Output: "Test Report"',
        desc: 'You honestly recorded what worked, what failed, and unexpected findings, supporting conclusions with facts and data.',
        nextLabel: 'Next: Four-dimension evaluation →'
      },
      'exam-4': {
        title: 'Saved! Output: "Four-Dimension Evaluation"',
        desc: 'You systematically evaluated the idea across four dimensions — user, business, technology, ecosystem — clarifying its strengths and gaps.',
        nextLabel: 'Next: Elevator pitch →'
      },
      'exam-5': {
        title: 'Saved! Output: "Elevator Pitch" + "Iteration Plan"',
        desc: 'You distilled the essence of the project into a value story clear in 30 seconds, and made a clear next-step action list.',
        nextLabel: 'Finish the project 🎉'
      }
    };

    const key = `${stage}-${screen}`;
    const output = outputMap[key];
    if (!output) return;

    titleEl.textContent = output.title;
    descEl.textContent = output.desc;
    if (nextBtn) nextBtn.textContent = output.nextLabel;

    // Show capsule
    capsule.classList.add('show');

    // Auto-hide after 8 seconds
    clearTimeout(this._capsuleHideTimeout);
    this._capsuleHideTimeout = setTimeout(() => {
      this.hideTaskCompletionCapsule();
    }, 8000);
  }

  /**
   * Hide task completion capsule
   */
  hideTaskCompletionCapsule() {
    const capsule = document.getElementById('taskCompletionCapsule');
    if (capsule) {
      capsule.classList.remove('show');
    }
  }

  completeStage(stage) {
    if (!AppState.currentProjectId) return;

    // 【R3 流程校验】阶段整体为空时禁止完成
    if (!this.stageHasContent(stage)) {
      this.showToast('本阶段似乎还是空的，先把前面的任务做一点再完成吧～');
      return;
    }

    // Save and clear all drafts for this stage
    const stageInfo = Utils.getStageInfo(stage);
    for (let i = 1; i <= stageInfo.screens; i++) {
      this.clearDraft(stage, i);
    }

    // Add points
    window.EurekaStorage.addPoints(50, `完成 ${stageInfo.name} 模块`);

    // Move to next stage
    const stages = ['reveal', 'inspire', 'shape', 'exam'];
    const currentIndex = stages.indexOf(stage);
    const nextStage = stages[currentIndex + 1];

    if (nextStage) {
      // Show completion capsule for the last screen of current stage
      this.showTaskCompletionCapsule(stage, stageInfo.screens);

      setTimeout(() => {
        this.hideTaskCompletionCapsule();
        const completed = window.EurekaStorage.getProject(AppState.currentProjectId)?.completedStages || [];
        if (!completed.includes(stage)) completed.push(stage);
        const updatedProject = window.EurekaStorage.updateProject(AppState.currentProjectId, {
          stage: nextStage,
          currentScreen: 1,
          completedStages: completed
        });

        // 同步到 AppState，避免 navigate 时重新读取旧缓存导致停留在原阶段
        if (updatedProject) {
          AppState.currentProject = updatedProject;
          AppState.currentStage = nextStage;
          AppState.currentScreen = 1;
        }

        this.showToast(`🎉 ${stageInfo.name} 完成！+50 积分`);
        try {
          AppState.navigate(nextStage, { projectId: AppState.currentProjectId, stage: nextStage, screen: 1 });
        } catch (err) {
          console.error('[completeStage] navigate failed:', err);
          // 兜底：直接渲染下一模块
          this.renderModule(nextStage);
        }
      }, 2500);
    } else {
      // Project complete - show panorama
      this.showTaskCompletionCapsule(stage, stageInfo.screens);

      setTimeout(() => {
        this.hideTaskCompletionCapsule();
        const wasProUnlocked = window.EurekaStorage.getUser()?.unlockedPro;
        const newPoints = window.EurekaStorage.addPoints(PROJECT_COMPLETE_POINTS, '完成完整 RISE 项目');
        window.EurekaStorage.updateProject(AppState.currentProjectId, {
          status: 'completed'
        });

        this.showToast(`🎉 恭喜完成完整项目！+${PROJECT_COMPLETE_POINTS} 积分`);
        this.showPanorama(window.EurekaStorage.getProject(AppState.currentProjectId));

        // 若刚解锁 Pro，在全景图之后弹出祝贺
        if (!wasProUnlocked && newPoints >= PRO_UNLOCK_POINTS) {
          setTimeout(() => this.showProUnlockModal(newPoints), 600);
        }
      }, 2500);
    }
  }

  // ========== PROJECTS PAGE ==========

  renderProjects() {
    const projects = window.EurekaStorage.getProjects();

    this.setContent(`
      <header class="nav-header nav-header-dark">
        <button class="btn-icon btn-ghost" id="backBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="nav-logo-text">我的项目</span>
        <div style="width: 44px;"></div>
      </header>

      <main class="projects-main" style="padding: 72px var(--space-md) var(--space-md);">
        ${projects.length > 0 ? `
          <div class="projects-list">
            ${projects.map(project => {
              const stageInfo = Utils.getStageInfo(project.stage);
              const categoryInfo = Utils.getCategoryInfo(project.category);
              const progress = Utils.getProjectProgress(project);

              return `
                <div class="project-card" data-project-id="${project.id}">
                  <div class="project-card-header">
                    <div class="project-card-icon" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color};">
                      ${categoryInfo.icon}
                    </div>
                    <div class="project-card-info">
                      <h3 class="project-card-title">${project.title || '未命名项目'}</h3>
                      <p class="project-card-meta">${categoryInfo.name} · ${stageInfo.name} · ${Utils.formatRelativeTime(project.updatedAt)}</p>
                    </div>
                    <span class="badge badge-${project.status === 'completed' ? 'success' : 'primary'}" style="
                      background: ${project.status === 'completed' ? 'var(--success)' : stageInfo.color};
                    ">
                      ${project.status === 'completed' ? '已完成' : '进行中'}
                    </span>
                  </div>
                  <div class="progress-bar" style="margin-top: var(--space-md);">
                    <div class="progress-bar-fill" style="width: ${progress}%; background: ${stageInfo.color};"></div>
                  </div>
                  <div class="progress-indicator">
                    <span>${stageInfo.name} 第 ${project.currentScreen}/${stageInfo.screens} 屏</span>
                    <span>${progress}%</span>
                  </div>
                  ${project.status === 'completed' ? `
                    <button class="btn btn-ai project-panorama-btn" data-project-id="${project.id}" style="margin-top: var(--space-md); width: 100%;">
                      🎉 查看全景图
                    </button>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <div class="empty-state">
            <div class="empty-state-icon">📁</div>
            <h3 class="empty-state-title">暂无项目</h3>
            <p class="empty-state-desc">开始你的第一个 RISE 练习吧</p>
            <button class="btn btn-primary" style="margin-top: var(--space-lg);" id="startFirstBtn">
              立即开始
            </button>
          </div>
        `}
      </main>
    `);

    // Attach events
    document.getElementById('backBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
    });

    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('click', () => {
        const projectId = card.dataset.projectId;
        AppState.navigate('reveal', { projectId });
      });
    });

    document.querySelectorAll('.project-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        const project = window.EurekaStorage.getProject(projectId);
        if (project) this.showDeleteConfirmModal(project);
      });
    });

    document.querySelectorAll('.project-panorama-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectId = btn.dataset.projectId;
        this.showPanorama(window.EurekaStorage.getProject(projectId));
      });
    });

    document.getElementById('startFirstBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
    });
  }

  // ========== PROFILE PAGE ==========

  renderProfile() {
    const user = AppState.user;
    const checkin = window.EurekaStorage.getCheckin();

    this.setContent(`
      <header class="nav-header nav-header-dark">
        <button class="btn-icon btn-ghost" id="backBtn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <span class="nav-logo-text">个人中心</span>
        <div style="width: 44px;"></div>
      </header>

      <main class="profile-main" style="padding: 72px var(--space-md) var(--space-md);">
        <div class="profile-header">
          <div class="profile-avatar">
            ${(user?.name || I18N.t('user.friend', '朋友')).charAt(0)}
          </div>
          <h2 class="profile-name">${user?.name || I18N.t('user.friend', '朋友')}</h2>
          <p class="profile-sub">Eureka Lite 用户</p>
        </div>

        <div class="profile-stats">
          <div class="profile-stat-card">
            <div class="profile-stat-value">${user?.points || 0}</div>
            <div class="profile-stat-label">总积分</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-value">${user?.streak || 0}</div>
            <div class="profile-stat-label">连续天数</div>
          </div>
          <div class="profile-stat-card">
            <div class="profile-stat-value">${checkin.dates?.length || 0}</div>
            <div class="profile-stat-label">累计打卡</div>
          </div>
        </div>

        <div class="profile-progress">
          <h3 class="section-title">练习积分</h3>
          <div class="progress-bar" style="height: 8px; margin-top: var(--space-sm);">
            <div class="progress-bar-fill" style="width: ${Math.min((user?.points || 0) / 500 * 100, 100)}%;"></div>
          </div>
          <p style="font-size: 12px; color: var(--text-muted); margin-top: var(--space-xs);">
            完成每个阶段 +50 分，完成整个 RISE 项目 +100 分。积分用于记录你的创新练习历程 🏅
          </p>
        </div>

        <div class="profile-menu">
          <div class="profile-menu-item" id="setNameBtn">
            <span class="profile-menu-icon">✏️</span>
            <span>设置昵称</span>
            <span class="profile-menu-arrow">→</span>
          </div>
          <div class="profile-menu-item" id="exportBtn">
            <span class="profile-menu-icon">📤</span>
            <span>导出数据</span>
            <span class="profile-menu-arrow">→</span>
          </div>
          <div class="profile-menu-item" id="resetBtn">
            <span class="profile-menu-icon">🔄</span>
            <span>重置数据</span>
            <span class="profile-menu-arrow">→</span>
          </div>
        </div>
      </main>
    `);

    // Attach events
    document.getElementById('backBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
    });

    document.getElementById('setNameBtn')?.addEventListener('click', () => {
      const name = prompt('请输入昵称：', user?.name || '');
      if (name !== null) {
        window.EurekaStorage.updateUser({ name: name.trim() || '' });
        AppState.refreshUser();
        this.renderProfile();
      }
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => {
      const data = {
        user: window.EurekaStorage.getUser(),
        projects: window.EurekaStorage.getProjects(),
        checkin: window.EurekaStorage.getCheckin()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eureka-lite-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.showToast('数据已导出');
    });

    document.getElementById('resetBtn')?.addEventListener('click', () => {
      if (confirm('确定要重置所有数据吗？此操作不可恢复。')) {
        window.EurekaStorage.clearAll();
        AppState.refreshUser();
        this.showToast('数据已重置');
        AppState.navigate('home');
      }
    });
  }

  // ========== SHAPE / EXAM 共享辅助 ==========

  getProjectBriefing(project) {
    let raw = project?.cards?.projectBriefing;
    if (!raw) return null;
    if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
    try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return null; }
  }

  getBestIdeas(project) {
    const ideas = this.getIdeas(project);
    const fstate = this.getFilterState(project.id);
    let best = ideas.filter(i => fstate.bestIds.includes(i.id));
    if (best.length === 0 && ideas.length) {
      best = ideas.map(i => {
        const s = fstate.scores[i.id] || { feasibility: 3, userValue: 3, businessValue: 3, innovation: 3 };
        return { ...i, total: s.feasibility + s.userValue + s.businessValue + s.innovation };
      }).sort((a, b) => b.total - a.total).slice(0, 2);
    }
    return best.slice(0, 2);
  }

  getShapeContextSummary(project) {
    const pov = this.extractPovFromProject(project);
    const hmws = this.getSelectedHmws(project);
    const bestIdeas = this.getBestIdeas(project);
    const bestIdea = bestIdeas[0];
    const fd = this._readCardJSON('shapeFourDim');
    const fdResult = fd && fd.result ? fd.result : '';
    let txt = '';
    txt += `【POV】目标用户：${pov.targetUser || '—'}；场景：${pov.sceneChallenge || '—'}；用户问题：${pov.userProblem || '—'}；洞察：${pov.insight || '—'}\n`;
    txt += `【最佳 HMW】${hmws.length ? hmws.join('；') : '—'}\n`;
    txt += `【最佳创意】${bestIdea ? bestIdea.title + (bestIdea.description ? '：' + bestIdea.description : '') : '—'}\n`;
    if (fdResult) txt += `【四维拷问】${fdResult}\n`;
    return txt.trim();
  }

  // ========== SHAPE 屏1：四维拷问 ==========

  getShapeFourDimTemplate(project) {
    const pov = this.extractPovFromProject(project);
    const bestIdeas = this.getBestIdeas(project);
    const bestTitle = bestIdeas[0] ? bestIdeas[0].title : '（尚未选定最佳创意）';
    let dims = { user: [], business: [], technical: [], ecosystem: [] };
    const saved = this._readCardJSON('shapeFourDim');
    if (saved && saved.dimensions) dims = saved.dimensions;

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">S1 四维拷问</h2>
        <p class="screen-subtitle">从用户 / 商业 / 技术 / 生态 四个维度，拷问你的最佳创意</p>
        <div class="shape-context-card">
          <div class="shape-context-row"><span class="shape-context-label">用户问题</span><span>${this.escapeHtml(pov.userProblem || '—')}</span></div>
          <div class="shape-context-row"><span class="shape-context-label">最佳创意</span><span>${this.escapeHtml(bestTitle)}</span></div>
        </div>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>点击按钮让 AI 基于你的最佳创意生成拷问问题，然后逐题填写你的回答。</span></div>
        <button class="btn btn-ai" id="genFourDimBtn">✨ AI 帮我生成拷问问题</button>
        <div id="fourDimContainer">${this.fourDimQuestionsHTML(dims, bestTitle)}</div>
        <div class="result-block">
          <label class="input-label">拷问结果（自动汇总，可编辑）</label>
          <textarea class="input textarea" id="fourDimResult" rows="5" placeholder="生成问题并填写回答后，这里会自动汇总...">${this.escapeHtml(saved?.result || '')}</textarea>
        </div>
        <button class="btn btn-secondary" id="saveFourDimBtn">保存拷问结果</button>
      </div>`;
  }

  fourDimQuestionsHTML(dims, bestTitle) {
    const DIMS = [
      { key: 'user', label: '👤 用户 User', color: 'var(--shape-primary)' },
      { key: 'business', label: '💰 商业 Business', color: '#F59E0B' },
      { key: 'technical', label: '⚙️ 技术 Technical', color: '#22C55E' },
      { key: 'ecosystem', label: '🌿 生态 Ecosystem', color: '#7F77DD' }
    ];
    const list = dims || { user: [], business: [], technical: [], ecosystem: [] };
    const anyQ = DIMS.some(d => (list[d.key] || []).length > 0);
    if (!anyQ) {
      return `<div class="fourdim-empty" id="fourDimEmpty">尚未生成拷问问题，点击上方「✨ AI 帮我生成拷问问题」开始。</div>`;
    }
    return DIMS.map(d => {
      const items = list[d.key] || [];
      return `
        <div class="fourdim-dim" data-dim="${d.key}">
          <div class="fourdim-dim-header" style="border-color:${d.color}">
            <span class="fourdim-dim-title" style="color:${d.color}">${d.label}</span>
          </div>
          <div class="fourdim-questions">
            ${items.map((it, idx) => `
              <div class="fourdim-q">
                <div class="fourdim-q-text">${this.escapeHtml(it.q || '')}</div>
                <textarea class="input textarea fourdim-ans" data-dim="${d.key}" data-idx="${idx}" rows="2" placeholder="你的回答...">${this.escapeHtml(it.a || '')}</textarea>
              </div>`).join('')}
          </div>
        </div>`;
    }).join('');
  }

  buildFourDimResultText(dims, bestTitle) {
    const labels = { user: '用户', business: '商业', technical: '技术', ecosystem: '生态' };
    let txt = `【四维拷问结果：${bestTitle}】\n`;
    Object.keys(labels).forEach(k => {
      const items = (dims[k] || []).filter(x => x.q);
      if (items.length) {
        txt += `\n${labels[k]}维度：\n`;
        items.forEach((it, i) => {
          txt += `Q${i + 1}：${it.q}\nA：${it.a || '（待回答）'}\n`;
        });
      }
    });
    return txt.trim();
  }

  attachShapeFourDimEvents(project) {
    let saveTimer = null;
    const container = document.getElementById('fourDimContainer');
    const genBtn = document.getElementById('genFourDimBtn');
    const saveBtn = document.getElementById('saveFourDimBtn');
    const resultEl = document.getElementById('fourDimResult');
    const bestIdeas = this.getBestIdeas(project);
    const bestTitle = bestIdeas[0] ? bestIdeas[0].title : '（尚未选定最佳创意）';

    const readDims = () => {
      const dims = { user: [], business: [], technical: [], ecosystem: [] };
      document.querySelectorAll('#fourDimContainer .fourdim-dim').forEach(dimEl => {
        const key = dimEl.dataset.dim;
        dims[key] = Array.from(dimEl.querySelectorAll('.fourdim-q')).map(qEl => ({
          q: (qEl.querySelector('.fourdim-q-text')?.textContent || '').trim(),
          a: (qEl.querySelector('.fourdim-ans')?.value || '').trim()
        }));
      });
      return dims;
    };

    const onInput = () => {
      if (resultEl) resultEl.value = this.buildFourDimResultText(readDims(), bestTitle);
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveShapeFourDimData(project), 600);
    };

    container?.querySelectorAll('.fourdim-ans').forEach(ta => ta.addEventListener('input', onInput));

    genBtn?.addEventListener('click', async () => {
      const pov = this.extractPovFromProject(project);
      const briefing = this.getProjectBriefing(project);
      const briefText = briefing ? JSON.stringify(briefing).slice(0, 1200) : (project?.title || '');
      const bestIdea = bestIdeas[0] || { title: bestTitle, description: '' };
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateShapeQuestions(bestIdea, pov.userProblem, briefText);
        if (container) {
          container.innerHTML = this.fourDimQuestionsHTML(obj, bestTitle);
          container.querySelectorAll('.fourdim-ans').forEach(ta => ta.addEventListener('input', onInput));
        }
        onInput();
        this.saveShapeFourDimData(project);
        this.showToast('✨ 已生成四维新拷问，请逐题填写回答');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 帮我生成拷问问题';
      }
    });

    saveBtn?.addEventListener('click', () => {
      this.saveShapeFourDimData(project);
      this.showToast('已保存拷问结果');
    });

    resultEl?.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveShapeFourDimData(project), 600);
    });
  }

  saveShapeFourDimData(project) {
    if (!AppState.currentProjectId) return;
    const container = document.getElementById('fourDimContainer');
    const dims = { user: [], business: [], technical: [], ecosystem: [] };
    if (container) {
      container.querySelectorAll('.fourdim-dim').forEach(dimEl => {
        const key = dimEl.dataset.dim;
        dims[key] = Array.from(dimEl.querySelectorAll('.fourdim-q')).map(qEl => ({
          q: (qEl.querySelector('.fourdim-q-text')?.textContent || '').trim(),
          a: (qEl.querySelector('.fourdim-ans')?.value || '').trim()
        }));
      });
    }
    const resultEl = document.getElementById('fourDimResult');
    const bestIdeas = this.getBestIdeas(project);
    const bestTitle = bestIdeas[0] ? bestIdeas[0].title : '';
    const empty = JSON.stringify(dims) === JSON.stringify({ user: [], business: [], technical: [], ecosystem: [] });
    const result = (resultEl?.value || this.buildFourDimResultText(dims, bestTitle)).trim();
    if (empty && !result) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'shapeFourDim', {
      content: JSON.stringify({ dimensions: dims, result }), timestamp: Date.now()
    });
  }

  // ========== SHAPE 屏2：最小概念方案 ==========

  conceptRowHTML(list, val) {
    return `
      <div class="concept-row">
        <textarea class="input textarea concept-item" data-list="${list}" rows="2" placeholder="输入一项...">${this.escapeHtml(val || '')}</textarea>
        <button class="concept-del" data-list="${list}" title="删除">✕</button>
      </div>`;
  }

  getShapeMinConceptTemplate(project) {
    const example = this.getShapeContextSummary(project);
    let concept = { oneLiner: '', features: [], characteristics: [], boundaries: [] };
    const saved = this._readCardJSON('shapeMinConcept');
    if (saved && saved.concept) concept = saved.concept;
    if (!Array.isArray(concept.features)) concept.features = [];
    if (!Array.isArray(concept.characteristics)) concept.characteristics = [];
    if (!Array.isArray(concept.boundaries)) concept.boundaries = [];

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">S2 最小概念方案</h2>
        <p class="screen-subtitle">基于前面所有内容，定义你的概念方案</p>
        <details class="shape-example" open>
          <summary>📐 范例 / 前面内容汇总（点此收起）</summary>
          <div class="shape-example-body">${this.escapeHtml(example).replace(/\n/g, '<br>')}</div>
        </details>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>参考上方汇总，用「✨ AI 生成概念方案」获得初稿，再自由编辑。</span></div>
        <button class="btn btn-ai" id="genConceptBtn">✨ AI 生成概念方案</button>
        <div class="concept-field">
          <label class="input-label">一句话定义（oneLiner）</label>
          <textarea class="input textarea" id="mcOneLiner" rows="2" placeholder="例如：一个让上班族 3 分钟找到可靠停车位的应用">${this.escapeHtml(concept.oneLiner || '')}</textarea>
        </div>
        <div class="concept-field">
          <label class="input-label">功能与特性（features）</label>
          <div class="concept-list" id="mcFeatures">${concept.features.map(f => this.conceptRowHTML('features', f)).join('')}</div>
          <button class="btn-add concept-add" data-list="features">➕ 添加</button>
        </div>
        <div class="concept-field">
          <label class="input-label">产品特性（characteristics）</label>
          <div class="concept-list" id="mcCharacteristics">${concept.characteristics.map(f => this.conceptRowHTML('characteristics', f)).join('')}</div>
          <button class="btn-add concept-add" data-list="characteristics">➕ 添加</button>
        </div>
        <div class="concept-field">
          <label class="input-label">边界 / 不做什么（boundaries）</label>
          <div class="concept-list" id="mcBoundaries">${concept.boundaries.map(f => this.conceptRowHTML('boundaries', f)).join('')}</div>
          <button class="btn-add concept-add" data-list="boundaries">➕ 添加</button>
        </div>
        <button class="btn btn-secondary" id="saveConceptBtn">保存概念方案</button>
      </div>`;
  }

  attachShapeMinConceptEvents(project) {
    let saveTimer = null;
    const oneLinerEl = document.getElementById('mcOneLiner');
    const genBtn = document.getElementById('genConceptBtn');
    const saveBtn = document.getElementById('saveConceptBtn');

    const onInput = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveShapeMinConceptData(project), 600);
    };

    const bindList = (list) => {
      const container = document.getElementById('mc' + list.charAt(0).toUpperCase() + list.slice(1));
      container?.querySelectorAll('.concept-item').forEach(ta => ta.addEventListener('input', onInput));
      container?.querySelectorAll('.concept-del').forEach(b => b.addEventListener('click', () => {
        b.closest('.concept-row')?.remove();
        this.saveShapeMinConceptData(project);
      }));
    };
    ['features', 'characteristics', 'boundaries'].forEach(bindList);
    oneLinerEl?.addEventListener('input', onInput);

    document.querySelectorAll('.concept-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const list = btn.dataset.list;
        const container = document.getElementById('mc' + list.charAt(0).toUpperCase() + list.slice(1));
        if (container) {
          container.insertAdjacentHTML('beforeend', this.conceptRowHTML(list, ''));
          bindList(list);
          this.saveShapeMinConceptData(project);
        }
      });
    });

    genBtn?.addEventListener('click', async () => {
      const pov = this.extractPovFromProject(project);
      const fd = this._readCardJSON('shapeFourDim');
      const fdText = fd && fd.result ? fd.result : '';
      const bestIdeas = this.getBestIdeas(project);
      const bestIdea = bestIdeas[0] || { title: '', description: '' };
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateMinConcept(
          `用户问题：${pov.userProblem || ''}\n最佳创意：${bestIdea.title || ''} ${bestIdea.description || ''}\n四维拷问：${fdText}`.slice(0, 1500)
        );
        if (oneLinerEl && obj.oneLiner) oneLinerEl.value = obj.oneLiner;
        if (Array.isArray(obj.features)) this.refreshConceptList(project, 'features', obj.features);
        if (Array.isArray(obj.characteristics)) this.refreshConceptList(project, 'characteristics', obj.characteristics);
        if (Array.isArray(obj.boundaries)) this.refreshConceptList(project, 'boundaries', obj.boundaries);
        this.saveShapeMinConceptData(project);
        this.showToast('✨ 已生成概念方案初稿，可继续编辑');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 生成概念方案';
      }
    });

    saveBtn?.addEventListener('click', () => {
      this.saveShapeMinConceptData(project);
      this.showToast('已保存概念方案');
    });
  }

  refreshConceptList(project, list, values) {
    const container = document.getElementById('mc' + list.charAt(0).toUpperCase() + list.slice(1));
    if (!container) return;
    container.innerHTML = (values || []).map(v => this.conceptRowHTML(list, v)).join('');
    const onInput = () => this.saveShapeMinConceptData(project);
    container.querySelectorAll('.concept-item').forEach(ta => ta.addEventListener('input', onInput));
    container.querySelectorAll('.concept-del').forEach(b => b.addEventListener('click', () => {
      b.closest('.concept-row')?.remove();
      this.saveShapeMinConceptData(project);
    }));
  }

  saveShapeMinConceptData(project) {
    if (!AppState.currentProjectId) return;
    const readList = (list) => {
      const container = document.getElementById('mc' + list.charAt(0).toUpperCase() + list.slice(1));
      if (!container) return [];
      return Array.from(container.querySelectorAll('.concept-item')).map(ta => (ta.value || '').trim()).filter(Boolean);
    };
    const oneLiner = document.getElementById('mcOneLiner')?.value?.trim() || '';
    const concept = {
      oneLiner,
      features: readList('features'),
      characteristics: readList('characteristics'),
      boundaries: readList('boundaries')
    };
    const example = this.getShapeContextSummary(project);
    if (!oneLiner && !concept.features.length && !concept.characteristics.length && !concept.boundaries.length) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'shapeMinConcept', {
      content: JSON.stringify({ example, concept }), timestamp: Date.now()
    });
  }

  // ========== SHAPE 屏3：用户体验故事板 ==========

  getShapeStoryboardTemplate(project) {
    const themes = [
      { key: 'problem', title: '用户面对的问题' },
      { key: 'opportunity', title: '我们的创新机遇' },
      { key: 'contact', title: '用户接触新的概念方案' },
      { key: 'usage', title: '用户使用新方案解决问题' },
      { key: 'outcome', title: '用户得到的结果' },
      { key: 'feeling', title: '用户的感受和表达' }
    ];
    let cards = [];
    const saved = this._readCardJSON('shapeStoryboard');
    if (saved && Array.isArray(saved.cards) && saved.cards.length === 6) cards = saved.cards;
    else cards = themes.map(t => ({ key: t.key, title: t.title, desc: '', image: '' }));

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">S3 用户体验故事板</h2>
        <p class="screen-subtitle">基于最小概念方案，用 6 个场景讲完用户故事</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>点击「✨ AI 生成故事板」自动生成 6 卡描述，可自由编辑；图片占位区后续接入 AI 生图。</span></div>
        <button class="btn btn-ai" id="genStoryboardBtn">✨ AI 生成故事板</button>
        <div class="storyboard-grid">
          ${cards.map((c, i) => `
            <div class="storyboard-card" data-key="${c.key}">
              <div class="storyboard-card-head"><span class="storyboard-num">${i + 1}</span><span class="storyboard-title">${this.escapeHtml(c.title)}</span></div>
              <textarea class="input textarea storyboard-desc" data-key="${c.key}" rows="3" placeholder="描述这一刻的用户经历...">${this.escapeHtml(c.desc || '')}</textarea>
              <div class="storyboard-img-placeholder" title="图片生成功能开发中">🖼️ 图片生成功能开发中（敬请期待）</div>
            </div>`).join('')}
        </div>
        <button class="btn btn-secondary" id="saveStoryboardBtn">保存故事板</button>
      </div>`;
  }

  attachShapeStoryboardEvents(project) {
    let saveTimer = null;
    const genBtn = document.getElementById('genStoryboardBtn');
    const saveBtn = document.getElementById('saveStoryboardBtn');
    document.querySelectorAll('.storyboard-desc').forEach(ta => ta.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveShapeStoryboardData(project), 600);
    }));

    genBtn?.addEventListener('click', async () => {
      const mc = this._readCardJSON('shapeMinConcept');
      const conceptText = mc && mc.concept ? JSON.stringify(mc.concept) : (project?.title || '');
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateStoryboard(conceptText.slice(0, 1500));
        const cards = (obj && Array.isArray(obj.cards)) ? obj.cards : [];
        document.querySelectorAll('.storyboard-card').forEach(cardEl => {
          const key = cardEl.dataset.key;
          const c = cards.find(x => x.key === key);
          const ta = cardEl.querySelector('.storyboard-desc');
          if (c && c.desc && ta) ta.value = c.desc;
        });
        this.saveShapeStoryboardData(project);
        this.showToast('✨ 已生成 6 卡故事板描述');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 生成故事板';
      }
    });

    saveBtn?.addEventListener('click', () => {
      this.saveShapeStoryboardData(project);
      this.showToast('已保存故事板');
    });
  }

  saveShapeStoryboardData(project) {
    if (!AppState.currentProjectId) return;
    const cards = Array.from(document.querySelectorAll('.storyboard-card')).map(cardEl => ({
      key: cardEl.dataset.key,
      title: cardEl.querySelector('.storyboard-title')?.textContent || '',
      desc: (cardEl.querySelector('.storyboard-desc')?.value || '').trim(),
      image: ''
    }));
    if (!cards.length) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'shapeStoryboard', {
      content: JSON.stringify({ cards }), timestamp: Date.now()
    });
  }

  // ========== SHAPE 屏4：整合确认卡 ==========

  getShapeSummaryTemplate(project) {
    const concept = this._readCardJSON('shapeMinConcept');
    const sb = this._readCardJSON('shapeStoryboard');
    const oneLiner = concept?.concept?.oneLiner || '（尚未生成概念方案）';
    const features = (concept?.concept?.features || []).filter(Boolean);
    const storyCards = (sb && Array.isArray(sb.cards)) ? sb.cards : [];
    const storyHtml = storyCards.length
      ? storyCards.map(c => `<div class="summary-story-item"><strong>${this.escapeHtml(c.title)}</strong>：${this.escapeHtml(c.desc || '（待填写）')}</div>`).join('')
      : '<div class="summary-empty">尚未生成故事板</div>';

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">S4 Shape 整合确认卡</h2>
        <p class="screen-subtitle">确认你的构建成果，准备进入 Exam</p>
        <div class="inspire-summary-card">
          <div class="summary-block-title">🎯 概念方案</div>
          <div class="summary-row"><span class="summary-key">一句话定义</span><span>${this.escapeHtml(oneLiner)}</span></div>
          <div class="summary-block-sub">功能与特性</div>
          ${features.length ? features.map(f => `<div class="summary-idea-item">${this.escapeHtml(f)}</div>`).join('') : '<div class="summary-empty">暂无</div>'}
        </div>
        <div class="inspire-summary-card">
          <div class="summary-block-title">📖 用户故事（6 卡）</div>
          ${storyHtml}
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="summaryBackBtn">返回修改</button>
          <button class="btn btn-confirm-primary" id="summaryConfirmBtn">确认完成，进入 Exam</button>
        </div>
      </div>`;
  }

  attachShapeSummaryEvents(project) {
    document.getElementById('summaryBackBtn')?.addEventListener('click', () => {
      this.goToScreen('shape', 3);
    });
    document.getElementById('summaryConfirmBtn')?.addEventListener('click', () => {
      this.saveShapeSummary(project);
      this.completeStage('shape');
    });
  }

  saveShapeSummary(project) {
    if (!AppState.currentProjectId) return;
    const minConcept = this._readCardJSON('shapeMinConcept');
    const storyboard = this._readCardJSON('shapeStoryboard');
    const concept = (minConcept && minConcept.concept) || { oneLiner: '', features: [], characteristics: [], boundaries: [] };
    const story = (storyboard && Array.isArray(storyboard.cards)) ? storyboard.cards : [];
    const summary = { concept, storyboard: story, createdAt: Date.now() };
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'shapeSummary', {
      content: JSON.stringify(summary), timestamp: Date.now()
    });
  }

  // ========== EXAM 屏1：设计测试计划 ==========

  getExamTestPlanTemplate(project) {
    const concept = this._readCardJSON('shapeMinConcept');
    const oneLiner = concept?.concept?.oneLiner || '';
    let data = { purpose: '', scenario: '', hypotheses: '', userValue: '' };
    const saved = this._readCardJSON('examTestPlan');
    if (saved) data = { ...data, ...saved };

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">E1 设计测试计划</h2>
        <p class="screen-subtitle">${this.escapeHtml(oneLiner || '基于概念方案设计验证计划')}</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>点击「✨ AI 生成测试计划」基于概念方案生成初稿，再编辑。</span></div>
        <button class="btn btn-ai" id="genTestPlanBtn">✨ AI 生成测试计划</button>
        <div class="exam-field"><label class="input-label">测试目的（purpose）</label><textarea class="input textarea exam-input" id="tp_purpose" rows="2" placeholder="我们想要验证的核心假设是什么？">${this.escapeHtml(data.purpose)}</textarea></div>
        <div class="exam-field"><label class="input-label">测试场景（scenario）</label><textarea class="input textarea exam-input" id="tp_scenario" rows="2" placeholder="在什么场景下测试？找谁测试？">${this.escapeHtml(data.scenario)}</textarea></div>
        <div class="exam-field"><label class="input-label">需要验证的假设（hypotheses，每行一条）</label><textarea class="input textarea exam-input" id="tp_hypotheses" rows="3" placeholder="1. 用户愿意...\n2. 用户能...">${this.escapeHtml(data.hypotheses)}</textarea></div>
        <div class="exam-field"><label class="input-label">用户价值（userValue）</label><textarea class="input textarea exam-input" id="tp_userValue" rows="2" placeholder="我们为目标用户创造了什么价值？">${this.escapeHtml(data.userValue)}</textarea></div>
        <button class="btn btn-secondary" id="saveTestPlanBtn">保存测试计划</button>
      </div>`;
  }

  attachExamTestPlanEvents(project) {
    let saveTimer = null;
    document.querySelectorAll('.exam-input').forEach(ta => ta.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveExamTestPlanData(project), 600);
    }));

    const genBtn = document.getElementById('genTestPlanBtn');
    genBtn?.addEventListener('click', async () => {
      const mc = this._readCardJSON('shapeMinConcept');
      const sb = this._readCardJSON('shapeStoryboard');
      const ctx = `概念方案：${mc && mc.concept ? JSON.stringify(mc.concept) : ''}\n故事板：${sb && Array.isArray(sb.cards) ? JSON.stringify(sb.cards.map(c => c.desc)) : ''}`.slice(0, 1500);
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateExamTestPlan(ctx);
        if (obj.purpose) document.getElementById('tp_purpose').value = obj.purpose;
        if (obj.scenario) document.getElementById('tp_scenario').value = obj.scenario;
        if (obj.hypotheses) document.getElementById('tp_hypotheses').value = Array.isArray(obj.hypotheses) ? obj.hypotheses.join('\n') : obj.hypotheses;
        if (obj.userValue) document.getElementById('tp_userValue').value = obj.userValue;
        this.saveExamTestPlanData(project);
        this.showToast('✨ 已生成测试计划初稿');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 生成测试计划';
      }
    });

    document.getElementById('saveTestPlanBtn')?.addEventListener('click', () => {
      this.saveExamTestPlanData(project);
      this.showToast('已保存测试计划');
    });
  }

  saveExamTestPlanData(project) {
    if (!AppState.currentProjectId) return;
    const get = (id) => document.getElementById(id)?.value?.trim() || '';
    const data = {
      purpose: get('tp_purpose'),
      scenario: get('tp_scenario'),
      hypotheses: get('tp_hypotheses'),
      userValue: get('tp_userValue')
    };
    if (!data.purpose && !data.scenario && !data.hypotheses && !data.userValue) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'examTestPlan', {
      content: JSON.stringify(data), timestamp: Date.now()
    });
  }

  // ========== EXAM 屏2：测试报告 ==========

  getExamTestReportTemplate(project) {
    let data = { effectiveValue: '', invalidValue: '', newProblems: '', newOpportunities: '' };
    const saved = this._readCardJSON('examTestReport');
    if (saved) data = { ...data, ...saved };

    const field = (id, label, ph) => `
      <div class="exam-field">
        <label class="input-label">${label}</label>
        <textarea class="input textarea exam-input" id="${id}" rows="3" placeholder="${ph}">${this.escapeHtml(data[id.replace('tr_', '')] || '')}</textarea>
      </div>`;

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">E2 测试报告</h2>
        <p class="screen-subtitle">记录真实的测试发现，诚实不自我欺骗</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>点击「✨ AI 辅助撰写测试报告」基于测试计划+观察生成 4 类内容，再编辑。</span></div>
        <button class="btn btn-ai" id="genTestReportBtn">✨ AI 辅助撰写测试报告</button>
        ${field('tr_effectiveValue', '验证的有效方案价值（effectiveValue）', '哪些设计真正解决了用户问题？')}
        ${field('tr_invalidValue', '验证的错误和无效价值（invalidValue）', '哪些假设被证伪？哪里做错了？')}
        ${field('tr_newProblems', '发现的全新问题和挑战（newProblems）', '测试中暴露的新问题？')}
        ${field('tr_newOpportunities', '新的机会和信息（newOpportunities）', '意外的正向发现？')}
        <button class="btn btn-secondary" id="saveTestReportBtn">保存测试报告</button>
      </div>`;
  }

  attachExamTestReportEvents(project) {
    let saveTimer = null;
    document.querySelectorAll('.exam-input').forEach(ta => ta.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveExamTestReportData(project), 600);
    }));

    const genBtn = document.getElementById('genTestReportBtn');
    genBtn?.addEventListener('click', async () => {
      const tp = this._readCardJSON('examTestPlan');
      const ctx = `测试计划：${tp ? JSON.stringify(tp) : ''}`.slice(0, 1500);
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateExamTestReport(ctx);
        if (obj.effectiveValue) document.getElementById('tr_effectiveValue').value = obj.effectiveValue;
        if (obj.invalidValue) document.getElementById('tr_invalidValue').value = obj.invalidValue;
        if (obj.newProblems) document.getElementById('tr_newProblems').value = obj.newProblems;
        if (obj.newOpportunities) document.getElementById('tr_newOpportunities').value = obj.newOpportunities;
        this.saveExamTestReportData(project);
        this.showToast('✨ 已生成测试报告初稿');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 辅助撰写测试报告';
      }
    });

    document.getElementById('saveTestReportBtn')?.addEventListener('click', () => {
      this.saveExamTestReportData(project);
      this.showToast('已保存测试报告');
    });
  }

  saveExamTestReportData(project) {
    if (!AppState.currentProjectId) return;
    const get = (id) => document.getElementById(id)?.value?.trim() || '';
    const data = {
      effectiveValue: get('tr_effectiveValue'),
      invalidValue: get('tr_invalidValue'),
      newProblems: get('tr_newProblems'),
      newOpportunities: get('tr_newOpportunities')
    };
    if (!data.effectiveValue && !data.invalidValue && !data.newProblems && !data.newOpportunities) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'examTestReport', {
      content: JSON.stringify(data), timestamp: Date.now()
    });
  }

  // ========== EXAM 屏3：四维度评价 ==========

  getExamFourDimEvalTemplate(project) {
    const dims = [
      { key: 'userValue', label: '用户价值 User Value', desc: '方案为用户创造的实际价值与体验改善' },
      { key: 'businessValue', label: '商业价值 Business Value', desc: '商业可行性、变现与增长潜力' },
      { key: 'feasibility', label: '技术可行性 Feasibility', desc: '实现难度、资源与时间可行性' },
      { key: 'innovation', label: '创新程度 Innovation', desc: '差异化与突破性' }
    ];
    const saved = this._readCardJSON('examFourDimEval') || {};
    const scores = saved.scores || { userValue: 3, businessValue: 3, feasibility: 3, innovation: 3 };
    const reasons = saved.reasons || {};
    const concept = this._readCardJSON('shapeMinConcept');
    const oneLiner = (concept && concept.concept && concept.concept.oneLiner)
      ? concept.concept.oneLiner : '（尚未生成最小概念方案）';

    const rowsHtml = dims.map(d => `
      <div class="exam-dim-card">
        <div class="exam-dim-head">
          <span class="exam-dim-label">${d.label}</span>
          <span class="dim-score-control">
            <button class="dim-score-btn" data-dim="${d.key}" data-delta="-1">−</button>
            <span class="dim-score-val" id="dimVal_${d.key}">${scores[d.key]}</span>
            <button class="dim-score-btn" data-dim="${d.key}" data-delta="1">+</button>
          </span>
        </div>
        <p class="exam-dim-desc">${d.desc}</p>
        <textarea class="textarea exam-dim-reason" id="dimReason_${d.key}" placeholder="结合测试发现，说明该维度的评价与依据...">${this.escapeHtml(reasons[d.key] || '')}</textarea>
      </div>`).join('');

    const total = dims.reduce((s, d) => s + (Number(scores[d.key]) || 0), 0);

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">E3 四维度评价</h2>
        <p class="screen-subtitle">基于测试发现，对方案做四维评估</p>
        <div class="info-panel exam-dim-context">
          <div class="info-panel-title">🎯 评价对象</div>
          <div class="info-panel-body">${this.escapeHtml(oneLiner)}</div>
        </div>
        <div class="exam-dim-grid">${rowsHtml}</div>
        <div class="idea-filter-total">
          <span class="idea-ai-score-btn" id="examAiScoreBtn">🤖 AI 辅助评分</span>
          <span>综合得分 <span class="idea-filter-total-score" id="examDimTotal">${total}</span>/20</span>
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="saveFourDimBtn">保存评价</button>
        </div>
      </div>`;
  }

  attachExamFourDimEvents(project) {
    const clamp = (n) => Math.max(1, Math.min(5, n));
    const dims = ['userValue', 'businessValue', 'feasibility', 'innovation'];

    const updateTotal = () => {
      let t = 0;
      dims.forEach(k => {
        const el = document.getElementById('dimVal_' + k);
        if (el) t += Number(el.textContent) || 0;
      });
      const totalEl = document.getElementById('examDimTotal');
      if (totalEl) totalEl.textContent = t;
    };

    document.querySelectorAll('.dim-score-btn[data-dim]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.dim;
        const valEl = document.getElementById('dimVal_' + key);
        if (!valEl) return;
        valEl.textContent = clamp((Number(valEl.textContent) || 3) + Number(btn.dataset.delta));
        updateTotal();
        this.saveExamFourDimData(project);
      });
    });

    dims.forEach(k => {
      const ta = document.getElementById('dimReason_' + k);
      if (ta) ta.addEventListener('input', () => this.saveExamFourDimData(project));
    });

    document.getElementById('examAiScoreBtn')?.addEventListener('click', async (e) => {
      const btn = e.currentTarget;
      btn.disabled = true; btn.textContent = '⏳ AI 评分中...';
      try {
        const context = this._buildExamFourDimContext(project);
        const res = await AIAssistant.generateExamFourDimEval(context);
        if (res && res.scores) {
          dims.forEach(k => {
            const valEl = document.getElementById('dimVal_' + k);
            const reasonEl = document.getElementById('dimReason_' + k);
            if (valEl && res.scores[k]) valEl.textContent = clamp(res.scores[k]);
            if (reasonEl && res.reasons && res.reasons[k]) reasonEl.value = res.reasons[k];
          });
          updateTotal();
          this.saveExamFourDimData(project);
          this.showToast('✨ AI 已完成四维评分');
        } else {
          this.showToast('AI 未返回有效评分');
        }
      } catch (err) {
        this.showToast('AI 评分失败：' + (err.message || '未知错误'));
      } finally {
        btn.disabled = false; btn.textContent = '🤖 AI 辅助评分';
      }
    });

    document.getElementById('saveFourDimBtn')?.addEventListener('click', () => {
      this.saveExamFourDimData(project);
      this.showToast('已保存四维度评价');
    });
  }

  saveExamFourDimData(project) {
    if (!AppState.currentProjectId) return;
    const dims = ['userValue', 'businessValue', 'feasibility', 'innovation'];
    const scores = {}; const reasons = {};
    dims.forEach(k => {
      scores[k] = Number(document.getElementById('dimVal_' + k)?.textContent) || 3;
      reasons[k] = document.getElementById('dimReason_' + k)?.value?.trim() || '';
    });
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'examFourDimEval', {
      content: JSON.stringify({ scores, reasons, updatedAt: Date.now() }),
      timestamp: Date.now()
    });
  }

  _buildExamFourDimContext(project) {
    const concept = this._readCardJSON('shapeMinConcept');
    const report = this._readCardJSON('examTestReport');
    const plan = this._readCardJSON('examTestPlan');
    const oneLiner = (concept && concept.concept && concept.concept.oneLiner) ? concept.concept.oneLiner : '';
    const features = (concept && concept.concept && Array.isArray(concept.concept.features))
      ? concept.concept.features.join('；') : '';
    const tr = report
      ? `有效价值：${report.effectiveValue || ''}；无效价值：${report.invalidValue || ''}；新问题：${report.newProblems || ''}；新机会：${report.newOpportunities || ''}`
      : '';
    const purpose = plan?.purpose || '';
    return `概念方案：${oneLiner}\n功能特性：${features}\n测试目的：${purpose}\n测试报告：${tr}`;
  }

  // ========== EXAM 屏4：电梯演讲 & 迭代计划 ==========

  getExamElevatorTemplate(project) {
    const categories = ['阶段聚焦', '优先事项', '目标产出', '衡量成功', '学习收获'];
    const phases = ['30 ' + I18N.t('unit.day','天'), '60 ' + I18N.t('unit.day','天'), '90 ' + I18N.t('unit.day','天')];
    let saved = this._readCardJSON('examElevator');
    let iteration = (saved && Array.isArray(saved.iteration)) ? saved.iteration : [];
    if (iteration.length === 0) {
      // 默认 5 行固定维度，呼应 30-60-90 迭代规划参考图
      iteration = categories.map(cat => ({ category: cat, actions: ['', '', ''] }));
    } else {
      iteration = iteration.map((r, i) => ({
        category: r.category || categories[i] || ('阶段 ' + (i + 1)),
        actions: ((Array.isArray(r.actions) ? r.actions : [])).map(a => a || '')
          .concat(['', '', '']).slice(0, 3)
      }));
    }
    const pitch = saved?.pitch || '';

    const rowsHtml = iteration.map((row, ri) => `
      <div class="iter-row" data-ri="${ri}">
        <input class="input iter-cat" data-ri="${ri}" value="${this.escapeHtml(row.category)}" placeholder="维度..." />
        ${phases.map((p, ci) => `<textarea class="input textarea iter-cell" data-ri="${ri}" data-ci="${ci}" rows="2" placeholder="${p}...">${this.escapeHtml((row.actions && row.actions[ci]) || '')}</textarea>`).join('')}
        <button class="iter-del" data-ri="${ri}" title="删除该行">✕</button>
      </div>`).join('');

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">E4 电梯演讲 & 迭代计划</h2>
        <p class="screen-subtitle">30 秒讲清价值，规划下一步</p>
        <div class="screen-hint"><span class="hint-icon">💡</span><span>用模板或「✨ AI 生成电梯演讲」；下方按「阶段聚焦 / 优先事项 / 目标产出 / 衡量成功 / 学习收获」五类填写 30-60-90 天迭代计划。</span></div>
        <div class="exam-field">
          <label class="input-label">电梯演讲模板</label>
          <div class="elevator-template">我们为【目标用户】提供了【方案】，解决了【问题】，带来【价值】。</div>
        </div>
        <button class="btn btn-ai" id="genPitchBtn">✨ AI 生成电梯演讲</button>
        <div class="exam-field"><label class="input-label">电梯演讲（pitch）</label><textarea class="input textarea" id="el_pitch" rows="3" placeholder="我们为...">${this.escapeHtml(pitch)}</textarea></div>
        <div class="exam-field">
          <label class="input-label">30-60-90 天迭代计划</label>
          <div class="iter-table">
            <div class="iter-head">
              <span class="iter-cat-head">维度 ＼ 阶段</span>
              ${phases.map(p => `<span class="iter-phase">${p}</span>`).join('')}
              <span class="iter-del-head"></span>
            </div>
            <div id="iterBody">${rowsHtml}</div>
          </div>
          <button class="btn-add" id="iterAddRow">➕ 添加一行</button>
        </div>
        <button class="btn btn-secondary" id="saveElevatorBtn">保存</button>
      </div>`;
  }

  attachExamElevatorEvents(project) {
    let saveTimer = null;
    const onInput = () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => this.saveExamElevatorData(project), 600);
    };
    const bindCells = () => {
      document.querySelectorAll('.iter-cell').forEach(ta => ta.addEventListener('input', onInput));
      document.querySelectorAll('.iter-del').forEach(b => b.addEventListener('click', () => {
        b.closest('.iter-row')?.remove();
        this.saveExamElevatorData(project);
      }));
    };
    bindCells();
    document.getElementById('el_pitch')?.addEventListener('input', onInput);

    document.getElementById('iterAddRow')?.addEventListener('click', () => {
      const body = document.getElementById('iterBody');
      const ri = body.children.length;
      const row = document.createElement('div');
      row.className = 'iter-row';
      row.dataset.ri = ri;
      row.innerHTML = `
        <input class="input iter-cat" data-ri="${ri}" value="自定义维度" placeholder="维度..." />
        <textarea class="input textarea iter-cell" data-ri="${ri}" data-ci="0" rows="2" placeholder="30 天行动..."></textarea>
        <textarea class="input textarea iter-cell" data-ri="${ri}" data-ci="1" rows="2" placeholder="60 天行动..."></textarea>
        <textarea class="input textarea iter-cell" data-ri="${ri}" data-ci="2" rows="2" placeholder="90 天行动..."></textarea>
        <button class="iter-del" data-ri="${ri}" title="删除该行">✕</button>`;
      body.appendChild(row);
      bindCells();
      this.saveExamElevatorData(project);
    });

    const genBtn = document.getElementById('genPitchBtn');
    genBtn?.addEventListener('click', async () => {
      const summary = this._readCardJSON('shapeSummary') || {};
      const tp = this._readCardJSON('examTestPlan') || {};
      const ctx = `概念方案：${summary.concept ? JSON.stringify(summary.concept) : ''}\n测试目的：${tp.purpose || ''}`.slice(0, 1200);
      genBtn.disabled = true; genBtn.textContent = '🤖 AI 生成中...';
      try {
        const obj = await AIAssistant.generateElevatorPitch(ctx);
        if (obj.pitch) document.getElementById('el_pitch').value = obj.pitch;
        this.saveExamElevatorData(project);
        this.showToast('✨ 已生成电梯演讲');
      } catch (err) {
        this.showToast('生成失败：' + (err.message || '未知错误'));
      } finally {
        genBtn.disabled = false; genBtn.textContent = '✨ AI 生成电梯演讲';
      }
    });

    document.getElementById('saveElevatorBtn')?.addEventListener('click', () => {
      this.saveExamElevatorData(project);
      this.showToast('已保存');
    });
  }

  saveExamElevatorData(project) {
    if (!AppState.currentProjectId) return;
    const pitch = document.getElementById('el_pitch')?.value?.trim() || '';
    const iteration = Array.from(document.querySelectorAll('#iterBody .iter-row')).map(row => {
      const cat = row.querySelector('.iter-cat')?.value?.trim() || '';
      const cells = Array.from(row.querySelectorAll('.iter-cell')).map(ta => (ta.value || '').trim());
      return { category: cat, actions: cells };
    });
    if (!pitch && iteration.every(r => r.actions.every(a => !a))) return;
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'examElevator', {
      content: JSON.stringify({ pitch, iteration }), timestamp: Date.now()
    });
  }

  // ========== EXAM 屏5：整合确认卡 ==========

  getExamSummaryTemplate(project) {
    const tp = this._readCardJSON('examTestPlan');
    const tr = this._readCardJSON('examTestReport');
    const el = this._readCardJSON('examElevator');
    const fd = this._readCardJSON('examFourDimEval');
    const purpose = tp?.purpose || '（尚未填写测试计划）';
    const fourDimHtml = fd ? (() => {
      const labels = { userValue: '用户价值', businessValue: '商业价值', feasibility: '技术可行性', innovation: '创新程度' };
      const order = ['userValue', 'businessValue', 'feasibility', 'innovation'];
      const total = order.reduce((s, k) => s + (Number(fd.scores?.[k]) || 0), 0);
      const rows = order.map(k => `
        <div class="summary-row"><span class="summary-key">${labels[k]}</span><span>${Number(fd.scores?.[k]) || 0}/5${fd.reasons?.[k] ? ' — ' + this.escapeHtml(fd.reasons[k]) : ''}</span></div>`).join('');
      return `<div class="summary-row"><span class="summary-key">综合得分</span><span><b>${total}</b>/20</span></div>${rows}`;
    })() : '<div class="summary-empty">尚未完成四维度评价</div>';
    const reportHtml = tr ? `
      <div class="summary-row"><span class="summary-key">验证的有效价值</span><span>${this.escapeHtml(tr.effectiveValue || '—')}</span></div>
      <div class="summary-row"><span class="summary-key">无效 / 错误价值</span><span>${this.escapeHtml(tr.invalidValue || '—')}</span></div>
      <div class="summary-row"><span class="summary-key">新发现的问题</span><span>${this.escapeHtml(tr.newProblems || '—')}</span></div>
      <div class="summary-row"><span class="summary-key">新机会 / 信息</span><span>${this.escapeHtml(tr.newOpportunities || '—')}</span></div>
    ` : '<div class="summary-empty">尚未生成测试报告</div>';
    const pitch = el?.pitch || '（尚未生成电梯演讲）';
    const iterRows = (el && Array.isArray(el.iteration)) ? el.iteration : [];
    const iterHtml = iterRows.length ? iterRows.map(r => {
      const acts = (r.actions || []).map(a => a.trim()).filter(Boolean);
      const cat = r.category ? `<strong>${this.escapeHtml(r.category)}：</strong>` : '';
      return acts.length ? `<div class="summary-idea-item">${cat}${acts.map(a => '· ' + this.escapeHtml(a)).join('；')}</div>` : '';
    }).join('') : '<div class="summary-empty">暂无迭代计划</div>';

    return `
      <div class="screen-content animate-fade-in-up">
        <h2 class="screen-title">E5 Exam 整合确认卡</h2>
        <p class="screen-subtitle">确认你的验证成果，准备完成项目</p>
        <div class="inspire-summary-card">
          <div class="summary-block-title">🧪 测试目的</div>
          <div class="summary-row"><span class="summary-key">目的</span><span>${this.escapeHtml(purpose)}</span></div>
        </div>
        <div class="inspire-summary-card">
          <div class="summary-block-title">📊 测试产出</div>
          ${reportHtml}
        </div>
        <div class="inspire-summary-card">
          <div class="summary-block-title">📐 四维度评价</div>
          ${fourDimHtml}
        </div>
        <div class="inspire-summary-card">
          <div class="summary-block-title">🎤 呈现计划</div>
          <div class="summary-row"><span class="summary-key">电梯演讲</span><span>${this.escapeHtml(pitch)}</span></div>
          <div class="summary-block-sub">30-60-90 迭代</div>
          ${iterHtml}
        </div>
        <div class="confirm-actions">
          <button class="btn btn-secondary" id="summaryBackBtn">返回修改</button>
          <button class="btn btn-confirm-primary" id="summaryConfirmBtn">确认完成，查看全景图</button>
        </div>
      </div>`;
  }

  attachExamSummaryEvents(project) {
    document.getElementById('summaryBackBtn')?.addEventListener('click', () => {
      this.goToScreen('exam', 4);
    });
    document.getElementById('summaryConfirmBtn')?.addEventListener('click', () => {
      this.saveExamSummary(project);
      this.completeStage('exam');
    });
  }

  saveExamSummary(project) {
    if (!AppState.currentProjectId) return;
    const tp = this._readCardJSON('examTestPlan') || {};
    const tr = this._readCardJSON('examTestReport') || {};
    const el = this._readCardJSON('examElevator') || { pitch: '', iteration: [] };
    const summary = {
      testPlan: tp,
      testReport: tr,
      elevator: el,
      createdAt: Date.now()
    };
    window.EurekaStorage.updateCard(AppState.currentProjectId, 'examSummary', {
      content: JSON.stringify(summary), timestamp: Date.now()
    });
  }

  // ========== 需求9：四模块全景图 ==========

  showPanorama(project) {
    if (!project) { AppState.navigate('home'); return; }

    const safe = (fn, fallback) => { try { return fn(); } catch (e) { console.warn('[panorama]', e); return fallback; } };

    // Reveal
    const briefing = safe(() => this.getProjectBriefing(project) || {}, {});
    const pov = safe(() => this.extractPovFromProject(project), { targetUser: '', sceneChallenge: '', insight: '' });
    const bgRaw = safe(() => this._readCardJSON('businessGoal', project), null);
    const businessGoal = (bgRaw && (bgRaw.hypothesis || bgRaw)) ? (bgRaw.hypothesis || bgRaw) : {};

    // Inspire
    const hmws = safe(() => this.getSelectedHmws(project), []);
    const bestIdeas = safe(() => this.getBestIdeas(project), []);

    // Shape（优先 summary）
    const shapeSummary = safe(() => this._readCardJSON('shapeSummary', project), null);
    const minConcept = safe(() => this._readCardJSON('shapeMinConcept', project), null);
    const storyboard = safe(() => this._readCardJSON('shapeStoryboard', project), null);
    const concept = (shapeSummary && shapeSummary.concept) || (minConcept && minConcept.concept) || { oneLiner: '', features: [], characteristics: [], boundaries: [] };
    const storyCards = (shapeSummary && Array.isArray(shapeSummary.storyboard)) ? shapeSummary.storyboard
      : (storyboard && Array.isArray(storyboard.cards) ? storyboard.cards : []);

    // Exam（优先 summary）
    const examSummary = safe(() => this._readCardJSON('examSummary', project), null);
    const testPlan = (examSummary && examSummary.testPlan) || safe(() => this._readCardJSON('examTestPlan', project), null) || {};
    const testReport = (examSummary && examSummary.testReport) || safe(() => this._readCardJSON('examTestReport', project), null) || {};
    const elevator = (examSummary && examSummary.elevator) || safe(() => this._readCardJSON('examElevator', project), null) || { pitch: '', iteration: [] };

    const fdEval = safe(() => this._readCardJSON('examFourDimEval', project), null);
    const fdHtml = fdEval && fdEval.scores ? (() => {
      const labels = { userValue: '用户价值', businessValue: '商业价值', feasibility: '技术可行性', innovation: '创新程度' };
      const order = ['userValue', 'businessValue', 'feasibility', 'innovation'];
      const total = order.reduce((s, k) => s + (Number(fdEval.scores[k]) || 0), 0);
      const rows = order.map(k => `<li>${labels[k]}：${Number(fdEval.scores[k]) || 0}/5${fdEval.reasons && fdEval.reasons[k] ? ' — ' + this.escapeHtml(fdEval.reasons[k]) : ''}</li>`).join('');
      return `<div class="panorama-sub">四维评价（综合 ${total}/20）</div><ul class="panorama-list">${rows}</ul>`;
    })() : '';

    // 30-60-90 天迭代计划
    const iteration = Array.isArray(elevator.iteration) ? elevator.iteration : [];
    const stages = ['0-30天', '31-60天', '61-90天'];
    const iterationHtml = iteration.length ? (() => {
      const rows = iteration.map(row => {
        const acts = Array.isArray(row.actions) ? row.actions : [];
        const cells = stages.map((s, si) => `<td>${this.escapeHtml(acts[si] || '—')}</td>`).join('');
        return `<tr><th>${this.escapeHtml(row.category || '—')}</th>${cells}</tr>`;
      }).join('');
      return `
        <div class="panorama-sub">30-60-90 天迭代计划</div>
        <table class="panorama-iter-table">
          <thead><tr><th>维度</th>${stages.map(s => `<th>${s}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    })() : '';

    const listHtml = (arr) => (arr && arr.length)
      ? arr.filter(Boolean).map(x => `<li>${this.escapeHtml(typeof x === 'string' ? x : (x.title || x.text || x.q || ''))}</li>`).join('')
      : '<li class="panorama-empty">—</li>';

    const revealBlock = `
      <div class="panorama-block reveal-block">
        <div class="panorama-block-head"><span class="panorama-icon">🔍</span><h3>揭示了什么（Reveal）</h3></div>
        <div class="panorama-row"><span class="panorama-key">目标用户</span><span>${this.escapeHtml(pov.targetUser || briefing.targetUser || '—')}</span></div>
        <div class="panorama-row"><span class="panorama-key">场景</span><span>${this.escapeHtml(pov.sceneChallenge || briefing.scene || '—')}</span></div>
        <div class="panorama-row"><span class="panorama-key">核心洞察</span><span>${this.escapeHtml(pov.insight || '—')}</span></div>
        <div class="panorama-row"><span class="panorama-key">商业假设</span><span>${this.escapeHtml(businessGoal.goal || businessGoal.consensus || '—')}</span></div>
      </div>`;

    const inspireBlock = `
      <div class="panorama-block inspire-block">
        <div class="panorama-block-head"><span class="panorama-icon">💡</span><h3>启发了什么（Inspire）</h3></div>
        <div class="panorama-sub">最佳 HMW</div>
        <ul class="panorama-list">${listHtml(hmws)}</ul>
        <div class="panorama-sub">最佳创意</div>
        <ul class="panorama-list">${listHtml(bestIdeas.map(i => i.title))}</ul>
      </div>`;

    const shapeBlock = `
      <div class="panorama-block shape-block">
        <div class="panorama-block-head"><span class="panorama-icon">🎯</span><h3>构建了什么（Shape）</h3></div>
        <div class="panorama-row"><span class="panorama-key">概念方案</span><span>${this.escapeHtml(concept.oneLiner || '—')}</span></div>
        <div class="panorama-sub">功能与特性</div>
        <ul class="panorama-list">${listHtml(concept.features)}</ul>
        <div class="panorama-sub">用户故事（6 卡）</div>
        <ul class="panorama-list">${listHtml(storyCards.map(c => c.title + (c.desc ? '：' + c.desc : '')))}</ul>
      </div>`;

    const examBlock = `
      <div class="panorama-block exam-block">
        <div class="panorama-block-head"><span class="panorama-icon">📋</span><h3>验证了什么（Exam）</h3></div>
        <div class="panorama-row"><span class="panorama-key">测试目的</span><span>${this.escapeHtml(testPlan.purpose || '—')}</span></div>
        <div class="panorama-sub">测试产出</div>
        <ul class="panorama-list">
          <li>有效价值：${this.escapeHtml(testReport.effectiveValue || '—')}</li>
          <li>无效价值：${this.escapeHtml(testReport.invalidValue || '—')}</li>
          <li>新问题：${this.escapeHtml(testReport.newProblems || '—')}</li>
          <li>新机会：${this.escapeHtml(testReport.newOpportunities || '—')}</li>
        </ul>
        ${fdHtml}
        ${iterationHtml}
        <div class="panorama-sub">电梯演讲</div>
        <div class="panorama-pitch">${this.escapeHtml(elevator.pitch || '—')}</div>
      </div>`;

    this.setContent(`
      <div class="panorama-view" id="panoramaView">
        <header class="panorama-header">
          <h1 class="panorama-title">🎉 项目全景图</h1>
          <p class="panorama-subtitle">${this.escapeHtml(project.title || '未命名项目')} · 完整 RISE 创新旅程</p>
        </header>
        <div class="panorama-grid" id="panoramaGrid">
          ${revealBlock}
          ${inspireBlock}
          ${shapeBlock}
          ${examBlock}
        </div>
        <div class="panorama-toolbar no-print">
          <button class="btn btn-secondary" id="panoramaImgBtn">🖼️ 保存为图片</button>
          <button class="btn btn-secondary" id="panoramaDownloadBtn">📥 下载 HTML</button>
          <button class="btn btn-secondary" id="panoramaPrintBtn">🖨️ 打印 / PDF</button>
          <button class="btn btn-primary" id="panoramaHomeBtn" style="background: var(--exam-primary);">返回首页</button>
        </div>
      </div>
    `);

    document.getElementById('panoramaHomeBtn')?.addEventListener('click', () => {
      AppState.navigate('home');
    });

    document.getElementById('panoramaPrintBtn')?.addEventListener('click', () => {
      window.print();
    });

    document.getElementById('panoramaDownloadBtn')?.addEventListener('click', () => {
      this.downloadPanoramaHtml(project);
    });

    document.getElementById('panoramaImgBtn')?.addEventListener('click', () => {
      this.downloadPanoramaImage(project);
    });
  }

  // 生成自包含 HTML 文件并下载
  downloadPanoramaHtml(project) {
    const grid = document.getElementById('panoramaGrid');
    if (!grid) return;
    const title = this.escapeHtml(project.title || '未命名项目');
    const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8"><title>${title} - 项目全景图</title>
<style>${PANORAMA_EXPORT_CSS}</style></head>
<body>
<h1 style="text-align:center;font-family:system-ui,'PingFang SC','Microsoft YaHei',sans-serif;color:#1f2937;">🎉 项目全景图</h1>
<p style="text-align:center;color:#6b7280;font-family:system-ui,sans-serif;">${title} · 完整 RISE 创新旅程</p>
${grid.outerHTML}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-项目全景图.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // 通过 SVG foreignObject 导出 PNG（best-effort，失败回退提示）
  downloadPanoramaImage(project) {
    try {
      const grid = document.getElementById('panoramaGrid');
      if (!grid) return;
      const title = this.escapeHtml(project.title || '未命名项目');
      const clone = grid.cloneNode(true);
      const xml = new XMLSerializer().serializeToString(clone);
      const width = grid.scrollWidth || 1000;
      const height = grid.scrollHeight || 600;
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${xml}</div></foreignObject></svg>`;
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const scale = 2;
        const canvas = document.createElement('canvas');
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        canvas.toBlob((b) => {
          if (!b) { alert('图片导出失败，请改用「下载 HTML」或「打印 / PDF」。'); return; }
          const a = document.createElement('a');
          a.href = URL.createObjectURL(b);
          a.download = `${title}-项目全景图.png`;
          document.body.appendChild(a);
          a.click();
          a.remove();
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        alert('图片导出失败，请改用「下载 HTML」或「打印 / PDF」。');
      };
      img.src = url;
    } catch (e) {
      console.warn('[panorama image]', e);
      alert('图片导出失败，请改用「下载 HTML」或「打印 / PDF」。');
    }
  }

}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('%c🚀 Eureka Lite v1.1 %c(全景图数据修复+迭代计划+下载+首页项目卡片)', 'color:#E07A2F;font-size:14px;font-weight:bold', 'color:#666;font-size:12px');
  console.log('%c💡 提示：FIND 推导输出如显示 [📋 本地模板] = AI未生效；[🤖 DeepSeek] = AI正常', 'color:#888;font-size:11px');
  window.app = new EurekaLite();
  window.app.start();
});

// 【i18n】EN 模式下所有动态追加的弹窗/面板统一应用中→英兜底替换
if (window.I18N && window.I18N.applyTo && document.body) {
  const _origAppend = document.body.appendChild.bind(document.body);
  document.body.appendChild = function (el) {
    if (el && el.nodeType === 1 && el.innerHTML && window.I18N.getLang() === 'en') {
      try { el.innerHTML = window.I18N.applyTo(el.innerHTML); } catch (e) {}
    }
    return _origAppend(el);
  };
}
