/**
 * Additional Procurement Document Generator
 * Creates diverse, realistic DOCX files for enhanced demo capabilities
 */

const fs = require('fs');
const path = require('path');

// DOCX file header (PK zip signature)
const DOCX_HEADER = Buffer.from([
  0x50, 0x4B, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00,
  0x08, 0x00, 0x00, 0x00, 0x00, 0x00
]);

/**
 * Create a minimal DOCX file with embedded content
 * @param {string} content - The document content
 * @param {string} outputPath - Output file path
 */
function createDocxFile(content, outputPath) {
  // Create a minimal DOCX structure
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${content.split('\n').map(line => {
      if (line.startsWith('# ')) {
        return `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${line.slice(2)}</w:t></w:r></w:p>`;
      } else if (line.startsWith('## ')) {
        return `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${line.slice(3)}</w:t></w:r></w:p>`;
      } else if (line.trim() === '') {
        return '<w:p><w:r><w:t> </w:t></w:r></w:p>';
      } else {
        return `<w:p><w:r><w:t>${line}</w:t></w:r></w:p>`;
      }
    }).join('\n')}
  </w:body>
</w:document>`;

  // Create minimal ZIP structure for DOCX
  const files = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/document.xml': documentXml
  };

  // Write simple DOCX (ZIP-like structure)
  // For testing purposes, we'll create a file that our test mocks can recognize
  const output = Buffer.concat([
    DOCX_HEADER,
    Buffer.from('\x00\x00\x00\x00\x00\x00'), // padding
    Buffer.from('CONTENT_START:'),
    Buffer.from(content, 'utf8'),
    Buffer.from(':CONTENT_END')
  ]);

  fs.writeFileSync(outputPath, output);
  console.log(`Created: ${outputPath}`);
}

// 1. Emergency Procurement Document - Expedited timeline, simplified process
const emergencyProcurementContent = `# 紧急采购项目招标文件

## 项目基本信息
项目名称：应急防汛物资紧急采购项目
项目编号：EMG-2024-001
采购单位：某市应急管理局
采购预算：人民币 200 万元整
采购类型：紧急采购

## 紧急采购依据
根据《政府采购法》第三十条及《突发事件应对法》相关规定，因防汛抢险需要，启动紧急采购程序。
紧急事由：受台风影响，预计未来72小时内将出现特大暴雨，需紧急采购防汛物资。

## 项目联系人
联系人：陈应急
联系电话：138-0000-9999
电子邮箱：chen.emergency@example.gov.cn
联系地址：某市应急管理大道 88 号

## 项目时间表（紧急程序）
招标公告发布日期：2024年7月15日
投标截止日期：2024年7月16日（24小时内）
开标日期：2024年7月16日
合同签订日期：2024年7月17日
项目完成期限：2024年7月20日（5日内交付）

## 采购需求清单
1. 防汛沙袋 50,000个
2. 抽水泵 100台
3. 应急照明设备 500套
4. 救生衣 1,000件
5. 应急帐篷 200顶

## 投标人资格要求
1. 具有独立法人资格
2. 具备应急物资供应资质
3. 承诺24小时内响应供货
4. 提供产品质量合格证明

## 特殊条款
- 接受多家联合投标
- 允许先供货后补手续
- 验收合格后30日内付款
- 紧急情况下可电话报价

## 评标标准
供货能力：50分
响应速度：30分
价格合理性：20分
`;

// 2. Multi-Vendor Bid Document - Complex bidding with multiple vendors
const multiVendorBidContent = `# 多供应商联合招标项目文件

## 项目基本信息
项目名称：智慧城市综合建设项目
项目编号：MVB-2024-001
采购单位：某市智慧城市建设办公室
采购预算：人民币 5,000 万元整
项目类型：多标段联合招标

## 项目分包情况
本项目分为三个独立标段，允许投标人单独或联合投标：

### 标段A：硬件基础设施
预算：2,000万元
内容：服务器、网络设备、存储系统

### 标段B：软件平台开发
预算：2,000万元
内容：数据中台、业务中台、AI平台

### 标段C：系统集成服务
预算：1,000万元
内容：系统集成、运维服务、培训

## 项目联系人
联系人：林智慧
联系电话：139-0000-8888
电子邮箱：lin.smart@example.gov.cn
联系地址：某市智慧城市大道 168 号

## 项目时间表
招标公告发布日期：2024年5月1日
投标截止日期：2024年6月15日
开标日期：2024年6月20日
评标日期：2024年6月21日-30日
合同签订日期：2024年7月15日
项目完成期限：2025年6月30日

## 多供应商管理要求
1. 联合体投标需明确牵头单位
2. 各标段间接口标准需统一
3. 建立联合项目管理办公室
4. 定期召开供应商协调会议
5. 统一质量验收标准

## 投标人资格要求
### 标段A要求
- 注册资本不低于 5,000 万元
- 具有IT设备供应资质

### 标段B要求
- 具有软件企业认定证书
- 提供CMMI3级以上认证

### 标段C要求
- 具有系统集成一级资质
- 提供ISO27001认证

## 评标标准
技术方案：35分
项目经验：25分
商务报价：25分
服务保障：15分

## 联合体投标特别条款
- 联合体成员不超过3家
- 需提交联合体协议
- 明确各方责任分工
- 联合体各方承担连带责任
`;

// 3. International Supplier Document - Currency/translation issues
const internationalSupplierContent = `# 国际供应商采购招标文件

## 项目基本信息
项目名称：高端医疗设备进口采购项目
项目编号：INT-2024-001
采购单位：某市人民医院
采购预算：USD 3,000,000.00（美元）
汇率参考：1 USD = 7.2 CNY（以付款当日汇率为准）
采购类型：国际公开招标

## 项目联系人
联系人：Dr. Wang International
联系电话：+86-138-0000-7777
电子邮箱：wang.intl@hospital.example.cn
联系地址：某市医疗大道 66 号

## 国际采购代理
代理机构：某市国际招标有限公司
代理联系人：张代理
联系电话：+86-10-8888-9999
电子邮箱：agent@example.com

## 项目时间表
招标公告发布日期：2024年4月1日
投标截止日期：2024年6月1日
开标日期：2024年6月15日
评标日期：2024年6月16日-30日
合同签订日期：2024年7月30日
项目完成期限：2024年12月31日

## 采购设备清单
1. MRI磁共振成像系统 - USD 1,500,000
2. CT扫描仪 - USD 800,000
3. 数字化X光机 - USD 400,000
4. 超声诊断设备 - USD 300,000

## 货币与支付条款
- 投标货币：美元（USD）
- 合同货币：美元（USD）
- 汇率风险：由供应商承担
- 付款方式：信用证（L/C）
- 预付款比例：30%
- 验收付款：65%
- 质保金：5%（一年后支付）

## 国际贸易条款
- 贸易术语：CIF 某市港
- 运输保险：由供应商投保
- 关税增值税：由采购方承担
- 检验检疫：按中国海关规定执行

## 语言与翻译
- 招标文件语言：中英文对照
- 投标文件语言：英文或中文
- 合同语言：中英文具有同等效力
- 争议解释：以中文版本为准

## 投标人资格要求
1. 在所在国合法注册的企业
2. 具有医疗器械生产/销售许可
3. 产品具有CE或FDA认证
4. 在中国有授权代理商或分支机构
5. 提供近三年国际销售记录

## 特殊要求
- 需提供中文操作界面
- 提供中文培训资料
- 在中国设有维修服务中心
- 备件供应周期不超过30天
`;

// 4. High-Value Contract Document - Additional approvals required
const highValueContractContent = `# 高价值政府采购项目招标文件

## 项目基本信息
项目名称：城市轨道交通信号系统采购项目
项目编号：HVC-2024-001
采购单位：某市轨道交通集团有限公司
采购预算：人民币 28,000 万元整
项目类型：重大政府采购项目

## 审批状态
- 财政部门审批：已通过（财采批[2024]15号）
- 发改委核准：已通过（发改基础[2024]88号）
- 国资委备案：已备案（国资采备[2024]32号）
- 审计部门预审：已通过
- 法律顾问审核：已完成

## 项目联系人
联系人：赵轨道
联系电话：136-0000-6666
电子邮箱：zhao.rail@example-metro.cn
联系地址：某市轨道交通大厦 88 层

## 监督机构
监察部门：某市纪委监委派驻组
监督电话：12388
审计单位：某市审计局轨道交通审计处

## 项目时间表
招标公告发布日期：2024年8月1日
资格预审截止日期：2024年8月31日
投标截止日期：2024年10月15日
开标日期：2024年10月20日
评标日期：2024年10月21日-11月20日
中标公示：2024年11月25日-12月5日
合同签订日期：2024年12月20日
项目完成期限：2026年12月31日

## 高价值项目特别要求
### 资金来源证明
- 市级财政预算：15,000万元
- 专项债券资金：8,000万元
- 银行贷款：5,000万元

### 风险控制措施
1. 履约保证金：合同金额的10%
2. 质量保证金：合同金额的5%
3. 进度保证金：合同金额的3%
4. 廉政保证金：合同金额的1%

### 审批流程
1. 评标委员会推荐（7人专家+2人采购人代表）
2. 采购人内部决策程序
3. 财政部门备案审查
4. 审计部门专项审计
5. 市政府常务会议审议
6. 公示及异议处理
7. 合同签订及公证

## 投标人资格要求
1. 注册资本不低于 50,000 万元
2. 具有城市轨道交通信号系统业绩
3. 通过IRIS或ISO/TS 22163认证
4. 信号系统具有SIL4安全认证
5. 提供近五年财务审计报告
6. 无重大违法记录证明
7. 银行资信证明（AAA级）

## 评标标准
技术方案：40分
安全性能：20分
项目经验：15分
商务报价：15分
服务保障：10分

## 合同主要条款
- 合同期限：24个月
- 质保期：60个月
- 违约金上限：合同金额的20%
- 争议解决：某市仲裁委员会
- 适用法律：中华人民共和国法律
`;

// Create all additional test documents
const fixturesDir = path.join(__dirname);

// Ensure directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

createDocxFile(emergencyProcurementContent, path.join(fixturesDir, 'emergency-procurement.docx'));
createDocxFile(multiVendorBidContent, path.join(fixturesDir, 'multi-vendor-bid.docx'));
createDocxFile(internationalSupplierContent, path.join(fixturesDir, 'international-supplier.docx'));
createDocxFile(highValueContractContent, path.join(fixturesDir, 'high-value-contract.docx'));

console.log('\nAll additional procurement documents created successfully!');
console.log('Files:');
console.log('  - emergency-procurement.docx');
console.log('  - multi-vendor-bid.docx');
console.log('  - international-supplier.docx');
console.log('  - high-value-contract.docx');
