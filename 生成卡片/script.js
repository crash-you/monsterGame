document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const generateBtn = document.getElementById('generate-btn');
  const downloadBtn = document.getElementById('download-button');
  const cardContainer = document.getElementById('card-container');
  const form = document.getElementById('card-form');

  // 卡片内容元素
  const cardTitle = document.querySelector('.card-title');
  const cardSubtitle = document.querySelector('.card-subtitle');
  const authorDisplay = document.getElementById('author-display');
  const mainPointsList = document.querySelector('.main-points-list');
  const quoteText = document.querySelector('.quote-text');

  // 生成卡片按钮点击事件
  generateBtn.addEventListener('click', function() {
    // 获取表单数据
    const title = document.getElementById('title').value;
    const subtitle = document.getElementById('subtitle').value;
    const author = document.getElementById('author').value;
    const mainPoints = document.getElementById('main-points').value;
    const quote = document.getElementById('quote').value;
    const themeColor = document.getElementById('theme-color').value;

    // 表单验证
    if (!title) {
      alert('请输入文章标题');
      return;
    }

    if (!mainPoints) {
      alert('请输入至少一个主要观点');
      return;
    }

    // 更新卡片内容
    cardTitle.textContent = title;
    cardTitle.classList.add('text-clamp-2');

    // 更新副标题
    if (subtitle) {
      cardSubtitle.textContent = subtitle;
      cardSubtitle.style.display = 'block';
      cardSubtitle.classList.add('text-clamp-2');
    } else {
      cardSubtitle.style.display = 'none';
    }

    // 更新作者
    if (author) {
      authorDisplay.textContent = author;
      authorDisplay.parentElement.style.display = 'block';
    } else {
      authorDisplay.parentElement.style.display = 'none';
    }

    // 更新主要观点
    const pointsArray = mainPoints.split('\n').filter(point => point.trim() !== '');
    let pointsHTML = '';
    
    // 限制为最多5个观点
    const limitedPoints = pointsArray.slice(0, 5);
    
    limitedPoints.forEach(point => {
      pointsHTML += `
        <li>
          <i class="fas fa-check"></i>
          <span class="text-clamp-2">${point}</span>
        </li>
      `;
    });
    
    mainPointsList.innerHTML = pointsHTML;

    // 更新引述
    if (quote) {
      quoteText.textContent = quote;
      quoteText.classList.add('text-clamp-3');
      quoteText.parentElement.style.display = 'flex';
    } else {
      quoteText.parentElement.style.display = 'none';
    }

    // 应用主题颜色
    cardContainer.className = ''; // 清除之前的主题类
    
    if (themeColor !== 'default') {
      cardContainer.classList.add(`theme-${themeColor}`);
    }

    // 滚动到预览区域
    document.querySelector('.preview-section').scrollIntoView({
      behavior: 'smooth'
    });
  });

  // 下载卡片按钮点击事件
  downloadBtn.addEventListener('click', async function() {
    try {
      // 保存按钮原始HTML以便后面恢复
      const originalHTML = this.innerHTML;
      
      // 更改按钮状态
      this.innerHTML = '<i class="fas fa-spinner animate-spin"></i> 正在生成图片...';
      this.disabled = true;
      
      // 隐藏下载按钮防止其出现在导出图像中
      this.style.display = 'none';
      
      // 确保字体和图标完全加载
      await document.fonts.ready;
      
      // 触发重排，确保布局稳定
      cardContainer.getBoundingClientRect();
      
      // 增加等待时间确保所有渲染完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 强制应用所有计算样式，防止重叠问题
      const forceStyleRecalc = (element) => {
        if (!element) return;
        window.getComputedStyle(element).getPropertyValue('position');
        const children = element.children;
        for (let i = 0; i < children.length; i++) {
          forceStyleRecalc(children[i]);
        }
      };
      forceStyleRecalc(cardContainer);

      // 临时恢复卡片原始大小以便导出高清图像
      const originalTransform = cardContainer.style.transform;
      const originalMarginBottom = cardContainer.style.marginBottom;
      
      cardContainer.style.transform = 'scale(1)';
      cardContainer.style.marginBottom = '0';
      
      // 使用html2canvas，处理图标位置和元素重叠问题
      const canvas = await html2canvas(cardContainer, {
        scale: 2, // 生成2倍清晰度图像
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardContainer.style.backgroundColor || "#F5F2EB",
        logging: false,
        onclone: function(clonedDoc) {
          const clonedCard = clonedDoc.getElementById('card-container');
          
          // 确保布局稳定性
          clonedCard.style.position = 'relative';
          clonedCard.style.width = '1080px';
          clonedCard.style.height = '800px';
          
          // 处理所有定位元素，确保正确的堆叠顺序
          const positionedElements = clonedCard.querySelectorAll('[style*="position"]');
          positionedElements.forEach((el, index) => {
            // 确保有明确的z-index，防止重叠混乱
            if (!el.style.zIndex) {
              el.style.zIndex = index + 1;
              el.style.overflow = 'hidden';
            }
          });
          
          // 处理所有图标，确保正确显示
          const icons = clonedCard.querySelectorAll('i[class*="fa-"]');
          icons.forEach(icon => {
            icon.style.display = 'inline-block';
            icon.style.lineHeight = '1';
          });
        }
      });
      
      // 恢复卡片原始样式
      cardContainer.style.transform = originalTransform;
      cardContainer.style.marginBottom = originalMarginBottom;
      
      // 转换为PNG并下载
      canvas.toBlob(function(blob) {
        // 创建下载链接
        const link = document.createElement('a');
        // 从卡片标题获取文件名，如果没有则使用默认名称
        const title = document.querySelector('.card-title') || document.querySelector('h1');
        const fileName = (title ? title.textContent.trim().substring(0, 30) : '文章概念卡片') + '.png';
        link.download = fileName;
        link.href = URL.createObjectURL(blob);
        link.click();
        
        // 清理URL对象
        URL.revokeObjectURL(link.href);
        
        // 恢复按钮状态和显示
        downloadBtn.style.display = 'flex';
        downloadBtn.innerHTML = originalHTML;
        downloadBtn.disabled = false;
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('生成图片失败:', error);
      alert('生成图片失败，请重试');
      
      // 恢复按钮状态
      downloadBtn.style.display = 'flex';
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> 下载卡片PNG图像';
      downloadBtn.disabled = false;
    }
  });
  
  // 为默认数据添加示例，方便用户理解
  document.getElementById('title').placeholder = '如：《高效学习的五个关键步骤》';
  document.getElementById('subtitle').placeholder = '如：认知科学视角下的学习方法解析';
  document.getElementById('author').placeholder = '如：张三';
  document.getElementById('main-points').placeholder = '如：\n1. 分散学习比集中学习更有效\n2. 主动回忆强化长期记忆\n3. 精深加工促进知识内化\n4. 多感官学习提高理解效率\n5. 教学他人巩固自身掌握';
  document.getElementById('quote').placeholder = '如："学习不是为了灌满一桶水，而是为了点燃一把火。"';
}); 