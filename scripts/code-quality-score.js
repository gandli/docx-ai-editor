// 代码质量评分脚本
// 用于 autoresearch 的 Verify 命令
// 输出 0-10 的分数

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const PROJECT_ROOT = process.cwd()

function run(command) {
  try {
    return execSync(command, { 
      encoding: 'utf8', 
      cwd: PROJECT_ROOT,
      stdio: ['pipe', 'pipe', 'pipe']
    })
  } catch (error) {
    // 有些命令失败时也会输出有用信息
    return error.stdout || error.stderr || ''
  }
}

function calculateQualityScore() {
  let score = 10.0
  const issues = []
  
  // ========== 1. ESLint 错误扣分 (每个 -0.5) ==========
  try {
    const eslintConfigPath = join(PROJECT_ROOT, '.eslintrc.json')
    const hasEslintConfig = existsSync(eslintConfigPath)
    
    if (hasEslintConfig) {
      const lintResult = run('npx eslint src/ --format json 2>&1 || true')
      
      // 尝试解析 JSON 输出
      try {
        const jsonStart = lintResult.indexOf('[')
        const jsonEnd = lintResult.lastIndexOf(']') + 1
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const issues = JSON.parse(lintResult.substring(jsonStart, jsonEnd))
          const errorCount = issues.reduce((sum, file) => sum + (file.errorCount || 0), 0)
          const warningCount = issues.reduce((sum, file) => sum + (file.warningCount || 0), 0)
          
          score -= errorCount * 0.5
          score -= warningCount * 0.2
          
          if (errorCount > 0) {
            issues.push(`ESLint: ${errorCount} errors, ${warningCount} warnings`)
          }
        }
      } catch (e) {
        // JSON 解析失败，尝试用正则提取错误数
        const errorMatch = lintResult.match(/(\d+)\s+errors?/)
        const warningMatch = lintResult.match(/(\d+)\s+warnings?/)
        
        if (errorMatch) {
          score -= parseInt(errorMatch[1]) * 0.5
          issues.push(`ESLint: ${errorMatch[1]} errors`)
        }
        if (warningMatch) {
          score -= parseInt(warningMatch[1]) * 0.2
        }
      }
    } else {
      console.log('⚠️  未找到 ESLint 配置文件，跳过检查')
    }
  } catch (e) {
    console.log('⚠️  ESLint 检查失败:', e.message)
  }
  
  // ========== 2. 代码复杂度扣分 ==========
  // 检查单个文件的复杂度 (简化版本)
  try {
    const srcDir = join(PROJECT_ROOT, 'src')
    const jsFiles = run(`find ${srcDir} -name "*.js" -o -name "*.jsx" 2>/dev/null`).trim().split('\n').filter(f => f)
    
    let highComplexityCount = 0
    for (const file of jsFiles) {
      if (file && existsSync(file)) {
        const content = readFileSync(file, 'utf8')
        // 简化：计算函数嵌套深度和条件语句数量
        const functionCount = (content.match(/function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>|\(\)\s*=>/g) || []).length
        const ifCount = (content.match(/\bif\s*\(/g) || []).length
        const loopCount = (content.match(/\b(for|while|do)\s*[\({]/g) || []).length
        
        // 如果函数多且条件/循环多，认为复杂度高
        if (functionCount > 10 && (ifCount + loopCount) > 15) {
          highComplexityCount++
        }
      }
    }
    
    score -= highComplexityCount * 0.3
    if (highComplexityCount > 0) {
      issues.push(`高复杂度文件：${highComplexityCount}`)
    }
  } catch (e) {
    console.log('⚠️  复杂度分析失败:', e.message)
  }
  
  // ========== 3. 文件过大扣分 (超过 300 行) ==========
  try {
    const srcDir = join(PROJECT_ROOT, 'src')
    const largeFilesOutput = run(`find ${srcDir} -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs wc -l 2>/dev/null | grep -v total | awk '$1 > 300 {print $2}'`)
    const largeFiles = largeFilesOutput.trim().split('\n').filter(f => f)
    
    score -= Math.min(largeFiles.length * 0.2, 2.0)
    if (largeFiles.length > 0) {
      issues.push(`大文件 (>300 行): ${largeFiles.length}`)
    }
  } catch (e) {
    // 忽略
  }
  
  // ========== 4. TODO/FIXME 注释扣分 ==========
  try {
    const srcDir = join(PROJECT_ROOT, 'src')
    const todoCount = run(`grep -r "TODO\\|FIXME\\|XXX\\|HACK" ${srcDir} 2>/dev/null | wc -l`).trim()
    const todoNum = parseInt(todoCount) || 0
    
    score -= Math.min(todoNum * 0.1, 1.0)
    if (todoNum > 0) {
      issues.push(`待处理标记：${todoNum}`)
    }
  } catch (e) {
    // 忽略
  }
  
  // ========== 5. console.log 扣分 (生产代码中应避免) ==========
  try {
    const srcDir = join(PROJECT_ROOT, 'src')
    const consoleCount = run(`grep -r "console\\.log\\|console\\.error\\|console\\.warn" ${srcDir} --include="*.js" --include="*.jsx" 2>/dev/null | wc -l`).trim()
    const consoleNum = parseInt(consoleCount) || 0
    
    score -= Math.min(consoleNum * 0.05, 0.5)
  } catch (e) {
    // 忽略
  }
  
  // 确保分数不低于 0
  score = Math.max(0, score)
  
  // 输出纯数字 (autoresearch 需要)
  console.log(score.toFixed(1))
  
  // 如果需要详细输出 (调试用),取消下面的注释
  // console.error('\n=== 代码质量报告 ===')
  // console.error(`得分：${score.toFixed(1)}/10`)
  // issues.forEach(issue => console.error(`  - ${issue}`))
}

calculateQualityScore()
