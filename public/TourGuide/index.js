/**
 * TourGuide 组件入口文件
 * 将此文件引入到HTML中即可使用TourGuide功能
 */

// 加载CSS
const tourGuideStyleLink = document.createElement('link');
tourGuideStyleLink.rel = 'stylesheet';
tourGuideStyleLink.href = 'TourGuide/tourGuide.css';
document.head.appendChild(tourGuideStyleLink);

// 延迟初始化，确保页面加载
document.addEventListener('DOMContentLoaded', async () => {
  // 首先加载脚本作为模块
  const script = document.createElement('script');
  script.type = 'module';
  script.textContent = `
    import TourGuide from './TourGuide/tourGuide.js';

    const auto = localStorage.getItem('tourGuideAutoStart');
    if (auto !== 'false') {
      const guide = await TourGuide.from();
      setTimeout(() => guide.start(), 1000);
    }
    
    // 导出全局实例创建方法
    window.createTourGuide = async () => {
      const guide = await TourGuide.from();
      return guide;
    };
  `;
  document.head.appendChild(script);
});

// 向后兼容的API
window.TourGuideLoader = { 
  init: function() {
    console.log('使用新API: const guide = await window.createTourGuide(); guide.start();');
  } 
};
