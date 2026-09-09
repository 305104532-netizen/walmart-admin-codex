import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Alert, Button, Card, Checkbox, Col, Form, Input, Modal, Row, Select, Space, Switch, Table, Tag, Typography, message } from 'antd'
import type { TableColumnsType } from 'antd'
import { ArrowLeftOutlined, EditOutlined, EyeOutlined, LockOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, UndoOutlined } from '@ant-design/icons'
import { ALL_SITES, FIELD_TYPES, SITE_OPTIONS, VALIDATE_RULES, getStandardTemplate, validateRegistrationSteps } from '../../models/registrationTemplates'
import type { RegistrationField, RegistrationSite, RegistrationStep, TemplateRevision } from '../../models/registrationTemplates'
import FormTemplatePreview from './FormTemplatePreview'

export interface RegistrationEditorDocument {
  published?: TemplateRevision
  draft?: TemplateRevision
  migrationNotice?: string
  revision?: number
  ownerId?: string
  name?: string
  sourceStandardVersion?: number
}

export interface RegistrationEditorAdapter {
  kind: 'standard' | 'personal'
  load: () => RegistrationEditorDocument
  subscribe: (listener: () => void) => () => void
  assertCanModify: () => void
  persist: (steps: RegistrationStep[], document: RegistrationEditorDocument, publish: boolean) => RegistrationEditorDocument | Promise<RegistrationEditorDocument>
}

type Props = {
  adapter: RegistrationEditorAdapter
  authorized: boolean
  initiallyEditing?: boolean
  onBack?: () => void
  extraActions?: ReactNode
}
type Loaded = { template?: RegistrationEditorDocument; error: string }
type WorkingCopy = { steps: RegistrationStep[]; baseToken: string; dirty: boolean }
type FieldEditor = { stepId: string; originalKey?: string }
type FieldValues = RegistrationField & { optionsText?: string }
const cloneSteps = (steps: RegistrationStep[]) => structuredClone(steps)
const token = (value: RegistrationEditorDocument) => JSON.stringify(value)

