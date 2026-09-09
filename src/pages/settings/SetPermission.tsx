import { Alert, Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Tag, Tree, Typography, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'
import {
  FORM_CONFIG_PERMISSION, FORM_VIEW_PERMISSION, SETTINGS_PERMISSION_MANAGE,
  readRolePermissions, saveRolePermissions, useCurrentAdmin,
} from '../../models/adminAccess'
import type { PreviewRole, RolePermissions } from '../../models/adminAccess'

interface Role { id: number; role: PreviewRole; name: string; desc: string; users: number }
const roles: Role[] = [
  { id: 1, role: 'superadmin', name: '超级管理员', desc: '全部业务权限及本地权限管理', users: 2 },
  { id: 2, role: 'admin', name: '管理员', desc: '业务权限及本地权限管理', users: 5 },
  { id: 3, role: 'operator', name: '运营', desc: '内容/活动/成长运营', users: 12 },
  { id: 4, role: 'bd', name: '招商经理', desc: '管理自己的专属表单；标准表单只读', users: 28 },
]

function permissionTree(role: PreviewRole): DataNode[] {
  return [
    { title: '入驻管理', key: 'register', children: [
      { title: '卖家入驻进度看板', key: 'r1' },
      { title: '溯源追踪', key: 'r2' },
      { title: '查看入驻表单', key: FORM_VIEW_PERMISSION },
      { title: '修改标准入驻表单', key: FORM_CONFIG_PERMISSION, disabled: role !== 'admin' && role !== 'superadmin' },
      { title: '五要素预审', key: 'r4' },
    ] },
    { title: '成长中心', key: 'growth', children: [{ title: '评分/画像', key: 'g1' }, { title: '人群圈选', key: 'g2' }, { title: 'DAY-ONE白名单', key: 'g3' }] },
    { title: '内容管理', key: 'content', children: [{ title: '文章/视频', key: 'c1' }, { title: '分类/标签', key: 'c2' }] },
    { title: '活动管理', key: 'activity', children: [{ title: '活动/报名/签到', key: 'a1' }, { title: '线索归因', key: 'a2' }] },
    { title: '系统设置', key: 'settings', children: [{ title: '权限管理', key: 's1' }] },
  ]
}

function loadPermissions(): { permissions: RolePermissions | null; error: string } {
  try { return { permissions: readRolePermissions(), error: '' } }
  catch (error) { return { permissions: null, error: error instanceof Error ? error.message : '角色权限读取失败，请重试。' } }
}

export default function SetPermission() {
  const currentUser = useCurrentAdmin()
  const canManage = currentUser.permissions.includes(SETTINGS_PERMISSION_MANAGE)
  const [selectedRole, setSelectedRole] = useState<PreviewRole>('admin')
  const [state, setState] = useState(loadPermissions)
  const [open, setOpen] = useState(false)
  const [form] = Form.useForm()
  const [messageApi, messageContext] = message.useMessage()
  const selected = roles.find((role) => role.role === selectedRole)!

  const save = () => {
    if (!state.permissions) return
    try {
      saveRolePermissions(selectedRole, state.permissions[selectedRole])
      const persisted = readRolePermissions()
      setState((current) => ({
        permissions: current.permissions ? { ...current.permissions, [selectedRole]: persisted[selectedRole] } : persisted,
        error: '',
      }))
      messageApi.success(`${selected.name}的权限已保存到本地`)
    } catch (error) {
      const text = error instanceof Error ? error.message : '角色权限保存失败，当前勾选已保留。'
      setState((current) => ({ ...current, error: text }))
      messageApi.error(text)
    }
  }

  const columns = [
    { title: '角色名称', dataIndex: 'name', render: (value: string) => <Tag color="blue">{value}</Tag> },
    { title: '权限说明', dataIndex: 'desc' },
    { title: '用户数', dataIndex: 'users' },
    { title: '操作', render: (_: unknown, role: Role) => <Space>
      <a onClick={() => setSelectedRole(role.role)}>编辑权限</a>
      <a>成员</a>
      <a style={{ color: '#EF4444' }}>删除</a>
    </Space> },
  ]

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    {messageContext}
    <Alert type="info" showIcon title="本地预览权限" description={`当前预览身份：${currentUser.name}。角色授权保存在此浏览器中，尚未接入真实账号和服务端鉴权。`} />
    {state.error && <Alert type="error" showIcon title="角色权限读写异常" description={state.error}
      action={<Button onClick={() => setState(loadPermissions())}>重新读取</Button>} />}
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title="角色管理" extra={<Button type="primary" icon={<PlusOutlined />} disabled={!canManage} onClick={() => setOpen(true)}>新增角色</Button>}>
          <Table rowKey="role" columns={columns} dataSource={roles} pagination={false}
            rowSelection={{ type: 'radio', selectedRowKeys: [selectedRole], onChange: (_keys, selectedRows) => { if (selectedRows[0]) setSelectedRole(selectedRows[0].role) } }} />
        </Card>
      </Col>
      <Col xs={24} lg={12}>
        <Card title={`权限分配 · ${selected.name}`} extra={<Button type="primary" size="small" disabled={!canManage || !state.permissions} onClick={save}>保存权限</Button>}>
          <Typography.Paragraph type="secondary">仅管理员和超级管理员可以获得“修改标准入驻表单”权限。招商经理（BD）可以复制标准表单并管理自己的专属表单，不能修改标准表单或他人的专属表单；运营仅可查看标准表单。</Typography.Paragraph>
          <Tree treeData={permissionTree(selectedRole)} checkable defaultExpandAll disabled={!canManage || !state.permissions}
            checkedKeys={state.permissions?.[selectedRole] ?? []}
            onCheck={(keys) => {
              if (!canManage) return
              const checked = (Array.isArray(keys) ? keys : keys.checked).map(String)
              const permissions = selectedRole === 'admin' || selectedRole === 'superadmin' ? checked : checked.filter((key) => key !== FORM_CONFIG_PERMISSION)
              setState((current) => current.permissions ? { ...current, permissions: { ...current.permissions, [selectedRole]: permissions } } : current)
            }} />
          <Typography.Paragraph type="secondary" style={{ marginTop: 16, marginBottom: 0 }}>撤销管理员的表单修改权限后，仍可在此页面恢复授权。</Typography.Paragraph>
        </Card>
      </Col>
    </Row>
    <Modal title="新增角色" open={open} onCancel={() => setOpen(false)} okButtonProps={{ disabled: !canManage }}
      onOk={() => { if (!canManage) return; messageApi.success('已创建（mock）'); setOpen(false) }}>
      <Form form={form} layout="vertical">
        <Form.Item label="角色名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <Form.Item label="权限说明" name="desc"><Input /></Form.Item>
        <Form.Item label="数据范围" name="scope"><Select options={[{ value: 'all', label: '全部数据' }, { value: 'dept', label: '本部门' }, { value: 'self', label: '仅本人名下' }]} /></Form.Item>
      </Form>
    </Modal>
  </Space>
}
