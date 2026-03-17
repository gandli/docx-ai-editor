// API 性能基准测试脚本
// 用于 autoresearch 的 Verify 命令
// 输出 P95 响应时间 (毫秒)

import { performance } from 'perf_hooks'

// 模拟 LLM API 调用 (实际项目中应导入真实的 API 函数)
async function mockLLMCall(prompt) {
  // 模拟网络延迟 (50-200ms 随机)
  const delay = 50 + Math.random() * 150
  await new Promise(resolve => setTimeout(resolve, delay))
  return `Response to: ${prompt}`
}

async function benchmark() {
  const iterations = 20
  const latencies = []
  
  console.log(`开始基准测试 (${iterations} 次迭代)...`)
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    
    try {
      await mockLLMCall('test prompt for benchmark')
    } catch (error) {
      console.error(`迭代 ${i} 失败:`, error.message)
      continue
    }
    
    const end = performance.now()
    const latency = end - start
    latencies.push(latency)
  }
  
  if (latencies.length === 0) {
    console.error('错误：没有成功的迭代')
    process.exit(1)
  }
  
  // 排序计算百分位数
  latencies.sort((a, b) => a - b)
  
  const p50 = latencies[Math.floor(latencies.length * 0.50)]
  const p75 = latencies[Math.floor(latencies.length * 0.75)]
  const p90 = latencies[Math.floor(latencies.length * 0.90)]
  const p95 = latencies[Math.floor(latencies.length * 0.95)]
  const p99 = latencies[Math.floor(latencies.length * 0.99)]
  const avg = latencies.reduce((sum, val) => sum + val, 0) / latencies.length
  const min = latencies[0]
  const max = latencies[latencies.length - 1]
  
  // 输出 autoresearch 需要的格式
  console.log(`p95: ${p95.toFixed(2)}ms`)
  
  // 详细统计 (输出到 stderr，不影响 autoresearch 解析)
  console.error(`\n=== API 性能基准测试 ===`)
  console.error(`成功迭代：${latencies.length}/${iterations}`)
  console.error(`最小：${min.toFixed(2)}ms`)
  console.error(`最大：${max.toFixed(2)}ms`)
  console.error(`平均：${avg.toFixed(2)}ms`)
  console.error(`P50: ${p50.toFixed(2)}ms`)
  console.error(`P75: ${p75.toFixed(2)}ms`)
  console.error(`P90: ${p90.toFixed(2)}ms`)
  console.error(`P95: ${p95.toFixed(2)}ms ⬅️ 主要指标`)
  console.error(`P99: ${p99.toFixed(2)}ms`)
  console.error(`========================\n`)
  
  // 检查是否达到目标
  if (p95 < 100) {
    console.error('✅ 达到目标：P95 < 100ms')
  } else {
    console.error(`❌ 未达目标：P95 ${p95.toFixed(2)}ms >= 100ms (还需优化 ${p95 - 100}ms)`)
  }
}

// 运行基准测试
benchmark().catch(error => {
  console.error('基准测试失败:', error)
  process.exit(1)
})
