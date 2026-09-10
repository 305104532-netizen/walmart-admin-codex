import { useMemo, useState } from 'react'
import { ApartmentOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Descriptions, Drawer, Form, Input, Modal, Row, Select, Space, Statistic, Table, Tag, Tree, Typography, message } from 'antd'
import type { DataNode } from 'antd/es/tree'
import { SETTINGS_PERMISSION_MANAGE, useCurrentAdmin } from '../../models/adminAccess'
import { readOrganization, resetOrganization, saveOrganization } from '../../models/organization'
import type { OrganizationMember, OrganizationMemberRole, OrganizationSite, OrganizationState, OrganizationStatus, OrganizationUnit, OrganizationUnitType } from '../../models/organization'

const SITE_OPTIONS = ['US', 'CA', 'MX'].map((site) => ({ value: site, label: site }))
const TYPE_LABELS: Record<OrganizationUnitType, string> = { center: '业务中心', business: '业务部门', region: '区域团队', function: '职能部门', team: '工作组' }
const ROLE_LABELS: Record<OrganizationMemberRole, string> = { superadmin: '超级管理员', admin: '管理员', operator: '运营', bd: '招商经理' }
const STATUS_LABELS: Record<OrganizationStatus, string> = { enabled: '启用', disabled: '停用' }

function loadState(): { data?: OrganizationState; error: string } {
  try { return { data: readOrganization(), error: '' } }
  catch (cause) { return { error: cause instanceof Error ? cause.message : '组织架构读取失败。' } }
}

function makeTree(units: OrganizationUnit[], members: OrganizationMember[], parentId: string | null): DataNode[] {
  return units.filter((unit) => unit.parentId === parentId).map((unit) => ({
    key: unit.id,
    title: `${unit.name}（${members.filter((member) => member.departmentId === unit.id && member.status === 'enabled').length}）`,
    disabled: unit.status === 'disabled',
    children: makeTree(units, members, unit.id),
  }))
}

function newId(prefix: string): string { return `${prefix}-${crypto.randomUUID()}` }

function collectDescendantIds(units: OrganizationUnit[], id: string): Set<string> {
  const result = new Set<string>([id])
  const visit = (parentId: string) => units.filter((unit) => unit.parentId === parentId).forEach((unit) => {
    if (result.has(unit.id)) return
    result.add(unit.id)
    visit(unit.id)
  })
  visit(id)
  return result
}

