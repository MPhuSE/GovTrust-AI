import { Injectable, NotFoundException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Observable, firstValueFrom } from 'rxjs';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { AI_SERVICE_GRPC } from '../../grpc/grpc.constants';

export interface SmartBotSource {
  content: string;
  relevanceScore: number;
  title: string;
  article: string;
  url: string;
  sourceVersion: string;
}

interface AIServiceGrpcClient {
  IdentifyProcedure(req: { query: string; sessionId: string }): Observable<{ procedureCode: string; confidence: number; message: string }>;
  ConsultSmartBot(req: { question: string; procedureCode: string; topK: number; procedureContext: string }): Observable<{ answer: string; procedureCode: string; sources: SmartBotSource[]; disclaimer: string }>;
}

@Injectable()
export class ProceduresService implements OnModuleInit {
  private aiGrpc: AIServiceGrpcClient;

  constructor(
    @InjectModel(Procedure.name) private procedureModel: Model<ProcedureDocument>,
    @Inject(AI_SERVICE_GRPC) private readonly aiClient: ClientGrpc,
  ) {}

  onModuleInit() {
    this.aiGrpc = this.aiClient.getService<AIServiceGrpcClient>('AIService');
  }

  findAll() {
    return this.procedureModel.find({ isActive: true }).select('code name description department');
  }

  async findByCode(code: string): Promise<ProcedureDocument> {
    const p = await this.procedureModel.findOne({ code, isActive: true });
    if (!p) throw new NotFoundException(`Thủ tục "${code}" không tồn tại`);
    return p;
  }

  async identify(userQuery: string) {
    try {
      // Gọi ai-svc qua gRPC (HoSoBot)
      const grpcResult = await firstValueFrom(
        this.aiGrpc.IdentifyProcedure({ query: userQuery, sessionId: '' }),
      );
      if (grpcResult.procedureCode) {
        const procedure = await this.findByCode(grpcResult.procedureCode);
        return { ...grpcResult, checklist: procedure.checklist, formFields: procedure.formFields };
      }
    } catch {
      // fallback
    }
    const procedures = await this.findAll();
    return { procedures, message: 'Vui lòng chọn thủ tục phù hợp' };
  }

  async consult(question: string, procedureCode: string, topK = 5) {
    // Lấy dữ liệu thủ tục từ Mongo → dựng context để SmartBot trả lời "cần giấy tờ gì"
    const procedure = await this.findByCode(procedureCode);
    const procedureContext = this.buildProcedureContext(procedure);
    return firstValueFrom(
      this.aiGrpc.ConsultSmartBot({ question, procedureCode, topK, procedureContext }),
    );
  }

  private buildProcedureContext(procedure: ProcedureDocument): string {
    const lines: string[] = [`Tên thủ tục: ${procedure.name}`];
    if (procedure.description) lines.push(`Mô tả: ${procedure.description}`);
    if (procedure.department) lines.push(`Cơ quan tiếp nhận: ${procedure.department}`);
    if (procedure.priorityConfig?.slaDays) {
      lines.push(`Thời hạn xử lý (SLA): ${procedure.priorityConfig.slaDays} ngày làm việc`);
    }

    const docs = (procedure.checklist ?? []).filter((item) => item.isRequired !== false);
    if (docs.length) {
      lines.push('Giấy tờ cần chuẩn bị:');
      docs.forEach((item, index) => {
        const role = item.roleInProcedure ? ` (${item.roleInProcedure})` : '';
        const qty = item.quantity ? ` — số lượng: ${item.quantity}` : '';
        const optional = item.isRequired === false ? ' [không bắt buộc]' : '';
        lines.push(`  ${index + 1}. ${item.documentTypeCode}${role}${qty}${optional}`);
      });
    }
    return lines.join('\n');
  }
}
