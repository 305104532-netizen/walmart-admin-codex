import { Card, Table, Tag, Button, Space, Input, Switch, Form, InputNumber, message, Row, Col } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'

// 搜索配置：热门搜索词、搜索权重、同义词
interface HotWord { id: number; word: string; count: number; pinned: boolean }
const hotWords: HotWord[] = ['入驻', 'WFS', '选品', '广告', '佣金', 'Listing优化', '冷启动', '税务'].map((w, i) => ({
  id: i + 1, word: w, count: 1000 - i * 80, pinned: i < 3,
}))

export default function SearchConfig() {
  const [words, setWords] = useState(hotWords)

  const columns = [
    { title: '热门搜索词', dataIndex: 'word', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '搜索次数', dataIndex: 'count', sorter: (a: HotWord, b: HotWord) => a.count - b.count },
    { title: '置顶推荐', dataIndex: 'pinned', render: (v: boolean, r: HotWord) => <Switch checked={v} onChange={() => setWords((ws) => ws.map((x) => (x.id === r.id ? { ...x, pinned: !x.pinned } : x)))} /> },
    { title: '操作', render: () => <Space><a>编辑</a><a style={{ color: '#EF4444' }}>删除</a></Space> },
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={14}>
          <Card title="热门搜索词配置" extra={<Button type="primary" size="small" icon={<PlusOutlined />}>新增</Button>}>
            <Table rowKey="id" columns={columns} dataSource={words} pagination={false} size="small" />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="搜索权重与规则">
            <Form layout="vertical">
              <Form.Item label="标题匹配权重"><InputNumber defaultValue={10} min={1} max={100} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="正文匹配权重"><InputNumber defaultValue={5} min={1} max={100} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="标签匹配权重"><InputNumber defaultValue={8} min={1} max={100} style={{ width: '100%' }} /></Form.Item>
              <Form.Item label="同义词映射"><Input.TextArea rows={3} placeholder="每行一组，如：广告=推广=advertising" /></Form.Item>
              <Form.Item label="搜索结果排序"><Input defaultValue="相关度优先" /></Form.Item>
              <Button type="primary" onClick={() => message.success('搜索配置已保存（mock）')}>保存配置</Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