export default function SetOrganization() {
  const currentUser = useCurrentAdmin()
  const canManage = currentUser.permissions.includes(SETTINGS_PERMISSION_MANAGE)
  const [state, setState] = useState(loadState)
  const rootId = state.data?.units.find((unit) => unit.parentId === null)?.id
  const [selectedId, setSelectedId] = useState(rootId ?? '')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<OrganizationMemberRole>()
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus>()
  const [unitDrawer, setUnitDrawer] = useState(false)
  const [memberDrawer, setMemberDrawer] = useState(false)
  const [editingUnit, setEditingUnit] = useState<OrganizationUnit>()
  const [editingMember, setEditingMember] = useState<OrganizationMember>()
  const [unitForm] = Form.useForm<OrganizationUnit>()
  const [memberForm] = Form.useForm<OrganizationMember>()
  const [messageApi, messageContext] = message.useMessage()

  const data = state.data
  const selectedUnit = data?.units.find((unit) => unit.id === selectedId) ?? data?.units.find((unit) => unit.parentId === null)
  const memberName = (id?: string) => data?.members.find((member) => member.id === id)?.name ?? '未设置'
  const treeData = useMemo(() => data ? makeTree(data.units, data.members, null) : [], [data])
  const unavailableParentIds = useMemo(() => editingUnit ? collectDescendantIds(data?.units ?? [], editingUnit.id) : new Set<string>(), [data?.units, editingUnit])
  const members = useMemo(() => (data?.members ?? []).filter((member) => member.departmentId === selectedUnit?.id
    && (!search || `${member.name}${member.employeeNo}${member.email}`.toLowerCase().includes(search.toLowerCase()))
    && (!roleFilter || member.role === roleFilter) && (!statusFilter || member.status === statusFilter)), [data, roleFilter, search, selectedUnit?.id, statusFilter])

  const persist = (next: OrganizationState, success: string) => {
    try { setState({ data: saveOrganization(next), error: '' }); messageApi.success(success) }
    catch (cause) { messageApi.error(cause instanceof Error ? cause.message : '组织架构保存失败。') }
  }

  const openUnit = (unit?: OrganizationUnit) => {
    setEditingUnit(unit)
    unitForm.setFieldsValue(unit ?? { parentId: selectedUnit?.id ?? rootId, type: 'team', sites: selectedUnit?.sites ?? ['US', 'CA', 'MX'], status: 'enabled' } as OrganizationUnit)
    setUnitDrawer(true)
  }
  const openMember = (member?: OrganizationMember) => {
    setEditingMember(member)
    memberForm.setFieldsValue(member ?? { departmentId: selectedUnit?.id ?? rootId, role: 'bd', sites: selectedUnit?.sites ?? ['US', 'CA', 'MX'], status: 'enabled' } as OrganizationMember)
    setMemberDrawer(true)
  }

  const saveUnit = async () => {
    if (!data || !canManage) return
    const values = await unitForm.validateFields()
    if (data.units.some((unit) => unit.code.toLowerCase() === values.code.trim().toLowerCase() && unit.id !== editingUnit?.id)) {
      unitForm.setFields([{ name: 'code', errors: ['部门编码已存在'] }]); return
    }
    const unit: OrganizationUnit = { ...values, id: editingUnit?.id ?? newId('unit'), name: values.name.trim(), code: values.code.trim().toUpperCase(), parentId: editingUnit?.parentId === null ? null : values.parentId }
    const units = editingUnit ? data.units.map((item) => item.id === editingUnit.id ? unit : item) : [...data.units, unit]
    persist({ ...data, units }, editingUnit ? '部门信息已更新' : '下级部门已创建')
    setSelectedId(unit.id); setUnitDrawer(false)
  }

  const saveMember = async () => {
    if (!data || !canManage) return
    const values = await memberForm.validateFields()
    if (data.members.some((member) => member.employeeNo.toLowerCase() === values.employeeNo.trim().toLowerCase() && member.id !== editingMember?.id)) {
      memberForm.setFields([{ name: 'employeeNo', errors: ['员工编号已存在'] }]); return
    }
    const member: OrganizationMember = { ...values, id: editingMember?.id ?? newId('member'), name: values.name.trim(), employeeNo: values.employeeNo.trim().toUpperCase(), email: values.email.trim() }
    const members = editingMember ? data.members.map((item) => item.id === editingMember.id ? member : item) : [...data.members, member]
    persist({ ...data, members }, editingMember ? '成员信息已更新' : '组织成员已添加')
    setSelectedId(member.departmentId); setMemberDrawer(false)
  }

  const restoreDefaults = () => {
    Modal.confirm({ title: '恢复预设组织架构？', content: '当前浏览器中新增或修改的组织与成员将恢复为业务预设结构。', okText: '恢复预设', cancelText: '取消',
      onOk: () => { try { const next = resetOrganization(); setState({ data: next, error: '' }); setSelectedId(next.units.find((unit) => unit.parentId === null)?.id ?? ''); messageApi.success('已恢复预设组织架构') } catch (cause) { messageApi.error(cause instanceof Error ? cause.message : '恢复失败。') } },
    })
  }

  if (!data) return <Alert type="error" showIcon title="组织架构不可用" description={state.error} action={<Button onClick={() => setState(loadState())}>重新读取</Button>} />

  const columns = [
    { title: '成员', key: 'member', render: (_: unknown, member: OrganizationMember) => <Space><UserOutlined /><div><Typography.Text strong>{member.name}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{member.employeeNo}</Typography.Text></div></Space> },
    { title: '角色', dataIndex: 'role', render: (role: OrganizationMemberRole) => <Tag color={role === 'bd' ? 'blue' : role === 'admin' || role === 'superadmin' ? 'purple' : 'cyan'}>{ROLE_LABELS[role]}</Tag> },
    { title: '负责站点', dataIndex: 'sites', render: (sites: OrganizationSite[]) => <Space size={[0, 4]} wrap>{sites.map((site) => <Tag key={site}>{site}</Tag>)}</Space> },
    { title: '邮箱', dataIndex: 'email', responsive: ['lg' as const] },
    { title: '状态', dataIndex: 'status', render: (status: OrganizationStatus) => <Tag color={status === 'enabled' ? 'green' : 'default'}>{STATUS_LABELS[status]}</Tag> },
    { title: '操作', key: 'action', render: (_: unknown, member: OrganizationMember) => <Button type="link" size="small" icon={<EditOutlined />} disabled={!canManage} onClick={() => openMember(member)}>编辑</Button> },
  ]

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    {messageContext}
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <div><Typography.Title level={4} style={{ margin: 0 }}>组织架构管理</Typography.Title><Typography.Text type="secondary">管理业务部门、站点范围、负责人及后台成员归属</Typography.Text></div>
      <Space><Button icon={<ReloadOutlined />} disabled={!canManage} onClick={restoreDefaults}>恢复预设</Button><Button type="primary" icon={<PlusOutlined />} disabled={!canManage || !selectedUnit} onClick={() => openUnit()}>新增下级部门</Button></Space>
    </Space>
    <Alert type="info" showIcon title="组织与业务数据范围" description="招商团队按站点承接活动和峰会线索；BD 专属入驻表单及卖家归属与成员身份绑定。成员停用后保留历史数据，不再参与新线索和任务分配。" />
    {!canManage && <Alert type="warning" showIcon title="当前身份仅可查看组织架构" description="只有具备系统管理权限的管理员可以调整部门和成员。" />}
    <Row gutter={[16, 16]}>
      <Col xs={12} md={6}><Card size="small"><Statistic title="组织单元" value={data.units.length} prefix={<ApartmentOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card size="small"><Statistic title="在职成员" value={data.members.filter((member) => member.status === 'enabled').length} prefix={<TeamOutlined />} /></Card></Col>
      <Col xs={12} md={6}><Card size="small"><Statistic title="招商经理" value={data.members.filter((member) => member.role === 'bd' && member.status === 'enabled').length} /></Card></Col>
      <Col xs={12} md={6}><Card size="small"><Statistic title="覆盖站点" value="US · CA · MX" /></Card></Col>
    </Row>
    <Row gutter={[16, 16]} align="stretch">
      <Col xs={24} lg={7}>
        <Card title="组织树" styles={{ body: { minHeight: 470 } }}>
          <Tree blockNode defaultExpandAll selectedKeys={selectedUnit ? [selectedUnit.id] : []} treeData={treeData} onSelect={(keys) => { if (keys[0]) setSelectedId(String(keys[0])) }} />
        </Card>
      </Col>
      <Col xs={24} lg={17}>
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Card title={selectedUnit?.name ?? '部门信息'} extra={<Button icon={<EditOutlined />} disabled={!canManage || !selectedUnit} onClick={() => selectedUnit && openUnit(selectedUnit)}>编辑部门</Button>}>
            {selectedUnit && <Descriptions size="small" column={{ xs: 1, sm: 2 }} items={[
              { key: 'code', label: '部门编码', children: selectedUnit.code },
              { key: 'type', label: '组织类型', children: TYPE_LABELS[selectedUnit.type] },
              { key: 'leader', label: '负责人', children: memberName(selectedUnit.leaderId) },
              { key: 'sites', label: '负责站点', children: <Space size={[0, 4]} wrap>{selectedUnit.sites.map((site) => <Tag color="blue" key={site}>{site}</Tag>)}</Space> },
              { key: 'status', label: '状态', children: <Tag color={selectedUnit.status === 'enabled' ? 'green' : 'default'}>{STATUS_LABELS[selectedUnit.status]}</Tag> },
              { key: 'description', label: '职责', span: 'filled', children: selectedUnit.description || '未填写' },
            ]} />}
          </Card>
          <Card title={`部门成员（${members.length}）`} extra={<Button type="primary" icon={<PlusOutlined />} disabled={!canManage || !selectedUnit} onClick={() => openMember()}>添加成员</Button>}>
            <Space wrap style={{ marginBottom: 16 }}>
              <Input allowClear prefix={<SearchOutlined />} placeholder="姓名 / 工号 / 邮箱" value={search} onChange={(event) => setSearch(event.target.value)} style={{ width: 220 }} />
              <Select allowClear placeholder="成员角色" value={roleFilter} onChange={setRoleFilter} style={{ width: 140 }} options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} />
              <Select allowClear placeholder="状态" value={statusFilter} onChange={setStatusFilter} style={{ width: 120 }} options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} />
            </Space>
            <Table rowKey="id" columns={columns} dataSource={members} pagination={{ pageSize: 8, hideOnSinglePage: true }} scroll={{ x: 760 }} />
          </Card>
        </Space>
      </Col>
    </Row>

    <Drawer title={editingUnit ? '编辑部门' : '新增下级部门'} open={unitDrawer} onClose={() => setUnitDrawer(false)} size={520}
      extra={<Button type="primary" disabled={!canManage} onClick={() => void saveUnit()}>保存</Button>} destroyOnHidden>
      <Form form={unitForm} layout="vertical">
        <Form.Item label="部门名称" name="name" rules={[{ required: true, whitespace: true, message: '请输入部门名称' }]}><Input maxLength={50} /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="部门编码" name="code" rules={[{ required: true, whitespace: true, message: '请输入部门编码' }, { pattern: /^[A-Za-z0-9-]+$/, message: '仅支持字母、数字和连字符' }]}><Input maxLength={30} /></Form.Item></Col><Col span={12}><Form.Item label="组织类型" name="type" rules={[{ required: true }]}><Select options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))} /></Form.Item></Col></Row>
        <Form.Item label="上级部门" name="parentId" rules={[{ required: editingUnit?.parentId !== null, message: '请选择上级部门' }]}><Select disabled={editingUnit?.parentId === null} options={data.units.filter((unit) => !unavailableParentIds.has(unit.id)).map((unit) => ({ value: unit.id, label: unit.name }))} /></Form.Item>
        <Form.Item label="负责站点" name="sites" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个站点' }]}><Select mode="multiple" options={SITE_OPTIONS} /></Form.Item>
        <Form.Item label="部门负责人" name="leaderId"><Select allowClear showSearch optionFilterProp="label" options={data.members.filter((member) => member.status === 'enabled').map((member) => ({ value: member.id, label: `${member.name} · ${member.employeeNo}` }))} /></Form.Item>
        <Form.Item label="状态" name="status" rules={[{ required: true }]}><Select options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} /></Form.Item>
        <Form.Item label="部门职责" name="description"><Input.TextArea rows={4} maxLength={300} showCount /></Form.Item>
      </Form>
    </Drawer>

    <Drawer title={editingMember ? '编辑组织成员' : '添加组织成员'} open={memberDrawer} onClose={() => setMemberDrawer(false)} size={520}
      extra={<Button type="primary" disabled={!canManage} onClick={() => void saveMember()}>保存</Button>} destroyOnHidden>
      <Form form={memberForm} layout="vertical">
        <Row gutter={16}><Col span={12}><Form.Item label="姓名" name="name" rules={[{ required: true, whitespace: true, message: '请输入姓名' }]}><Input maxLength={40} /></Form.Item></Col><Col span={12}><Form.Item label="员工编号" name="employeeNo" rules={[{ required: true, whitespace: true, message: '请输入员工编号' }]}><Input maxLength={30} /></Form.Item></Col></Row>
        <Form.Item label="企业邮箱" name="email" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}><Input /></Form.Item>
        <Row gutter={16}><Col span={12}><Form.Item label="所属部门" name="departmentId" rules={[{ required: true }]}><Select showSearch optionFilterProp="label" options={data.units.filter((unit) => unit.status === 'enabled').map((unit) => ({ value: unit.id, label: unit.name }))} /></Form.Item></Col><Col span={12}><Form.Item label="后台角色" name="role" rules={[{ required: true }]}><Select options={Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))} /></Form.Item></Col></Row>
        <Form.Item label="负责站点" name="sites" extra="决定可查看和承接的卖家、活动及峰会线索范围" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个站点' }]}><Select mode="multiple" options={SITE_OPTIONS} /></Form.Item>
        <Form.Item label="状态" name="status" extra="停用成员保留历史归属，但不再参与新线索或任务分配" rules={[{ required: true }]}><Select options={Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label }))} /></Form.Item>
      </Form>
    </Drawer>
  </Space>
}
