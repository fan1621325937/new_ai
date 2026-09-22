const fs = require('fs');
const path = require('path');
const dir = path.resolve('c:/Users/fnm/Desktop/AI/newAI/src/assets/icons/svg');

const targetFiles = [
  'deepThinking.svg',
  'pause.svg',
  'play.svg',
  'recycle.svg',
  'tableActiveIcon.svg',
  'warningLight.svg',
  'write.svg',
  '声音-大.svg',
  '打钻任务.svg',
  '演出.svg'
];

targetFiles.forEach(f => {
  const p = path.join(dir, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf-8');

  // 将 stroke="rgba(255, 255, 255, ...)" 改为 stroke="currentColor"
  content = content.replace(/\bstroke=["']rgba\([^)]+\)["']/gi, 'stroke="currentColor"');
  content = content.replace(/\bfill=["']rgba\([^)]+\)["']/gi, 'fill="currentColor"');

  // style 中的颜色
  content = content.replace(/style="([^"]*)"/gi, (match, s) => {
    let res = s
      .replace(/fill\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'fill:currentColor')
      .replace(/stroke\s*:\s*#[0-9a-fA-F]{3,8}/gi, 'stroke:currentColor')
      .replace(/fill\s*:\s*rgba\([^)]+\)/gi, 'fill:currentColor')
      .replace(/stroke\s*:\s*rgba\([^)]+\)/gi, 'stroke:currentColor');
    return `style="${res}"`;
  });

  // 属性上的颜色
  content = content.replace(/\bfill="(?!none\b|url\b)[^"]+"/gi, 'fill="currentColor"');
  content = content.replace(/\bstroke="(?!none\b|url\b)[^"]+"/gi, 'stroke="currentColor"');

  fs.writeFileSync(p, content.trim() + '\n', 'utf-8');
  console.log(`[Standardized] ${f}`);
});
