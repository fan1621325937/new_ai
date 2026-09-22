const fs = require('fs');
const path = require('path');
const dir = path.resolve('c:/Users/fnm/Desktop/AI/newAI/src/assets/icons/svg');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
let unwrappedCount = 0;

files.forEach(fileName => {
  const filePath = path.join(dir, fileName);
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;

  if (content.includes('bg-mask-0') || content.includes('path_0')) {
    // 移除 <defs><rect id="path_0" .../></defs> 或类似无用 rect defs
    content = content.replace(/<defs>\s*<rect\b[^>]*\bid=["']path_0["'][^>]*\/>\s*<\/defs>/gi, '');
    content = content.replace(/<defs>\s*<rect\b[^>]*\bid=["']path_0["'][^>]*><\/rect>\s*<\/defs>/gi, '');

    // 移除 <mask id="bg-mask-0"...>...</mask>
    content = content.replace(/<mask\b[^>]*\bid=["']bg-mask-0["'][^>]*>[\s\S]*?<\/mask>/gi, '');

    // 移除 <g mask="url(#bg-mask-0)"> 及其配对闭合标签 </g>
    // 采用更精准的标签解包：
    content = content.replace(/<g\b[^>]*\bmask=["']url\(#bg-mask-0\)["'][^>]*>/gi, '');
    
    // 清理可能遗留的空 defs
    content = content.replace(/<defs>\s*<\/defs>/gi, '');

    // 清理闭合的尾部多余 </g>，先校验标签平衡
    // 统计 <g 和 </g> 的数量
    let openG = (content.match(/<g\b/gi) || []).length;
    let closeG = (content.match(/<\/g>/gi) || []).length;
    while (closeG > openG) {
      // 移除最后一个 </g>
      const lastIndex = content.lastIndexOf('</g>');
      if (lastIndex !== -1) {
        content = content.slice(0, lastIndex) + content.slice(lastIndex + 4);
      }
      closeG--;
    }

    // 确保 path/g/polygon 均使用 currentColor
    content = content.replace(/style="([^"]*)"/gi, (match, styleBody) => {
      let newStyle = styleBody
        .replace(/fill\s*:\s*(?:#ffffff|white)/gi, 'fill:currentColor')
        .replace(/stroke\s*:\s*(?:#ffffff|white)/gi, 'stroke:currentColor');
      return `style="${newStyle}"`;
    });

    content = content.trim() + '\n';

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf-8');
      unwrappedCount++;
      console.log(`[Unwrapped Mask] ${fileName}`);
    }
  }
});

console.log(`成功解包并彻底消除 ${unwrappedCount} 个文件的冗余蒙版与ID冲突！`);
