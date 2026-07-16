// ==========================================================================
//  macOS 15 (Sequoia) 设计语言主题模块
//  集中管理所有 macOS 风格的色彩、模糊与控件变量，供 React 组件复用。
// ==========================================================================

// 系统级字体栈（SF Pro 优先，跨平台优雅降级）
export const MAC_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", Roboto, sans-serif'

// 窗口红黄绿交通灯控制键
export const TRAFFIC_LIGHTS = {
  close: '#ff5f57',
  minimize: '#febc2e',
  maximize: '#28c840',
}

// 根据主题名返回一套完整的 macOS 调色板
export function getMacTheme(themeName = 'light') {
  const isDark = themeName === 'dark'

  // 浅色（默认）与深色两套系统配色
  const base = isDark
    ? {
        // —— 深色模式（macOS Dark Appearance）——
        primary: '#0a84ff',
        onPrimary: '#ffffff',
        primaryContainer: 'rgba(10, 132, 255, 0.22)',
        onPrimaryContainer: '#c9e3ff',
        surface: 'rgba(28, 28, 30, 0.72)',          // 窗口毛玻璃底色
        surfaceContainerLow: 'rgba(255, 255, 255, 0.06)',  // 侧栏 / 内容区
        surfaceContainer: 'rgba(255, 255, 255, 0.10)',     // 输入框 / 卡片
        surfaceContainerHigh: 'rgba(255, 255, 255, 0.12)', // 顶栏 / 底栏
        onSurface: '#f5f5f7',
        onSurfaceVariant: '#98989d',
        outline: 'rgba(255, 255, 255, 0.14)',
        vibrancy: 'blur(40px) saturate(180%)',
        vibrancyLight: 'blur(20px) saturate(160%)',
        shadow: '0 22px 70px rgba(0, 0, 0, 0.55)',
        hover: 'rgba(255, 255, 255, 0.10)',
        active: 'rgba(255, 255, 255, 0.16)',
        separator: 'rgba(255, 255, 255, 0.10)',
        bubbleReceived: 'rgba(255, 255, 255, 0.14)',
        bubbleReceivedText: '#f5f5f7',
        error: '#ff453a',
        success: '#32d74b',
      }
    : {
        // —— 浅色模式（macOS Light Appearance）——
        primary: '#007aff',
        onPrimary: '#ffffff',
        primaryContainer: 'rgba(0, 122, 255, 0.14)',
        onPrimaryContainer: '#00366e',
        surface: 'rgba(246, 246, 248, 0.78)',       // 窗口毛玻璃底色
        surfaceContainerLow: 'rgba(0, 0, 0, 0.035)',  // 侧栏 / 内容区
        surfaceContainer: 'rgba(0, 0, 0, 0.05)',      // 输入框 / 卡片
        surfaceContainerHigh: 'rgba(255, 255, 255, 0.55)', // 顶栏 / 底栏
        onSurface: '#1d1d1f',
        onSurfaceVariant: '#86868b',
        outline: 'rgba(0, 0, 0, 0.10)',
        vibrancy: 'blur(40px) saturate(200%)',
        vibrancyLight: 'blur(20px) saturate(180%)',
        shadow: '0 22px 70px rgba(0, 0, 0, 0.28)',
        hover: 'rgba(0, 0, 0, 0.05)',
        active: 'rgba(0, 0, 0, 0.09)',
        separator: 'rgba(0, 0, 0, 0.08)',
        bubbleReceived: 'rgba(255, 255, 255, 0.92)',
        bubbleReceivedText: '#1d1d1f',
        error: '#ff3b30',
        success: '#34c759',
      }

  return {
    ...base,
    isDark,
    // 统一圆角规范（macOS 偏好大圆角）
    radius: {
      window: '14px',
      card: '12px',
      control: '8px',
      pill: '100px',
      bubble: '18px',
    },
  }
}

export default getMacTheme
