import { Model } from 'mongoose';
import { ProcedureDocument } from '../../database/schemas/procedure.schema';
import { SessionDocument } from '../../database/schemas/session.schema';
import { FormDocumentRenderer } from './form-document.renderer';
import { SmartFormService } from './smartform.service';

describe('SmartFormService', () => {
  it('maps OCR fields, procedure defaults and user overrides into one form draft', async () => {
    const procedure = {
      code: 'TEST',
      name: 'Thủ tục kiểm thử',
      formFields: [
        { id: 'coQuan', label: 'Cơ quan', required: true, sourceMap: [], defaultValue: 'UBND cấp xã' },
        { id: 'hoTen', label: 'Họ tên', required: true, sourceMap: ['cccd.hoTen'] },
        { id: 'mucDich', label: 'Mục đích', required: true, sourceMap: [] },
      ],
    } as unknown as ProcedureDocument;
    const session = {
      procedureId: procedure,
      aiResult: {
        score: { canSubmit: true },
        ocrData: {
          cccd: { fields: { hoTen: { value: 'Nguyễn Văn An', confidence: 0.98 } } },
        },
      },
    };
    const query = { populate: jest.fn().mockResolvedValue(session) };
    const sessionModel = {
      findById: jest.fn().mockReturnValue(query),
      findByIdAndUpdate: jest.fn().mockResolvedValue(session),
    };
    const service = new SmartFormService(
      sessionModel as unknown as Model<SessionDocument>,
      {} as Model<ProcedureDocument>,
      {} as never,
      {} as never,
      {} as never,
      {} as FormDocumentRenderer,
    );

    const result = await service.runGenerateNow('session-id', { mucDich: 'Đăng ký kết hôn' });

    expect(result.formData.coQuan).toMatchObject({ value: 'UBND cấp xã', source: 'PROCEDURE_DEFAULT' });
    expect(result.formData.hoTen).toMatchObject({ value: 'Nguyễn Văn An', source: 'cccd', confidence: 0.98 });
    expect(result.formData.mucDich).toMatchObject({ value: 'Đăng ký kết hôn', source: 'USER' });
    expect(result.missingFields).toEqual([]);
  });

  it('builds a seamless smartForm view: one editable field list in template order, flagging AI-filled', async () => {
    const procedure = {
      code: 'TEST',
      name: 'Thủ tục kiểm thử',
      formFields: [
        { id: 'coQuan', label: 'Cơ quan', required: true, sourceMap: [], defaultValue: 'UBND cấp xã' },
        { id: 'hoTen', label: 'Họ tên', required: true, sourceMap: ['cccd.hoTen'] },
        { id: 'ghiChu', label: 'Ghi chú', required: false, sourceMap: [] },
      ],
    } as unknown as ProcedureDocument;
    const session = {
      procedureId: procedure,
      aiResult: {
        score: { canSubmit: true },
        ocrData: {
          cccd: { fields: { hoTen: { value: 'Nguyễn Văn An', confidence: 0.98 } } },
        },
      },
    };
    const query = { populate: jest.fn().mockResolvedValue(session) };
    const sessionModel = {
      findById: jest.fn().mockReturnValue(query),
      findByIdAndUpdate: jest.fn().mockResolvedValue(session),
    };
    const service = new SmartFormService(
      sessionModel as unknown as Model<SessionDocument>,
      {} as Model<ProcedureDocument>,
      {} as never,
      {} as never,
      {} as never,
      {} as FormDocumentRenderer,
    );

    const result = await service.runGenerateNow('session-id');

    // UI liền mạch: `fields` là một danh sách DUY NHẤT theo đúng thứ tự template,
    // mọi ô đều editable; `filled` cho biết AI đã điền hay chưa.
    expect(result.smartForm.fields).toEqual([
      expect.objectContaining({ key: 'coQuan', value: 'UBND cấp xã', source: 'auto', editable: true, filled: true }),
      expect.objectContaining({ key: 'hoTen', value: 'Nguyễn Văn An', source: 'ocr', editable: true, filled: true }),
      expect.objectContaining({ key: 'ghiChu', value: '', source: 'manual', editable: true, filled: false, required: false }),
    ]);

    // autoFilledFields/manualFields vẫn giữ để tương thích ngược (phản ánh cùng dữ liệu).
    expect(result.smartForm.autoFilledFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'hoTen', value: 'Nguyễn Văn An', source: 'ocr' }),
        expect.objectContaining({ key: 'coQuan', value: 'UBND cấp xã', source: 'auto' }),
      ]),
    );
    expect(result.smartForm.manualFields).toEqual([
      expect.objectContaining({ key: 'ghiChu', value: '', source: 'manual', editable: true, required: false }),
    ]);
    expect(result.smartForm.procedureName).toBe('Thủ tục kiểm thử');

    // Persist cả formData và smartForm
    expect(sessionModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'session-id',
      expect.objectContaining({
        $set: expect.objectContaining({
          'aiResult.smartForm': result.smartForm,
        }),
      }),
    );
  });
});
