import { useState } from 'react'
import { Layout, Menu, Breadcrumb, Dropdown, Badge, Avatar, Space } from 'antd'
import { BellOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { menuConfig } from '../menuConfig'
import { useCurrentAdmin } from '../models/adminAccess'

const { Header, Sider, Content } = Layout

// 构建 AntD Menu items
const menuItems = menuConfig.map((m) =>
  m.children
    ? { key: m.key, icon: m.icon, label: m.label, children: m.children.map((c) => ({ key: c.key, label: c.label })) }
    : { key: m.key, icon: m.icon, label: m.label }
)

// 路由 → 面包屑映射
function findBreadcrumb(path: string): string[] {
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
  const selectedPath = location.pathname.startsWith('/activity/detail/') ? '/activity/list' : location.pathname

  // 展开的父菜单
  const openKey = menuConfig.find((m) => m.children?.some((c) => selectedPath.startsWith(c.key)))?.key

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={220} theme="dark">
        <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: collapsed ? 14 : 16, letterSpacing: 1 }}>
          {collapsed ? 'WM' : '沃尔玛管理后台'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedPath]}
          defaultOpenKeys={openKey ? [openKey] : []}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB' }}>
          <div style={{ cursor: 'pointer', fontSize: 18 }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <Space size={20}>
            <Badge count={5} size="small"><BellOutlined style={{ fontSize: 18 }} /></Badge>
            <Dropdown menu={{ items: [{ key: 'logout', label: '退出登录' }] }}>
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1A56DB' }} />
                <span>{currentUser.name}</span>
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <div style={{ padding: '12px 20px 0' }}>
          <Breadcrumb items={crumbs.map((c) => ({ title: c }))} />
        </div>
        <Content style={{ margin: 20, padding: 20, background: '#fff', borderRadius: 8, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
