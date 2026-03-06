const fs = require('fs')
const path = require('path')

const BRAND = '#7a1200'
const BRAND_HOVER = '#5a0d00'
const BRAND_LIGHT = '#fdf2f0'
const BRAND_LIGHT_TEXT = '#7a1200'

// Pola penggantian berurutan (lebih spesifik dulu)
const replacements = [
  // Button utama
  [/bg-teal-600 hover:bg-teal-700/g, `bg-[${BRAND}] hover:bg-[${BRAND_HOVER}]`],
  [/bg-teal-700 hover:bg-teal-800/g, `bg-[${BRAND_HOVER}] hover:bg-[#420900]`],
  // Status badge aktif
  [/bg-teal-50 text-teal-700 border border-teal-200/g, `bg-red-50 text-red-800 border border-red-200`],
  // Tombol ghost teal
  [/text-teal-600 hover:bg-teal-50/g, `text-[${BRAND}] hover:bg-red-50`],
  [/text-teal-600 border-teal-200 hover:bg-teal-50/g, `text-[${BRAND}] border-red-200 hover:bg-red-50`],
  // Badge
  [/bg-teal-600 text-white/g, `bg-[${BRAND}] text-white`],
  [/bg-teal-100 text-teal-700/g, `bg-red-100 text-red-800`],
  // Icon wrapper
  [/bg-teal-50 flex items-center justify-center text-teal-600/g, `bg-red-50 flex items-center justify-center text-[${BRAND}]`],
  [/w-24 h-24 rounded-full bg-teal-50 flex items-center justify-center text-teal-600/g, `w-24 h-24 rounded-full bg-red-50 flex items-center justify-center text-[${BRAND}]`],
  // Filter active state
  [/bg-teal-50 border-teal-600/g, `bg-red-50 border-[${BRAND}]`],
  // Scan state
  [/border-teal-400 bg-teal-50/g, `border-red-400 bg-red-50`],
  // Remaining sisa teal
  [/text-teal-600/g, `text-[${BRAND}]`],
  [/text-teal-700/g, `text-[${BRAND_HOVER}]`],
  [/bg-teal-600/g, `bg-[${BRAND}]`],
  [/bg-teal-700/g, `bg-[${BRAND_HOVER}]`],
  [/bg-teal-800/g, `bg-[#420900]`],
  [/bg-teal-50/g, `bg-red-50`],
  [/bg-teal-100/g, `bg-red-100`],
  [/border-teal-600/g, `border-[${BRAND}]`],
  [/border-teal-400/g, `border-red-400`],
  [/border-teal-200/g, `border-red-200`],
  [/border-teal-500/g, `border-[${BRAND}]`],
  [/progress.*bg-teal-500/g, (m) => m.replace('bg-teal-500', `bg-[${BRAND}]`)],
  [/bg-teal-500/g, `bg-[${BRAND}]`],
  [/\.text-teal-500/g, `.text-[${BRAND}]`],
]

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  const original = content

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ ${path.relative(process.cwd(), filePath)}`)
  }
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && !['node_modules', '.next', '.git'].includes(entry.name)) {
      walk(fullPath)
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      processFile(fullPath)
    }
  }
}

const targetDir = path.join(__dirname, '..', 'app', 'dashboard')
console.log('🔄 Mass replacing teal → brand color (#7a1200)...\n')
walk(targetDir)
console.log('\n✅ Selesai!')
