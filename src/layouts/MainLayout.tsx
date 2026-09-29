import { useState } from 'react'
import { Layout, Menu, Breadcrumb, Dropdown, Badge, Avatar, Space, Button, Tooltip } from 'antd'
import { BellOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined, ShopOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { menuConfig } from '../menuConfig'
import { useCurrentAdmin } from '../models/adminAccess'
import './MainLayout.css'

const { Header, Sider } = Layout

// 构建 AntD Menu items
const menuItems = menuConfig.map((m) =>
  m.children
    ? { key: m.key, icon: m.icon, label: m.label, children: m.children.map((c) => ({ key: c.key, label: c.label })) }
    : { key: m.key, icon: m.icon, label: m.label }
)

// 路由 → 面包屑映射
function findBreadcrumb(path: string): string[] {
  if (path.startsWith('/activity/summit/detail/')) return ['活动管理', '沃尔玛峰会管理', '峰会详情']
  if (path === '/activity/summit/create') return ['活动管理', '沃尔玛峰会管理', '创建峰会']
  if (path.startsWith('/activity/detail/')) return ['活动管理', '活动列表', '活动详情']
  for (const m of menuConfig) {
    if (m.key === path) return [m.label]
    if (m.children) {
      const c = m.children.find((x) => path.startsWith(x.key))
      if (c) return [m.label, c.label]
    }
  }
  return ['未知页面']
}

export default function MainLayout() {
  const currentUser = useCurrentAdmin()
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const crumbs = findBreadcrumb(location.pathname)
  const selectedPath = location.pathname.startsWith('/activity/detail/') ? '/activity/list'
    : location.pathname.startsWith('/activity/summit/') ? '/activity/summit'
      : location.pathname

  // 展开的父菜单
  const openKey = menuConfig.find((m) => m.children?.some((c) => selectedPath.startsWith(c.key)))?.key

  return (
    <Layout className="admin-app-shell">
      <a className="admin-skip-link" href="#main-content">跳转到主要内容</a>
      <Sider className="admin-sider" trigger={null} collapsible collapsed={collapsed} width={220} collapsedWidth={64} breakpoint="lg" onCollapse={setCollapsed} theme="dark">
        <div className={`admin-logo${collapsed ? ' is-collapsed' : ''}`} title="沃尔玛管理后台">
          <span className="admin-logo-mark" aria-hidden="true">W</span>
          <span className="admin-logo-copy">
            <strong>沃尔玛</strong>
            <small>运营管理后台</small>
          </span>
        </div>
        <nav aria-label="管理后台主导航">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedPath]}
            defaultOpenKeys={openKey ? [openKey] : []}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
          />
        </nav>
      </Sider>
      <Layout className="admin-main-layout">
        <Header className="admin-header">
          <div className="admin-header-context">
            <Tooltip title={collapsed ? '展开导航' : '收起导航'}>
              <Button type="text" className="admin-menu-trigger" aria-label={collapsed ? '展开导航' : '收起导航'} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
            </Tooltip>
            <div className="admin-workspace-context">
              <span className="admin-workspace-icon" aria-hidden="true"><ShopOutlined /></span>
              <span>
                <strong>运营工作台</strong>
                <small>商家增长与小程序内容运营</small>
              </span>
            </div>
          </div>
          <Space size={16} className="admin-account-actions">
            <Badge count={5} size="small"><Button type="text" aria-label="查看通知" icon={<BellOutlined />} /></Badge>
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录' }] }}>
              <Space className="admin-user-menu">
                <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1A56DB' }} />
                <span className="admin-user-name">{currentUser.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <div className="admin-breadcrumb">
          <Breadcrumb items={crumbs.map((c) => ({ title: c }))} />
        </div>
        <main id="main-content" className="admin-content" tabIndex={-1}>
          <Outlet />
        </main>
      </Layout>
    </Layout>
  )
}
