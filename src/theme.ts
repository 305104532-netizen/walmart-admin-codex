import type { ThemeConfig } from 'antd'

// 管理后台设计 Token：所有页面共用同一套颜色、间距、圆角和控件尺寸。
export const tokens = {
  primary: '#0071CE',
  primaryHover: '#005EA8',
  primaryLight: '#EAF4FF',
  brandYellow: '#FFC220',
  success: '#25864A',
  warning: '#B86E00',
  error: '#C9362B',
  textPrimary: '#172033',
  textSecondary: '#667085',
  textDisabled: '#98A2B3',
  bgPage: '#F3F6F9',
  bgCard: '#FFFFFF',
  border: '#DDE4EC',
  borderStrong: '#C8D2DE',
  sider: '#071A2D',
  radiusSm: 6,
  radiusMd: 10,
  radiusLg: 14,
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
    colorBorderSecondary: '#E8EDF2',
    borderRadius: tokens.radiusSm,
    borderRadiusLG: tokens.radiusMd,
    colorBgLayout: tokens.bgPage,
    colorBgContainer: tokens.bgCard,
    controlHeight: 36,
    controlHeightSM: 30,
    fontSize: 14,
    lineHeight: 1.57,
    motion: true,
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      siderBg: tokens.sider,
      headerHeight: 60,
    },
    Menu: {
      darkItemBg: tokens.sider,
      darkItemHoverBg: '#102D49',
      darkItemSelectedBg: '#0B69B7',
      darkItemColor: '#B8C7D8',
      darkItemSelectedColor: '#FFFFFF',
    },
    Card: {
      borderRadiusLG: tokens.radiusMd,
      headerFontSize: 16,
      bodyPadding: 20,
      headerHeight: 56,
      colorBorderSecondary: '#E8EDF2',
    },
    Table: {
      headerBg: '#F5F8FB',
      headerColor: tokens.textPrimary,
      cellPaddingBlock: 13,
      cellPaddingInline: 16,
      rowHoverBg: '#F5FAFF',
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
