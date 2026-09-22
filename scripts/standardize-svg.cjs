const fs = require('fs');
const path = require('path');

const svgDir = path.resolve('c:/Users/fnm/Desktop/AI/newAI/src/assets/icons/svg');
const backupDir = path.resolve('c:/Users/fnm/Desktop/AI/newAI/src/assets/icons/svg_backup');

// 1. 备份原图标
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  const allFiles = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));
  allFiles.forEach(f => {
    fs.copyFileSync(path.join(svgDir, f), path.join(backupDir, f));
  });
  console.log(`[Backup] 成功备份 ${allFiles.length} 个图标到 ${backupDir}`);
}

// 读取详细分类分析结果
const analysisData = require('C:/Users/fnm/.gemini/antigravity-ide/brain/a3f1ae78-9f33-41a3-9879-9ca89859ab92/scratch/categorized-svg-report.json');

const singleHardcodedList = new Set(analysisData.categorized.single_hardcoded);
const emptyFillList = new Set(analysisData.categorized.empty_fill);
const noViewBoxList = new Set(analysisData.categorized.no_viewbox);

let cleanedColorCount = 0;
let fixedViewBoxCount = 0;
const modifiedFiles = [];

const files = fs.readdirSync(svgDir).filter(f => f.endsWith('.svg'));

files.forEach(fileName => {
  const filePath = path.join(svgDir, fileName);
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;
  let isModified = false;

  // A. 修复缺失 viewBox
  if (noViewBoxList.has(fileName) || !/viewBox=["'][^"']+["']/i.test(content)) {
    const widthMatch = content.match(/\bwidth=["']([0-9.]+)(?:px)?["']/i);
    const heightMatch = content.match(/\bheight=["']([0-9.]+)(?:px)?["']/i);
    if (widthMatch && heightMatch) {
      const w = parseFloat(widthMatch[1]);
      const h = parseFloat(heightMatch[1]);
      if (w > 0 && h > 0) {
        // 在 <svg 后面插入 viewBox
        content = content.replace(/(<svg\b[^>]*)/i, (match) => {
          if (!/viewBox=/i.test(match)) {
            return `${match} viewBox="0 0 ${w} ${h}"`;
          }
          return match;
        });
        fixedViewBoxCount++;
        isModified = true;
      }
    }
  }

  // B. 针对 single_hardcoded 与 empty_fill 执行精准颜色规范化
  if (singleHardcodedList.has(fileName) || emptyFillList.has(fileName)) {
    // 移除 XML 声明和 DOCTYPE
    content = content.replace(/<\?xml[^>]*\?>/gi, '');
    content = content.replace(/<!DOCTYPE[^>]*>/gi, '');

    // 移除 p-id 和 t 属性
    content = content.replace(/\s+p-id="[^"]*"/gi, '');
    content = content.replace(/\s+t="[^"]*"/gi, '');

    // 移除空 defs 样式 <defs><style...></style></defs>
    content = content.replace(/<defs>\s*<style[^>]*>\s*<\/style>\s*<\/defs>/gi, '');

    // 处理 fill="" -> 移除或者转为 fill="currentColor"
    content = content.replace(/\bfill=""/gi, 'fill="currentColor"');
    content = content.replace(/\bfill=''/gi, 'fill="currentColor"');

    // 处理行内 style 中的 fill / stroke
    // 例如 style="fill:#FFFFFF" -> style="fill:currentColor" 或 直接删除style fill
    content = content.replace(/style="([^"]*)"/gi, (match, styleContent) => {
      let updatedStyle = styleContent
        .replace(/fill\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'fill:currentColor')
        .replace(/stroke\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'stroke:currentColor')
        .replace(/fill\s*:\s*white/gi, 'fill:currentColor')
        .replace(/fill\s*:\s*black/gi, 'fill:currentColor')
        .replace(/stroke\s*:\s*white/gi, 'stroke:currentColor')
        .replace(/stroke\s*:\s*black/gi, 'stroke:currentColor');
      return updatedStyle.trim() ? `style="${updatedStyle}"` : '';
    });

    // 替换元素属性上的 fill="#xxx" -> fill="currentColor" (保留 fill="none")
    content = content.replace(/\bfill="(?!none\b|url\b)[^"]+"/gi, 'fill="currentColor"');
    content = content.replace(/\bfill='(?!none\b|url\b)[^']+'/gi, 'fill="currentColor"');

    // 替换元素属性上的 stroke="#xxx" -> stroke="currentColor" (保留 stroke="none")
    content = content.replace(/\bstroke="(?!none\b|url\b)[^"]+"/gi, 'stroke="currentColor"');
    content = content.replace(/\bstroke='(?!none\b|url\b)[^']+'/gi, 'stroke="currentColor"');

    cleanedColorCount++;
    isModified = true;
  }

  // 整理空白字符
  if (isModified) {
    content = content.trim() + '\n';
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf-8');
      modifiedFiles.push(fileName);
    }
  }
});

console.log('=== 清洗与规范化完成 ===');
console.log(`处理单色硬编码与空fill图标: ${cleanedColorCount} 个`);
console.log(`修复缺失viewBox图标: ${fixedViewBoxCount} 个`);
console.log(`实际写入更新文件: ${modifiedFiles.length} 个`);
