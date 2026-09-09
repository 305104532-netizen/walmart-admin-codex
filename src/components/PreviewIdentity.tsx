import { useState } from 'react'
import { Alert, Select, Space, Typography } from 'antd'
import { PREVIEW_USERS, setPreviewUser, useCurrentAdmin } from '../models/adminAccess'

export default function PreviewIdentity() {
  return import.meta.env.DEV ? <DevelopmentPreviewIdentity /> : null
}

function DevelopmentPreviewIdentity() {
  const user = useCurrentAdmin()
  const [error, setError] = useState('')

  return <Space orientation="vertical" size={8} style={{ width: '100%' }}>
    <Space wrap size={12}>
      <Typography.Text strong>本地身份预览</Typography.Text>
      <Select aria-label="本地身份预览" value={user.id || undefined} placeholder="请选择演示账户" style={{ minWidth: 220 }}
        options={PREVIEW_USERS.map((identity) => ({ value: identity.id, label: identity.name + (identity.role === 'bd' ? '（BD）' : '') }))}
        onChange={(id: string) => {
          if (id === user.id) return
          try { setPreviewUser(id); setError('') }
          catch (cause) { setError(cause instanceof Error ? cause.message : '预览身份切换失败，请重试。') }
        }} />
      <Typography.Text type="secondary">仅切换当前标签页的演示账户，不是真实登录。</Typography.Text>
    </Space>
    {!user.id && <Alert type="warning" showIcon title="预览身份或角色授权不可用，当前为只读状态。" />}
    {error && <Alert type="error" showIcon title={error} />}
  </Space>
}
