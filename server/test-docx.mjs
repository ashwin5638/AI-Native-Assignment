import mammoth from 'mammoth'
const r = await mammoth.extractRawText({ path: 'test.docx' })
console.log(JSON.stringify(r))