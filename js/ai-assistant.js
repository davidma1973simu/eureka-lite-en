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
      /Problem是(.+?)[，,。]/,
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
    const productMatch = text.match(/(智能|智能硬件|APP|应用|Product|Service|网站|平台)(.+?)[，,。]/);
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

    // 如果有Product提及
    if (elements.product) {
      lines.push(`【Product/Service】${elements.product}`);
    }

    // 行为描述
    const actionMatch = userInput.match(/(想要|希望|需要)(.+?)[，,。]/);
    if (actionMatch) {
      lines.push(`【用户目标】${actionMatch[2]}`);
    }

    if (lines.length < 2) {
      // 如果提取不到足够信息，返回基于原文的优化版本
      return {
        title: 'Scenario description（优化版)',
        content: this.normalizeText(userInput)
      };
    }

    return {
      title: 'Scenario description（规范化改写)',
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
        service: '需要便捷Service的中青年用户',
        problem: '受该Problem困扰的目标人群',
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
      if (hasElder) return '老年人独自在家时，子女担心他们的安全和生活状况。现有的沟通方式（电话、视频)不够及时，无法实时了解老人的状态。';
      if (hasChild) return '新手父母在孩子成长过程中，需要记录喂养、睡眠、疫苗接种等信息。纸质记录容易丢失，现有App操作复杂，长辈不会使用。';
      if (hasPet) return '上班族白天外出工作时，担心独自在家的宠物：是否饿了、有没有捣乱、情绪如何。无法实时了解宠物状态，回家后才发现Problem。';

      // Category-based defaults
      const sceneDefaults = {
        product: '用户在日常生活中遇到的不便，现有解决方案无法满足其特定需求，导致效率低下或体验不佳。',
        service: '用户在需要Service时，发现流程繁琐、等待时间长、Service质量不稳定，整体体验令人失望。',
        problem: '该Problem影响的人群广泛，现有解决方法效果有限，用户迫切需要更高效、更便捷的解决方案。',
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
      steps.push('【触点5】使用Product/Service');
      steps.push('【触点6】产生后续行为');
    }

    return {
      title: 'User journey（规范化)',
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
      title: '关键发现（规范化)',
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
      title: 'FIND 洞察（规范化)',
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
      title: 'HMW Problem（规范化)',
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
          suggestions.push('✓ Mark key decision points and emotional shifts');
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
      'inspire-3': ['先求量，再求质', 'Allow wild ideas', 'Combine multiple inspiration sources'],
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
              return '💡 提示：请Add the situation in which it is used';
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
      'inspire-2': '哪个领域已经解决了类似Problem？',
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
            title: 'Behavior tracking & reminders',
            description: 'Use sensors to track behavior and auto-trigger reminders (e.g. a smart bottle logs water intake)',
            source: 'Health tech'
          },
          {
            type: 'Cool',
            title: 'Gamified incentives',
            description: 'Turn health behavior into points, badges and leaderboards to make drinking water fun',
            source: 'Health App'
          },
          {
            type: 'Outsider',
            title: 'Social contagion',
            description: 'Let friends and classmates remind and motivate each other, building a healthy social vibe',
            source: 'WeChat Steps'
          }
        ];
      }

      // Student/education related
      if (text.includes('学生') || text.includes('大学') || text.includes('课堂') || text.includes('课间') || text.includes('学习')) {
        return [
          {
            type: 'New',
            title: 'Contextual micro-services',
            description: 'Lightweight services for fragmented moments (e.g. micro-tasks finished between classes)',
            source: 'EdTech'
          },
          {
            type: 'Cool',
            title: 'Peer effect',
            description: 'Leverage peer influence among students to build positive study/habit routines',
            source: 'Study Together'
          },
          {
            type: 'Outsider',
            title: 'Off-peak design',
            description: 'Serve users when they need not act, cutting willpower drain',
            source: 'Smart home'
          }
        ];
      }

      // Office/work related
      if (text.includes('办公') || text.includes('通勤') || text.includes('工作') || text.includes('会议')) {
        return [
          {
            type: 'New',
            title: 'Context-aware automation',
            description: 'Auto-trigger services from user state (e.g. open to-dos on entering the office)',
            source: 'Smart office'
          },
          {
            type: 'Cool',
            title: 'Micro-interruption design',
            description: 'Deliver key info through tiny interruptions (vibration, flash)',
            source: 'Wearable devices'
          },
          {
            type: 'Outsider',
            title: 'Frictionless interaction',
            description: 'No active action needed; the system does it (auto-save, sync)',
            source: 'iCloud'
          }
        ];
      }

      // Generic product related
      if (category === 'product' || text.includes('Product') || text.includes('硬件')) {
        return [
          {
            type: 'New',
            title: 'Subscription mindset',
            description: 'Shift from one-off purchase to ongoing subscription, creating continuous value',
            source: 'SaaS industry'
          },
          {
            type: 'Cool',
            title: 'Gamified feedback',
            description: 'Give users instant, joyful feedback on their actions to lift engagement',
            source: 'Duolingo'
          },
          {
            type: 'Outsider',
            title: 'Reverse customization',
            description: 'Let users join product definition, boosting a sense of ownership',
            source: '乐高Ideas'
          }
        ];
      }

      // Generic service related
      if (category === 'service' || text.includes('Service')) {
        return [
          {
            type: 'New',
            title: '情境感知Service',
            description: '根据用户当前状态调整Service内容',
            source: '酒店行业'
          },
          {
            type: 'Cool',
            title: 'Delightful surprises',
            description: 'Create above-expectation moments beyond the anticipated',
            source: 'Disney'
          },
          {
            type: 'Outsider',
            title: 'Community-driven',
            description: 'Let users serve and help one another',
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
          title: 'Extreme users',
          description: 'Watch extreme users’ extreme needs — that is where real opportunities hide',
          source: 'Design thinking'
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
        if (context?.targetUser) ctxLines.push(`[Project real target user] ${context.targetUser}`);
        if (context?.sceneDesc) ctxLines.push(`[Project real scenario] ${context.sceneDesc}`);
        if (context?.scene) ctxLines.push(`[Project scenario summary] ${context.scene}`);
        if (context?.finding && context.finding !== (userInput || '').trim()) ctxLines.push(`[Original key finding] ${context.finding}`);
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
        const targetMatch = content.match(/【目标用户】(.+?)(?=\n【Scenario description】|$)/s);
        const sceneMatch = content.match(/【Scenario description】(.+?)$/s);
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

      // 构建项目上下文摘要（关键：让 AI 紧扣实际项目主题)
      const ctxParts = [
        `【项目名称】${projectName}`,
        `【目标用户】${targetUser}`,
        `【Scenario description】${scene}`,
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

    // ---- fallback：基于实际项目数据（不再用关键词猜测领域) ----
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
      const pm1 = sourceText2.match(/(?:面临|遇到|存在|导致|造成)(.+?)(?:Problem|困难|挑战|痛点|不便)/)
        || sourceText2.match(/(?:无法|不能|很难|不容易)(.+?)(?:，|,|。|$)/)
        || sourceText2.match(/(?:花费|消耗|浪费|花了)(.+?)(?:时间|精力|金钱)/);
      if (pm1) coreProblem2 = pm1[1] || pm1[0];
    }
    if (!coreProblem2 && insight2) {
      const pm2 = insight2.match(/需要"(.+?)"/) || insight2.match(/需要(.+?)，因为/);
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
  // ==================  DeepSeek 真实 AI 能力层（含模板回退)  ==================
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
    if (!project) return '(no project context yet)';
    const lines = [];
    lines.push(`Project name: ${project.title || project.originalTitle || '未命名'}`);
    const catMap = { product: 'Product', service: 'Service', problem: 'Problem', explore: 'Exploration' };
    lines.push(`Innovation type: ${catMap[project.category] || project.category || '未知'}`);

    const cards = project.cards || {};
    const pick = (raw) => {
      if (!raw) return '';
      if (typeof raw === 'object' && raw.content) raw = raw.content;
      return typeof raw === 'string' ? raw : JSON.stringify(raw);
    };

    // 场景
    const scene = pick(cards.scene);
    if (scene) lines.push(`[Scenario / User] ${scene.slice(0, 300)}`);
    // User journey
    const journey = pick(cards.journey);
    if (journey) lines.push(`[User journey] ${journey.slice(0, 300)}`);
    // FIND 洞察
    const find = this._getFindData(project);
    if (find && (find.distill || find.need || find.fact)) {
      lines.push(`[Core insight] ${(find.distill || find.need || find.fact || '').toString().slice(0, 200)}`);
    }
    // HMW / 最佳创意
    const hmw = pick(cards.hmw);
    if (hmw) lines.push(`[HMW / Innovation opportunity] ${hmw.slice(0, 200)}`);
    const bestIdea = pick(cards.bestIdea) || pick(cards.ideaConfirm) || pick(cards.ideas);
    if (bestIdea) lines.push(`[Selected idea] ${bestIdea.slice(0, 200)}`);
    // Shape 已有产出（供 Exam 阶段参考)
    const fourDim = pick(cards.fourDimensions);
    if (fourDim) lines.push(`[Four-dimension challenge conclusion] ${fourDim.slice(0, 200)}`);
    const minConcept = pick(cards.minConcept);
    if (minConcept) lines.push(`[Minimum concept solution] ${minConcept.slice(0, 200)}`);
    const storyboard = pick(cards.storyboard);
    if (storyboard) lines.push(`[Experience storyboard] ${storyboard.slice(0, 200)}`);

    return lines.join('\n');
  },

  /**
   * 各阶段各屏的 AI 引导定义（草稿生成 + 建议)
   * key: `${stage}-${screen}`
   */
  _screenBrief(stage, screen) {
    const briefs = {
      // ---------- Reveal ----------
      'reveal-1': {
        label: 'Scenario description',
        draft: 'Based on the project context, write one concrete user scenario. It must include three elements — [Target user] [Usage scenario] [Pain point / challenge] — one per line, tagged with []. Keep it under 150 characters and focus on one real, specific painful moment.',
        tips: ['Clarify who is using it', 'Add the situation in which it is used', 'Describe the specific difficulty encountered']
      },
      'reveal-2': {
        label: 'User journey',
        draft: 'From the scenario, map the user’s full journey. List the key steps by [Touchpoint N] (5-7 steps), and flag drop-off / broken moments with [Breakpoint]. One touchpoint per line.',
        tips: ['From first contact through post-use', 'Mark key decision points and emotional shifts', 'Find the experience breakpoints']
      },
      'reveal-5': {
        label: 'Project brief',
        draft: 'Summarize the project brief in five sections: target user, core scenario, key insight, stakeholders, business assumptions. 2-3 clear sentences each.',
        tips: ['Consolidate assets from each stage', 'Highlight the most distinctive insight', 'Link to business value']
      },
      // ---------- Inspire ----------
      'inspire-3': {
        label: 'Idea generation',
        draft: 'From the HMW and insight, quickly generate 8 differentiated ideas — one per line, numbered, under 20 words. Quantity before quality; bold ideas welcome.',
        tips: ['Quantity before quality', 'Allow wild ideas', 'Combine multiple inspiration sources']
      },
      'inspire-4': {
        label: 'Select the best idea',
        draft: 'From the candidates, quickly rate on three axes — user value / feasibility / business potential — and recommend 1 best idea with a reason (under 100 words).',
        tips: ['Consider feasibility', 'Weigh user value', 'Assess business potential']
      },
      'inspire-5': {
        label: 'Confirm the best idea',
        draft: '为选定创意起一个响亮的名字，并用一句话（30字内)说清它的核心价值主张。格式：【创意名称】xxx\\n【一句话价值】xxx',
        tips: ['Pick a memorable name', 'State the value in one line', 'Explain why it is worth pursuing']
      },
      // ---------- Shape ----------
      'shape-1': {
        label: 'Four-dimension challenge',
        draft: 'Honestly challenge the chosen idea across four dimensions; for each give "current state + key risk + mitigation", 2-3 sentences:\n[Desirability] Do users truly want it?\n[Feasibility] Can tech/resources deliver it?\n[Viability] Is it commercially sustainable?\n[Adaptability] Does it fit trends and ecosystem?',
        tips: ['Answer each dimension honestly', 'Expose real risks, not self-comfort', 'Give actionable mitigations']
      },
      'shape-2': {
        label: 'Minimum concept (MVP)',
        draft: 'Define the minimum viable solution, output:\n[One-liner] describe the MVP in one sentence\n[Core features] what it does (<=3, focus on key value)\n[Explicit non-goals] what it won’t do yet (2-3, set boundaries)\n[First user] who it serves first',
        tips: ['Focus on the most critical core value', 'Set clear boundaries: what to do and what not', 'Smaller and more focused is better']
      },
      'shape-3': {
        label: 'User experience storyboard',
        draft: 'Tell a full user-experience story in a 6-panel storyboard, one sentence each (with user emotion):\n1. Aware (how they learn of it)\n2. Try (first use)\n3. Use (daily use)\n4. Aha (the aha moment)\n5. Grow (ongoing value)\n6. Share (recommend to others)',
        tips: ['Tell it from the user’s view', 'Each panel has scene, motive, emotion', 'Highlight the aha moment']
      },
      // ---------- Exam ----------
      'exam-1': {
        label: 'Build a prototype',
        draft: 'Design the simplest usable prototype, output:\n[Core hypothesis to validate] the single most important one\n[Prototype form] paper / clickable / Wizard-of-Oz / landing page, and why\n[Core experience path] the shortest path users can complete (3-5 steps)\n[Build cost] estimated effort',
        tips: ['Simplest usable is enough; not perfect', 'Focus on validating the core hypothesis', 'The faster the better']
      },
      'exam-2': {
        label: 'Run the test',
        draft: 'Draft a lightweight test plan, output:\n[Target testers] persona and where to find them\n[Sample size] suggested number\n[Task script] key tasks for users to complete\n[Observation metrics] what to record (behavior / friction / expression / verbatim)\n[Avoid leading] how to stay neutral and not induce',
        tips: ['Find real target users', 'Do not lead; let users explore naturally', 'Observe behavior, not just opinions']
      },
      'exam-3': {
        label: 'Test report',
        draft: 'Structure the test into a report:\n[What worked] validations that held\n[Top failure] the most serious problem\n[Surprise] unexpected insight\n[Hypothesis verdict] original hypothesis confirmed / falsified / pending\n[User verbatim] 1-2 representative quotes',
        tips: ['Record honestly, no self-deception', 'Separate facts from interpretation', 'Focus on the first failure point']
      },
      'exam-4': {
        label: 'Four-dimension evaluation',
        draft: 'From test results, score the solution on four dimensions with a one-line rationale each (1-5):\n[Desirability] do users want it\n[Feasibility] can it be built\n[Viability] can it profit sustainably\n[Adaptability] does it fit the trend\nThen give an overall verdict.',
        tips: ['Back scores with facts and data', 'Do not dodge low-score dimensions', 'Make the overall verdict clear']
      },
      'exam-5': {
        label: 'Elevator pitch & iteration plan',
        draft: 'Output two parts:\n[Elevator pitch] in 30s / 60 words tell investors who/what/why/how big the opportunity is\n[Iteration plan] next 3 concrete actions (with owner and validation goal), prioritized',
        tips: ['Distill the essence, highlight differentiation', 'Make the action plan concrete and executable', 'State the next validation goal']
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
      ? `\n\nThe user’s current draft (improve and elevate it; do not discard it entirely):\n${userInput.trim()}`
      : '\n\nThe user has not filled anything; generate a high-quality draft directly from the project context.';

    const prompt =
      `[Project context] \n${projectCtx}\n\n` +
      `[Current task] ${brief.label}\n${brief.draft}${userPart}\n\n` +
      `Output only the task content itself, with no title prefix and no explanation.`;

    try {
      const content = await window.AIService.complete(prompt, {
        system: this._systemPersona(),
        temperature: 0.7,
        maxTokens: 900
      });
      if (content && content.trim()) {
        return { title: `${brief.label}（AI 生成，可编辑)`, content: content.trim() };
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
      ? `User-written content: \n${userInput.trim()}`
      : 'The user has not written anything yet.';

    const prompt =
      `[Project context] \n${projectCtx}\n\n[Current task] ${brief.label}\n${brief.draft}\n\n${userPart}\n\n` +
      `Give 3-4 concrete, actionable suggestions on how the user can write this screen better.` +
      `Return JSON: {"suggestions": ["suggestion1","suggestion2","suggestion3"]}, each under 25 words, prefixed with "✓ ".`;

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
   * 获取 NCO 灵感卡片池（每类 perType 张)。
   * 优先根据项目上下文关键词匹配更相关的灵感；否则用通用默认池。
   * @param {string} category - 项目类别
   * @param {string} contextText - 项目上下文文本（标题/场景/洞察等)
   * @param {number} perType - 每类返回的数量（默认 3 → 共 9 张)
   * @returns {Array<{type,title,description,source}>}
   */
  getNcoInspirations(category, contextText = '', perType = 3) {
    const text = (contextText || '').toLowerCase();

    // ---- 各领域的灵感池（每类 3 张)----
    const pools = {
      health: {
        New: [
          { title: 'Behavior tracking & reminders', description: 'Use sensors to track behavior and auto-trigger reminders (e.g. a smart bottle logs water intake)', source: 'Health tech' },
          { title: 'Adaptive hydration plan', description: 'Dynamically estimate personal water needs from weather and activity, proactively pushing reminders', source: 'Wearable devices' },
          { title: 'Effortless hydration design', description: 'Weave hydration into daily motions so users do it unconsciously (e.g. mist inhalation)', source: 'Materials innovation' }
        ],
        Cool: [
          { title: 'Gamified incentives', description: 'Turn health behavior into points, badges and leaderboards to make drinking water fun', source: 'Health App' },
          { title: 'Visual progress', description: 'Show live daily health progress with light and color for instant positive feedback', source: 'Data visualization' },
          { title: 'Social challenges', description: 'Launch a 7-day water challenge where friends monitor and compete on progress', source: 'Community ops' }
        ],
        Outsider: [
          { title: 'Social contagion', description: 'Let friends and classmates remind and motivate each other, building a healthy social vibe', source: 'WeChat Steps' },
          { title: 'Environmental cues', description: 'Shift the space mood with light/music to subtly nudge healthy behavior', source: 'Environmental psychology' },
          { title: 'Reverse incentives', description: 'Donate a small amount to charity if goals are missed, using loss aversion to drive action', source: 'Behavioral economics' }
        ]
      },
      student: {
        New: [
          { title: 'Contextual micro-services', description: 'Lightweight services for fragmented moments (e.g. micro-tasks finished between classes)', source: 'EdTech' },
          { title: 'Learning-behavior profiling', description: 'Track focus periods and efficiency, auto-recommending the best study rhythm', source: 'Learning science' },
          { title: 'Mistake-driven self-evolution', description: 'Auto-generate variant drills from mistakes, tackling weak spots one by one', source: 'Adaptive learning' }
        ],
        Cool: [
          { title: 'Peer effect', description: 'Leverage peer influence among students to build positive study/habit routines', source: 'Study Together' },
          { title: 'Immersive feedback', description: 'Turn dull drills into "level-ups" with sound/FX to boost flow', source: 'Gamification design' },
          { title: 'Pomodoro livestream', description: 'Make focus timers public; being "seen" sustains self-discipline', source: 'Live-study' }
        ],
        Outsider: [
          { title: 'Off-peak design', description: 'Serve users when they need not act, cutting willpower drain', source: 'Smart home' },
          { title: 'Community co-learning', description: 'Strangers team up online to study together and stay accountable', source: 'Mutual-aid community' },
          { title: 'Reward tokens', description: 'Redeem learning results for real-world perks, bridging to the real world', source: 'Token economy' }
        ]
      },
      office: {
        New: [
          { title: 'Context-aware automation', description: 'Auto-trigger services from user state (e.g. open to-dos on entering the office)', source: 'Smart office' },
          { title: 'Voice-to-schedule', description: 'Generate tasks, meetings and reminders from one sentence, no manual entry', source: 'Voice assistant' },
          { title: 'Async collaboration flow', description: 'Split collaboration into resumable micro-tasks, lowering sync cost', source: 'Collaboration tools' }
        ],
        Cool: [
          { title: 'Micro-interruption design', description: 'Deliver key info through tiny interruptions (vibration, flash)', source: 'Wearable devices' },
          { title: 'Focus bubble', description: 'One-tap "do-not-disturb" that auto-replies and defers non-urgent items', source: 'Deep work' },
          { title: 'Achievement wall', description: 'Visualize finished tasks as a growth trail to reinforce achievement', source: 'Gamification' }
        ],
        Outsider: [
          { title: 'Frictionless interaction', description: 'No active action needed; the system does it (auto-save, sync)', source: 'iCloud' },
          { title: 'Ambient intelligence', description: 'Meeting rooms auto-detect headcount and topic, prepping gear and docs', source: 'Spatial computing' },
          { title: 'Decision outsourcing', description: 'Hand low-value decisions to a rules engine; users keep only key calls', source: '自动化' }
        ]
      },
      default: {
        New: [
          { title: 'Subscription mindset', description: 'Shift from one-off purchase to ongoing subscription, creating continuous value', source: 'SaaS industry' },
          { title: 'Contextual micro-services', description: 'Break big needs into scenario-fit lightweight services', source: 'Service design' },
          { title: 'Data-driven adaptation', description: 'Use behavior data to refine experience, learning users the more they use it', source: 'Growth hacking' }
        ],
        Cool: [
          { title: 'Gamified feedback', description: 'Give users instant, joyful feedback on their actions to lift engagement', source: 'Duolingo' },
          { title: 'Delightful surprises', description: 'Create above-expectation moments beyond the anticipated', source: 'Disney' },
          { title: 'Immersive narrative', description: 'Wrap the product flow in a story line to strengthen memory hooks and emotion', source: 'Experience design' }
        ],
        Outsider: [
          { title: 'Reverse customization', description: 'Let users join product definition, boosting a sense of ownership', source: 'LEGO Ideas' },
          { title: 'Community-driven', description: 'Let users serve and help one another', source: 'Airbnb community' },
          { title: 'Extreme users', description: 'Watch extreme users’ extreme needs — that is where real opportunities hide', source: 'Design thinking' }
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
   * 调用 DeepSeek 生成全新的 NCO 灵感卡片（刷新用)。
   * @returns {Promise<Array<{type,title,description,source}>>}
   */
  async generateNcoInspirationsAI(projectContext, perType = 3) {
    const ctx = (projectContext || '').slice(0, 600) || 'an innovation project whose theme is not yet defined';
    if (this._hasAI()) {
      const prompt =
        `项目背景：\n${ctx}\n\n` +
        `From three lenses — New (fresh approach), Cool (fun & cool), Outsider (cross-domain borrow) — produce ${perType} 张"灵感卡片"。\n` +
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
                source: String(item.source || 'AI inspiration')
              });
            }
          });
        });
        if (result.length >= 3) return result;
      } catch (e) {
        console.warn('[AI] generateNcoInspirationsAI fallback:', e.message);
      }
    }
    // 回退：静态池（根据上下文)
    return this.getNcoInspirations('', ctx, perType);
  },

  /**
   * AI forced connection（Forced Connection)：把 HMW Problem与灵感卡片交叉组合，生成创意。
   * @param {Array<string>} hmwList - 已选的最佳 HMW 文本数组
   * @param {Array<{title,description,type}>} inspirationCards - 已收藏的灵感卡片
   * @param {string} projectContext - 项目上下文
   * @returns {Promise<Array<{title,description,source}>>}
   */
  async generateForcedConnectionIdeas(hmwList, inspirationCards, projectContext) {
    const hmw = (hmwList && hmwList.length) ? hmwList : ['(no specific HMW selected; base on the project’s core problem)'];
    const insp = (inspirationCards && inspirationCards.length) ? inspirationCards : [];
    const ctx = (projectContext || '').slice(0, 500) || '';

    const hmwText = hmw.map((h, i) => `${i + 1}. ${h}`).join('\n');
    const inspText = insp.length
      ? insp.map((c, i) => `${i + 1}. [${c.type}] ${c.title} —— ${c.description}`).join('\n')
      : '(no saved inspiration cards; diverge from the HMW yourself)';

    if (this._hasAI()) {
      const prompt =
        `[Project background] \n${ctx}\n\n` +
        `[Best HMW questions] \n${hmwText}\n\n` +
        `[Inspiration cards] \n${inspText}\n\n` +
        `请用"强制连接(Forced Connection)"创新思维：把上述 HMW Problem与灵感卡片进行跨领域交叉组合，` +
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
              source: String(x.source || 'AI forced connection')
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
    const hmwBase = hmw[0] || 'solve the core problem';
    const picks = insp.slice(0, 3);
    if (picks.length === 0) {
      return [
        { title: 'Minimum viable experiment', description: `Around “${hmwBase}”, run a 1-week small experiment to validate the riskiest assumption.`, source: 'local fallback' },
        { title: 'User co-creation workshop', description: `Invite target users to brainstorm on “${hmwBase}”, turning users into co-creators.`, source: 'local fallback' }
      ];
    }
    picks.forEach((c, i) => {
      const other = picks[(i + 1) % picks.length];
      ideas.push({
        title: `${c.title} × ${hmwBase.slice(0, 12)}`,
        description: `Connect “${c.title}” (from ${c.type} inspiration) with HMW “${hmwBase}” via forced connection: borrow “${c.description}", and blend in "${other.title}” to form a differentiated solution.`,
        source: `Connect ${c.type} inspiration + HMW`
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
        `[Project background] ${ctx}\n【创意】标题：${idea.title}\n描述：${idea.description}\n\n` +
        `请从四个维度为这个创意打分（各 1-5 的整数)：可行性(feasibility)、用户价值(userValue)、商业价值(businessValue)、创新程度(innovation)。\n` +
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
   * Four-dimension challenge：基于最佳创意，生成 用户/商业/技术/生态 四个维度的拷问Problem。
   * @returns {Promise<{user:Array,{q:string,a:string},business:...,technical:...,ecosystem:...}>}
   */
  async generateShapeQuestions(bestIdea, userProblem, briefText) {
    const ideaTitle = (bestIdea && bestIdea.title) || '我们的核心创意';
    const ideaDesc = (bestIdea && bestIdea.description) || '';
    const problem = (userProblem || '').slice(0, 200) || '目标用户的核心Problem';
    const brief = (briefText || '').slice(0, 800);

    if (this._hasAI()) {
      const prompt =
        `[Project brief] ${brief}\n[User problem] ${problem}\n[Best idea] ${ideaTitle} ${ideaDesc}\n\n` +
        `请从 用户(User) / 商业(Business) / 技术(Technical) / 生态(Ecosystem) 四个维度，` +
        `各提出 2-3 个针对该创意的尖锐拷问Problem（每题一句，聚焦风险、假设与可行性)。\n` +
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
        { q: `Does this solution truly solve “${problem}”, or the problem we only imagine?`, a: '' },
        { q: `Would the target user change existing habits for “${ideaTitle}”?`, a: '' }
      ],
      business: [
        { q: `"${ideaTitle}” make money? Does the unit economics hold?`, a: '' },
        { q: `If a big company copies this idea tomorrow, where is our moat?`, a: '' }
      ],
      technical: [
        { q: `Can a minimum viable version (MVP) be built with current tech within 2 weeks?`, a: '' },
        { q: `What are the most likely technical risks or dependencies?`, a: '' }
      ],
      ecosystem: [
        { q: `Which stakeholders does this touch, and who would object?`, a: '' },
        { q: `Does it comply with industry regulation / platform rules?`, a: '' }
      ]
    };
  },

  /**
   * 最小概念方案：基于上下文生成 oneLiner / features / characteristics / boundaries。
   * @returns {Promise<{oneLiner:string,features:string[],characteristics:string[],boundaries:string[]}>}
   */
  async generateMinConcept(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '(no context yet)';
    if (this._hasAI()) {
      const prompt =
        `[Context] ${ctx}\n\n请基于以上内容，给出一个最小可行概念方案(MVP)。\n` +
        `要求：一句话定义(oneLiner)；3-5 个功能与特性(features)；2-3 个Product特性(characteristics)；2-4 条明确"不做什么"的边界(boundaries)。\n` +
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
      oneLiner: 'A lightweight solution focused on core value (add a one-line definition from the context).',
      features: ['Core feature A', 'Core feature B', 'Aux feature C'],
      characteristics: ['Easy to start', 'Quick to validate'],
      boundaries: ['No platform-level expansion for now', 'No multi-device sync yet']
    };
  },

  /**
   * User experience storyboard：基于概念方案生成 6 卡描述。
   * @returns {Promise<{cards:Array<{key,title,desc}>}>}
   */
  async generateStoryboard(conceptText) {
    const ctx = (conceptText || '').slice(0, 1500) || '(no concept yet)';
    const themes = [
      { key: 'problem', title: 'The user’s problem' },
      { key: 'opportunity', title: 'Our innovation opportunity' },
      { key: 'contact', title: 'User meets the new concept' },
      { key: 'usage', title: 'User applies the new solution' },
      { key: 'outcome', title: 'The result the user gets' },
      { key: 'feeling', title: 'The user’s feeling & expression' }
    ];
    if (this._hasAI()) {
      const prompt =
        `[Concept] ${ctx}\n\nTell the user story in 6 fixed scenes, in this fixed order and titles: ` +
        themes.map(t => t.title).join(' / ') + `\n` +
        `Write 1-2 user-perspective sentences per scene.\n` +
        `Return JSON: {"cards":[{"key":"problem","title":"The user’s problem","desc":""}, ... exactly 6, key and title must match exactly]}`;
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
        desc: `(Describe the user’s experience at this moment: ${t.title})`
      }))
    };
  },

  /**
   * 测试计划：基于概念方案/故事板生成 purpose/scenario/hypotheses/userValue。
   * @returns {Promise<{purpose:string,scenario:string,hypotheses:string[],userValue:string}>}
   */
  async generateExamTestPlan(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '(no context yet)';
    if (this._hasAI()) {
      const prompt =
        `[Context] ${ctx}\n\n为这个方案设计一份轻量测试计划。\n` +
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
      purpose: 'Validate whether users are willing to use our core solution to solve their problem in a real scenario.',
      scenario: 'Invite 5-8 target users for unguided trial observation in a near-real scenario.',
      hypotheses: ['Users grasp the core value within 1 minute', 'Users are willing to complete the key action'],
      userValue: 'Saves users time / reduces uncertainty.'
    };
  },

  /**
   * Test report：基于测试计划+观察生成 4 类内容。
   * @returns {Promise<{effectiveValue:string,invalidValue:string,newProblems:string,newOpportunities:string}>}
   */
  async generateExamTestReport(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '(no context yet)';
    if (this._hasAI()) {
      const prompt =
        `[Test plan & observations] ${ctx}\n\n请基于观察撰写Test report，诚实不自我欺骗。\n` +
        `以 JSON 返回：{"effectiveValue":"验证有效的价值","invalidValue":"错误/无效的价值","newProblems":"新发现的Problem","newOpportunities":"新机会/信息"}`;
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
      effectiveValue: '(Fill in the value that was validated)',
      invalidValue: '(Fill in the hypothesis that was falsified)',
      newProblems: '(Fill in the newly found problems)',
      newOpportunities: '(Fill in the unexpected positive finding)'
    };
  },

  /**
   * 电梯演讲：基于概念方案+测试目的生成 pitch。
   * @returns {Promise<{pitch:string}>}
   */
  async generateElevatorPitch(contextText) {
    const ctx = (contextText || '').slice(0, 1200) || '(no context yet)';
    if (this._hasAI()) {
      const prompt =
        `[Context] ${ctx}\n\n写一段 30 秒电梯演讲，套用结构：` +
        `We provide [solution] for [target user], solving [problem] and delivering [value].\n` +
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
    return { pitch: 'We provide [solution] for [target user], solving [problem] and delivering [value].' };
  },

  async generateExamFourDimEval(contextText) {
    const ctx = (contextText || '').slice(0, 1500) || '(no context yet)';
    if (this._hasAI()) {
      const prompt =
        `[Context] ${ctx}\n\n基于以下创新项目的概念方案与测试发现，对方案做四维评估（每项 1-5 分，并给出一句依据)：\n` +
        `- 用户价值 User Value\n- 商业价值 Business Value\n- 技术可行性 Feasibility\n- 创新程度 Innovation\n\n` +
        `请只返回 JSON：{"scores":{"userValue":<1-5>,"businessValue":<1-5>,"feasibility":<1-5>,"innovation":<1-5>},"reasons":{"userValue":"","businessValue":"","feasibility":"","innovation":""}}`;
      try {
        const obj = await window.AIService.completeJSON(prompt, {
          system: 'You are a strict innovation-project reviewer. Score on facts and data, avoid exaggeration. Output JSON only.',
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
        'You are Eureka Lite’s "Divergence coach", helping users broaden thinking and explore more possibilities.',
        'You never reject any idea; you only say "Yes, and what else?".',
        'Based on the user’s current stage (RISE) and what they’ve filled, propose 3-4 divergent suggestions or guiding questions.',
        'Each suggestion starts with ✅, one sentence (under 25 words).',
        'End with a 🌱 action prompt.'
      ].join(' '),
      critique: [
        'You are Eureka Lite’s "Critique coach", helping users spot blind spots and risks.',
        'You are not putting the user down; you question sincerely like an investor: does this assumption hold? what other risks?',
        'Based on the user’s stage and input, raise 3-4 sharp but constructive challenges.',
        'Each challenge starts with ⚠️, one sentence (under 25 words).',
        'End with a 📌 key-risk summary.'
      ].join(' '),
      research: [
        'You are Eureka Lite’s "Analyst", helping users gather factual grounding.',
        'Based on the user’s stage and input, point out assumptions to validate and where to get data.',
        'Propose 3-4 research / data / fact-based suggestions.',
        'Each suggestion starts with 🔎, one sentence (under 25 words).',
        'End with a 📊 suggested validation checklist.'
      ].join(' ')
    };
    return prompts[mode] || prompts.brainstorm;
  },

  /** 根据模式和当前上下文生成 AI 回复 */
  async generateAIModeResponse(mode, contextText, userInput) {
    const system = this._modeSystem(mode);
    const ctx = (contextText || '').slice(0, 800) || 'The user is running an innovation project in Eureka Lite';
    const userPart = (userInput || '').trim().slice(0, 200);
    const prompt = `[Project context] ${ctx}\n${userPart ? '[User input] ' + userPart + '\n' : ''}\nPlease respond according to your role.`;
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
      brainstorm: '✅ Think: are there overlooked needs in this scenario?\n✅ Are there similar solutions in other industries to borrow from?\n✅ If resources were unlimited, what would you do?\n✅ What is the user’s real motivation?\n🌱 Try starting from "why does the user behave this way".',
      critique: '⚠️ Does your solution address a problem users will pay for?\n⚠️ Is there data supporting your assumption?\n⚠️ If competitors copy your solution, what is your moat?\n📌 Key risk: assumption unvalidated.',
      research: '🔎 What successful business cases exist in this field?\n🔎 How large is the target user group?\n🔎 Why are existing solutions not good enough?\n📊 Suggest starting with 5 competitor analyses.'
    };
    return fallbacks[mode] || fallbacks.brainstorm;
  }
};

// Export
window.AIAssistant = AIAssistant;
