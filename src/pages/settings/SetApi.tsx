import { Card, Form, Input, Button, Switch, Table, Tag, Space, Divider, message } from 'antd'

// API对接配置：Workbench、SCRM、实名核验、微信等
const apis = [
  { id: 1, name: 'Workbench 卖家数据', url: 'https://workbench.walmart.com/api', status: '已连接' },
  { id: 2, name: 'SCRM(致趣百川)', url: 'https://scrm.example.com/api', status: '已连接' },
  { id: 3, name: '实名三要素核验', url: 'https://verify.example.com/api', status: '已连接' },
  { id: 4, name: '微信服务号', url: 'https://api.weixin.qq.com', status: '已连接' },
]

export default function SetApi() {
  return (
    <div>
      <Card title="API 对接状态">
        <Table
          rowKey="id"
          pagination={false}
          dataSource={apis}
          columns={[
            { title: '接口名称', dataIndex: 'name' },
            { title: '接口地址', dataIndex: 'url', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
            { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color="green">{v}</Tag> },
            { title: '操作', render: () => <Space><a>配置</a><a>测试连接</a></Space> },
          ]}
        />
      </Card>

      <Card title="Workbench 回传配置" style={{ marginTop: 16 }}>
        <Form layout="vertical" style={{ maxWidth: 600 }} initialValues={{ autoSync: true, realtime: true }}>
          <Form.Item label="API Base URL" name="baseUrl"><Input defaultValue="https://workbench.walmart.com/api" /></Form.Item>
          <Form.Item label="API Key" name="apiKey"><Input.Password placeholder="••••••••" /></Form.Item>
          <Form.Item label="入驻信息实时回传" name="realtime" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="入驻状态自动同步(24h)" name="autoSync" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" onClick={() => message.success('已保存（mock）')}>保存配置</Button>
        </Form>
      </Card>
    </div>
  )
}