export default function RegistrationFormEditor({ adapter, authorized, initiallyEditing = false, onBack, extraActions }: Props) {
  const readTemplate = (): Loaded => {
    try { return { template: adapter.load(), error: '' } }
    catch (error) { return { error: error instanceof Error ? error.message : '表单配置读取失败，请重试。' } }
  }
  const [loaded, setLoaded] = useState<Loaded>(readTemplate)
  const [working, setWorking] = useState<WorkingCopy | null>(() => {
    const document = loaded.template
    const revision = document?.draft ?? document?.published
    return initiallyEditing && authorized && document && revision
      ? { steps: cloneSteps(revision.steps), baseToken: token(document), dirty: false } : null
  })
  const [busy, setBusy] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [fieldEditor, setFieldEditor] = useState<FieldEditor | null>(null)
  const [preview, setPreview] = useState(false)
  const [form] = Form.useForm<FieldValues>()
  const fieldType = Form.useWatch('type', form)
  const [messageApi, messageContext] = message.useMessage()
  const [modal, modalContext] = Modal.useModal()

  useEffect(() => adapter.subscribe(() => {
    try { setLoaded({ template: adapter.load(), error: '' }) }
    catch (error) { setLoaded({ error: error instanceof Error ? error.message : '表单配置读取失败，请重试。' }) }
  }), [adapter])

  const current: RegistrationEditorDocument = loaded.template ?? {
    published: { steps: getStandardTemplate(), version: 1, updatedAt: null, updatedBy: '系统预设' },
  }
  const canModify = authorized && !loaded.error
  const editing = canModify && working !== null
  const personal = adapter.kind === 'personal'
  const displayRevision = current.published ?? current.draft!
  const formName = personal ? current.name ?? 'BD 专属表单' : '标准入驻表单'
  const steps = editing ? working.steps : displayRevision.steps
  const step = steps[stepIndex] ?? steps[0]
  const changedElsewhere = editing && working.baseToken !== token(current)
  const allFields = steps.flatMap(group => group.fields)

  const notifyError = (error: unknown) => messageApi.error(error instanceof Error ? error.message : '操作失败，请重试。')
  const checkEditing = () => {
    try {
      adapter.assertCanModify()
      if (busy) throw new Error('正在保存，请稍后操作。')
      if (!working || !canModify) throw new Error('请先进入表单修改模式。')
      if (token(adapter.load()) !== working.baseToken) throw new Error('表单已在其他页面更新，请退出修改后重新加载，避免覆盖新配置。')
      return true
    } catch (error) { notifyError(error); return false }
  }
  const beginEditing = () => {
    try {
      adapter.assertCanModify()
      const state = adapter.load()
      setLoaded({ template: state, error: '' })
      setWorking({ steps: cloneSteps((state.draft ?? state.published!).steps), baseToken: token(state), dirty: false })
      setStepIndex(0)
      setFieldEditor(null)
    } catch (error) { notifyError(error) }
  }
  const finishEditing = () => { setWorking(null); setFieldEditor(null); setStepIndex(0) }
  const confirmLeave = (action: () => void) => {
    if (working?.dirty) {
      modal.confirm({ title: '放弃当前未保存的修改？', content: '已保存的草稿和已发布表单会保留。', okText: '放弃修改', cancelText: '继续修改', onOk: action })
    } else action()
  }
  const openField = (field?: RegistrationField) => {
    if (!checkEditing() || !step || step.id === 'confirmation') return
    setFieldEditor({ stepId: step.id, originalKey: field?.key })
    form.resetFields()
    let index = allFields.length + 1
    while (allFields.some(item => item.key === 'field' + index)) index += 1
    form.setFieldsValue(field ? { ...field, optionsText: field.options?.join('\n') } : {
      key: 'field' + index, label: '', en: '', type: 'text', required: false, sensitive: false, validate: 'none', applicableSites: [...ALL_SITES],
    })
  }
  const saveField = async () => {
    if (!checkEditing() || !fieldEditor || !working) return
    let values: FieldValues
    try { values = await form.validateFields() } catch { return }
    if (!checkEditing()) return
    const { optionsText, ...input } = values
    const field: RegistrationField = {
      ...input,
      key: fieldEditor.originalKey ?? input.key.trim(),
      label: input.label.trim(),
      en: input.en.trim(),
      applicableSites: ALL_SITES.filter(site => input.applicableSites.includes(site)),
      required: Boolean(input.required),
      sensitive: Boolean(input.sensitive),
      showIf: input.showIf?.trim() || undefined,
      placeholder: input.placeholder?.trim() || undefined,
      options: input.type === 'select' ? [...new Set((optionsText ?? '').split('\n').map(value => value.trim()).filter(Boolean))] : undefined,
    }
    const nextSteps = working.steps.map(group => group.id !== fieldEditor.stepId ? group : {
      ...group, fields: fieldEditor.originalKey
        ? group.fields.map(item => item.key === fieldEditor.originalKey ? field : item)
        : [...group.fields, field],
    })
    try { validateRegistrationSteps(nextSteps) } catch (error) { notifyError(error); return }
    setWorking({ ...working, steps: nextSteps, dirty: true })
    setFieldEditor(null)
    messageApi.success('字段已更新，请保存草稿或发布修改。')
  }
  const removeField = (field: RegistrationField) => {
    if (!checkEditing()) return
    const references = allFields.filter(item => item.showIf?.split('=')[0].trim() === field.key)
    if (references.length) {
      messageApi.warning('该字段被“' + references.map(item => item.label).join('、') + '”的显示条件引用，请先修改关联条件。')
      return
    }
    modal.confirm({
      title: '删除字段“' + field.label + '”？',
      content: '删除仅作用于当前修改，发布后才会更新已发布表单。',
      okText: '删除字段', cancelText: '取消', okButtonProps: { danger: true },
      onOk: () => {
        if (!checkEditing()) return
        setWorking(value => value ? { ...value, dirty: true, steps: value.steps.map(group => ({
          ...group, fields: group.fields.filter(item => item.key !== field.key),
        })) } : value)
      },
    })
  }
  const restoreStandard = () => {
    if (!checkEditing()) return
    modal.confirm({
      title: '恢复统一入驻表单系统预设？',
      content: '当前修改将替换为三站字段并集，所有字段的适用站点恢复为 US、CA、MX 全选。保存草稿或发布后生效。',
      okText: '恢复到当前修改', cancelText: '取消',
      onOk: () => {
        if (!checkEditing()) return
        setWorking(value => value ? { ...value, steps: getStandardTemplate(), dirty: true } : value)
        setFieldEditor(null)
        setStepIndex(0)
      },
    })
  }
  const persist = async (publish: boolean) => {
    if (!checkEditing() || !working) return
    setBusy(true)
    try {
      const saved = await adapter.persist(working.steps, current, publish)
      setLoaded({ template: saved, error: '' })
      if (publish) {
        finishEditing()
        messageApi.success(formName + '已发布，版本 v' + saved.published!.version)
      } else {
        setWorking({ steps: cloneSteps((saved.draft ?? saved.published!).steps), baseToken: token(saved), dirty: false })
        messageApi.success(formName + '草稿已保存' + (saved.published ? '，已发布表单未变更。' : '，发布后生效。'))
      }
    } catch (error) { notifyError(error) }
    finally { setBusy(false) }
  }

  const columns: TableColumnsType<RegistrationField> = [
    { title: '字段名称', dataIndex: 'label', width: 170 },
    { title: '适用站点', dataIndex: 'applicableSites', width: 175, render: (sites: RegistrationSite[]) => <Space size={[0, 4]} wrap>{sites.map(site => <Tag key={site} color="blue">{site}</Tag>)}</Space> },
    { title: '字段标识', dataIndex: 'key', width: 165, render: (value: string) => <Typography.Text code>{value}</Typography.Text> },
    { title: '英文名称', dataIndex: 'en', ellipsis: true, width: 220 },
    { title: '类型', dataIndex: 'type', width: 95, render: (value: string) => FIELD_TYPES.find(item => item.value === value)?.label ?? value },
    { title: '必填', dataIndex: 'required', width: 70, render: (value: boolean) => <Tag color={value ? 'red' : 'default'}>{value ? '必填' : '选填'}</Tag> },
    { title: '敏感', dataIndex: 'sensitive', width: 70, render: (value?: boolean) => value ? <Tag color="orange">脱敏</Tag> : '—' },
    { title: '显示条件', dataIndex: 'showIf', width: 155, render: (value?: string) => value || '始终显示' },
    ...(editing ? [{ title: '操作', key: 'actions', width: 125, fixed: 'right' as const, render: (_: unknown, field: RegistrationField) => <Space size={0}>
      <Button type="link" size="small" disabled={changedElsewhere || busy} onClick={() => openField(field)}>编辑</Button>
      <Button type="link" size="small" danger disabled={changedElsewhere || busy} onClick={() => removeField(field)}>删除</Button>
    </Space> }] : []),
  ]

  return <Space orientation="vertical" size={16} style={{ width: '100%' }}>
    {messageContext}{modalContext}
    <Space wrap style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Space wrap>
        <Typography.Title level={4} style={{ margin: 0 }}>{formName}</Typography.Title>
        <Tag color={authorized ? 'blue' : 'default'} icon={authorized ? <EditOutlined /> : <LockOutlined />}>{authorized ? personal ? 'BD 专属 · 仅本人可修改' : '管理员 · 已授权修改' : '标准表单只读'}</Tag>
      </Space>
      <Space wrap>
        {onBack && <Button icon={<ArrowLeftOutlined />} disabled={busy} onClick={() => confirmLeave(onBack)}>我的专属表单</Button>}
        {extraActions}
        <Button icon={<EyeOutlined />} disabled={!!loaded.error} onClick={() => setPreview(true)}>预览表单</Button>
        {editing ? <>
          <Button disabled={busy} onClick={() => confirmLeave(finishEditing)}>退出修改</Button>
          {!personal && <Button icon={<UndoOutlined />} onClick={restoreStandard} disabled={changedElsewhere || busy}>恢复系统预设</Button>}
          <Button icon={<SaveOutlined />} loading={busy} onClick={() => void persist(false)} disabled={changedElsewhere || busy}>保存草稿</Button>
          <Button type="primary" loading={busy} onClick={() => void persist(true)} disabled={changedElsewhere || busy}>发布修改</Button>
        </> : canModify && <Button type="primary" icon={<EditOutlined />} onClick={beginEditing}>{current.draft ? '继续编辑草稿' : '修改表单'}</Button>}
      </Space>
    </Space>
    <Alert type={authorized ? 'info' : 'warning'} showIcon title={personal ? 'BD 经理专属表单' : '标准入驻表单 · 三站字段并集'} description={personal
      ? '此表单仅属于当前 BD 经理。可修改字段和适用站点，保存与发布只更新当前专属表单，不影响标准表单或其他经理的表单。'
      : authorized ? '统一管理 US、CA、MX 入驻字段。字段默认适用全部站点，可编辑适用站点；BD 经理只能复制已发布标准表单，不能修改标准表单。'
      : '标准表单仅供查看和预览。BD 经理可复制已发布标准表单，创建并修改自己的专属表单。'} />
    <Typography.Text type="secondary">本地预览：表单配置及角色授权仅保存在当前浏览器，尚未接入真实账号和服务端鉴权。</Typography.Text>
    {loaded.error && <Alert type="error" showIcon title="表单配置读取失败，已暂停修改" description={loaded.error} action={<Button icon={<ReloadOutlined />} onClick={() => setLoaded(readTemplate())}>重试</Button>} />}
    {current.migrationNotice && !loaded.error && <Alert type="info" showIcon title="旧表单配置已合并" description={current.migrationNotice} />}
    {!loaded.error && <><Space wrap>
      <Typography.Text strong>{formName}</Typography.Text>
      <Tag color={!current.published ? 'orange' : current.published.updatedAt === null ? 'blue' : 'green'}>{!current.published ? '未发布草稿' : current.published.updatedAt === null ? '系统预设' : '已发布配置'} v{displayRevision.version}</Tag>
      {personal && <Tag>复制自标准表单 v{current.sourceStandardVersion}</Tag>}
      {editing && <Tag color="orange">{working.dirty ? '有未保存修改' : current.draft ? '草稿已保存' : '修改中'}</Tag>}
      <Typography.Text type="secondary">{steps.length} 个固定步骤 · {allFields.length} 个字段</Typography.Text>
      {SITE_OPTIONS.map(option => <Tag key={option.value}>{option.value}：{allFields.filter(field => field.applicableSites.includes(option.value)).length} 个字段</Tag>)}
      {current.published?.updatedAt && <Typography.Text type="secondary">发布于 {new Date(current.published.updatedAt).toLocaleString('zh-CN')} · {current.published.updatedBy}</Typography.Text>}
    </Space>
    {!editing && canModify && current.draft && <Alert type="info" showIcon title={'有待发布草稿 v' + current.draft.version} description={current.published ? '当前展示已发布表单，可继续编辑草稿后发布。' : '当前为新建副本，编辑并发布后生效。'} />}
    {changedElsewhere && <Alert type="warning" showIcon title="配置已在其他页面更新" description="为避免覆盖新配置，请退出修改后重新进入。当前内容可通过预览查看。" />}
    <Row gutter={[16, 16]}>
      <Col xs={24} md={6} xl={5}>
        <Card title="固定步骤分组" size="small" styles={{ body: { padding: 8 } }}>
          <Space orientation="vertical" size={4} style={{ width: '100%' }}>
            {steps.map((group, index) => <Button key={group.id} block type={group.id === step?.id ? 'primary' : 'text'} onClick={() => setStepIndex(index)} style={{ textAlign: 'left', height: 'auto', whiteSpace: 'normal', padding: '10px 12px' }}>
              {index + 1}. {group.name}（{group.fields.length}）
            </Button>)}
          </Space>
        </Card>
      </Col>
      <Col xs={24} md={18} xl={19}>
        <Card title={'字段列表 · ' + (step?.name ?? '')} size="small" extra={editing && step?.id !== 'confirmation' && <Button type="primary" size="small" icon={<PlusOutlined />} disabled={changedElsewhere || busy} onClick={() => openField()}>新增字段</Button>}>
          {step?.id === 'confirmation'
            ? <Alert type="info" title="确认提交" description="系统固定的最终确认步骤，不配置业务字段。" showIcon />
            : <Table rowKey="key" columns={columns} dataSource={step?.fields ?? []} pagination={false} size="small" scroll={{ x: editing ? 1345 : 1220 }} locale={{ emptyText: '当前步骤暂无字段' }} />}
        </Card>
      </Col>
    </Row></>}
    <Modal title={fieldEditor?.originalKey ? '编辑字段' : '新增字段'} open={editing && !!fieldEditor} onCancel={() => setFieldEditor(null)} onOk={() => void saveField()} okText="应用到当前修改" cancelText="取消" okButtonProps={{ disabled: changedElsewhere || busy }} destroyOnHidden width={600}>
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}><Form.Item label="字段名称（中文）" name="label" rules={[{ required: true, whitespace: true, message: '请输入字段名称' }]}><Input maxLength={80} /></Form.Item></Col>
          <Col span={12}><Form.Item label="英文名称" name="en" rules={[{ required: true, whitespace: true, message: '请输入英文名称' }]}><Input maxLength={150} /></Form.Item></Col>
        </Row>
        <Form.Item label="字段标识" name="key" extra="字段标识用于关联配置，创建后不可修改。" rules={[
          { required: true, pattern: /^[A-Za-z][A-Za-z0-9_]*$/, message: '请使用字母开头的字母、数字或下划线' },
          { validator: (_, value: string) => !allFields.some(field => field.key === value && field.key !== fieldEditor?.originalKey) ? Promise.resolve() : Promise.reject(new Error('字段标识已存在')) },
        ]}><Input disabled={!!fieldEditor?.originalKey} maxLength={80} /></Form.Item>
        <Form.Item label="适用站点" name="applicableSites" extra="默认全选，至少选择一个站点。未勾选的站点不展示此字段。" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一个适用站点' }]}><Checkbox.Group options={SITE_OPTIONS} /></Form.Item>
        <Form.Item label="字段类型" name="type" rules={[{ required: true, message: '请选择字段类型' }]}><Select options={FIELD_TYPES} /></Form.Item>
        {fieldType === 'select' && <Form.Item label="下拉选项" name="optionsText" extra="每行一个选项；未自定义时沿用业务字典。"><Input.TextArea rows={3} placeholder="输入选项，每行一个" /></Form.Item>}
        <Form.Item label="占位提示" name="placeholder"><Input maxLength={200} /></Form.Item>
        <Form.Item label="校验规则" name="validate"><Select options={VALIDATE_RULES} /></Form.Item>
        <Form.Item label="条件显示" name="showIf" rules={[{ validator: (_, value?: string) => {
          if (!value?.trim()) return Promise.resolve()
          const match = value.trim().match(/^([A-Za-z][A-Za-z0-9_]*)=(.+)$/)
          return match && match[1] !== form.getFieldValue('key') && allFields.some(field => field.key === match[1])
            ? Promise.resolve() : Promise.reject(new Error('请使用已存在的其他字段标识=值，例如 hasUSAccount=是'))
        } }]}><Input maxLength={200} placeholder="如 hasUSAccount=是，留空则始终显示" /></Form.Item>
        <Space size={40}>
          <Form.Item label="是否必填" name="required" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="敏感字段（脱敏）" name="sensitive" valuePropName="checked"><Switch /></Form.Item>
        </Space>
      </Form>
    </Modal>
    <FormTemplatePreview open={preview && !loaded.error} onClose={() => setPreview(false)} title={formName + (editing ? '（当前修改）' : current.published ? '（已发布）' : '（草稿）')} steps={steps} />
  </Space>
}
