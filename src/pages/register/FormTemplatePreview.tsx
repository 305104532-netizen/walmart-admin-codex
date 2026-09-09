import { useState } from 'react'
import { Button, Card, Col, Empty, Form, Input, Modal, Radio, Row, Select, Space, Steps, Tag, Typography } from 'antd'
import { LockOutlined, UploadOutlined } from '@ant-design/icons'
import { SITE_OPTIONS, filterRegistrationSteps } from '../../models/registrationTemplates'
import type { RegistrationSite, RegistrationStep } from '../../models/registrationTemplates'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  steps: RegistrationStep[]
}
type RegistrationField = RegistrationStep['fields'][number]

const VALIDATION_LABELS: Record<string, string> = {
  phone: '手机号格式', email: '邮箱格式', uscc: '统一社会信用代码 18 位', idcard: '身份证号码 18 位',
}

function FieldControl({ field }: { field: RegistrationField }) {
  const placeholder = field.placeholder || `请输入${field.label}`
  if (field.type === 'upload') return <Space orientation="vertical" size={4}>
    <Button disabled icon={<UploadOutlined />}>上传图片</Button>
    <Typography.Text type="secondary" style={{ fontSize: 12 }}>预览中不可上传文件</Typography.Text>
  </Space>
  if (field.type === 'select') return <Select
    disabled
    style={{ width: '100%' }}
    placeholder={field.placeholder || `请选择${field.label}`}
    options={Array.isArray(field.options) ? field.options.map(option => ({ label: option, value: option })) : []}
  />
  if (field.sensitive) return <Input.Password disabled visibilityToggle={false} placeholder={placeholder} />
  return <Input disabled type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'} placeholder={placeholder} />
}

function FieldNotes({ field }: { field: RegistrationField }) {
  const validation = field.validate && typeof VALIDATION_LABELS[field.validate] === 'string' ? VALIDATION_LABELS[field.validate] : ''
  const options = field.type === 'select' && Array.isArray(field.options) ? field.options : []
  const applicableSites = Array.isArray(field.applicableSites) ? field.applicableSites : SITE_OPTIONS.map(option => option.value)
  return <Space orientation="vertical" size={2} style={{ fontSize: 12, lineHeight: 1.6, width: '100%', overflowWrap: 'anywhere' }}>
    {field.en && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{field.en}</Typography.Text>}
    <Space size={[4, 4]} wrap>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>适用站点：</Typography.Text>
      {SITE_OPTIONS.filter(option => applicableSites.includes(option.value)).map(option => <Tag key={option.value}>{option.value}</Tag>)}
    </Space>
    {field.showIf && <Typography.Text type="secondary" style={{ fontSize: 12 }}>显示条件：{field.showIf}</Typography.Text>}
    {validation && <Typography.Text type="secondary" style={{ fontSize: 12 }}>校验规则：{validation}</Typography.Text>}
    {field.type === 'select' && <Typography.Text type="secondary" style={{ fontSize: 12 }}>
      {options.length ? `预设选项：${options.join('、')}` : '暂无预设选项'}
    </Typography.Text>}
    {field.sensitive && <Typography.Text type="secondary" style={{ fontSize: 12 }}>敏感信息，确认页脱敏展示</Typography.Text>}
  </Space>
}

export default function FormTemplatePreview(props: Props) {
  return props.open ? <PreviewContent key={props.title + JSON.stringify(props.steps)} {...props} /> : null
}

function PreviewContent({ open, onClose, title, steps }: Props) {
  const [activeStep, setActiveStep] = useState(0)
  const [previewSite, setPreviewSite] = useState<RegistrationSite>('US')

  const previewSteps = filterRegistrationSteps(steps, previewSite)
  const activeIndex = Math.max(0, Math.min(activeStep, previewSteps.length - 1))
  const currentStep = previewSteps[activeIndex]
  const fields = currentStep?.fields ?? []
  const isConfirmation = Boolean(currentStep && (currentStep.id === 'confirm' || currentStep.name.includes('确认提交')))

  return <Modal
    title={`${title} · 表单预览`}
    open={open}
    onCancel={onClose}
    footer={<Button onClick={onClose}>关闭预览</Button>}
    width="min(900px, calc(100vw - 32px))"
    destroyOnHidden
    styles={{ body: { maxHeight: '72vh', overflowY: 'auto', paddingRight: 4 } }}
  >
    <Typography.Paragraph type="secondary" style={{ margin: '4px 0 20px' }}>
      只读预览，用于核对所选站点的表单结构；不会采集信息或提交申请。适用当前站点的条件字段会展示，并标注显示条件。
    </Typography.Paragraph>

    <Space wrap size={12} style={{ marginBottom: 20 }}>
      <Typography.Text strong>预览站点</Typography.Text>
      <Radio.Group
        aria-label="预览站点"
        value={previewSite}
        options={SITE_OPTIONS}
        onChange={event => {
          const nextSite = event.target.value as RegistrationSite
          if (SITE_OPTIONS.some(option => option.value === nextSite)) setPreviewSite(nextSite)
        }}
      />
    </Space>

    {!previewSteps.length ? <Empty description="暂无预设步骤" /> : <>
      <Steps
        size="small"
        responsive
        current={activeIndex}
        onChange={setActiveStep}
        items={previewSteps.map(step => ({ key: step.id, title: step.name }))}
        style={{ marginBottom: 24 }}
      />

      <Card
        size="small"
        title={currentStep?.name || '表单内容'}
        extra={<Tag>只读预览</Tag>}
        styles={{ body: { padding: 20 } }}
      >
        {isConfirmation ? <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            此步骤用于核对前面填写的联系人、企业及经营信息，并确认提交入驻申请。
          </Typography.Paragraph>
          <Typography.Text type="secondary">正式填写时，敏感信息将在确认页脱敏展示。当前预览不包含卖家填写的数据。</Typography.Text>
          <Button type="primary" disabled>确认提交</Button>
        </Space> : fields.length ? <Form component="div" layout="vertical" disabled>
          <Row gutter={[24, 0]}>
            {fields.map(field => <Col key={field.key} xs={24} sm={12}>
              <Form.Item
                required={field.required}
                label={<Space size={6} wrap>
                  <span>{field.label}</span>
                  {!field.required && <Tag>选填</Tag>}
                  {field.sensitive && <Tag color="orange" icon={<LockOutlined />}>敏感</Tag>}
                </Space>}
                extra={<FieldNotes field={field} />}
              >
                <FieldControl field={field} />
              </Form.Item>
            </Col>)}
          </Row>
        </Form> : <Empty description="该站点在此步骤暂无适用字段" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
      </Card>

      <Space style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
        <Button disabled={activeIndex === 0} onClick={() => setActiveStep(Math.max(0, activeIndex - 1))}>上一步</Button>
        <Typography.Text type="secondary">第 {activeIndex + 1} / {previewSteps.length} 步</Typography.Text>
        <Button disabled={activeIndex >= previewSteps.length - 1} onClick={() => setActiveStep(Math.min(previewSteps.length - 1, activeIndex + 1))}>下一步</Button>
      </Space>
    </>}
  </Modal>
}
