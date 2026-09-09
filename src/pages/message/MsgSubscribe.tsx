import { Card, Table, Tag, Button, Space, Switch, message } from 'antd'

// 订阅消息配置：小程序一次性订阅消息模板
interface Sub { id: number; name: string; tmplId: string; scene: string; enabled: boolean }
const data: Sub[] = [
  { id: 1, name: '活动开始提醒', tmplId: 'ACTIVITY_TMPL_ID', scene: '活动详情页预约', enabled: true },
  { id: 2, name: '学习提醒', tmplId: 'LEARN_REMIND_TMPL_ID', scene: '成长中心订阅', enabled: true },
  { id: 3, name: '直播开播提醒', tmplId: 'LIVE_TMPL_ID', scene: '直播预约', enabled: true },
  { id: 4, name: '入驻进度更新', tmplId: 'REGISTER_TMPL_ID', scene: '入驻进度页', enabled: false },
]

export default function MsgSubscribe() {
  const columns = [
    { title: '订阅场景', dataIndex: 'name' },
    { title: '模板ID', dataIndex: 'tmplId', render: (v: string) => <code style={{ fontSize: 12 }}>{v}</code> },
    { title: '触发位置', dataIndex: 'scene', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '启用', dataIndex: 'enabled', render: (v: boolean) => <Switch defaultChecked={v} /> },
    { title: '操作', render: () => <Space><a>编辑</a><a>发送记录</a></Space> },
  ]

  return (
    <Card title="小程序订阅消息配置" extra={<Button type="primary" onClick={() => message.success('已保存（mock）')}>保存</Button>}>
      <Table rowKey="id" columns={columns} dataSource={data} pagination={false} />
      <div style={{ marginTop: 16, padding: 12, background: '#EFF6FF', borderRadius: 8, color: '#6B7280', fontSize: 13 }}>
        订阅消息为一次性授权，用户每次授权仅可下发一条。前端在活动预约、学习提醒、直播预约等场景调用 wx.requestSubscribeMessage 获取授权。
      </div>
    </Card>
  )
}
