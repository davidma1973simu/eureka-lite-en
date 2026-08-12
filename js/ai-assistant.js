/**
 * Eureka Lite - AI Assistant Module
 * Based on user input for normative revision
 */

const AIAssistant = {
  // State
  isOpen: false,
  currentSuggestions: [],

  /**
   * Analyze user input and extract key information
   * @param {string} userInput - User's raw input
   * @param {string} stage - Current stage
   * @param {number} screen - Current screen number
   * @returns {Object} - Analyzed content with key elements
   */
  analyzeInput(userInput, stage, screen) {
    if (!userInput || userInput.trim().length < 5) {
      return { isEmpty: true, elements: {} };
    }

    const text = userInput.trim();
    const elements = {};

    // Extract user/target (用户)
    const userPatterns = [
      /用户[是为是]?(.+?)[，,]/,
      /目标用户[是为是]?(.+?)[，,]/,
      /(.+?)在.+?[使用场景]|使用场景[是为是]?(.+?)[，,]/
    ];
    for (const pattern of userPatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.user = match[1] || match[2] || '';
        break;
      }
    }

    // Extract scene/scenario (场景)
    const scenePatterns = [
      /场景[是为是]?(.+?)[，,]/,
      /使用场景[是为是]?(.+?)[，,]/,
      /在(.+?)时/,
      /(.+?)的情况下/
    ];
    for (const pattern of scenePatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.scene = match[1] || '';
        break;
      }
    }

    // Extract pain point (痛点)
    const painPatterns = [
      /痛点[是为是]?(.+?)[，,。]/,
      /问题是(.+?)[，,。]/,
      /(.+?)困难[，,。]/,
      /(忘记|无法|不能|不会|很难).{0,20}[，,。]/
    ];
    for (const pattern of painPatterns) {
      const match = text.match(pattern);
      if (match) {
        elements.pain = match[1] || match[0] || '';
        break;
      }
    }

    // Extract product/service mentioned
    const productMatch = text.match(/(智能|智能硬件|APP|应用|产品|服务|网站|平台)(.+?)[，,。]/);
    if (productMatch) {
      elements.product = productMatch[2] || productMatch[0];
    }

    return { isEmpty: false, elements, originalText: text };
  },

  /**
   * Generate normative revision based on user input
   * For Reveal T1: Scene Description - normalize to structured format
   */
  reviseRevealT1(userInput, analysis) {
    if (analysis.isEmpty) {
      return null;
    }

    const { elements } = analysis;
    const lines = [];

    // 目标用户
    if (elements.user) {
      lines.push(`【目标用户】${elements.user}`);
    }

    // 使用场景
    if (elements.scene) {
      lines.push(`【使用场景】${elements.scene}`);
    } else if (userInput.includes('课') || userInput.includes('教室')) {
      lines.push('【使用场景】课间休息或课堂上');
    } else if (userInput.includes('宿舍')) {
      lines.push('【使用场景】宿舍日常生活');
    } else if (userInput.includes('通勤') || userInput.includes('办公')) {
      lines.push('【使用场景】通勤途中或办公室');
    }

    // 痛点/挑战
    if (elements.pain) {
      lines.push(`【痛点/挑战】${elements.pain}`);
    } else if (userInput.includes('忘记')) {
      lines.push('【痛点/挑战】用户经常忘记喝水或打水');
    } else if (userInput.includes('麻烦')) {
      lines.push('【痛点/挑战】现有解决方案操作繁琐');
    } else if (userInput.includes('不方便')) {
      lines.push('【痛点/挑战】获取饮品的途径不够便捷');
    }

    // 如果有产品提及
    if (elements.product) {
      lines.push(`【产品/服务】${elements.product}`);
    }

    // 行为描述
    const actionMatch = userInput.match(/(想要|希望|需要)(.+?)[，,。]/);
    if (actionMatch) {
      lines.push(`【用户目标】${actionMatch[2]}`);
    }

    if (lines.length < 2) {
      // 如果提取不到足够信息，返回基于原文的优化版本
      return {
        title: '场景描述（优化版）',
        content: this.normalizeText(userInput)
      };
    }

    return {
      title: '场景描述（规范化改写）',
      content: lines.join('\n')
    };
  },

  /**
   * Normalize text to proper format
   */
  normalizeText(text) {
    // 简单的文本规范化：修正标点、规范格式
    return text
      .replace(/，/g, '，')
      .replace(/。/g, '。')
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Generate normative revision for different stages/screens
   * @param {Object} context - { stage, screen, type }
   * @param {string} userInput - User's original input
   * @returns {Object|null} - Revised content
   */
  generatePrefillContent(context, userInput) {
    const { stage, screen } = context;
    const analysis = this.analyzeInput(userInput, stage, screen);

    // For Reveal T1 (scene description)
    if (stage === 'reveal' && screen === 1) {
      return this.reviseRevealT1(userInput, analysis);
    }

    // For Reveal T2 (journey)
    if (stage === 'reveal' && screen === 2) {
      return this.reviseRevealT2(userInput, analysis);
    }

    // For Reveal T3 (FIND insight) - handled by generateFindStep
    // For Reveal T4 (business goal) - handled by generic revision

    // For Inspire T1 (HMW)
    if (stage === 'inspire' && screen === 1) {
      return this.reviseInspireT1(userInput, analysis);
    }

    // Generic revision for other screens
    if (!analysis.isEmpty) {
      return {
        title: '内容优化',
        content: this.normalizeText(userInput)
      };
    }

    return null;
  },

  /**
   * Generate prefill content for Reveal Screen 1 dialogue inputs
   * Based on project title and category
   * @param {Object} project - Current project
   * @param {string} field - 'targetUser' or 'sceneDesc'
   * @returns {string|null} - Prefill text
   */
  generateRevealPrefill(project, field) {
    if (!project) return null;

    const title = (project.title || project.originalTitle || '').toLowerCase();
    const category = project.category || 'product';
    const isEn = (typeof I18N !== 'undefined' && I18N.getLang() === 'en');

    // Extract keywords from title
    const hasWater = title.includes('水') || title.includes('杯') || title.includes('喝') || title.includes('water') || title.includes('cup') || title.includes('drink');
    const hasShoe = title.includes('鞋') || title.includes('跑') || title.includes('运动') || title.includes('shoe') || title.includes('run') || title.includes('sport');
    const hasStudent = title.includes('学生') || title.includes('大学') || title.includes('课堂') || title.includes('student') || title.includes('university') || title.includes('college');
    const hasOffice = title.includes('办公') || title.includes('通勤') || title.includes('工作') || title.includes('office') || title.includes('commute') || title.includes('work');
    const hasHealth = title.includes('健康') || title.includes('健身') || title.includes('运动') || title.includes('health') || title.includes('fitness') || title.includes('exercise');
    const hasElder = title.includes('老人') || title.includes('老年') || title.includes('父母') || title.includes('elder') || title.includes('senior') || title.includes('parent');
    const hasChild = title.includes('儿童') || title.includes('孩子') || title.includes('宝宝') || title.includes('child') || title.includes('kid') || title.includes('baby');
    const hasPet = title.includes('宠物') || title.includes('狗') || title.includes('猫') || title.includes('pet') || title.includes('dog') || title.includes('cat');

    if (field === 'targetUser') {
      if (isEn) {
        if (hasStudent) return 'College and graduate students';
        if (hasOffice) return 'Office workers aged 25-40';
        if (hasElder) return 'Seniors over 65 and their family members';
        if (hasChild) return 'Parents of children aged 0-6';
        if (hasPet) return 'Urban pet owners aged 25-35';
        if (hasHealth) return 'Urban white-collar workers who care about health management';
        if (hasShoe) return 'Running enthusiasts aged 18-35';
        if (hasWater) return 'Students and young office workers aged 18-30';
        const userDefaultsEn = {
          product: 'Target user group aged 18-35',
          service: 'Young and middle-aged users who need convenient services',
          problem: 'People affected by this problem',
          explore: 'Early adopters interested in this area'
        };
        return userDefaultsEn[category] || 'Target user group';
      }

      // Generate target user based on keywords and category
      if (hasStudent) return '大学生和研究生';
      if (hasOffice) return '25-40岁的上班族';
      if (hasElder) return '65岁以上的老年人及其家属';
      if (hasChild) return '0-6岁幼儿的父母';
      if (hasPet) return '25-35岁的城市宠物主人';
      if (hasHealth) return '关注健康管理的都市白领';
      if (hasShoe) return '18-35岁的跑步爱好者';
      if (hasWater) return '18-30岁的学生和年轻上班族';

      // Category-based defaults
      const userDefaults = {
        product: '18-35岁的目标用户群体',
        service: '需要便捷服务的中青年用户',
        problem: '受该问题困扰的目标人群',
        explore: '对该领域感兴趣的早期用户'
      };
      return userDefaults[category] || '目标用户群体';
    }

    if (field === 'sceneDesc') {
      if (isEn) {
        if (hasWater) return 'During busy study or work, users often forget to drink water and only realize they are dehydrated when thirsty. Existing cups cannot remind users to hydrate in time, leaving them in a sub-healthy state.';
        if (hasShoe) return 'When choosing running shoes, running enthusiasts face choice difficulty: they don\'t know which shoe suits their foot shape and running habits. Offline fitting is troublesome, online purchase risks poor fit, and returns are costly.';
        if (hasStudent) return 'College students need to manage multiple tasks after class: coursework, club activities, part-time jobs, etc. Existing tools are either too complex or too single-function to efficiently integrate everything.';
        if (hasOffice) return 'During commute and work, office workers need to handle a large amount of fragmented information: emails, messages, to-dos. Information is scattered across different platforms, hard to manage centrally, and important items are often missed.';
        if (hasHealth) return 'Health-conscious people want to develop regular exercise and diet habits but lack effective supervision and reminders. Persisting alone is easy to give up; external motivation and peer support are needed.';
        if (hasElder) return 'When elderly people live alone, their children worry about their safety and living conditions. Existing communication methods (phone, video) are not timely enough to know the elderly\'s status in real time.';
        if (hasChild) return 'New parents need to record feeding, sleep, vaccination and other information during their child\'s growth. Paper records are easily lost, and existing apps are complicated for elders to use.';
        if (hasPet) return 'When office workers go out during the day, they worry about pets left home alone: whether they are hungry, making trouble, or in a good mood. They cannot know the pet\'s status in real time and only discover problems after returning home.';
        const sceneDefaultsEn = {
          product: 'Users encounter inconveniences in daily life; existing solutions fail to meet their specific needs, leading to low efficiency or poor experience.',
          service: 'When users need the service, they find the process cumbersome, waiting time long, and service quality unstable, resulting in a disappointing overall experience.',
          problem: 'The problem affects a wide range of people; existing solutions have limited effect, and users urgently need more efficient and convenient solutions.',
          explore: 'This direction currently lacks sufficient user validation; it is necessary to deeply understand the real needs and usage habits of the target group.'
        };
        return sceneDefaultsEn[category] || 'Specific challenges and needs users face in relevant scenarios.';
      }

      // Generate scene description based on keywords and category
      if (hasWater) return '在忙碌的学习或工作中，用户经常忘记喝水，等到口渴时才发现身体已经缺水。现有的水杯无法提醒用户及时补水，导致用户长期处于亚健康状态。';
      if (hasShoe) return '跑步爱好者在选购跑鞋时，面临选择困难：不知道哪款鞋适合自己的脚型和跑步习惯。线下试穿麻烦，线上购买又担心不合脚，退换货成本高。';
      if (hasStudent) return '大学生在课余时间需要管理多项任务：课程作业、社团活动、兼职工作等。现有的工具过于复杂或功能单一，难以高效整合所有事务。';
      if (hasOffice) return '上班族在通勤和工作中，需要处理大量碎片化信息：邮件、消息、待办事项。信息分散在不同平台，难以统一管理，经常遗漏重要事项。';
      if (hasHealth) return '注重健康的人群希望养成规律的运动和饮食习惯，但缺乏有效的监督和提醒机制。独自坚持容易放弃，需要外部激励和同伴支持。';
      if (hasElder) return '老年人独自在家时，子女担心他们的安全和生活状况。现有的沟通方式（电话、视频）不够及时，无法实时了解老人的状态。';
      if (hasChild) return '新手父母在孩子成长过程中，需要记录喂养、睡眠、疫苗接种等信息。纸质记录容易丢失，现有App操作复杂，长辈不会使用。';
      if (hasPet) return '上班族白天外出工作时，担心独自在家的宠物：是否饿了、有没有捣乱、情绪如何。无法实时了解宠物状态，回家后才发现问题。';

      // Category-based defaults
      const sceneDefaults = {
        product: '用户在日常生活中遇到的不便，现有解决方案无法满足其特定需求，导致效率低下或体验不佳。',
        service: '用户在需要服务时，发现流程繁琐、等待时间长、服务质量不稳定，整体体验令人失望。',
        problem: '该问题影响的人群广泛，现有解决方法效果有限，用户迫切需要更高效、更便捷的解决方案。',
        explore: '该方向目前缺乏充分的用户验证，需要深入了解目标群体的真实需求和使用习惯。'
      };
      return sceneDefaults[category] || '用户在相关场景下遇到的具体挑战和需求。';
    }

    return null;
  },

  /**
   * Revise Reveal T2: Journey exploration
   */
  reviseRevealT2(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const steps = [];

    // Generate journey based on context
    if (elements.product || userInput.includes('水杯') || userInput.includes('喝水')) {
      steps.push('【触点1】用户感觉口渴，意识到需要补充水分');
      steps.push('【触点2】查看手机或手表，确认当前时间');
      steps.push('【触点3】决定去打水或使用水杯');
      steps.push('【触点4】寻找水杯或前往饮水处');
      steps.push('【触点5】完成喝水行为');
      steps.push('【断裂点】忘记打水/水杯不在身边');
    } else {
      steps.push('【触点1】用户发现需求');
      steps.push('【触点2】开始寻找解决方案');
      steps.push('【触点3】评估选项');
      steps.push('【触点4】做出选择');
      steps.push('【触点5】使用产品/服务');
      steps.push('【触点6】产生后续行为');
    }

    return {
      title: '用户旅程（规范化）',
      content: steps.join('\n')
    };
  },

  /**
   * Revise Reveal T3: Key findings
   */
  reviseRevealT3(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const findings = [];

    findings.push(`【发现1】${elements.user || '目标用户'}在使用${elements.scene || '该场景'}时，存在未被满足的需求`);

    if (elements.pain) {
      findings.push(`【发现2】"${elements.pain}"是核心痛点`);
    }

    findings.push('【发现3】现有解决方案在[此处补充具体断裂点]存在优化空间');

    return {
      title: '关键发现（规范化）',
      content: findings.join('\n')
    };
  },

  /**
   * Revise Reveal T4: Pain insights (FIND model)
   */
  reviseRevealT4(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const find = [];

    // Facts
    if (elements.user) {
      find.push(`【Facts 事实】${elements.user}在${elements.scene || '该场景'}中，${elements.pain || userInput}`);
    } else {
      find.push(`【Facts 事实】${userInput.substring(0, 100)}`);
    }

    // Interpret
    find.push('【Interpret 解读】这说明用户需要一个更便捷、更不容易被遗忘的补水提醒或管理方案');

    // Need
    find.push('【Need 需求】用户需要的是：1) 及时提醒 2) 便捷获取 3) 不依赖记忆');

    // Design
    find.push('【Design 设计机会】智能提醒 + 便捷取水 + 社交激励 的组合方案');

    return {
      title: 'FIND 洞察（规范化）',
      content: find.join('\n')
    };
  },

  /**
   * Revise Inspire T1: HMW question
   */
  reviseInspireT1(userInput, analysis) {
    if (analysis.isEmpty) return null;

    const { elements } = analysis;
    const user = elements.user || '[目标用户]';
    const scene = elements.scene || '该场景';
    const pain = elements.pain || '存在的痛点';

    const hmws = [
      `我们如何帮助${user}，在${scene}时，能够及时补充水分，不再忘记？`,
      `我们如何帮助${user}，在${scene}时，能够更便捷地获取饮水？`,
      `我们如何帮助${user}，在${scene}时，能够建立健康的饮水习惯？`
    ];

    return {
      title: 'HMW 问题（规范化）',
      content: hmws.join('\n')
    };
  },

  /**
   * Get normative suggestions (not random examples)
   */
  getSuggestions(stage, screen, userInput) {
    const analysis = this.analyzeInput(userInput, stage, screen);

    if (analysis.isEmpty) {
      // Default generic suggestions when no input
      return this.getDefaultSuggestions(stage, screen);
    }

    // Context-aware suggestions based on user input
    return this.getContextAwareSuggestions(stage, screen, analysis);
  },

  /**
   * Get suggestions based on user's actual input
   */
  getContextAwareSuggestions(stage, screen, analysis) {
    const { elements, originalText } = analysis;
    const suggestions = [];

    switch (stage) {
      case 'reveal':
        if (screen === 1) {
          // Scene description - suggest adding missing elements
          if (!elements.user) {
            suggestions.push('✓ 补充：明确目标用户是谁');
          }
          if (!elements.scene) {
            suggestions.push('✓ 补充：具体的使用场景和时间');
          }
          if (!elements.pain) {
            suggestions.push('✓ 补充：用户的痛点或挑战');
          }
          if (elements.user && elements.scene && elements.pain) {
            suggestions.push('✓ 内容已完整，可点击"优化格式"进行规范化');
          }
        } else if (screen === 2) {
          // Journey - suggest structure
          suggestions.push('✓ 基于您的场景，建议按触点顺序描述');
          suggestions.push('✓ 标注关键决策点和情绪变化');
          suggestions.push('✓ 标记可能的体验断裂点');
        } else if (screen === 3) {
          // Key findings
          suggestions.push('✓ 提炼最独特的1-3个发现');
          suggestions.push('✓ 用具体事实或数据支撑');
          suggestions.push('✓ 挑战常规认知');
        } else if (screen === 4) {
          // FIND model
          suggestions.push('✓ Facts：描述观察到的具体事实');
          suggestions.push('✓ Interpret：解读事实背后的原因');
          suggestions.push('✓ Need：挖掘用户真正需要什么');
          suggestions.push('✓ Design：提出设计机会');
        }
        break;

      case 'inspire':
        if (screen === 1) {
          suggestions.push('✓ 用"我们如何帮助..."开头');
          suggestions.push('✓ 明确目标用户');
          suggestions.push('✓ 描述期望的改变');
        }
        break;

      default:
        return this.getDefaultSuggestions(stage, screen);
    }

    return suggestions;
  },

  /**
   * Default suggestions when no user input
   */
  getDefaultSuggestions(stage, screen) {
    const defaults = {
      'reveal-1': ['描述一个具体的用户场景', '聚焦一个痛点时刻', '越具体越好'],
      'reveal-2': ['从用户视角走一遍流程', '标注关键触点', '找到体验断裂点'],
      'reveal-3': ['提炼最独特的发现', '用数据或事实支撑', '挑战常规认知'],
      'reveal-4': ['明确目标用户', '未满足的需求是什么', '情感层面的痛点'],
      'reveal-5': ['涉及哪些利益相关方', '商业价值假设', '与业务目标的关联'],
      'inspire-1': ['用"我们如何帮助..."开头', '明确目标用户和场景', '描述期望的结果'],
      'inspire-3': ['先求量，再求质', '允许疯狂的想法', '组合多个灵感来源'],
    };

    const key = `${stage}-${screen}`;
    return defaults[key] || ['输入内容后，我会给您具体的优化建议'];
  },

  /**
   * Get hint for current stage/screen
   */
  getHint(stage, screen, userInput) {
    const analysis = this.analyzeInput(userInput, stage, screen);

    if (!analysis.isEmpty) {
      switch (stage) {
        case 'reveal':
          if (screen === 1) {
            if (!analysis.elements.user) {
              return '💡 提示：请明确描述"谁"在使用';
            }
            if (!analysis.elements.scene) {
              return '💡 提示：请补充"什么情况下"使用';
            }
            if (!analysis.elements.pain) {
              return '💡 提示：请描述遇到了什么困难';
            }
            return '💡 提示：内容完整，可点击"预填"查看规范化版本';
          }
          break;
      }
    }

    // Default hints
    const hints = {
      'reveal-1': '例如："用户在课间休息时，经常忘记喝水"',
      'reveal-2': '从"第一次接触"到"使用后"完整描述',
      'reveal-3': '发现了什么别人没注意到的？',
      'reveal-4': '用户真正想要的是什么？',
      'inspire-1': '"我们如何帮助忙碌的学生，在课堂上，能够及时补充水分？"',
    };

    return hints[`${stage}-${screen}`] || '💡 输入内容后获得针对性建议';
  },

  // Legacy compatibility - keep old method names working
  getSuggestionsLegacy(stage, screen) {
    return this.getDefaultSuggestions(stage, screen);
  },

  getHintLegacy(stage, screen) {
    const hints = {
      'reveal-1': '例如："用户在结账时发现运费比预期高"',
      'reveal-2': '从"第一次接触"到"使用后"完整描述',
      'reveal-3': '发现了什么别人没注意到的？',
      'reveal-4': '用户真正想要的是什么？',
      'reveal-5': '这个发现对公司意味着什么？',
      'inspire-1': '"我们如何帮助忙碌的用户，在没有时间研究时，能够快速做出明智决定？"',
      'inspire-2': '哪个领域已经解决了类似问题？',
      'inspire-3': '先列出10个想法，再筛选',
      'inspire-4': '哪个想法最能打动你？',
      'inspire-5': '给这个想法起个名字',
    };
    return hints[`${stage}-${screen}`] || '';
  },

  /**
   * Get NCO inspiration based on user's content
   * @param {string} category - Base category
   * @param {number} count - Number of inspirations to return
   * @param {string} userInput - User's original input for context
   */
  getNCOInspiration(category, count = 3, userInput = '') {
    const text = (userInput || '').toLowerCase();

    // Find related inspirations based on user content
    const getRelatedInspirations = () => {
      // Health/wellness related
      if (text.includes('水') || text.includes('喝') || text.includes('健康') || text.includes('提醒')) {
        return [
          {
            type: 'New',
            title: '行为追踪与提醒',
            description: '通过传感器追踪行为，自动触发提醒（如智能水杯记录饮水量）',
            source: '健康科技'
          },
          {
            type: 'Cool',
            title: '游戏化激励',
            description: '将健康行为转化为积分、徽章、排行榜，让喝水变得有趣味',
            source: '健康App'
          },
          {
            type: 'Outsider',
            title: '社交传染',
            description: '让朋友、同学互相提醒、互相激励，形成健康的社交氛围',
            source: '微信运动'
          }
        ];
      }

      // Student/education related
      if (text.includes('学生') || text.includes('大学') || text.includes('课堂') || text.includes('课间') || text.includes('学习')) {
        return [
          {
            type: 'New',
            title: '场景化微服务',
            description: '针对碎片化场景的轻量级服务（如课间快速完成的微任务）',
            source: '教育科技'
          },
          {
            type: 'Cool',
            title: '同伴效应',
            description: '利用学生之间的相互影响，创造正向的学习/生活习惯',
            source: 'Study Together'
          },
          {
            type: 'Outsider',
            title: '错峰设计',
            description: '在用户不需要主动行动时提供服务，减少意志力消耗',
            source: '智能家居'
          }
        ];
      }

      // Office/work related
      if (text.includes('办公') || text.includes('通勤') || text.includes('工作') || text.includes('会议')) {
        return [
          {
            type: 'New',
            title: '情境感知自动化',
            description: '根据用户状态自动触发服务（如进入办公室自动开启待办）',
            source: '智能办公'
          },
          {
            type: 'Cool',
            title: '微打断设计',
            description: '通过极小的打断（如震动、闪光）传递关键信息',
            source: '可穿戴设备'
          },
          {
            type: 'Outsider',
            title: '无意识交互',
            description: '用户无需主动操作，系统自动完成（如自动存档、同步）',
            source: 'iCloud'
          }
        ];
      }

      // Generic product related
      if (category === 'product' || text.includes('产品') || text.includes('硬件')) {
        return [
          {
            type: 'New',
            title: '订阅制思维',
            description: '从一次性购买转向持续服务订阅，创造持续价值',
            source: 'SaaS行业'
          },
          {
            type: 'Cool',
            title: '游戏化反馈',
            description: '让用户行为获得即时、愉悦的反馈，提升参与度',
            source: 'Duolingo'
          },
          {
            type: 'Outsider',
            title: '反向定制',
            description: '让用户参与产品定义过程，提升认同感',
            source: '乐高Ideas'
          }
        ];
      }

      // Generic service related
      if (category === 'service' || text.includes('服务')) {
        return [
          {
            type: 'New',
            title: '情境感知服务',
            description: '根据用户当前状态调整服务内容',
            source: '酒店行业'
          },
          {
            type: 'Cool',
            title: '惊喜元素',
            description: '在预期之外创造超预期体验',
            source: '迪士尼'
          },
          {
            type: 'Outsider',
            title: '社区驱动',
            description: '让用户互相服务、互相帮助',
            source: 'Airbnb社区'
          }
        ];
      }

      // Default
      return [
        {
          type: 'New',
          title: '假设验证',
          description: '先验证最风险的假设，用最小成本测试',
          source: '精益创业'
        },
        {
          type: 'Cool',
          title: '用户共创',
          description: '让用户参与创新过程，共同定义解决方案',
          source: '创新工作坊'
        },
        {
          type: 'Outsider',
          title: '极端用户',
          description: '关注极端用户的极端需求，往往能发现真正机会',
          source: '设计思维'
        }
      ];
    };

    return getRelatedInspirations().slice(0, count);
  },

  /**
   * Generate FIND step content using AI
   * F(事实) → I(解释) → N(需求) → D(凝练)
   * 重写版：基于用户输入做针对性分析，避免万能模板
   * @param {string} stepKey - 'fact', 'interpret', 'need', 'distill'
   * @param {string} userInput - User's input for this step
   * @param {Object} context - Previous steps' data { fact, interpret, need }
   * @returns {Promise<string>} - AI generated content
   */
  /**
   * Generate FIND step content
   * Core principle: ALL outputs <= 100 chars, must reference input
   * F(fact) -> I(interpret) -> N(need) -> D(distill)
   */
  async generateFindStep(stepKey, userInput, context) {
    console.log(`[FIND-AI] generateFindStep called: step=${stepKey}, hasAI=${this._hasAI()}`);
    console.log(`[FIND-AI] context=`, JSON.stringify(context));
    console.log(`[FIND-AI] userInput="${(userInput || '').trim().slice(0, 100)}"`);

    // 优先使用 DeepSeek 真实推理 —— 严格链式推导版
    if (this._hasAI()) {
      const stepPrompts = {
        fact: {
          guide: `You are a senior innovation insights analyst, proficient in design thinking and user research. The user has just marked a "key finding (Fact)" from the user journey map — an observable, verifiable phenomenon.

【Your only task】Give this fact a deep "Interpretation" — answer **Why: why did this phenomenon happen?**

【Original fact entered by user】
${(userInput || '').trim()}

【Strict analysis rules — follow every one】
1. 🔍 Dig for root causes: don't stay on the surface. Ask Why three levels deep:
   - Level 1: What is the direct cause? (user-behavior level)
   - Level 2: What is wrong with the system/product/process? (design-flaw level)
   - Level 3: Why does this design flaw exist? (assumption/constraint level)
2. 🚫 Never blame the user: phrases like "user error", "user didn't read carefully", or "user habit" are lazy answers.
3. 🎯 Attribute to the system: the phenomenon must be caused by a design or absence in the product, service, process, or environment.
4. 🔗 Causal chain: use the structure "Because A (system issue), B (user experience) happens, therefore C (observed phenomenon)".
5. 🎯 The analysis must target the project's real target user and real scenario. Do not invent other personas or scenarios.
6. ✂️ One paragraph, 80–120 words, concise and forceful.

Output only the interpretation conclusion. No prefix, no numbered list, no filler like "Here is the analysis":`,
          outputLabel: 'I Interpret'
        },
        interpret: {
          guide: `You are a senior innovation insights analyst. We have now completed the first two steps:
- 🔍 Fact (F): ${context?.fact || '(previous step not filled)'}
- 💡 Interpret (I): ${context?.interpret || '(previous step not filled)'}

【Your only task】Based on the above "Fact + Interpret" causal chain, distil the user's true "Need (N)" — answer **Why Not: what does the user subconsciously really need?**

Note: the user added extra reflection in this step: ${(userInput || '').trim() || '(no extra input)'}

【Strict rules — follow every one】
1. ⚔️ Distinguish Want vs Need:
   - Stated Want = surface request, e.g. "I want a better search feature"
   - Latent Need = deep motivation, e.g. "When overloaded with information, I need a sense of certainty and control"
   - Your task is to find the Latent Need!
2. 🔗 Derive logically from F→I: the need must naturally follow from the fact + interpretation above; do not jump to unrelated areas.
3. 💊 The need must be a concrete pain point, desire, or sense of lack that a product or service can solve.
4. ✂️ One sentence, 50–80 words, in the format "What the user really needs is not [A surface want], but [B deep essence / feeling]."
5. 🎯 This sentence should give the product team immediate direction.
6. 🧑 The target user must be the real target user provided in the project context; do not invent other personas.

Output only the need conclusion, with no prefix:`,
          outputLabel: 'N Need'
        },
        need: {
          guide: `You are a senior innovation insights analyst. We have completed the first three steps of FIND:
- 🔍 Fact (F): ${context?.fact || '(missing)'}
- 💡 Interpret (I): ${context?.interpret || '(missing)'}
- ❤️ Need (N): ${context?.need || '(missing)'}

【Your only task】Distil the three into one core **insight (Distill / POV)** that strikes at the essence — answer **So What: what concrete innovation opportunity does this mean?**

User's extra reflection in this step: ${(userInput || '').trim() || '(no extra input)'}

【Strict rules — follow every one】
1. 📐 POV fixed format: [target user] + needs + [core need/experience], because + [root cause makes existing approach fail].
2. 🎯 The target user must strictly use the real target user provided in the project context. Never invent new personas (e.g. "25-year-old new mom", "office worker"). If not provided, use the generic "user", but never fabricate.
3. 🌍 The scenario must strictly use the real scenario provided above; do not switch to unrelated scenarios.
4. ⚡ The core need should have emotional tension (not "better XX", but "a sense of certainty/control/dignity in the XX scenario").
5. 🔗 The root cause must reference the F-I-N derivation above.
6. ✂️ One sentence, 60–100 words, with elevator-pitch force — a stranger should say "that really is a problem" after hearing it.
7. ❌ No templated, empty, or generic filler; no new people, scenarios, or assumptions unrelated to the project.

Output only the POV statement, with no prefix:`,
          outputLabel: 'D Insight (POV)'
        },
        distill: {
          guide: `You are a senior innovation insights analyst. The FIND four-step method is nearly complete, and the first three steps have produced:

- 🔍 Fact (F): ${context?.fact || '(missing)'}
- 💡 Interpret (I): ${context?.interpret || '(missing)'}
- ❤️ Need (N): ${context?.need || '(missing)'}
- 📝 Current POV draft: ${(userInput || '').trim() || '(no draft)'}

【Your only task】Give the above POV a **final distillation and strengthening** so it becomes a North Star statement that can directly guide subsequent HMW innovation design.

【Strict rules — follow every one】
1. 🎯 If the user already has a decent POV draft → refine and strengthen it (more precise / more forceful).
2. ✍️ If the user's POV is too generic or weak → rewrite a stronger version based on F-I-N.
3. 📐 Final format: POV = [target user] + in [scenario] + urgently needs [core experience/capability], + because [root cause makes existing solution fail].
4. 🎯 Target user and scenario must strictly use the real target user and real scenario from above. Never invent new people or scenarios. If not provided, use "user" rather than a specific persona.
5. ⚡ Quality standard: after reading this sentence, the team should be able to start brainstorming solutions immediately.
6. ✂️ One sentence, 60–100 words.
7. ❌ No new assumptions, people, or scenarios unrelated to the project.

Output only the final POV statement, with no prefix:`,
          outputLabel: 'D Final Distill (POV)'
        }
      };
      const sp = stepPrompts[stepKey];
      if (sp) {
        const ctxLines = [];
        if (context?.targetUser) ctxLines.push(`【项目真实目标用户】${context.targetUser}`);
        if (context?.sceneDesc) ctxLines.push(`【项目真实场景】${context.sceneDesc}`);
        if (context?.scene) ctxLines.push(`【项目场景摘要】${context.scene}`);
        if (context?.finding && context.finding !== (userInput || '').trim()) ctxLines.push(`【原始关键发现】${context.finding}`);
        const prompt =
          `${ctxLines.join('\n')}\n\n${sp.guide}`;
        console.log(`[FIND-AI] Calling DeepSeek for step=${stepKey}, prompt length=${prompt.length}`);

        try {
          const r = await window.AIService.complete(prompt, {
            system: this._systemPersona(), temperature: 0.7, maxTokens: 300
          });
          if (r && r.trim()) {
            console.log(`[FIND-AI] ✅ DeepSeek returned (${r.length} chars):`, r.slice(0, 120));
            return '[🤖 DeepSeek] ' + r.trim().slice(0, 200);
          }
        } catch (e) {
          console.warn('[FIND-AI] ❌ DeepSeek failed, using local fallback:', e.message);
        }
      } else {
        console.warn(`[FIND-AI] ❌ No prompt defined for step=${stepKey}`);
      }
    } else {
      console.warn('[FIND-AI] ⚠️ _hasAI()=false, AI service not configured or Key invalid, using local template');
    }

    // ---- 本地兜底模板 ----
    console.log(`[FIND-AI] 📋 Using local fallback template for step=${stepKey}`);

    // ---- 改进版 fallback：更贴合上下文 ----
    const { fact, interpret, need } = context;
    const input = (userInput || '').trim();
    const brief = (text) => {
      if (!text) return '';
      const m = text.match(/^(.{2,20}?)[，,。\s]/);
      return m ? m[1].trim() : text.slice(0, 20).trim();
    };

    if (stepKey === 'fact') {
      if (!input) return '[📋 Local Template] Please enter the observed fact first.';
      const k = brief(input);
      return '[📋 Local Template] Why does the phenomenon "' + k + '" occur?\nA deep-level cause may be: the design assumptions of the existing solution do not match the user\'s real usage context, creating friction at key moments that users cannot resolve on their own. Keep asking from system design and user mental-model perspectives.';
    }

    if (stepKey === 'interpret') {
      const factText = fact || input;
      const k = brief(factText);
      if (!factText && !input) return '[📋 Local Template] Please complete the Fact (F) step first.';
      return '[📋 Local Template] Based on the fact "' + k + '", what the user subconsciously needs is not more features or information, but a sense of certainty and control when making decisions—reducing anxiety, lowering cognitive load, and enabling fast, correct choices. (⚠️ This is a local fallback; for AI-powered analysis, please check your AI configuration.)';
    }

    if (stepKey === 'need') {
      const fBrief = brief(fact || '');
      const iBrief = brief(interpret || '');
      if (!interpret && !fact) return '[📋 Local Template] Please complete the Interpret (I) step first.';
      return '[📋 Local Template] Core insight (POV): When facing "' + (fBrief || 'the above situation') + '", what users really need is a system that anticipates problems and proactively offers solutions, rather than passively discovering problems and then searching for answers. (⚠️ This is a local fallback; for AI-powered analysis, please check your AI configuration.)';
    }

    if (stepKey === 'distill') {
      const fBrief = brief(fact || '');
      const iBrief = brief(interpret || '');
      const nBrief = brief(need || '');
      return '[📋 Local Template] ✅ FIND derivation complete! (local mode)\n📌 Fact: ' + (fBrief || '(filled)') + '\n→ Interpret: ' + (iBrief || '(filled)') + '\n→ Need: ' + (nBrief || '(filled)') + '\n→ Suggested POV: [Target user] needs [deterministic solution] in [specific scenario], because [root cause makes existing approach inefficient].';
    }

    return '[📋 Local Template] Please complete the current step first.';
  },

  /**
   * Generate HMW suggestions for a given dimension based on POV
   * @param {string} dimKey - amplify | remove | flip | diverge
   * @param {object} pov - { targetUser, sceneChallenge, userProblem, insight, goal }
   * @returns {string[]} Array of HMW suggestion strings
   */
  async generateHmwSuggestions(dimKey, pov) {
    const { targetUser, sceneChallenge, userProblem, insight, goal } = pov;
    const u = targetUser || 'target user';
    const s = sceneChallenge || 'specific scenario';
    const p = userProblem || 'the problem they face';
    const i = insight || 'core insight';

    // 优先使用 DeepSeek 生成
    if (this._hasAI()) {
      const dimMap = {
        amplify: 'Amplify: turn pain points into positive value and exceed expectations',
        remove: 'Remove: completely eliminate obstacles and constraints for zero friction',
        flip: 'Flip: invert assumptions and make the scenario adapt to the user',
        diverge: 'Diverge: ignore tech/cost limits and imagine the most radical way'
      };
      const dim = dimMap[dimKey] || dimMap.amplify;
      const prompt =
        `Target user: ${u}\nScenario challenge: ${s}\nUser problem: ${p}\nCore insight: ${i}\n\n` +
        `From the "${dim}" dimension, generate 2 HMW (How Might We, "How might we…") innovation opportunity questions. ` +
        `Each must be tightly grounded in the above context and inspire solutions. Return JSON: {"hmw": ["question 1", "question 2"]}.`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.8, maxTokens: 400
        });
        if (obj && Array.isArray(obj.hmw) && obj.hmw.length) return obj.hmw.slice(0, 2);
      } catch (e) {
        console.warn('[AI] generateHmwSuggestions fallback:', e.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1200));

    const templates = {
      amplify: [
        `How might we help "${u}" turn "${p}" into a positive experience when "${s}", making the whole process enjoyable and valuable?`,
        `How might we let "${u}" in "${s}" not only solve "${p}" but also gain unexpected benefits?`,
        `How might we turn "${p}" into an opportunity for "${u}" in "${s}" to demonstrate ability and feel a sense of achievement?`
      ],
      remove: [
        `How might we completely remove all obstacles "${u}" faces with "${p}" when "${s}", making the process frictionless?`,
        `If "${p}" did not exist as a constraint at all, what would a smooth experience look like for "${u}" in "${s}"?`,
        `How might we let "${u}" in "${s}" never have to think about "${p}" because the system has silently solved it?`
      ],
      flip: [
        `If we flip our thinking: instead of "${u}" adapting to "${s}", what happens if "${s}" actively adapts to "${u}"?`,
        `How might we turn "${p}" from a burden for "${u}" into a trigger for the system to proactively serve "${u}"?`,
        `If the traditional assumption "${i}" is wrong, can we help "${u}" achieve their goal in "${s}" in the exact opposite way?`
      ],
      diverge: [
        `If we ignore all technology and cost limits, how might we help "${u}" perfectly solve "${p}" in "${s}" in the most imaginative way?`,
        `If "${u}" had superpowers in "${s}", how would "${p}" be thoroughly solved? Can that "superpower" be delivered by a product?`,
        `How might we let "${u}" in "${s}" say goodbye to "${p}" once and for all through an unprecedented, industry-breaking approach?`
      ]
    };

    const outputs = templates[dimKey] || templates.amplify;
    // Use hash of POV content to select consistently
    const hash = (u + s + p).length;
    const count = 2; // Generate 2 suggestions
    const result = [];
    for (let j = 0; j < count; j++) {
      const idx = (hash + j) % outputs.length;
      result.push(outputs[idx]);
    }
    return result;
  },

  async generateStakeholders(project) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const category = project?.category || 'product';
    const title = project?.title || project?.originalTitle || '';
    const sceneData = this._getSceneData(project);
    const findData = this._getFindData(project);

    // Extract topic from project context for contextual generation
    const topic = title || sceneData.targetUser || '该创新方向';
    const scene = sceneData.sceneDesc || '';
    const insight = findData.distill || findData.need || '';

    // Generate contextual stakeholder needs based on project topic
    const generateNeeds = (role) => {
      const baseNeeds = {
        'Business Leader': ['Strategic alignment', 'Input-output ratio', 'Execution feasibility', 'Speed and results'],
        'Technology Expert': ['Technical feasibility', 'System integration', 'Scalability', 'Maintenance cost'],
        'Partner': ['Shared value', 'Resource commitment', 'Risk sharing', 'Cooperation terms'],
        'User Representative': ['Solves real pain points', 'Ease of use', 'Learning cost', 'Visible value']
      };
      return baseNeeds[role] || ['Core need 1', 'Core need 2', 'Core need 3', 'Core need 4'];
    };

    // Contextual stakeholder generation based on project type
    let stakeholderConfigs = [];

    if (category === 'product' || category === 'service') {
      stakeholderConfigs = [
        { icon: '👔', name: 'Business Leader', defaultScores: [4, 3, 3, 2] },
        { icon: '🔧', name: 'Technology Expert', defaultScores: [3, 4, 3, 2] },
        { icon: '🤝', name: 'Partner', defaultScores: [3, 3, 3, 3] },
        { icon: '👤', name: 'User Representative', defaultScores: [4, 3, 2, 3] }
      ];
    } else if (category === 'problem') {
      stakeholderConfigs = [
        { icon: '😟', name: 'Problem Bearer', defaultScores: [4, 3, 3, 2] },
        { icon: '💰', name: 'Decision/Resource Owner', defaultScores: [4, 3, 3, 2] },
        { icon: '🧠', name: 'Execution Team', defaultScores: [3, 3, 3, 3] },
        { icon: '📊', name: 'Affected Party', defaultScores: [3, 3, 3, 3] }
      ];
    } else {
      stakeholderConfigs = [
        { icon: '🔍', name: 'Explorer', defaultScores: [4, 3, 3, 2] },
        { icon: '💰', name: 'Funder', defaultScores: [4, 3, 3, 2] },
        { icon: '📊', name: 'Potential User', defaultScores: [3, 3, 3, 3] },
        { icon: '🏢', name: 'Execution Team', defaultScores: [3, 3, 3, 3] }
      ];
    }

    // Build stakeholders with 12-point needs
    const stakeholders = stakeholderConfigs.map(config => {
      const needs = generateNeeds(config.name).map((label, i) => ({
        label,
        score: config.defaultScores[i] || 3
      }));
      return {
        name: config.name,
        icon: config.icon,
        needs
      };
    });

    return { stakeholders };
  },

  _getSceneData(project) {
    let sceneData = { targetUser: '', sceneDesc: '' };
    if (project?.cards?.scene) {
      try {
        let raw = project.cards.scene;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        const content = typeof raw === 'string' ? raw : '';
        const targetMatch = content.match(/【目标用户】(.+?)(?=\n【场景描述】|$)/s);
        const sceneMatch = content.match(/【场景描述】(.+?)$/s);
        if (targetMatch) sceneData.targetUser = targetMatch[1].trim();
        if (sceneMatch) sceneData.sceneDesc = sceneMatch[1].trim();
      } catch (e) {}
    }
    return sceneData;
  },

  _getFindData(project) {
    let findData = {};
    if (project?.cards?.findInsight) {
      try {
        let raw = project.cards.findInsight;
        if (typeof raw === 'object' && raw !== null && raw.content) raw = raw.content;
        findData = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch (e) {}
    }
    return findData;
  },

  /**
   * Generate consensus suggestions based on stakeholders
   * @param {Object} data - { stakeholders: Array, consensus: string }
   * @returns {string} - consensus suggestion
   */
  async generateStakeholderConsensus(data) {
    await new Promise(resolve => setTimeout(resolve, 800));

    const stakeholders = data.stakeholders || [];
    if (stakeholders.length === 0) return 'Please add stakeholders first';

    const names = stakeholders.map(s => s.name).join(', ');
    return `Based on the needs of ${names}, seek consensus in the following directions:

1. **Shared Goals**: Identify core metrics everyone cares about (e.g. user experience improvement, operating-cost reduction, revenue growth)
2. **Priority Ordering**: Solve win-win issues first, then address zero-sum conflicts
3. **Resource Allocation**: Clarify each party's input and expected return
4. **Communication Cadence**: Set up regular syncs to avoid information asymmetry

💡 Suggested next step: Turn consensus into testable business hypotheses using clear "if...then..." logic.`;
  },

  /**
   * Generate business hypotheses based on FIND insight + stakeholders + project context
   * Market hypothesis format: TAM / SAM / SOM / Competitors / Strategic Alignment / Notes
   * @param {Object} findData - FIND analysis data
   * @param {Object} stakeholderData - stakeholder data
   * @param {Object} project - Current project data
   * @returns {Object} - { tam, sam, som, competitors, alignment, notes }
   */
  async generateBusinessHypothesis(findData, stakeholderData, project) {
    // ---- 优先使用 DeepSeek AI 生成紧扣项目的商业假设 ----
    if (this._hasAI()) {
      const sceneData = this._getSceneData(project);
      const insight = findData?.distill || findData?.need || '';
      const fact = findData?.fact || '';
      const targetUser = sceneData.targetUser || '目标用户';
      const scene = sceneData.sceneDesc || '';
      const projectName = project?.title || project?.originalTitle || '本项目';

      // 构建项目上下文摘要（关键：让 AI 紧扣实际项目主题）
      const ctxParts = [
        `【项目名称】${projectName}`,
        `【目标用户】${targetUser}`,
        `【场景描述】${scene}`,
        `【核心事实】${fact}`,
        `【FIND洞察】${insight}`
      ];
      if (stakeholderData?.stakeholders) {
        const sList = (Array.isArray(stakeholderData.stakeholders) ? stakeholderData.stakeholders : []).map(s => `${s.name || ''}(${s.role || ''})`).filter(Boolean).join('、');
        if (sList) ctxParts.push(`【利益相关方】${sList}`);
      }

      const prompt =
`${ctxParts.join('\n')}

Based on the **real project information** above, generate business hypotheses. Requirements:
1. Stay tightly aligned with the project theme and scenario; do not generate unrelated domains or product forms.
2. If the project is "smart running shoes", write hypotheses around smart running shoes, not a general health-management app or generic sports platform.
3. TAM/SAM/SOM user definitions must be consistent with the target user.

Return JSON:
{"tam":"Total addressable market (specific numbers + user definition)","sam":"Serviceable addressable market (more precise users + scale)","som":"Serviceable obtainable market (first-phase target + timeline)","competitors":"Existing competitors and gaps (must be relevant)","alignment":"Strategic alignment (tied to the actual project)","notes":"Key assumptions to validate"}

Return JSON directly, no markdown code blocks.`;

      try {
        const raw = await window.AIService.complete(prompt, {
          system: this._systemPersona(), temperature: 0.6, maxTokens: 800
        });
        if (raw && raw.trim()) {
          // 尝试解析 JSON
          const jsonMatch = raw.trim().replace(/```json\n?|\n?```/g, '').match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const obj = JSON.parse(jsonMatch[0]);
            return {
              tam: obj.tam || '', sam: obj.sam || '', som: obj.som || '',
              competitors: obj.competitors || '', alignment: obj.alignment || '',
              notes: obj.notes || 'These are preliminary AI-generated business hypotheses. Validate key assumptions through user research and competitor analysis.'
            };
          }
        }
      } catch (e) {
        console.warn('[AI] generateBusinessHypothesis AI failed:', e.message);
      }
    }

    // ---- fallback：基于实际项目数据（不再用关键词猜测领域） ----
    await new Promise(resolve => setTimeout(resolve, 800));

    const sceneData2 = this._getSceneData(project);
    const insight2 = findData?.distill || findData?.need || '';
    const fact2 = findData?.fact || '';
    const targetUser2 = sceneData2.targetUser || project?.targetUser || '目标用户';
    const scene2 = sceneData2.sceneDesc || project?.sceneDesc || '';
    const projectName2 = project?.title || project?.originalTitle || '本项目';

    // Extract core problem from fact or insight
    let coreProblem2 = '';
    const sourceText2 = fact2 || insight2;
    if (sourceText2) {
      const pm1 = sourceText2.match(/(?:面临|遇到|存在|导致|造成)(.+?)(?:问题|困难|挑战|痛点|不便)/)
        || sourceText2.match(/(?:无法|不能|很难|不容易)(.+?)(?:，|,|。|$)/)
        || sourceText2.match(/(?:花费|消耗|浪费|花了)(.+?)(?:时间|精力|金钱)/);
      if (pm1) coreProblem2 = pm1[1] || pm1[0];
    }
    if (!coreProblem2 && insight2) {
      const pm2 = insight2.match(/需要「(.+?)」/) || insight2.match(/需要(.+?)，因为/);
      if (pm2) coreProblem2 = pm2[1];
    }

    let tam2, sam2, som2, competitors2, alignment2, notes2;

    if (fact2 || insight2 || scene2) {
      const pd = coreProblem2 || 'core pain point';
      const ib = insight2 ? insight2.slice(0, 60) + (insight2.length > 60 ? '...' : '') : '';
      tam2 = `Based on the positioning of "${projectName2}" and the target users ${targetUser2}. Nationwide, the population with ${pd} reaches tens of millions to hundreds of millions, and market demand keeps growing.`;
      sam2 = `Precisely focus on the segment of ${targetUser2}${scene2 ? ' in the "' + scene2.slice(0, 30) + '" scenario' : ''} that has a strong pain point around ${pd}, with clear willingness to pay or decision-making influence, totaling millions to tens of millions.`;
      som2 = `In the first phase, validate the core hypothesis through an MVP${ib ? ' based on the insight "' + ib + '"' : ' solving ' + pd}, aiming to acquire the first batch of seed users (10k-100k) within one year, then scale after building benchmark cases.`;
      competitors2 = `Existing solutions are mostly traditional methods or generic tools that fail to precisely address the deep pain point of ${targetUser2} around ${pd}; the market is fragmented with no clear leader, leaving room for innovation.`;
      alignment2 = `${ib ? 'Based on the FIND insight — ' + ib + ' — ' : ''}This direction is highly aligned with the innovation goal and has a clear validation path plus measurable success metrics.`;
      notes2 = `⚠️ These are preliminary business hypotheses based on current project information. Complete the FIND four-step method for deeper insights before generating a more precise version. To validate: 1) TAM/SAM accuracy; 2) user willingness to pay; 3) competitor barriers.`;
    } else {
      tam2 = '⚠️ Not enough information yet. Please complete User Journey → Mark Key Findings → FIND insights before generating business hypotheses.';
      sam2 = '⚠️ Define the target users and service scenario first to estimate the serviceable market.';
      som2 = '⚠️ Validate the core hypothesis with an MVP first, then plan the obtainable market.';
      competitors2 = '⚠️ Clarify product positioning and target scenario before analyzing the competitive landscape.';
      alignment2 = '⚠️ Complete Reveal-stage user research and FIND insights first to ensure business hypotheses are grounded in real needs.';
      notes2 = '📌 Business hypotheses only matter when based on real FIND insights. Please go back and complete FIND analysis.';
    }

    return { tam: tam2, sam: sam2, som: som2, competitors: competitors2, alignment: alignment2, notes: notes2 };
  },

  // ==========================================================================
  // ==================  DeepSeek 真实 AI 能力层（含模板回退）  ==================
  // ==========================================================================

  /** 是否具备真实 AI 能力 */
  _hasAI() {
    return !!(window.AIService && window.AIService.isReady());
  },

  /** 系统人设：Eureka RISE 创新教练 */
  _systemPersona() {
    return [
      'You are an Eureka Lite AI innovation coach, proficient in the RISE methodology (Reveal → Inspire → Shape → Exam).',
      'Your task is to help users produce structured, actionable, and editable innovation drafts at each stage.',
      'Requirements:',
      '1) Stay tightly aligned with the project context the user has provided; never drift into generic filler.',
      '2) Keep language concise, professional, and actionable; output in English.',
      '3) Strictly follow the requested structure and length so users can adopt and refine directly.',
      '4) Do not say "as an AI" or similar; provide content directly.'
    ].join('\n');
  },

  /**
   * 从 project 构建供 LLM 使用的上下文摘要
   */
  _buildProjectContext(project) {
    if (!project) return '（暂无项目上下文）';
    const lines = [];
    lines.push(`项目名称：${project.title || project.originalTitle || '未命名'}`);
    const catMap = { product: '产品', service: '服务', problem: '问题', explore: '探索' };
    lines.push(`创新类型：${catMap[project.category] || project.category || '未知'}`);

    const cards = project.cards || {};
    const pick = (raw) => {
      if (!raw) return '';
      if (typeof raw === 'object' && raw.content) raw = raw.content;
      return typeof raw === 'string' ? raw : JSON.stringify(raw);
    };

    // 场景
    const scene = pick(cards.scene);
    if (scene) lines.push(`【场景/用户】${scene.slice(0, 300)}`);
    // 用户旅程
    const journey = pick(cards.journey);
    if (journey) lines.push(`【用户旅程】${journey.slice(0, 300)}`);
    // FIND 洞察
    const find = this._getFindData(project);
    if (find && (find.distill || find.need || find.fact)) {
      lines.push(`【核心洞察】${(find.distill || find.need || find.fact || '').toString().slice(0, 200)}`);
    }
    // HMW / 最佳创意
    const hmw = pick(cards.hmw);
    if (hmw) lines.push(`【HMW/创新机遇】${hmw.slice(0, 200)}`);
    const bestIdea = pick(cards.bestIdea) || pick(cards.ideaConfirm) || pick(cards.ideas);
    if (bestIdea) lines.push(`【选定创意】${bestIdea.slice(0, 200)}`);
    // Shape 已有产出（供 Exam 阶段参考）
    const fourDim = pick(cards.fourDimensions);
    if (fourDim) lines.push(`【四维拷问结论】${fourDim.slice(0, 200)}`);
    const minConcept = pick(cards.minConcept);
    if (minConcept) lines.push(`【最小概念方案】${minConcept.slice(0, 200)}`);
    const storyboard = pick(cards.storyboard);
    if (storyboard) lines.push(`【体验故事板】${storyboard.slice(0, 200)}`);

    return lines.join('\n');
  },

  /**
   * 各阶段各屏的 AI 引导定义（草稿生成 + 建议）
   * key: `${stage}-${screen}`
   */
  _screenBrief(stage, screen) {
    const briefs = {
      // ---------- Reveal ----------
      'reveal-1': {
        label: '场景描述',
        draft: '基于项目上下文，写出一段具体的用户场景。必须包含【目标用户】【使用场景】【痛点/挑战】三个要素，每项一行，用【】标注。总字数150字内，聚焦一个真实、具体的痛点时刻。',
        tips: ['明确"谁"在使用', '补充"什么情况下"使用', '描述遇到的具体困难']
      },
      'reveal-2': {
        label: '用户旅程',
        draft: '基于场景，梳理用户完整旅程。按【触点N】逐步列出关键步骤（5-7步），并用【断裂点】标注体验中断/流失的环节。每行一个触点。',
        tips: ['从第一次接触到使用后', '标注关键决策点和情绪变化', '找出体验断裂点']
      },
      'reveal-5': {
        label: '项目简报',
        draft: '汇总项目简报，包含：目标用户、核心场景、关键洞察、利益相关方、商业假设 五个小节。每节2-3句，结构清晰。',
        tips: ['汇总各阶段资产', '突出最独特的洞察', '关联商业价值']
      },
      // ---------- Inspire ----------
      'inspire-3': {
        label: '创意生成',
        draft: '基于 HMW 与洞察，快速生成 8 条差异化创意点子，每条一行、编号、20字内。先求量再求质，允许大胆想法。',
        tips: ['先求量再求质', '允许疯狂的想法', '组合多个灵感来源']
      },
      'inspire-4': {
        label: '筛选最佳创意',
        draft: '从候选创意中，按"用户价值/可行性/商业潜力"三维快速点评，推荐 1 个最佳创意并说明理由（100字内）。',
        tips: ['考虑可行性', '衡量用户价值', '评估商业潜力']
      },
      'inspire-5': {
        label: '确认最佳创意',
        draft: '为选定创意起一个响亮的名字，并用一句话（30字内）说清它的核心价值主张。格式：【创意名称】xxx\\n【一句话价值】xxx',
        tips: ['起个好记的名字', '一句话说清价值', '说明为何值得深入']
      },
      // ---------- Shape ----------
      'shape-1': {
        label: '四维拷问',
        draft: '对选定创意从四个维度做诚实拷问，每个维度给出"现状判断 + 关键风险 + 应对建议"，每维度2-3句：\n【期望度 Desirability】用户是否真的想要？\n【可行性 Feasibility】技术/资源能否实现？\n【存续度 Viability】商业上能否持续？\n【顺应度 Adaptability】是否顺应趋势与生态？',
        tips: ['每个维度都要诚实回答', '暴露真实风险而非自我安慰', '给出可操作的应对建议']
      },
      'shape-2': {
        label: '最小概念方案（MVP）',
        draft: '定义最小可行方案，输出：\n【一句话定义】用一句话描述 MVP\n【核心功能】做什么（3条以内，聚焦最关键价值）\n【明确不做】暂不做什么（2-3条，划清边界）\n【第一用户】最先服务谁',
        tips: ['聚焦最关键的核心价值', '明确划定边界：做什么、不做什么', '越小越聚焦越好']
      },
      'shape-3': {
        label: '用户体验故事板',
        draft: '用六格故事板讲一个完整的用户体验故事，每格一句话（含用户情绪）：\n1.认识（如何知道）\n2.尝试（第一次用）\n3.使用（日常使用）\n4.顿悟（Aha 时刻）\n5.成长（持续价值）\n6.传播（推荐他人）',
        tips: ['从用户视角讲述', '每格包含场景、动机、情绪', '突出 Aha 顿悟时刻']
      },
      // ---------- Exam ----------
      'exam-1': {
        label: '搭建原型',
        draft: '设计一个最简可用原型方案，输出：\n【要验证的核心假设】最关键、最想验证的一条\n【原型形式】纸面/点击原型/绿野仙踪/落地页等，并说明为何选它\n【核心体验路径】用户能走通的最短路径（3-5步）\n【搭建成本】预估投入',
        tips: ['最简可用即可，不求完美', '聚焦验证最核心的假设', '越快做出来越好']
      },
      'exam-2': {
        label: '执行测试',
        draft: '制定一份轻量测试计划，输出：\n【目标测试用户】画像与在哪找到他们\n【样本量】建议人数\n【任务脚本】让用户完成的关键任务\n【观察指标】要记录什么（行为/卡点/表情/原话）\n【避免引导】如何保持中立不诱导',
        tips: ['找真实目标用户', '不要引导，让用户自然探索', '重点观察行为而非只听意见']
      },
      'exam-3': {
        label: '测试报告',
        draft: '基于测试整理结构化报告：\n【成功点】哪些验证成立\n【第一失败点】最严重的问题\n【意外发现】没预料到的洞察\n【假设结论】原假设成立/证伪/待定\n【用户原话】1-2句有代表性的引用',
        tips: ['诚实记录，不自我欺骗', '区分事实与解读', '关注第一失败点']
      },
      'exam-4': {
        label: '四维度评价',
        draft: '基于测试结果，对方案做四维度评分与依据（每维度打分 1-5 并给1句依据）：\n【期望度】用户是否想要\n【可行性】能否实现\n【存续度】能否持续盈利\n【顺应度】是否顺应趋势\n最后给出综合判断。',
        tips: ['用事实和数据支撑评分', '不回避低分维度', '综合判断要明确']
      },
      'exam-5': {
        label: '电梯演讲 & 迭代计划',
        draft: '输出两部分：\n【电梯演讲】30秒/60字内向投资人讲清"为谁解决什么、凭什么、有多大机会"\n【迭代计划】下一步 3 条具体行动（含负责事项与验证目标），按优先级排序',
        tips: ['浓缩精华，突出差异化', '行动计划要具体可执行', '明确下一个验证目标']
      }
    };
    return briefs[`${stage}-${screen}`] || null;
  },

  /**
   * 【核心】用 DeepSeek 为当前屏生成结构化草稿；失败回退到旧模板
   * @returns {Promise<{title, content}|null>}
   */
  async generatePrefillContentAI(context, userInput, project) {
    const { stage, screen } = context;
    const brief = this._screenBrief(stage, screen);

    // 无 AI 能力或该屏未定义 → 回退旧逻辑
    if (!this._hasAI() || !brief) {
      return this.generatePrefillContent(context, userInput || (project?.title || ''));
    }

    const projectCtx = this._buildProjectContext(project);
    const userPart = (userInput && userInput.trim().length > 3)
      ? `\n\n用户当前已写的草稿（请在此基础上优化提升，不要完全推翻）：\n${userInput.trim()}`
      : '\n\n用户尚未填写，请基于项目上下文直接生成一份高质量初稿。';

    const prompt =
      `【项目上下文】\n${projectCtx}\n\n` +
      `【当前任务】${brief.label}\n${brief.draft}${userPart}\n\n` +
      `请直接输出该任务的内容本身，不要加标题前缀、不要解释。`;

    try {
      const content = await window.AIService.complete(prompt, {
        system: this._systemPersona(),
        temperature: 0.7,
        maxTokens: 900
      });
      if (content && content.trim()) {
        return { title: `${brief.label}（AI 生成，可编辑）`, content: content.trim() };
      }
    } catch (e) {
      console.warn('[AI] generatePrefillContentAI fallback:', e.message);
    }
    // 回退
    return this.generatePrefillContent(context, userInput || (project?.title || ''));
  },

  /**
   * 用 DeepSeek 生成针对性建议列表；失败回退旧模板
   * @returns {Promise<string[]>}
   */
  async getSuggestionsAI(stage, screen, userInput, project) {
    const brief = this._screenBrief(stage, screen);
    if (!this._hasAI() || !brief) {
      return this.getSuggestions(stage, screen, userInput);
    }

    const projectCtx = this._buildProjectContext(project);
    const userPart = (userInput && userInput.trim().length > 3)
      ? `用户已写内容：\n${userInput.trim()}`
      : '用户尚未填写内容。';

    const prompt =
      `【项目上下文】\n${projectCtx}\n\n【当前任务】${brief.label}\n${brief.draft}\n\n${userPart}\n\n` +
      `请针对"用户如何把这一屏写得更好"给出 3-4 条具体、可操作的建议。` +
      `以 JSON 返回：{"suggestions": ["建议1", "建议2", "建议3"]}，每条建议 25 字内，以"✓ "开头。`;

    try {
      const obj = await window.AIService.completeJSON(prompt, {
        system: this._systemPersona(),
        temperature: 0.6,
        maxTokens: 400
      });
      if (obj && Array.isArray(obj.suggestions) && obj.suggestions.length) {
        return obj.suggestions.slice(0, 4);
      }
    } catch (e) {
      console.warn('[AI] getSuggestionsAI fallback:', e.message);
    }
    // 回退：用 brief.tips 或旧模板
    if (brief.tips && brief.tips.length) return brief.tips.map(t => `✓ ${t}`);
    return this.getSuggestions(stage, screen, userInput);
  },

  /**
   * 获取 NCO 灵感卡片池（每类 perType 张）。
   * 优先根据项目上下文关键词匹配更相关的灵感；否则用通用默认池。
   * @param {string} category - 项目类别
   * @param {string} contextText - 项目上下文文本（标题/场景/洞察等）
   * @param {number} perType - 每类返回的数量（默认 3 → 共 9 张）
   * @returns {Array<{type,title,description,source}>}
   */
  getNcoInspirations(category, contextText = '', perType = 3) {
    const text = (contextText || '').toLowerCase();

    // ---- 各领域的灵感池（每类 3 张）----
    const pools = {
      health: {
        New: [
          { title: '行为追踪与提醒', description: '通过传感器追踪行为，自动触发提醒（如智能水杯记录饮水量）', source: '健康科技' },
          { title: '自适应饮水计划', description: '根据天气、运动量动态推算个人所需水量，主动推送提醒', source: '可穿戴设备' },
          { title: '无感补水设计', description: '把补水融进日常动作，让用户在无意识中完成（如雾化吸入）', source: '材料创新' }
        ],
        Cool: [
          { title: '游戏化激励', description: '将健康行为转化为积分、徽章、排行榜，让喝水变得有趣味', source: '健康App' },
          { title: '可视化进度', description: '用光影、色彩实时展示当日健康进度，制造即时正反馈', source: '数据可视化' },
          { title: '社交挑战赛', description: '发起 7 天喝水挑战，好友互相监督、PK 进度', source: '社群运营' }
        ],
        Outsider: [
          { title: '社交传染', description: '让朋友、同学互相提醒、互相激励，形成健康的社交氛围', source: '微信运动' },
          { title: '环境暗示', description: '用灯光/音乐改变空间氛围，潜移默化引导健康行为', source: '环境心理学' },
          { title: '反向激励', description: '未完成目标就向公益捐出小额资金，用"损失厌恶"促行动', source: '行为经济学' }
        ]
      },
      student: {
        New: [
          { title: '场景化微服务', description: '针对碎片化场景的轻量级服务（如课间快速完成的微任务）', source: '教育科技' },
          { title: '学习行为画像', description: '记录专注时段与效率，自动推荐最适合的学习节奏', source: '学习科学' },
          { title: '错题自进化', description: '根据错题自动生成变式练习，薄弱点逐个击破', source: '自适应学习' }
        ],
        Cool: [
          { title: '同伴效应', description: '利用学生之间的相互影响，创造正向的学习/生活习惯', source: 'Study Together' },
          { title: '沉浸反馈', description: '用音效/动效把枯燥练习变成"通关"，提升心流体验', source: '游戏化设计' },
          { title: '番茄直播', description: '公开自己的专注计时，用"被看见"维持自律', source: '直播学习' }
        ],
        Outsider: [
          { title: '错峰设计', description: '在用户不需要主动行动时提供服务，减少意志力消耗', source: '智能家居' },
          { title: '社群共学', description: '陌生人在线组队共学，互相 accountable', source: '互助社区' },
          { title: '奖励代币', description: '把学习成果兑换成可消费权益，连接真实世界', source: '代币经济' }
        ]
      },
      office: {
        New: [
          { title: '情境感知自动化', description: '根据用户状态自动触发服务（如进入办公室自动开启待办）', source: '智能办公' },
          { title: '语音即日程', description: '一句话生成任务、会议与提醒，免去手动录入', source: '语音助手' },
          { title: '异步协作流', description: '把协作拆成可随时接续的微任务，降低同步成本', source: '协作工具' }
        ],
        Cool: [
          { title: '微打断设计', description: '通过极小的打断（如震动、闪光）传递关键信息', source: '可穿戴设备' },
          { title: '专注结界', description: '一键进入"免打扰"模式，自动代答与延后非紧急事项', source: '深度工作' },
          { title: '成就墙', description: '把完成的任务可视化成成长轨迹，强化成就感', source: '游戏化' }
        ],
        Outsider: [
          { title: '无意识交互', description: '用户无需主动操作，系统自动完成（如自动存档、同步）', source: 'iCloud' },
          { title: '环境智能', description: '会议室自动识别人数与议题，提前备好设备与资料', source: '空间计算' },
          { title: '决策外包', description: '把低价值决策交给规则引擎，用户只做关键判断', source: '自动化' }
        ]
      },
      default: {
        New: [
          { title: '订阅制思维', description: '从一次性购买转向持续服务订阅，创造持续价值', source: 'SaaS行业' },
          { title: '场景化微服务', description: '把大需求拆成贴合具体场景的轻量服务', source: '服务设计' },
          { title: '数据驱动自适应', description: '用行为数据动态优化体验，越用越懂用户', source: '增长黑客' }
        ],
        Cool: [
          { title: '游戏化反馈', description: '让用户行为获得即时、愉悦的反馈，提升参与度', source: 'Duolingo' },
          { title: '惊喜元素', description: '在预期之外创造超预期体验', source: '迪士尼' },
          { title: '沉浸叙事', description: '用故事线包裹产品流程，增强记忆点与情感', source: '体验设计' }
        ],
        Outsider: [
          { title: '反向定制', description: '让用户参与产品定义过程，提升认同感', source: '乐高 Ideas' },
          { title: '社区驱动', description: '让用户互相服务、互相帮助', source: 'Airbnb 社区' },
          { title: '极端用户', description: '关注极端用户的极端需求，往往能发现真正机会', source: '设计思维' }
        ]
      }
    };

    let key = 'default';
    if (text.includes('水') || text.includes('喝') || text.includes('健康') || text.includes('提醒') || text.includes('运动')) key = 'health';
    else if (text.includes('学生') || text.includes('大学') || text.includes('课堂') || text.includes('课间') || text.includes('学习')) key = 'student';
    else if (text.includes('办公') || text.includes('通勤') || text.includes('工作') || text.includes('会议') || text.includes('职场')) key = 'office';
    else if (category === 'product' || category === 'service') key = 'default';

    const pool = pools[key] || pools.default;
    const result = [];
    ['New', 'Cool', 'Outsider'].forEach(type => {
      (pool[type] || []).slice(0, perType).forEach(item => {
        result.push({ type, title: item.title, description: item.description, source: item.source });
      });
    });
    return result;
  },

  /**
   * 调用 DeepSeek 生成全新的 NCO 灵感卡片（刷新用）。
   * @returns {Promise<Array<{type,title,description,source}>>}
   */
  async generateNcoInspirationsAI(projectContext, perType = 3) {
    const ctx = (projectContext || '').slice(0, 600) || '一个尚未明确主题的创新项目';
    if (this._hasAI()) {
      const prompt =
        `项目背景：\n${ctx}\n\n` +
        `请从 New（全新做法）、Cool（有趣炫酷）、Outsider（跨界借鉴）三个视角，各产出 ${perType} 张"灵感卡片"。\n` +
        `每张卡片要具体、可启发创意，紧扣项目背景。\n` +
        `以 JSON 返回：{"New":[{"title":"","description":"","source":""}],"Cool":[...],"Outsider":[...]}。`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.9, maxTokens: 900
        });
        const result = [];
        ['New', 'Cool', 'Outsider'].forEach(type => {
          const arr = (obj && Array.isArray(obj[type])) ? obj[type] : [];
          arr.slice(0, perType).forEach(item => {
            if (item && item.title) {
              result.push({
                type,
                title: String(item.title),
                description: String(item.description || ''),
                source: String(item.source || 'AI 灵感')
              });
            }
          });
        });
        if (result.length >= 3) return result;
      } catch (e) {
        console.warn('[AI] generateNcoInspirationsAI fallback:', e.message);
      }
    }
    // 回退：静态池（根据上下文）
    return this.getNcoInspirations('', ctx, perType);
  },

  /**
   * AI 强制连接（Forced Connection）：把 HMW 问题与灵感卡片交叉组合，生成创意。
   * @param {Array<string>} hmwList - 已选的最佳 HMW 文本数组
   * @param {Array<{title,description,type}>} inspirationCards - 已收藏的灵感卡片
   * @param {string} projectContext - 项目上下文
   * @returns {Promise<Array<{title,description,source}>>}
   */
  async generateForcedConnectionIdeas(hmwList, inspirationCards, projectContext) {
    const hmw = (hmwList && hmwList.length) ? hmwList : ['（未选定具体 HMW，请基于项目核心问题）'];
    const insp = (inspirationCards && inspirationCards.length) ? inspirationCards : [];
    const ctx = (projectContext || '').slice(0, 500) || '';

    const hmwText = hmw.map((h, i) => `${i + 1}. ${h}`).join('\n');
    const inspText = insp.length
      ? insp.map((c, i) => `${i + 1}. [${c.type}] ${c.title} —— ${c.description}`).join('\n')
      : '（暂无收藏的灵感卡片，请基于 HMW 自行发散）';

    if (this._hasAI()) {
      const prompt =
        `【项目背景】\n${ctx}\n\n` +
        `【最佳 HMW 问题】\n${hmwText}\n\n` +
        `【灵感卡片】\n${inspText}\n\n` +
        `请用"强制连接(Forced Connection)"创新思维：把上述 HMW 问题与灵感卡片进行跨领域交叉组合，` +
        `产生 4-6 个具体、新颖、可落地的创意方案。每个创意要说明它连接了哪个 HMW 与哪些灵感。\n` +
        `以 JSON 返回：{"ideas":[{"title":"创意名","description":"一句话说明创意 + 来源标注(连接了 HMW? 与灵感?)","source":"来源标注"}]}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.85, maxTokens: 1100
        });
        if (obj && Array.isArray(obj.ideas)) {
          const ideas = obj.ideas
            .filter(x => x && x.title)
            .map(x => ({
              title: String(x.title),
              description: String(x.description || ''),
              source: String(x.source || 'AI 强制连接')
            }));
          if (ideas.length) return ideas;
        }
      } catch (e) {
        console.warn('[AI] generateForcedConnectionIdeas fallback:', e.message);
      }
    }

    // 回退：本地强制连接组合
    await new Promise(resolve => setTimeout(resolve, 900));
    return this._localForcedConnection(hmw, insp, ctx);
  },

  _localForcedConnection(hmw, insp, ctx) {
    const ideas = [];
    const hmwBase = hmw[0] || '解决核心问题';
    const picks = insp.slice(0, 3);
    if (picks.length === 0) {
      return [
        { title: '最小可行性实验', description: `围绕「${hmwBase}」，先做一个 1 周的小实验验证最风险的假设。`, source: '本地回退' },
        { title: '用户共创工作坊', description: `邀请目标用户一起针对「${hmwBase}」头脑风暴，把用户变成共创者。`, source: '本地回退' }
      ];
    }
    picks.forEach((c, i) => {
      const other = picks[(i + 1) % picks.length];
      ideas.push({
        title: `${c.title} × ${hmwBase.slice(0, 12)}`,
        description: `把「${c.title}」(来自${c.type}灵感) 与 HMW「${hmwBase}」强制连接：借鉴「${c.description}」，并融合「${other.title}」的思路，形成差异化方案。`,
        source: `连接 ${c.type}灵感 + HMW`
      });
    });
    return ideas.slice(0, 5);
  },

  /**
   * AI 辅助四维打分：根据项目上下文为创意评分。
   * @returns {Promise<{feasibility,userValue,businessValue,innovation}>}
   */
  async scoreIdeaAI(idea, projectContext) {
    const ctx = (projectContext || '').slice(0, 400) || '';
    if (this._hasAI()) {
      const prompt =
        `【项目背景】${ctx}\n【创意】标题：${idea.title}\n描述：${idea.description}\n\n` +
        `请从四个维度为这个创意打分（各 1-5 的整数）：可行性(feasibility)、用户价值(userValue)、商业价值(businessValue)、创新程度(innovation)。\n` +
        `以 JSON 返回：{"feasibility":n,"userValue":n,"businessValue":n,"innovation":n}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.4, maxTokens: 200
        });
        if (obj && typeof obj.feasibility === 'number') {
          const clamp = (v) => Math.max(1, Math.min(5, Math.round(Number(v) || 3)));
          return {
            feasibility: clamp(obj.feasibility),
            userValue: clamp(obj.userValue),
            businessValue: clamp(obj.businessValue),
            innovation: clamp(obj.innovation)
          };
        }
      } catch (e) {
        console.warn('[AI] scoreIdeaAI fallback:', e.message);
      }
    }
    // 回退：基于描述长度的启发式评分
    const len = (idea.description || '').length;
    const base = len > 40 ? 4 : 3;
    return { feasibility: base, userValue: base, businessValue: Math.max(2, base - 1), innovation: 5 };
  },

  /**
   * 四维拷问：基于最佳创意，生成 用户/商业/技术/生态 四个维度的拷问问题。
   * @returns {Promise<{user:Array,{q:string,a:string},business:...,technical:...,ecosystem:...}>}
   */
  async generateShapeQuestions(bestIdea, userProblem, briefText) {
    const ideaTitle = (bestIdea && bestIdea.title) || '我们的核心创意';
    const ideaDesc = (bestIdea && bestIdea.description) || '';
    const problem = (userProblem || '').slice(0, 200) || '目标用户的核心问题';
    const brief = (briefText || '').slice(0, 800);

    if (this._hasAI()) {
      const prompt =
        `【项目简报】${brief}\n【用户问题】${problem}\n【最佳创意】${ideaTitle} ${ideaDesc}\n\n` +
        `请从 用户(User) / 商业(Business) / 技术(Technical) / 生态(Ecosystem) 四个维度，` +
        `各提出 2-3 个针对该创意的尖锐拷问问题（每题一句，聚焦风险、假设与可行性）。\n` +
        `以 JSON 返回：{"user":[{"q":"","a":""}],"business":[{"q":"","a":""}],"technical":[{"q":"","a":""}],"ecosystem":[{"q":"","a":""}]}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.7, maxTokens: 1500
        });
        if (obj && Array.isArray(obj.user) && Array.isArray(obj.business) && Array.isArray(obj.technical) && Array.isArray(obj.ecosystem)) {
          const norm = (arr) => arr.filter(x => x && x.q).map(x => ({ q: String(x.q), a: '' }));
          return {
            user: norm(obj.user).slice(0, 3),
            business: norm(obj.business).slice(0, 3),
            technical: norm(obj.technical).slice(0, 3),
            ecosystem: norm(obj.ecosystem).slice(0, 3)
          };
        }
      } catch (e) {
        console.warn('[AI] generateShapeQuestions fallback:', e.message);
      }
    }
    return this._shapeQuestionsTemplate(ideaTitle, problem);
  },

  _shapeQuestionsTemplate(ideaTitle, problem) {
    return {
      user: [
        { q: `这个方案真正解决的，是「${problem}」还是我们自以为的问题？`, a: '' },
        { q: `目标用户是否愿意为「${ideaTitle}」改变现有习惯？`, a: '' }
      ],
      business: [
        { q: `「${ideaTitle}」靠什么挣钱？单位经济模型是否成立？`, a: '' },
        { q: `如果大厂明天抄走这个创意，我们的护城河在哪？`, a: '' }
      ],
      technical: [
        { q: `最小可行版本(MVP)能否在 2 周内用现有技术搭出来？`, a: '' },
        { q: `最可能出现的技术风险或依赖是什么？`, a: '' }
      ],
      ecosystem: [
        { q: `这个方案会触动哪些利益相关方，谁会反对？`, a: '' },
        { q: `它是否符合行业监管 / 平台规则？`, a: '' }
      ]
    };
  },

  /**
   * 最小概念方案：基于上下文生成 oneLiner / features / characteristics / boundaries。
   * @returns {Promise<{oneLiner:string,features:string[],characteristics:string[],boundaries:string[]}>}
   */
  async generateMinConcept(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '（暂无上下文）';
    if (this._hasAI()) {
      const prompt =
        `【上下文】${ctx}\n\n请基于以上内容，给出一个最小可行概念方案(MVP)。\n` +
        `要求：一句话定义(oneLiner)；3-5 个功能与特性(features)；2-3 个产品特性(characteristics)；2-4 条明确"不做什么"的边界(boundaries)。\n` +
        `以 JSON 返回：{"oneLiner":"","features":[""],"characteristics":[""],"boundaries":[""]}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.75, maxTokens: 900
        });
        if (obj && obj.oneLiner) {
          const arr = (k) => Array.isArray(obj[k]) ? obj[k].map(x => String(x)).filter(Boolean) : [];
          return {
            oneLiner: String(obj.oneLiner),
            features: arr('features').slice(0, 5),
            characteristics: arr('characteristics').slice(0, 3),
            boundaries: arr('boundaries').slice(0, 4)
          };
        }
      } catch (e) {
        console.warn('[AI] generateMinConcept fallback:', e.message);
      }
    }
    return {
      oneLiner: '一个聚焦核心价值的轻量方案（请基于上下文补充一句话定义）。',
      features: ['核心功能 A', '核心功能 B', '辅助功能 C'],
      characteristics: ['易上手', '可快速验证'],
      boundaries: ['暂不做平台级扩展', '暂不支持多端同步']
    };
  },

  /**
   * 用户体验故事板：基于概念方案生成 6 卡描述。
   * @returns {Promise<{cards:Array<{key,title,desc}>}>}
   */
  async generateStoryboard(conceptText) {
    const ctx = (conceptText || '').slice(0, 1500) || '（暂无概念方案）';
    const themes = [
      { key: 'problem', title: '用户面对的问题' },
      { key: 'opportunity', title: '我们的创新机遇' },
      { key: 'contact', title: '用户接触新的概念方案' },
      { key: 'usage', title: '用户使用新方案解决问题' },
      { key: 'outcome', title: '用户得到的结果' },
      { key: 'feeling', title: '用户的感受和表达' }
    ];
    if (this._hasAI()) {
      const prompt =
        `【概念方案】${ctx}\n\n请用 6 个固定场景讲述用户故事，顺序与标题固定为：` +
        themes.map(t => t.title).join(' / ') + `\n` +
        `每个场景写 1-2 句用户视角的描述。\n` +
        `以 JSON 返回：{"cards":[{"key":"problem","title":"用户面对的问题","desc":""}, ... 共 6 个，key 与标题必须严格对应]}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.8, maxTokens: 900
        });
        if (obj && Array.isArray(obj.cards) && obj.cards.length === 6) {
          const map = {};
          obj.cards.forEach(c => { if (c && c.key) map[c.key] = c; });
          const cards = themes.map(t => ({
            key: t.key,
            title: t.title,
            desc: map[t.key] && map[t.key].desc ? String(map[t.key].desc) : ''
          }));
          if (cards.every(c => c.desc)) return { cards };
        }
      } catch (e) {
        console.warn('[AI] generateStoryboard fallback:', e.message);
      }
    }
    return {
      cards: themes.map(t => ({
        key: t.key,
        title: t.title,
        desc: `（请描述用户在此刻的经历：${t.title}）`
      }))
    };
  },

  /**
   * 测试计划：基于概念方案/故事板生成 purpose/scenario/hypotheses/userValue。
   * @returns {Promise<{purpose:string,scenario:string,hypotheses:string[],userValue:string}>}
   */
  async generateExamTestPlan(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '（暂无上下文）';
    if (this._hasAI()) {
      const prompt =
        `【上下文】${ctx}\n\n为这个方案设计一份轻量测试计划。\n` +
        `以 JSON 返回：{"purpose":"测试目的","scenario":"测试场景(含找谁测)","hypotheses":["假设1","假设2"],"userValue":"用户价值"}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.7, maxTokens: 800
        });
        if (obj && obj.purpose) {
          return {
            purpose: String(obj.purpose),
            scenario: String(obj.scenario || ''),
            hypotheses: Array.isArray(obj.hypotheses) ? obj.hypotheses.map(x => String(x)) : [],
            userValue: String(obj.userValue || '')
          };
        }
      } catch (e) {
        console.warn('[AI] generateExamTestPlan fallback:', e.message);
      }
    }
    return {
      purpose: '验证用户是否愿意在真实场景中使用我们的核心方案解决其问题。',
      scenario: '邀请 5-8 位目标用户，在贴近真实的场景中进行无引导试用观察。',
      hypotheses: ['用户能在 1 分钟内理解核心价值', '用户愿意完成关键动作'],
      userValue: '为用户节省了时间 / 降低了不确定性。'
    };
  },

  /**
   * 测试报告：基于测试计划+观察生成 4 类内容。
   * @returns {Promise<{effectiveValue:string,invalidValue:string,newProblems:string,newOpportunities:string}>}
   */
  async generateExamTestReport(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '（暂无上下文）';
    if (this._hasAI()) {
      const prompt =
        `【测试计划与观察】${ctx}\n\n请基于观察撰写测试报告，诚实不自我欺骗。\n` +
        `以 JSON 返回：{"effectiveValue":"验证有效的价值","invalidValue":"错误/无效的价值","newProblems":"新发现的问题","newOpportunities":"新机会/信息"}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.6, maxTokens: 900
        });
        if (obj && obj.effectiveValue) {
          return {
            effectiveValue: String(obj.effectiveValue),
            invalidValue: String(obj.invalidValue || ''),
            newProblems: String(obj.newProblems || ''),
            newOpportunities: String(obj.newOpportunities || '')
          };
        }
      } catch (e) {
        console.warn('[AI] generateExamTestReport fallback:', e.message);
      }
    }
    return {
      effectiveValue: '（请填写验证有效的价值）',
      invalidValue: '（请填写被证伪的假设）',
      newProblems: '（请填写新发现的问题）',
      newOpportunities: '（请填写意外正向发现）'
    };
  },

  /**
   * 电梯演讲：基于概念方案+测试目的生成 pitch。
   * @returns {Promise<{pitch:string}>}
   */
  async generateElevatorPitch(contextText) {
    const ctx = (contextText || '').slice(0, 1200) || '（暂无上下文）';
    if (this._hasAI()) {
      const prompt =
        `【上下文】${ctx}\n\n写一段 30 秒电梯演讲，套用结构：` +
        `我们为【目标用户】提供了【方案】，解决了【问题】，带来【价值】。\n` +
        `以 JSON 返回：{"pitch":""}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: this._systemPersona(), temperature: 0.7, maxTokens: 400
        });
        if (obj && obj.pitch) return { pitch: String(obj.pitch) };
      } catch (e) {
        console.warn('[AI] generateElevatorPitch fallback:', e.message);
      }
    }
    return { pitch: '我们为【目标用户】提供了【方案】，解决了【问题】，带来【价值】。' };
  },

  async generateExamFourDimEval(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '（暂无上下文）';
    if (this._hasAI()) {
      const prompt =
        `【上下文】${ctx}\n\n基于以下创新项目的概念方案与测试发现，对方案做四维评估（每项 1-5 分，并给出一句依据）：\n` +
        `- 用户价值 User Value\n- 商业价值 Business Value\n- 技术可行性 Feasibility\n- 创新程度 Innovation\n\n` +
        `请只返回 JSON：{"scores":{"userValue":<1-5>,"businessValue":<1-5>,"feasibility":<1-5>,"innovation":<1-5>},"reasons":{"userValue":"","businessValue":"","feasibility":"","innovation":""}}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: '你是严格的创新项目评审专家，基于事实与数据打分，避免夸大。只输出 JSON。',
          temperature: 0.3, maxTokens: 800
        });
        if (obj && obj.scores) {
          const dims = ['userValue', 'businessValue', 'feasibility', 'innovation'];
          const scores = {}; const reasons = {};
          dims.forEach(k => {
            let v = Number(obj.scores[k]) || 3;
            scores[k] = Math.max(1, Math.min(5, v));
            reasons[k] = (obj.reasons && obj.reasons[k]) ? String(obj.reasons[k]) : '';
          });
          return { scores, reasons };
        }
      } catch (e) {
        console.warn('[AI] generateExamFourDimEval fallback:', e.message);
      }
    }
    return null;
  },

  // ========== AI 预设模式：帮我想 / 批判我 / 查一查 ==========

  /** 返回 3 个预设模式的 system prompt */
  _modeSystem(mode) {
    const prompts = {
      brainstorm: [
        '你是 Eureka Lite 的「发散师」，任务是帮助用户开阔思路、探寻更多可能性。',
        '你永远不否定用户的任何想法，只说"对，还有呢？"。',
        '基于用户当前所处阶段（RISE）和已填写内容，提出 3-4 条发散性的建议或引导问题。',
        '每条建议以 ✅ 开头，一句话（25 字内）。',
        '最终以一个🌱 行动提示结尾。'
      ].join(' '),
      critique: [
        '你是 Eureka Lite 的「批判师」，任务是帮助用户识别盲点和风险。',
        '你不是在打击用户，而是像投资人一样诚恳地质疑：这个假设成立吗？还有什么风险？',
        '基于用户当前阶段和已填写内容，提出 3-4 条尖锐但建设性的挑战。',
        '每条挑战以 ⚠️ 开头，一句话（25 字内）。',
        '最终以一个📌 关键风险总结结尾。'
      ].join(' '),
      research: [
        '你是 Eureka Lite 的「分析师」，任务是帮助用户补充事实依据。',
        '基于用户当前阶段和已填写内容，指出需要验证的假设和获取数据的方向。',
        '提出 3-4 条调研/数据/事实类的建议。',
        '每条建议以 🔎 开头，一句话（25 字内）。',
        '最终以一个📊 建议验证清单结尾。'
      ].join(' ')
    };
    return prompts[mode] || prompts.brainstorm;
  },

  /** 根据模式和当前上下文生成 AI 回复 */
  async generateAIModeResponse(mode, contextText, userInput) {
    const system = this._modeSystem(mode);
    const ctx = (contextText || '').slice(0, 800) || '用户正在使用 Eureka Lite 进行创新项目';
    const userPart = (userInput || '').trim().slice(0, 200);
    const prompt = `【项目上下文】${ctx}\n${userPart ? '【用户输入】' + userPart + '\n' : ''}\n请根据你的角色给出回应。`;
    if (this._hasAI()) {
      try {
        const r = await window.AIService.complete(prompt, { system, temperature: 0.7, maxTokens: 400 });
        if (r && r.trim()) return r.trim();
      } catch (e) {
        console.warn('[AI] generateAIModeResponse error:', e.message);
      }
    }
    // 无 AI 时的回退模板
    const fallbacks = {
      brainstorm: '✅ 想想用户在这个场景下还有没有被忽略的需求？\n✅ 有没有其他行业的类似解决方案可以借鉴？\n✅ 如果资源不限，你会怎么做？\n✅ 用户的真正动机是什么？\n🌱 试试从"为什么用户会这样做"开始思考。',
      critique: '⚠️ 你的方案解决了用户愿意付费的问题吗？\n⚠️ 有没有数据支持你的假设？\n⚠️ 如果竞品复制你的方案，你的壁垒是什么？\n📌 关键风险：假设未经验证。',
      research: '🔎 该领域有哪些成功的商业案例？\n🔎 目标用户群体有多大？\n🔎 现有解决方案为什么不够好？\n📊 建议先做 5 个竞品分析。'
    };
    return fallbacks[mode] || fallbacks.brainstorm;
  }
};

// Export
window.AIAssistant = AIAssistant;
