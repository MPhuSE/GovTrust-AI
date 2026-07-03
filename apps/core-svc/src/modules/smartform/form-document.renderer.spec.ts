import { ProcedureDocument } from '../../database/schemas/procedure.schema';
import { FormDocumentRenderer } from './form-document.renderer';
import PizZip = require('pizzip');

describe('FormDocumentRenderer', () => {
  const procedure = {
    code: 'DK_THUONG_TRU',
    name: 'Đăng ký thường trú',
    outputTemplate: {
      key: 'CT_THUONG_TRU',
      displayName: 'Tờ khai đăng ký thường trú',
      originalFile: 'template/renderable/CT_THUONG_TRU.docx',
      version: 'MVP',
      outputFormats: ['docx', 'pdf'],
    },
    formFields: [
      { id: 'nguoiYeuCau.hoTen', label: 'Họ và tên người yêu cầu', required: true, sourceMap: [] },
      { id: 'cuTru.diaChiThuongTru', label: 'Địa chỉ thường trú', required: true, sourceMap: [] },
    ],
  } as unknown as ProcedureDocument;
  const values = {
    __sessionId: 'session-test',
    'nguoiYeuCau.hoTen': 'Nguyễn Văn An',
    'cuTru.diaChiThuongTru': '123 Đường ABC, Phường XYZ',
  };

  it('renders a non-empty DOCX draft', async () => {
    const buffer = await new FormDocumentRenderer().renderDocx(procedure, values);

    expect(buffer.subarray(0, 2).toString()).toBe('PK');
    expect(buffer.length).toBeGreaterThan(1000);
    const xml = new PizZip(buffer).file('word/document.xml')?.asText() ?? '';
    expect(xml).toContain('Nguyễn Văn An');
    expect(xml).not.toContain('{{nguoiYeuCau.hoTen}}');
  });

  it('renders a Vietnamese PDF draft', async () => {
    const buffer = await new FormDocumentRenderer().renderPdf(procedure, values);

    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(1000);
  });
});
