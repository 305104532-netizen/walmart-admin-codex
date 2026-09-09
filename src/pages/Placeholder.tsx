import { Result } from 'antd'

// 占位页（尚未细化的页面统一走这里，逐步替换为真实实现）
export default function Placeholder({ title }: { title?: string }) {
  return (
    <Result
      status="info"
      title={title || '页面建设中'}
      subTitle="该功能页面正在按产品设计文档实现中。"
    />
  )
}
