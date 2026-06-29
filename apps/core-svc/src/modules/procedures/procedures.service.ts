import { Injectable, NotFoundException, OnModuleInit, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientGrpc } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Observable, firstValueFrom } from 'rxjs';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { AI_SERVICE_GRPC } from '../../grpc/grpc.constants';

interface AIServiceGrpcClient {
  IdentifyProcedure(req: { query: string; sessionId: string }): Observable<{ procedureCode: string; confidence: number; message: string }>;
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
}
