// 通用 mock 工具：模拟网络延迟 + 随机数据
export function delay<T>(data: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms))
}

export function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// 生成日期序列（近 n 天，MM-DD）
export function lastNDates(n: number): string[] {
  const out: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(now.getDate() - i)
    out.push(`${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
  }
  return out
}

// 常用中文姓名/公司池
export const NAMES = ['王芳', '李强', '张明', '刘红', '陈静', '杨帆', '赵敏', '孙磊', '周涛', '吴婷']
export const COMPANIES = ['深圳创客科技', '广州跨境优选', '义乌小商品', '杭州智造', '东莞智能家居', '厦门优品', '宁波海贸', '上海选品汇']
export const CATEGORIES = ['服饰鞋履、箱包&配饰', '消费电子产品', '家居、厨房、装饰及园艺', '母婴用品', '美容、健康和个人护理', '玩具和游戏', '汽车与动力户外产品', '宠物用品']
export const MANAGERS = ['张明', '刘红', '赵晓雅', 'Candy Zhang', 'John Zhang']
