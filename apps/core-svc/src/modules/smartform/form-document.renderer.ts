import { Injectable } from '@nestjs/common';
import {
  AlignmentType,
  BorderStyle,
  Document as DocxDocument,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import PDFDocument = require('pdfkit');
import Docxtemplater = require('docxtemplater');
import PizZip = require('pizzip');
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { ProcedureDocument } from '../../database/schemas/procedure.schema';

@Injectable()
export class FormDocumentRenderer {
  async renderDocx(procedure: ProcedureDocument, values: Record<string, string>): Promise<Buffer> {
    const officialDraft = this.renderCollectedTemplate(procedure, values);
    if (officialDraft) return officialDraft;

    const rows = procedure.formFields.map(field => new TableRow({
      children: [
        new TableCell({
          width: { size: 38, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: field.label, bold: true })] })],
        }),
        new TableCell({
          width: { size: 62, type: WidthType.PERCENTAGE },
          children: [new Paragraph(values[field.id] || '................................................................')],
        }),
      ],
    }));

    const document = new DocxDocument({
      sections: [{
        properties: {
          page: {
            size: { width: 11906, height: 16838 },
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: 'Độc lập - Tự do - Hạnh phúc', bold: true, underline: {} })],
          }),
          new Paragraph({ text: '', spacing: { after: 180 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: procedure.outputTemplate?.displayName ?? procedure.name, bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: `Mã hồ sơ tiền kiểm: ${values.__sessionId ?? ''}`, italics: true })],
            spacing: { after: 240 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4 },
              bottom: { style: BorderStyle.SINGLE, size: 4 },
              left: { style: BorderStyle.SINGLE, size: 4 },
              right: { style: BorderStyle.SINGLE, size: 4 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 2 },
              insideVertical: { style: BorderStyle.SINGLE, size: 2 },
            },
            rows,
          }),
          new Paragraph({ text: '', spacing: { after: 280 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun('………, ngày …… tháng …… năm ………')],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Người yêu cầu', bold: true })],
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: '(Ký, ghi rõ họ tên)', italics: true })],
          }),
          new Paragraph({ text: '', spacing: { before: 600 } }),
          new Paragraph({
            children: [new TextRun({
              text: `Bản nháp do GovTrust AI tự điền theo mẫu tham chiếu: ${procedure.outputTemplate?.originalFile ?? 'biểu mẫu công khai'}. Người dùng phải kiểm tra trước khi sử dụng.`,
              size: 18,
              italics: true,
              color: '666666',
            })],
          }),
        ],
      }],
    });

    return Packer.toBuffer(document);
  }

  private renderCollectedTemplate(
    procedure: ProcedureDocument,
    values: Record<string, string>,
  ): Buffer | undefined {
    const key = procedure.outputTemplate?.key;
    if (!key) return undefined;
    const relativePath = `template/renderable/${key}.docx`;
    const candidates = [
      resolve(process.cwd(), relativePath),
      resolve(process.cwd(), '..', '..', relativePath),
      resolve('/app', relativePath),
    ];
    const templatePath = candidates.find(existsSync);
    if (!templatePath) return undefined;

    // Conditional rendering: xóa các trường công trình nếu user không chọn đăng ký
    const finalValues = this.applyConditionalRules(key, values);

    const zip = new PizZip(readFileSync(templatePath));
    const template = new Docxtemplater(zip, {
      delimiters: { start: '{{', end: '}}' },
      paragraphLoop: true,
      linebreaks: true,
      nullGetter: () => '',
    });
    template.render(finalValues);
    return template.getZip().generate({ type: 'nodebuffer' });
  }

  /**
   * Áp dụng logic conditional cho từng template
   */
  private applyConditionalRules(
    templateKey: string,
    values: Record<string, string>,
  ): Record<string, any> {
    const result: Record<string, any> = { ...values };

    // Template DKDD_CHUYEN_NHUONG: xử lý phần 3 (công trình)
    if (templateKey === 'DKDD_CHUYEN_NHUONG') {
      const dangKyCongTrinh = values['congTrinh.dangKy']?.toLowerCase() === 'true';

      // Chuyển sang nested object để docxtemplater hiểu conditional {#congTrinh.dangKy}
      result['congTrinh'] = {
        dangKy: dangKyCongTrinh,  // Boolean để docxtemplater check
        loai: dangKyCongTrinh ? (values['congTrinh.loai'] || 'N/A') : undefined,
        soTang: dangKyCongTrinh ? (values['congTrinh.soTang'] || 'N/A') : undefined,
        chieuCao: dangKyCongTrinh ? (values['congTrinh.chieuCao'] || 'N/A') : undefined,
        matDoXayDung: dangKyCongTrinh ? (values['congTrinh.matDoXayDung'] || 'N/A') : undefined,
        chiTieuKhac: dangKyCongTrinh ? (values['congTrinh.chiTieuKhac'] || 'N/A') : undefined,
      };

      // Xóa các flat keys cũ
      delete result['congTrinh.dangKy'];
      delete result['congTrinh.loai'];
      delete result['congTrinh.soTang'];
      delete result['congTrinh.chieuCao'];
      delete result['congTrinh.matDoXayDung'];
      delete result['congTrinh.chiTieuKhac'];
    }

    return result;
  }

  async renderPdf(procedure: ProcedureDocument, values: Record<string, string>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const document = new PDFDocument({ size: 'A4', margin: 52, info: { Title: procedure.name } });
      const chunks: Buffer[] = [];
      document.on('data', chunk => chunks.push(Buffer.from(chunk)));
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);

      const fontPath = require.resolve('@fontsource/noto-sans/files/noto-sans-vietnamese-400-normal.woff');
      document.registerFont('NotoSans', fontPath).font('NotoSans');
      document.fontSize(11).text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      document.text('Độc lập - Tự do - Hạnh phúc', { align: 'center', underline: true });
      document.moveDown(1.2);
      document.fontSize(16).text(procedure.outputTemplate?.displayName ?? procedure.name, { align: 'center' });
      document.moveDown(1.2);

      for (const field of procedure.formFields) {
        document.fontSize(10).fillColor('#333333').text(field.label, { continued: true, width: 210 });
        document.fillColor('#000000').text(`: ${values[field.id] || '........................................................'}`);
        document.moveDown(0.35);
      }

      document.moveDown(1.5);
      document.text('………, ngày …… tháng …… năm ………', { align: 'right' });
      document.text('Người yêu cầu', { align: 'right' });
      document.text('(Ký, ghi rõ họ tên)', { align: 'right' });
      document.moveDown(3);
      document.fontSize(8).fillColor('#666666').text(
        `Bản nháp do GovTrust AI tự điền theo mẫu tham chiếu: ${procedure.outputTemplate?.originalFile ?? 'biểu mẫu công khai'}. Người dùng phải kiểm tra trước khi sử dụng.`,
      );
      document.end();
    });
  }
}
