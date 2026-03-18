/**
 * Test Procurement Document Generator
 * Creates realistic DOCX files for testing the procurement review workflow
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

// Document contents
const validProcurementContent = `# 政府采购项目招标文件

## 项目基本信息
项目名称：智慧校园信息化建设项目
项目编号：XYZ-2024-001
采购单位：某市教育局
采购预算：人民币 500 万元整

## 项目联系人
联系人：张三
联系电话：138-0000-1234
电子邮箱：zhangsan@example.edu.cn
联系地址：某市教育大道 100 号

## 项目时间表
招标公告发布日期：2024年3月1日
投标截止日期：2024年3月31日
开标日期：2024年4月5日
合同签订日期：2024年4月20日
项目完成期限：2024年12月31日

## 项目需求概述
本项目旨在建设智慧校园信息化平台，包括：
1. 校园网络基础设施升级
2. 教学管理系统开发
3. 学生信息管理平台
4. 家校互动系统

## 投标人资格要求
1. 具有独立法人资格
2. 注册资本不低于 1000 万元
3. 具有相关项目经验
4. 提供近三年财务审计报告

## 评标标准
技术方案：40分
商务报价：30分
项目经验：20分
售后服务：10分
`;

const missingBudgetContent = `# 政府采购项目招标文件

## 项目基本信息
项目名称：智慧校园信息化建设项目
项目编号：XYZ-2024-002
采购单位：某市教育局

## 项目联系人
联系人：李四
联系电话：139-0000-5678
电子邮箱：lisi@example.edu.cn
联系地址：某市教育大道 100 号

## 项目时间表
招标公告发布日期：2024年3月1日
投标截止日期：2024年3月31日
开标日期：2024年4月5日
合同签订日期：2024年4月20日
项目完成期限：2024年12月31日

## 项目需求概述
本项目旨在建设智慧校园信息化平台。

## 投标人资格要求
1. 具有独立法人资格
2. 注册资本不低于 1000 万元
3. 具有相关项目经验
`;

const invalidContactContent = `# 政府采购项目招标文件

## 项目基本信息
项目名称：智慧校园信息化建设项目
项目编号：XYZ-2024-003
采购单位：某市教育局
采购预算：人民币 500 万元整

## 项目联系人
联系人：王五
联系电话：invalid-phone
电子邮箱：not-an-email
联系地址：

## 项目时间表
招标公告发布日期：2024年3月1日
投标截止日期：2024年3月31日
开标日期：2024年4月5日
合同签订日期：2024年4月20日
项目完成期限：2024年12月31日

## 项目需求概述
本项目旨在建设智慧校园信息化平台。
`;

const incompleteTimelineContent = `# 政府采购项目招标文件

## 项目基本信息
项目名称：智慧校园信息化建设项目
项目编号：XYZ-2024-004
采购单位：某市教育局
采购预算：人民币 500 万元整

## 项目联系人
联系人：赵六
联系电话：137-0000-9999
电子邮箱：zhaoliu@example.edu.cn
联系地址：某市教育大道 100 号

## 项目时间表
招标公告发布日期：2024年3月1日
投标截止日期：待定
开标日期：待定
合同签订日期：待定
项目完成期限：待定

## 项目需求概述
本项目旨在建设智慧校园信息化平台。
`;

// Create all test documents
const fixturesDir = path.join(__dirname);

// Ensure directory exists
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

createDocxFile(validProcurementContent, path.join(fixturesDir, 'valid-procurement.docx'));
createDocxFile(missingBudgetContent, path.join(fixturesDir, 'missing-budget.docx'));
createDocxFile(invalidContactContent, path.join(fixturesDir, 'invalid-contact.docx'));
createDocxFile(incompleteTimelineContent, path.join(fixturesDir, 'incomplete-timeline.docx'));

console.log('\nAll test procurement documents created successfully!');
console.log('Files:');
console.log('  - valid-procurement.docx');
console.log('  - missing-budget.docx');
console.log('  - invalid-contact.docx');
console.log('  - incomplete-timeline.docx');
