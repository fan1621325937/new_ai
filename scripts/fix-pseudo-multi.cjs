const fs = require('fs');
const path = require('path');
const svgDir = path.resolve('c:/Users/fnm/Desktop/AI/newAI/src/assets/icons/svg');

// 列表：这批因 mask 和白色路径被误标为多色的单色图标
const pseudoMultiFiles = [
  'close.svg',
  'deepThinking.svg',
  'deviceControl.svg',
  'link-2.svg',
  'recycle.svg',
  'warningLight.svg',
  'write.svg',
  'yinliang.svg',
  '上实心箭头.svg',
  '分屏.svg',
  '录像信息.svg',
  '录像呼叫.svg',
  '录像声音.svg',
  '录像挂断.svg',
  '录像演出.svg',
  '录像耳机.svg',
  '日志管理.svg',
  '电话-挂断_fill.svg',
  '电话呼叫.svg',
  '耳机.svg',
  'tableActiveIcon.svg'
];

let updatedCount = 0;

pseudoMultiFiles.forEach(fileName => {
  const filePath = path.join(svgDir, fileName);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  // 1. 替换非 mask 元素上的 style="fill:#FFFFFF..." 或 style="fill:white..."
  content = content.replace(/style="([^"]*)"/gi, (match, styleBody) => {
    let newStyle = styleBody
      .replace(/fill\s*:\s*(?:#ffffff|white)/gi, 'fill:currentColor')
      .replace(/stroke\s*:\s*(?:#ffffff|white)/gi, 'stroke:currentColor')
      .replace(/fill\s*:\s*#(?:33a3ff|32a1fc|c4c4c4)/gi, 'fill:currentColor')
      .replace(/fill\s*:\s*rgba\([^)]+\)/gi, 'fill:currentColor');
    return `style="${newStyle}"`;
  });

  // 2. 替换 path/g/rect/circle 属性上的 fill="#FFFFFF" 或 fill="white" (但跳过 mask 内部的 fill="white")
  // 匹配非 mask 标签的 fill
  content = content.replace(/(<(?!mask\b)[a-z0-9_-]+[^>]*?)\bfill="(?:#ffffff|white|#33a3ff|#32a1fc|#c4c4c4)"/gi, '$1fill="currentColor"');
  content = content.replace(/(<(?!mask\b)[a-z0-9_-]+[^>]*?)\bstroke="(?:#ffffff|white|#33a3ff|#32a1fc|#c4c4c4)"/gi, '$1stroke="currentColor"');

  // 3. 移除多余命名空间及 p-id
  content = content.replace(/\s+p-id="[^"]*"/gi, '');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    updatedCount++;
    console.log(`[Fixed Pseudo-Multi] ${fileName}`);
  }
});

console.log(`完成对 ${updatedCount} 个伪多色图标的规范化转换！`);
