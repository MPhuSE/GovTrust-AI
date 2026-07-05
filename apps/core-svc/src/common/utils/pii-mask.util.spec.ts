import {
  anonymizeId,
  maskAddress,
  maskCrossCheck,
  maskDate,
  maskFieldValue,
  maskFormData,
  maskIdNumber,
  maskName,
  maskOcrData,
  maskScoreResult,
  maskSmartForm,
} from './pii-mask.util';

describe('pii-mask primitives', () => {
  it('masks id numbers keeping 2 head + 2 tail', () => {
    expect(maskIdNumber('012345678901')).toBe('01********01');
    expect(maskIdNumber('123')).toBe('***');
  });

  it('masks names keeping surname + initials', () => {
    expect(maskName('Nguyễn Văn An')).toBe('Nguyễn V. A.');
    expect(maskName('An')).toBe('A***');
  });

  it('masks dates keeping year only', () => {
    expect(maskDate('15/03/1990')).toBe('**/**/1990');
    expect(maskDate('không rõ')).toBe('**/**/****');
  });

  it('masks addresses keeping last administrative unit', () => {
    expect(maskAddress('12 Lê Lợi, P. Bến Nghé, Q.1, TP.HCM')).toBe('***, TP.HCM');
  });
});

describe('maskFieldValue routing by field key', () => {
  it('routes by semantic field name', () => {
    expect(maskFieldValue('soCCCD', '012345678901')).toBe('01********01');
    expect(maskFieldValue('hoTenChuHo', 'Lê Thái Hưng')).toBe('Lê T. H.');
    expect(maskFieldValue('ngaySinh', '01/01/2000')).toBe('**/**/2000');
    expect(maskFieldValue('noiThuongTru', 'Số 5, Hà Nội')).toBe('***, Hà Nội');
  });

  it('leaves non-PII fields untouched', () => {
    expect(maskFieldValue('nganhNghe', 'Bán lẻ')).toBe('Bán lẻ');
    expect(maskFieldValue('soCCCD', 123)).toBe(123);
  });
});

describe('maskOcrData', () => {
  it('masks field values but keeps structure + metadata', () => {
    const masked = maskOcrData({
      cccd_nguoi_yeu_cau: {
        documentTypeCode: 'CCCD',
        source: 'EKYC_PROFILE',
        fields: {
          soCCCD: { value: '012345678901', confidence: 0.99 },
          hoTen: { value: 'Nguyễn Văn An', confidence: 0.98 },
        },
      },
    }) as any;
    expect(masked.cccd_nguoi_yeu_cau.source).toBe('EKYC_PROFILE');
    expect(masked.cccd_nguoi_yeu_cau.fields.soCCCD).toEqual({ value: '01********01', confidence: 0.99 });
    expect(masked.cccd_nguoi_yeu_cau.fields.hoTen.value).toBe('Nguyễn V. A.');
  });

  it('returns undefined untouched', () => {
    expect(maskOcrData(undefined)).toBeUndefined();
  });
});

describe('maskCrossCheck', () => {
  it('masks left/right values and rebuilds message', () => {
    const masked = maskCrossCheck({
      checks: [
        { field: 'hoTenChuHo', status: 'MISMATCH', leftValue: 'Nguyễn Văn An', rightValue: 'Lê Thái Hưng' },
      ],
    }) as any;
    expect(masked.checks[0].leftValue).toBe('Nguyễn V. A.');
    expect(masked.checks[0].rightValue).toBe('Lê T. H.');
    expect(masked.checks[0].message).toBe('Không khớp — "Nguyễn V. A." ≠ "Lê T. H."');
  });
});

describe('anonymizeId', () => {
  it('is deterministic and non-reversible (16 hex chars)', () => {
    const id = '507f1f77bcf86cd799439011';
    expect(anonymizeId(id)).toMatch(/^[0-9a-f]{16}$/);
    expect(anonymizeId(id)).toBe(anonymizeId(id));
    expect(anonymizeId(id)).not.toContain(id);
  });
});

