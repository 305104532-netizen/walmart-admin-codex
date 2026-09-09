import { Card, Tabs, Table, Tag, Button, Space, Input, Upload, Modal, Form, DatePicker, InputNumber, Switch, message, Steps } from 'antd'
import { useState } from 'react'
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons'
import { COMPANIES, pick, randInt } from '../../mock/util'

interface WLItem { id: number; pid: string; company: string; source: string; visited: boolean; joinTime: string }
const wl: WLItem[] = Array.from({ length: 25 }).map((_, i) => ({
  id: i + 1, pid: `100${randInt(10000, 99999)}`, company: pick(COMPANIES) + '有限公司',
  source: pick(['Excel导入', '手动添加']), visited: Math.random() > 0.3, joinTime: `2026-07-${String(randInt(1, 28)).padStart(2, '0')}`,
}))

interface Code { id: number; code: string; expire: string; used: number; max: number; enabled: boolean }
const codes: Code[] = [
  { id: 1, code: 'WM2026', expire: '2026-12-31', used: 128, max: 500, enabled: true },
  { id: 2, code: 'DAYONE', expire: '2026-09-30', used: 56, max: 200, enabled: true },
]

export default function GrowthDayone() {
  const [importOpen, setImportOpen] = useState(false)
  const [step, setStep] = useState(0)

  const wlCols = [
    { title: 'PID', dataIndex: 'pid' },
    { title: '公司名称', dataIndex: 'company', ellipsis: true },
    { title: '加入方式', dataIndex: 'source', render: (v: string) => <Tag>{v}</Tag> },
    { title: '访问状态', dataIndex: 'visited', render: (v: boolean) => (v ? <Tag color="green">已访问</Tag> : <Tag>未访问</Tag>) },
    { title: '加入时间', dataIndex: 'joinTime' },
    { title: '操作', render: () => <a style={{ color: '#EF4444' }}>移除</a> },
  ]
  const codeCols = [
    { title: '访问码', dataIndex: 'code', render: (v: string) => <Tag color="blue" style={{ fontSize: 14 }}>{v}</Tag> },
    { title: '有效期至', dataIndex: 'expire' },
    { title: '已用/上限', render: (_: unknown, r: Code) => `${r.used} / ${r.max}` },
    { title: '状态', dataIndex: 'enabled', render: (v: boolean) => <Switch defaultChecked={v} /> },
    { title: '操作', render: () => <Space><a>分发记录</a><a style={{ color: '#EF4444' }}>停用</a></Space> },
  ]

  const whitelistTab = (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="PID/公司名搜索" prefix={<SearchOutlined />} style={{ width: 220 }} />
        <Button icon={<PlusOutlined />}>手动添加</Button>
        <Button type="primary" icon={<UploadOutlined />} onClick={() => { setImportOpen(true); setStep(0) }}>Excel批量导入</Button>
        <Button>导出</Button>
      </Space>
      <Table rowKey="id" columns={wlCols} dataSource={wl} pagination={{ pageSize: 10 }} />
    </>
  )

  const contentTab = (
    <Table
      rowKey="id"
      pagination={false}
      dataSource={[
        { id: 1, title: 'DAY-ONE 卖家专属入驻手册', tag: '专属', online: true },
        { id: 2, title: '一对一冷启动加速直播', tag: '直播', online: true },
        { id: 3, title: '新卖家激励政策礼包', tag: '福利', online: true },
        { id: 4, title: '专属选品趋势数据包', tag: '数据', online: false },
      ]}
      columns={[
        { title: '资源标题', dataIndex: 'title' },
        { title: '标签', dataIndex: 'tag', render: (v: string) => <Tag color="purple">{v}</Tag> },
        { title: '上架', dataIndex: 'online', render: (v: boolean) => <Switch defaultChecked={v} /> },
        { title: '操作', render: () => <Space><a>编辑</a><a>排序</a></Space> },
      ]}
    />
  )

  return (
    <div>
      <Card>
        <Tabs
          items={[
            { key: 'wl', label: `白名单卖家(${wl.length})`, children: whitelistTab },
            { key: 'code', label: '访问码管理', children: <><Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}>生成访问码</Button><Table rowKey="id" columns={codeCols} dataSource={codes} pagination={false} /></> },
            { key: 'content', label: '专属内容配置', children: <><Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }}>新增资源</Button>{contentTab}</> },
          ]}
        />
      </Card>

      <Modal title="Excel 批量导入白名单" open={importOpen} onCancel={() => setImportOpen(false)} width={640}
        footer={step < 3 ? [<Button key="next" type="primary" onClick={() => setStep((s) => Math.min(3, s + 1))}>下一步</Button>] : [<Button key="ok" type="primary" onClick={() => { message.success('导入成功（mock）'); setImportOpen(false) }}>确认导入</Button>]}>
        <Steps current={step} size="small" style={{ marginBottom: 24 }} items={[{ title: '下载模板' }, { title: '上传文件' }, { title: '匹配校验' }, { title: '确认导入' }]} />
        {step === 0 && <div><p>下载标准模板（含 PID、公司名 列），按格式填写后上传。</p><Button icon={<UploadOutlined />}>下载模板.xlsx</Button></div>}
        {step === 1 && <Upload.Dragger beforeUpload={() => false}><p className="ant-upload-drag-icon"><UploadOutlined /></p><p>点击或拖拽 xlsx 文件到此上传</p></Upload.Dragger>}
        {step === 2 && <Table size="small" pagination={false} rowKey="pid"
          dataSource={[{ pid: '10012345', company: 'A公司', ok: true }, { pid: '10088888', company: 'B公司', ok: false }]}
          columns={[{ title: 'PID', dataIndex: 'pid' }, { title: '公司名', dataIndex: 'company' }, { title: '校验', dataIndex: 'ok', render: (v: boolean) => (v ? <Tag color="green">通过</Tag> : <Tag color="red">PID不存在</Tag>) }]} />}
        {step === 3 && <p>共 2 条，其中 1 条通过校验，将导入 1 条白名单记录。</p>}
      </Modal>
    </div>
  )
}
