import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, Divider, Form, Input, InputNumber, Radio, Row, Select, Switch, Typography } from 'antd'
import ActivityMediaField from './ActivityMediaField'

const { Text } = Typography
const tagsProps = { mode: 'tags' as const, tokenSeparators: [',', '，'], style: { width: '100%' } }
const fieldTypes = [
  { value: 'text', label: '单行文本' }, { value: 'textarea', label: '多行文本' },
  { value: 'mobile', label: '手机号' }, { value: 'email', label: '邮箱' },
  { value: 'select', label: '单选' }, { value: 'multiple', label: '多选' },
]
const httpUrlRule = {
  validator: async (_: unknown, value?: string) => {
    if (!value) return
    try {
      const url = new URL(value)
      if (['http:', 'https:'].includes(url.protocol) && url.hostname) return
    } catch { /* Show the same help for invalid and incomplete URLs. */ }
    throw new Error('请输入完整的 http:// 或 https:// 链接')
  },
}

export const MEETING_DEFAULTS = {
  customFields: [], campaignCodes: [], audience: ['member', 'employee'], memberScope: 'all', memberGroups: [],
  recommendedIdentity: 'member',
  memberFields: [
    { label: '姓名', type: 'text', required: true },
    { label: '手机号', type: 'mobile', required: true },
    { label: '公司', type: 'text', required: false },
    { label: '邮箱', type: 'email', required: false },
  ],
  followWechat: true, followNonWechat: true, followReply: '', followPopupTitle: '关注后参与活动',
  followPopupDescription: '', enterpriseQrEnabled: false, enterpriseQrUrl: '',
  advancedRulesEnabled: false, participationRules: [], auditEnabled: false,
  capacityLimited: false, capacity: undefined, buttonMode: 'default',
  signupButtonText: '立即报名', signedUpButtonText: '已报名', fullButtonText: '名额已满',
  closedButtonText: '报名已结束', liveButtonText: '进入直播', replayButtonText: '观看回放',
  source: '', focusTags: [], signupTags: [], attendanceTags: [], replayTags: [],
  promotionChannels: [], wechatShare: true, shareImage: '', shareSummary: '',
  replayUrl: '', materialUrl: '', materialName: '', signupSuccessText: '您已报名成功',
  redirectEnabled: false, redirectUrl: '', redirectSeconds: 3,
}

