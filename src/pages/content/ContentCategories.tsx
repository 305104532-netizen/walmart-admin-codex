import { Card, Tree, Button, Space, Modal, Form, Input, message, Row, Col, Empty } from 'antd'
import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import type { DataNode } from 'antd/es/tree'

// 一级(A列全新分类) + 二级(K列) — 与小程序卖家大学一致
const treeData: DataNode[] = [
  { title: '流量秘籍', key: 'traffic', children: [{ title: '报告分析', key: 'traffic-1' }, { title: '快速入门', key: 'traffic-2' }] },
  { title: '平台工具', key: 'tools', children: [{ title: '最新资讯', key: 'tools-1' }] },
  { title: '物流指南', key: 'logistics', children: [{ title: 'WFS', key: 'logistics-1' }] },
  { title: '政策条款', key: 'policy', children: [{ title: '政策条款', key: 'policy-1' }, { title: '入驻指导', key: 'policy-2' }, { title: '快速入门', key: 'policy-3' }] },
  { title: '运营干货', key: 'operation', children: [
    { title: '快速入门', key: 'op-1' }, { title: 'WFS', key: 'op-2' }, { title: 'SWW', key: 'op-3' },
    { title: '自发货', key: 'op-4' }, { title: '运营宝典', key: 'op-5' }, { title: '成功卖家', key: 'op-6' }, { title: '全渠道卖家', key: 'op-7' },
  ] },
]

export default function ContentCategories() {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>()
  const [form] = Form.useForm()

  return (
    <div>
      <Row gutter={16}>
        <Col span={10}>
          <Card title="分类结构（一级=全新分类 / 二级=子分类）" extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setOpen(true)}>新增分类</Button>}>
            <Tree
              treeData={treeData}
              defaultExpandAll
              draggable
              blockNode
              onSelect={(keys) => setSelected(keys[0] as string)}
            />
          </Card>
        </Col>
        <Col span={14}>
          <Card title="分类详情">
            {selected ? (
              <Form layout="vertical">
                <Form.Item label="分类名称"><Input defaultValue={selected} /></Form.Item>
                <Form.Item label="排序权重"><Input type="number" defaultValue={1} /></Form.Item>
                <Form.Item label="关联内容数"><Input disabled defaultValue={42} /></Form.Item>
                <Button type="primary" onClick={() => message.success('已保存（mock）')}>保存</Button>
              </Form>
            ) : <Empty description="请选择左侧分类查看/编辑" />}
          </Card>
        </Col>
      </Row>

      <Modal title="新增分类" open={open} onCancel={() => setOpen(false)} onOk={() => { message.success('已新增（mock）'); setOpen(false) }}>
        <Form form={form} layout="vertical">
          <Form.Item label="分类层级" name="level"><Input placeholder="一级 / 二级" /></Form.Item>
          <Form.Item label="父级分类(二级时选)" name="parent"><Input placeholder="如 运营干货" /></Form.Item>
          <Form.Item label="分类名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
