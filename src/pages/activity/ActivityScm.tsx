import { Card, Form, Input, Switch, Button, Table, Tag, Space, Divider, message } from 'antd'

// SCM/SCRM 同步配置：直播、活动数据打通，用户信息同步免二次绑定
export default function ActivityScm() {
  const syncLog = [
    { id: 1, type: '直播预约', count: 328, time: '2026-07-20 10:00', status: '成功' },
    { id: 2, type: '活动报名', count: 256, time: '2026-07-20 09:30', status: '成功' },
    { id: 3, type: '用户信息', count: 1200, time: '2026-07-20 09:00', status: '成功' },
  ]

  return (
    <div>
      <Card title="SCRM / SCM 对接配置">
        <Form layout="vertical" style={{ maxWidth: 600 }} initialValues={{ enabled: true, syncUser: true, selective: true }}>
          <Form.Item label="启用 SCRM 集成" name="enabled" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="SCRM API 地址" name="apiUrl"><Input placeholder="https://scrm.example.com/api" /></Form.Item>
          <Form.Item label="AppKey" name="appKey"><Input.Password placeholder="••••••••" /></Form.Item>
          <Form.Item label="用户信息同步(手机/PID/邮箱免二次绑定)" name="syncUser" valuePropName="checked"><Switch /></Form.Item>
          <Form.Item label="直播/活动选择性展示到小程序" name="selective" valuePropName="checked"><Switch /></Form.Item>
          <Button type="primary" onClick={() => message.success('配置已保存（mock）')}>保存配置</Button>
        </Form>

        <Divider />
        <h4>同步记录</h4>
        <Table
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={syncLog}
          columns={[
            { title: '同步类型', dataIndex: 'type', render: (v: string) => <Tag color="blue">{v}</Tag> },
            { title: '数据量', dataIndex: 'count' },
            { title: '同步时间', dataIndex: 'time' },
            { title: '状态', dataIndex: 'status', render: (v: string) => <Tag color="green">{v}</Tag> },
          ]}
        />
      </Card>
    </div>
  )
}
