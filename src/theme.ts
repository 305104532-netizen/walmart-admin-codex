import type { ThemeConfig } from 'antd'

// 管理后台设计 Token：所有页面共用同一套颜色、间距、圆角和控件尺寸。
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
  spaceXs: 4,
  spaceSm: 8,
  spaceMd: 16,
  spaceLg: 24,
}

// Ant Design 5 ConfigProvider theme
export const antdTheme: ThemeConfig = {
  token: {
    colorPrimary: tokens.primary,
    colorSuccess: tokens.success,
    colorWarning: tokens.warning,
    colorError: tokens.error,
    colorText: tokens.textPrimary,
    colorTextSecondary: tokens.textSecondary,
    colorBorder: tokens.border,
    borderRadius: tokens.radiusSm,
    borderRadiusLG: tokens.radiusMd,
    colorBgLayout: tokens.bgPage,
    colorBgContainer: tokens.bgCard,
    controlHeight: 36,
    fontSize: 14,
    lineHeight: 1.57,
    motion: true,
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
      headerFontSize: 16,
      bodyPadding: 20,
    },
    Table: {
      headerBg: '#F8FAFC',
      headerColor: tokens.textPrimary,
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
    },
    Form: {
      itemMarginBottom: 20,
      labelColor: tokens.textPrimary,
    },
    Drawer: {
      paddingLG: 20,
    },
    Modal: {
      paddingContentHorizontalLG: 24,
    },
  },
}
