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
      {} as FormDocumentRenderer,
    );

    const result = await service.runGenerateNow('session-id', { mucDich: 'Đăng ký kết hôn' });

    expect(result.formData.coQuan).toMatchObject({ value: 'UBND cấp xã', source: 'PROCEDURE_DEFAULT' });
    expect(result.formData.hoTen).toMatchObject({ value: 'Nguyễn Văn An', source: 'cccd', confidence: 0.98 });
    expect(result.formData.mucDich).toMatchObject({ value: 'Đăng ký kết hôn', source: 'USER' });
    expect(result.missingFields).toEqual([]);
  });

  it('builds a smartForm view splitting auto-filled (OCR/default) from manual fields', async () => {
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
      {} as FormDocumentRenderer,
    );

    const result = await service.runGenerateNow('session-id');

    // OCR-filled + default → autoFilledFields (không sửa được)
    expect(result.smartForm.autoFilledFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'hoTen', value: 'Nguyễn Văn An', source: 'ocr', editable: false }),
        expect.objectContaining({ key: 'coQuan', value: 'UBND cấp xã', source: 'auto', editable: false }),
      ]),
    );
    // Trường trống → manualFields (người dùng tự nhập)
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
