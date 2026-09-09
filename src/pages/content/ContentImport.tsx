import { Card, Steps, Upload, Button, Table, Tag, message, Space } from 'antd'
import { useState } from 'react'
import { UploadOutlined, LinkOutlined } from '@ant-design/icons'

// 内容迁移/导入：从旧站/Excel/URL 批量导入内容
export default function ContentImport() {
  const [step, setStep] = useState(0)

  const preview = [
    { id: 1, title: '沃尔玛入驻完整流程指南', cat: '政策条款', ok: true },
    { id: 2, title: 'WFS入仓注意事项', cat: '物流指南', ok: true },
    { id: 3, title: '（标题为空）', cat: '-', ok: false },
  ]

  return (
    <Card title="内容迁移 / 批量导入">
      <Steps current={step} style={{ marginBottom: 24, maxWidth: 700 }}
        items={[{ title: '选择来源' }, { title: '上传/抓取' }, { title: '解析预览' }, { title: '确认导入' }]} />

      {step === 0 && (
        <Space direction="vertical" size={16}>
          <Button icon={<UploadOutlined />} onClick={() => setStep(1)}>从 Excel 批量导入</Button>
          <Button icon={<LinkOutlined />} onClick={() => setStep(1)}>从 URL 抓取（旧站迁移）</Button>
        </Space>
      )}
      {step === 1 && (
        <div>
          <Upload.Dragger beforeUpload={() => false} style={{ maxWidth: 500 }}>
            <p className="ant-upload-drag-icon"><UploadOutlined /></p>
            <p>点击或拖拽文件到此上传（支持 xlsx/csv）</p>
          </Upload.Dragger>
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => setStep(2)}>下一步：解析</Button>
        </div>
      )}
      {step === 2 && (
        <div>
          <Table rowKey="id" size="small" pagination={false} dataSource={preview}
            columns={[
              { title: '标题', dataIndex: 'title' },
              { title: '分类', dataIndex: 'cat' },
              { title: '校验', dataIndex: 'ok', render: (v: boolean) => (v ? <Tag color="green">通过</Tag> : <Tag color="red">标题缺失</Tag>) },
            ]} />
          <Button type="primary" style={{ marginTop: 16 }} onClick={() => setStep(3)}>下一步</Button>
        </div>
      )}
      {step === 3 && (
        <div>
          <p>共 3 条，2 条校验通过，将导入 2 条内容。</p>
          <Button type="primary" onClick={() => { message.success('导入完成（mock）'); setStep(0) }}>确认导入</Button>
        </div>
      )}
    </Card>
  )
}
