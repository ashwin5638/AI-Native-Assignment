import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import os from 'os'

const dir = path.join(os.tmpdir(), 'docx_test')
if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
fs.mkdirSync(path.join(dir, '_rels'), { recursive: true })
fs.mkdirSync(path.join(dir, 'word/_rels'), { recursive: true })
fs.mkdirSync(path.join(dir, 'docProps'), { recursive: true })

fs.writeFileSync(path.join(dir, '[Content_Types].xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>')
fs.writeFileSync(path.join(dir, '_rels/.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>')
fs.writeFileSync(path.join(dir, 'word/_rels/document.xml.rels'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="document.xml"/></Relationships>')
fs.writeFileSync(path.join(dir, 'word/document.xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Hello World from DOCX</w:t></w:r></w:p></w:body></w:document>')
fs.writeFileSync(path.join(dir, 'docProps/core.xml'), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><coreProperties xmlns="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:creator>test</dc:creator></coreProperties>')

execSync(`"${process.env.SystemRoot}\\System32\\tar.exe" -acf test.docx *`, { cwd: dir, shell: 'cmd.exe' })
fs.copyFileSync(path.join(dir, 'test.docx'), 'D:/tech/vibe-code/docs-editor/server/test.docx')
fs.rmSync(dir, { recursive: true })
console.log('test.docx created')
