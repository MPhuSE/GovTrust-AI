import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DocumentType, DocumentTypeDocument } from '../../database/schemas/document-type.schema';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectModel(DocumentType.name) private model: Model<DocumentTypeDocument>,
  ) {}

  findAll() {
    return this.model.find({ isActive: true }).select('code name category fields validity aliasCodes');
  }

  async findByCode(code: string): Promise<DocumentTypeDocument> {
    const dt = await this.model.findOne({ code, isActive: true });
    if (!dt) throw new NotFoundException(`Loại giấy tờ "${code}" không tồn tại`);
    return dt;
  }
}
