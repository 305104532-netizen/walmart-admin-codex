import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Input, Modal, Space, Table, Tag, Typography, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { CopyOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons'
import PreviewIdentity from '../../components/PreviewIdentity'
import { assertCanConfigureRegistrationForm, assertCanManageOwnRegistrationForms, canConfigureRegistrationForm, canManageOwnRegistrationForms, useCurrentAdmin } from '../../models/adminAccess'
import type { PreviewUser } from '../../models/adminAccess'
import { loadRegistrationTemplate, publishRegistrationTemplate, saveRegistrationDraft, subscribeRegistrationTemplates } from '../../models/registrationTemplates'
import { createBDRegistrationForm, listBDRegistrationForms, loadBDRegistrationForm, publishBDRegistrationForm, saveBDRegistrationDraft, subscribeBDRegistrationForms } from '../../models/bdRegistrationForms'
import type { BDRegistrationForm } from '../../models/bdRegistrationForms'
import RegistrationFormEditor from './RegistrationFormEditor'
import type { RegistrationEditorAdapter } from './RegistrationFormEditor'

const STANDARD_ADAPTER: RegistrationEditorAdapter = {
  kind: 'standard',
  load: loadRegistrationTemplate,
  subscribe: subscribeRegistrationTemplates,
  assertCanModify: assertCanConfigureRegistrationForm,
  persist: (steps, _document, publish) => publish ? publishRegistrationTemplate(steps) : saveRegistrationDraft(steps),
}

type ListState = { records: BDRegistrationForm[]; error: string }
type CreateValues = { name: string; description?: string }

function assertExpectedBD(userId: string) {
  const user = assertCanManageOwnRegistrationForms()
  if (user.id !== userId) throw new Error('当前登录身份已变更，请重新打开专属表单。')
  return user
}

function readOwnForms(userId: string): ListState {
  try {
    assertExpectedBD(userId)
    return { records: listBDRegistrationForms(), error: '' }
  } catch (error) {
    return { records: [], error: error instanceof Error ? error.message : '专属表单读取失败，请重试。' }
  }
}

export default function FormConfig() {
  const user = useCurrentAdmin()
  const authorized = canConfigureRegistrationForm(user)
  const ownForms = canManageOwnRegistrationForms(user)
  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    <PreviewIdentity />
    {ownForms
      ? <BDFormWorkspace key={user.id + ':' + user.role} user={user} />
      : <RegistrationFormEditor key={user.id + ':' + user.role + ':' + authorized} adapter={STANDARD_ADAPTER} authorized={authorized} />}
  </Space>
}

function BDFormWorkspace({ user }: { user: PreviewUser }) {
  const [view, setView] = useState<'list' | 'standard' | 'personal'>('list')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [state, setState] = useState<ListState>(() => readOwnForms(user.id))
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm<CreateValues>()
  const [messageApi, messageContext] = message.useMessage()

  useEffect(() => subscribeBDRegistrationForms(() => setState(readOwnForms(user.id))), [user.id])

  const personalAdapter = useMemo<RegistrationEditorAdapter>(() => ({
    kind: 'personal',
    load: () => {
      assertExpectedBD(user.id)
      const record = selectedId ? loadBDRegistrationForm(selectedId) : undefined
      if (!record) throw new Error('专属表单不存在，或当前账号无权访问。')
      return record
    },
    subscribe: subscribeBDRegistrationForms,
    assertCanModify: () => { assertExpectedBD(user.id) },
    persist: async (steps, document, publish) => {
      assertExpectedBD(user.id)
      if (!selectedId || document.ownerId !== user.id || document.revision === undefined) throw new Error('专属表单归属或版本不正确，请重新打开。')
      return publish
        ? publishBDRegistrationForm(selectedId, steps, document.revision)
        : saveBDRegistrationDraft(selectedId, steps, document.revision)
    },
  }), [selectedId, user.id])

  const openCreate = () => {
    try {
      assertExpectedBD(user.id)
      // 在打开弹窗前检查标准表单可读；创建时模型仍会读取最新的已发布版本。
      loadRegistrationTemplate()
      form.resetFields()
      form.setFieldsValue({ name: user.name + '专属表单 ' + (state.records.length + 1), description: '' })
      setCreateOpen(true)
    } catch (error) { messageApi.error(error instanceof Error ? error.message : '无法复制标准表单。') }
  }

  const create = async () => {
    if (creating) return
    let values: CreateValues
    try { values = await form.validateFields() } catch { return }
    setCreating(true)
    try {
      assertExpectedBD(user.id)
      const record = await createBDRegistrationForm(values.name.trim(), values.description?.trim())
      assertExpectedBD(user.id)
      setCreateOpen(false)
      setState(readOwnForms(user.id))
      setSelectedId(record.id)
      setView('personal')
      messageApi.success('已创建专属表单副本，可开始修改字段。')
    } catch (error) { messageApi.error(error instanceof Error ? error.message : '创建失败，请重试。') }
    finally { setCreating(false) }
  }

  const backToList = () => { setState(readOwnForms(user.id)); setView('list'); setSelectedId(null) }
  const configure = (record: BDRegistrationForm) => {
    setSelectedId(record.id)
    setView('personal')
  }
  const columns: TableColumnsType<BDRegistrationForm> = [
    { title: '专属表单名称', dataIndex: 'name', width: 250, render: (name: string, record) => <Space orientation="vertical" size={2}>
      <Button type="link" style={{ padding: 0, height: 'auto', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => configure(record)}>{name}</Button>
      {record.description && <Typography.Text type="secondary">{record.description}</Typography.Text>}
    </Space> },
    { title: '所属 BD 经理', dataIndex: 'ownerName', width: 150 },
    { title: '状态', width: 170, render: (_: unknown, record) => <Space size={[0, 4]} wrap>
      {record.published ? <Tag color="green">已发布 v{record.published.version}</Tag> : <Tag color="orange">未发布</Tag>}
      {record.draft && <Tag color="blue">草稿 v{record.draft.version}</Tag>}
    </Space> },
    { title: '复制来源', dataIndex: 'sourceStandardVersion', width: 150, render: (version: number) => '标准表单 v' + version },
    { title: '字段数', width: 90, render: (_: unknown, record) => (record.draft ?? record.published)?.steps.reduce((sum, step) => sum + step.fields.length, 0) ?? 0 },
    { title: '更新时间', dataIndex: 'updatedAt', width: 180, render: (value: string) => new Date(value).toLocaleString('zh-CN') },
    { title: '操作', width: 110, fixed: 'right', render: (_: unknown, record) => <Button type="link" onClick={() => configure(record)}>配置字段</Button> },
  ]

  return <>
    {messageContext}
    {view === 'personal' && selectedId ? <RegistrationFormEditor key={selectedId} adapter={personalAdapter} authorized initiallyEditing onBack={backToList} />
      : view === 'standard' ? <RegistrationFormEditor adapter={STANDARD_ADAPTER} authorized={false} onBack={backToList}
        extraActions={<Button type="primary" icon={<CopyOutlined />} onClick={openCreate}>复制为我的专属表单</Button>} />
        : <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Space wrap><Typography.Title level={4} style={{ margin: 0 }}>我的专属入驻表单</Typography.Title><Tag color="blue">BD 经理 · {user.name}</Tag></Space>
            <Space wrap>
              <Button icon={<EyeOutlined />} onClick={() => setView('standard')}>查看标准表单</Button>
              <Button type="primary" icon={<CopyOutlined />} onClick={openCreate}>复制标准表单创建</Button>
            </Space>
          </Space>
          <Alert type="info" showIcon title="专属表单仅本人可配置" description="复制标准表单的已发布版本，创建自己的专属表单。可修改字段、必填规则和适用站点；修改只影响当前副本，标准表单只读，其他 BD 经理的表单独立保存。" />
          <Typography.Text type="secondary">本地预览：当前按账号 ID 区分专属表单，尚未接入真实账号和服务端鉴权。</Typography.Text>
          {state.error ? <Alert type="error" showIcon title="专属表单读取失败" description={state.error} action={<Button icon={<ReloadOutlined />} onClick={() => setState(readOwnForms(user.id))}>重试</Button>} />
            : <Card size="small" title={'我的表单（' + state.records.length + '）'}>
              <Table rowKey="id" columns={columns} dataSource={state.records} pagination={{ pageSize: 10, hideOnSinglePage: true }} scroll={{ x: 1200 }} locale={{ emptyText: <Space orientation="vertical" size={12} style={{ padding: 20 }}>
                <Typography.Text type="secondary">还没有专属表单，从标准表单复制一份开始配置。</Typography.Text>
                <Button type="primary" icon={<CopyOutlined />} onClick={openCreate}>创建第一份专属表单</Button>
              </Space> }} />
            </Card>}
        </Space>}
    <Modal title="复制标准表单创建专属表单" open={createOpen} onCancel={() => { if (!creating) setCreateOpen(false) }} onOk={() => void create()}
      okText="创建并配置字段" cancelText="取消" confirmLoading={creating} cancelButtonProps={{ disabled: creating }} closable={!creating} mask={{ closable: !creating }} destroyOnHidden>
      <Alert type="info" showIcon title="复制已发布标准表单" description="复制包含全部字段、适用站点及校验规则；不包含标准表单的未发布草稿。副本归属于当前 BD 经理。" style={{ marginBottom: 16 }} />
      <Form form={form} layout="vertical">
        <Form.Item label="专属表单名称" name="name" rules={[{ required: true, whitespace: true, message: '请输入专属表单名称' }]}><Input maxLength={80} /></Form.Item>
        <Form.Item label="备注" name="description"><Input.TextArea rows={3} maxLength={300} showCount /></Form.Item>
      </Form>
    </Modal>
  </>
}