export default function MeetingSettings({ onMediaBusyChange }: { onMediaBusyChange?: (field: string, busy: boolean) => void }) {
  const form = Form.useFormInstance()
  const allowRegister = Form.useWatch('allowRegister', form) !== false
  const leadCapture = Form.useWatch('leadCapture', form) === true
  const audience: string[] = Form.useWatch('audience', form) ?? []
  const memberScope = Form.useWatch('memberScope', form)
  const enterpriseQrEnabled = Form.useWatch('enterpriseQrEnabled', form)
  const advancedRulesEnabled = Form.useWatch('advancedRulesEnabled', form)
  const capacityLimited = Form.useWatch('capacityLimited', form)
  const buttonMode = Form.useWatch('buttonMode', form)
  const wechatShare = Form.useWatch('wechatShare', form)
  const redirectEnabled = Form.useWatch('redirectEnabled', form)
  const cardStyle = { marginBottom: 20 }

  return <>
    <Card title="自定义字段" style={cardStyle}>
      <Text type="secondary">补充活动的内部记录，字段名称与内容仅用于后台管理。</Text>
      <Form.List name="customFields">
        {(fields, { add, remove }) => <div style={{ marginTop: 16 }}>
          {fields.map(({ key, name, ...rest }) => <Row key={key} gutter={12} align="top">
            <Col xs={24} md={8}><Form.Item {...rest} label="字段名称" name={[name, 'label']} rules={[{ required: true, whitespace: true, message: '请输入字段名称' }]}>
              <Input maxLength={40} placeholder="例如：业务项目" />
            </Form.Item></Col>
            <Col xs={21} md={14}><Form.Item {...rest} label="字段内容" name={[name, 'value']}><Input maxLength={200} placeholder="填写内部记录" /></Form.Item></Col>
            <Col xs={3} md={2}><Button type="text" aria-label="删除自定义字段" icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginTop: 30 }} /></Col>
          </Row>)}
          <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ label: '', value: '' })}>添加自定义字段</Button>
        </div>}
      </Form.List>
      <Form.Item label="Campaign 编码" name="campaignCodes" extra="输入编码后按回车添加，可记录多个编码。" style={{ marginTop: 24, marginBottom: 0 }}>
        <Select {...tagsProps} placeholder="输入活动关联编码" />
      </Form.Item>
    </Card>

    <Card title="参与规则" style={cardStyle}>
      {!allowRegister ? <Text type="secondary">开启“开放报名”后，可设置参与对象、报名条件和人数限制。</Text> : <>
        <Form.Item label="参与对象" name="audience" rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一种参与对象' }]}>
          <Checkbox.Group options={[{ value: 'member', label: '会员' }, { value: 'employee', label: '员工' }]} onChange={values => {
            const identity = form.getFieldValue('recommendedIdentity')
            if (identity !== 'choose' && !values.includes(identity)) form.setFieldValue('recommendedIdentity', values[0] ?? 'choose')
          }} />
        </Form.Item>
        <Row gutter={24}>
          {audience.includes('member') && <Col xs={24} md={12}><Form.Item label="会员参与范围" name="memberScope"><Radio.Group options={[{ value: 'all', label: '全部会员' }, { value: 'selected', label: '指定会员分组' }]} /></Form.Item></Col>}
          <Col xs={24} md={12}><Form.Item label="推荐参与身份" name="recommendedIdentity"><Select options={[{ value: 'member', label: '会员' }, { value: 'employee', label: '员工' }, { value: 'choose', label: '由参与者选择' }].filter(option => option.value === 'choose' || audience.includes(option.value))} /></Form.Item></Col>
        </Row>
        {audience.includes('member') && memberScope === 'selected' && <Form.Item label="会员分组" name="memberGroups" rules={[{ required: true, type: 'array', min: 1, message: '请添加至少一个会员分组' }]}>
          <Select {...tagsProps} placeholder="输入分组名称后按回车添加" />
        </Form.Item>}
        {leadCapture && <>
          <Divider titlePlacement="start">报名信息收集</Divider>
          <Form.List name="memberFields">
            {(fields, { add, remove }) => <>
              {fields.map(({ key, name, ...rest }) => <div key={key} style={{ padding: 16, marginBottom: 12, background: '#fafafa', borderRadius: 8 }}>
                <Row gutter={12} align="top">
                  <Col xs={24} md={9}><Form.Item {...rest} label="字段名称" name={[name, 'label']} rules={[{ required: true, whitespace: true, message: '请输入字段名称' }]}><Input maxLength={40} placeholder="例如：职位" /></Form.Item></Col>
                  <Col xs={16} md={9}><Form.Item {...rest} label="字段类型" name={[name, 'type']} rules={[{ required: true, message: '请选择字段类型' }]}><Select options={fieldTypes} /></Form.Item></Col>
                  <Col xs={5} md={4}><Form.Item {...rest} label="必填" name={[name, 'required']} valuePropName="checked"><Switch /></Form.Item></Col>
                  <Col xs={3} md={2}><Button type="text" aria-label="删除报名字段" icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginTop: 30 }} /></Col>
                </Row>
                <Form.Item noStyle shouldUpdate={(before, after) => before.memberFields?.[name]?.type !== after.memberFields?.[name]?.type}>
                  {({ getFieldValue }) => ['select', 'multiple'].includes(getFieldValue(['memberFields', name, 'type'])) && <Form.Item {...rest} label="可选项" name={[name, 'options']} rules={[{ required: true, type: 'array', min: 1, message: '请添加至少一个选项' }]} style={{ marginBottom: 0 }}>
                    <Select {...tagsProps} placeholder="输入选项后按回车添加" />
                  </Form.Item>}
                </Form.Item>
              </div>)}
              <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ label: '', type: 'text', required: false })}>添加报名字段</Button>
            </>}
          </Form.List>
        </>}
        <Divider titlePlacement="start">关注与参与引导</Divider>
        <Row gutter={24}>
          <Col xs={24} md={12}><Form.Item label="微信内引导关注服务号" name="followWechat" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="非微信环境引导关注服务号" name="followNonWechat" valuePropName="checked"><Switch /></Form.Item></Col>
        </Row>
        <Form.Item label="关注后回复内容" name="followReply"><Input.TextArea rows={2} maxLength={500} showCount placeholder="填写关注服务号后的回复内容" /></Form.Item>
        <Row gutter={24}>
          <Col xs={24} md={12}><Form.Item label="关注弹窗标题" name="followPopupTitle"><Input maxLength={16} showCount /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="关注弹窗说明" name="followPopupDescription"><Input maxLength={64} showCount /></Form.Item></Col>
        </Row>
        <Form.Item label="展示企业微信二维码" name="enterpriseQrEnabled" valuePropName="checked"><Switch /></Form.Item>
        {enterpriseQrEnabled && <Form.Item label="企业微信二维码" name="enterpriseQrUrl" rules={[{ required: true, message: '请上传二维码图片' }]}>
          <ActivityMediaField kind="image" label="企业微信二维码" maxMB={2} onBusyChange={busy => onMediaBusyChange?.('enterpriseQrUrl', busy)} />
        </Form.Item>}
        <Divider titlePlacement="start">高级参与条件</Divider>
        <Form.Item label="启用高级参与条件" name="advancedRulesEnabled" valuePropName="checked"><Switch /></Form.Item>
        {advancedRulesEnabled && <Form.List name="participationRules" rules={[{ validator: async (_, values) => { if (!values?.length) throw new Error('请添加至少一条参与条件') } }]}>
          {(fields, { add, remove }, { errors }) => <>
            <Text type="secondary">记录邀请码或报名费用条件。</Text>
            {fields.map(({ key, name, ...rest }) => <Row key={key} gutter={12} style={{ marginTop: 16 }}>
              <Col xs={24} md={8}><Form.Item {...rest} label="条件类型" name={[name, 'type']} rules={[{ required: true, message: '请选择条件类型' }]}><Select options={[{ value: 'invitation', label: '邀请码' }, { value: 'payment', label: '付费报名' }]} /></Form.Item></Col>
              <Col xs={21} md={14}><Form.Item noStyle shouldUpdate={(before, after) => before.participationRules?.[name]?.type !== after.participationRules?.[name]?.type}>
                {({ getFieldValue }) => getFieldValue(['participationRules', name, 'type']) === 'payment'
                  ? <Form.Item {...rest} label="报名费用（元）" name={[name, 'paymentAmount']} rules={[{ required: true, type: 'number', min: 0.01, message: '请输入大于 0 的报名费用' }]}><InputNumber min={0.01} precision={2} style={{ width: '100%' }} /></Form.Item>
                  : <Form.Item {...rest} label="邀请码" name={[name, 'invitationCode']} rules={[{ required: true, whitespace: true, message: '请输入邀请码' }]}><Input maxLength={64} placeholder="输入参与活动所需的邀请码" /></Form.Item>}
              </Form.Item></Col>
              <Col xs={3} md={2}><Button type="text" aria-label="删除参与条件" icon={<MinusCircleOutlined />} onClick={() => remove(name)} style={{ marginTop: 30 }} /></Col>
            </Row>)}
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ type: 'invitation', invitationCode: '' })} style={{ marginTop: 12 }}>添加参与条件</Button>
            <Form.ErrorList errors={errors} />
          </>}
        </Form.List>}
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col xs={24} md={12}><Form.Item label="报名需要审核" name="auditEnabled" valuePropName="checked"><Switch /></Form.Item></Col>
          <Col xs={24} md={12}><Form.Item label="限制报名人数" name="capacityLimited" valuePropName="checked"><Switch /></Form.Item></Col>
        </Row>
        {capacityLimited && <Form.Item label="报名人数上限" name="capacity" rules={[{ required: true, type: 'integer', min: 1, message: '请输入至少为 1 的整数人数' }]}>
          <InputNumber min={1} precision={0} style={{ width: 200 }} />
        </Form.Item>}
      </>}
    </Card>

    <Card title="状态及按钮设置" style={cardStyle}>
      <Form.Item label="按钮文案" name="buttonMode"><Radio.Group options={[{ value: 'default', label: '使用默认文案' }, { value: 'custom', label: '自定义文案' }]} /></Form.Item>
      {buttonMode === 'custom' ? <Row gutter={24}>
        {[
          ['signupButtonText', '可报名'], ['signedUpButtonText', '已报名'], ['fullButtonText', '名额已满'],
          ['closedButtonText', '报名结束'], ['liveButtonText', '直播中'], ['replayButtonText', '活动回放'],
        ].map(([name, label]) => <Col xs={24} md={12} key={name}><Form.Item label={label} name={name} rules={[{ required: true, whitespace: true, message: '请输入按钮文案' }]}><Input maxLength={16} showCount /></Form.Item></Col>)}
      </Row> : <Text type="secondary">根据活动状态展示“立即报名”“已报名”“名额已满”“报名已结束”“进入直播”和“观看回放”。</Text>}
    </Card>

    <Card title="来源和标签" style={cardStyle}>
      <p style={{ marginTop: 0 }}><Text type="secondary">设置参与者在关注、报名、参会及观看回放后对应的标签。</Text></p>
      <Form.Item label="活动来源" name="source"><Input maxLength={100} placeholder="例如：公众号推文、卖家社群" /></Form.Item>
      <Row gutter={24}>
        {[
          ['focusTags', '关注标签'], ['signupTags', '报名标签'], ['attendanceTags', '参会标签'], ['replayTags', '回放标签'],
        ].map(([name, label]) => <Col xs={24} md={12} key={name}><Form.Item label={label} name={name}><Select {...tagsProps} placeholder="输入标签后按回车添加" /></Form.Item></Col>)}
      </Row>
    </Card>

    <Card title="推广和分享" style={cardStyle}>
      <Form.Item label="推广渠道" name="promotionChannels"><Select {...tagsProps} placeholder="选择或添加推广渠道" options={['微信公众号', '微信好友', '朋友圈', '企业微信', '邮件', '短信'].map(value => ({ value, label: value }))} /></Form.Item>
      <Form.Item label="允许微信分享" name="wechatShare" valuePropName="checked"><Switch /></Form.Item>
      {wechatShare && <>
        <Form.Item label="分享图片" name="shareImage"><ActivityMediaField kind="image" label="分享图片" maxMB={2} onBusyChange={busy => onMediaBusyChange?.('shareImage', busy)} /></Form.Item>
        <Form.Item label="分享摘要" name="shareSummary"><Input.TextArea rows={2} maxLength={50} showCount placeholder="用简短文字介绍活动亮点" /></Form.Item>
      </>}
    </Card>

    <Card title="会后设置" style={cardStyle}>
      <Form.Item label="回放链接" name="replayUrl" rules={[httpUrlRule]}><Input placeholder="https://… 活动回放地址" /></Form.Item>
      <Row gutter={24}>
        <Col xs={24} md={12}><Form.Item label="资料名称" name="materialName"><Input maxLength={100} placeholder="例如：活动演讲资料" /></Form.Item></Col>
        <Col xs={24} md={12}><Form.Item label="活动资料" name="materialUrl"><ActivityMediaField kind="document" label="活动资料" maxMB={20} onBusyChange={busy => onMediaBusyChange?.('materialUrl', busy)} /></Form.Item></Col>
      </Row>
    </Card>

    <Card title="报名设置" style={cardStyle}>
      {!allowRegister ? <Text type="secondary">开启“开放报名”后，可设置报名成功提示和跳转页面。</Text> : <>
        <Form.Item label="报名成功提示" name="signupSuccessText" rules={[{ required: true, whitespace: true, message: '请输入报名成功提示' }]}><Input maxLength={64} showCount /></Form.Item>
        <Form.Item label="报名成功后跳转" name="redirectEnabled" valuePropName="checked"><Switch /></Form.Item>
        {redirectEnabled && <Row gutter={24}>
          <Col xs={24} md={16}><Form.Item label="跳转链接" name="redirectUrl" rules={[{ required: true, message: '请填写跳转链接' }, httpUrlRule]}><Input placeholder="https://…" /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label="跳转等待时间（秒）" name="redirectSeconds" rules={[{ required: true, type: 'integer', min: 0, max: 60, message: '请输入 0–60 之间的整数' }]}><InputNumber min={0} max={60} precision={0} style={{ width: '100%' }} /></Form.Item></Col>
        </Row>}
      </>}
    </Card>
  </>
}