describe('maskScoreResult', () => {
  it('masks original values embedded in breakdown.detail and recommendation', () => {
    const masked = maskScoreResult({
      score: 90,
      breakdown: [
        { ruleId: 'mismatch-info', severity: 'CRITICAL', detail: 'Thông tin không khớp — hoTenChuHo: "Nguyễn Văn An" ≠ "Lê Thái Hưng"' },
      ],
      recommendation: 'Cần khắc phục: Thông tin không khớp — hoTenChuHo: "Nguyễn Văn An" ≠ "Lê Thái Hưng".',
    }) as any;
    expect(masked.breakdown[0].detail).toBe('Thông tin không khớp — hoTenChuHo: "Nguyễn V. A." ≠ "Lê T. H."');
    expect(masked.recommendation).toContain('"Nguyễn V. A." ≠ "Lê T. H."');
    expect(JSON.stringify(masked)).not.toContain('Nguyễn Văn An');
  });

  it('masks values when field is a multi-word Vietnamese label (rule-engine mới)', () => {
    const masked = maskScoreResult({
      score: 82,
      breakdown: [
        { ruleId: 'mismatch-info', severity: 'HIGH', detail: 'Thông tin không khớp — Tên người được ủy quyền: "Đinh Ngọc Anh" ≠ "Nguyễn Đăng Kiên"' },
      ],
      recommendation: 'Cần khắc phục: Thông tin không khớp — Tên người được ủy quyền: "Đinh Ngọc Anh" ≠ "Nguyễn Đăng Kiên".',
    }) as any;
    expect(masked.breakdown[0].detail).toBe('Thông tin không khớp — Tên người được ủy quyền: "Đinh N. A." ≠ "Nguyễn Đ. K."');
    // PII gốc không được lọt ra ngoài với người xem không phải chủ hồ sơ.
    expect(JSON.stringify(masked)).not.toContain('Đinh Ngọc Anh');
    expect(JSON.stringify(masked)).not.toContain('Nguyễn Đăng Kiên');
  });

  it('masks multiple mismatches separated by "; " independently', () => {
    const masked = maskScoreResult({
      score: 70,
      breakdown: [
        { ruleId: 'mismatch-info', severity: 'HIGH', detail: 'Thông tin không khớp — Họ tên chủ hộ: "Nguyễn Văn An" ≠ "Lê Thái Hưng"; Địa chỉ thửa đất: "12 Lê Lợi, Huế" ≠ "12 Lê Lai, Huế"' },
      ],
    }) as any;
    expect(masked.breakdown[0].detail).toContain('Họ tên chủ hộ: "Nguyễn V. A." ≠ "Lê T. H."');
    expect(masked.breakdown[0].detail).toContain('Địa chỉ thửa đất: "***, Huế" ≠ "***, Huế"');
    expect(JSON.stringify(masked)).not.toContain('Nguyễn Văn An');
    expect(JSON.stringify(masked)).not.toContain('Lê Lợi');
  });
});

describe('maskFormData', () => {
  it('masks dotted-key form fields by their leaf name', () => {
    const masked = maskFormData({
      'chuHo.hoTen': { value: 'Nguyễn Văn An', source: 'cccd', editable: true },
      'chuHo.soCCCD': { value: '012345678901', source: 'cccd', editable: true },
      'hoKinhDoanh.nganhNghe': { value: 'Bán lẻ', source: 'giay_hkd', editable: true },
    }) as any;
    expect(masked['chuHo.hoTen'].value).toBe('Nguyễn V. A.');
    expect(masked['chuHo.soCCCD'].value).toBe('01********01');
    expect(masked['hoKinhDoanh.nganhNghe'].value).toBe('Bán lẻ');
    expect(masked['chuHo.hoTen'].editable).toBe(true);
  });
});

describe('maskSmartForm', () => {
  it('masks PII in autoFilledFields by field key, leaves manualFields untouched', () => {
    const masked = maskSmartForm({
      procedureName: 'Đăng ký khai sinh',
      autoFilledFields: [
        { key: 'hoTen', label: 'Họ tên', value: 'Nguyễn Văn An', source: 'ocr', editable: false },
        { key: 'soCCCD', label: 'Số CCCD', value: '012345678901', source: 'ocr', editable: false },
      ],
      manualFields: [
        { key: 'ghiChu', label: 'Ghi chú', value: 'nội dung tự nhập', source: 'manual', editable: true },
      ],
    }) as any;
    expect(masked.autoFilledFields[0].value).toBe('Nguyễn V. A.');
    expect(masked.autoFilledFields[1].value).toBe('01********01');
    expect(masked.manualFields[0].value).toBe('nội dung tự nhập');
    expect(JSON.stringify(masked)).not.toContain('012345678901');
  });

  it('returns non-object input unchanged', () => {
    expect(maskSmartForm(undefined)).toBeUndefined();
    expect(maskSmartForm(null)).toBeNull();
  });
});
