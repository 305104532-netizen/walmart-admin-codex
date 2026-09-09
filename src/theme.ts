// 设计 Token（对齐 MD 全局规范 + H5/小程序主题）
export const tokens = {
  primary: '#1A56DB',
  primaryHover: '#1E40AF',
  primaryLight: '#EFF6FF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#9CA3AF',
  bgPage: '#F9FAFB',
  bgCard: '#FFFFFF',
  border: '#E5E7EB',
  radiusSm: 6,
  radiusMd: 8,
  radiusLg: 12,
}

// Ant Design 5 ConfigProvider theme
export const antdTheme = {
  token: {
    colorPrimary: tokens.primary,
    colorSuccess: tokens.success,
    colorWarning: tokens.warning,
    colorError: tokens.error,
    colorText: tokens.textPrimary,
    colorTextSecondary: tokens.textSecondary,
    colorBorder: tokens.border,
    borderRadius: tokens.radiusSm,
    colorBgLayout: tokens.bgPage,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: '#001529',
      headerHeight: 56,
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemSelectedBg: tokens.primary,
    },
    Card: {
      borderRadiusLG: tokens.radiusMd,
    },
  },
}
