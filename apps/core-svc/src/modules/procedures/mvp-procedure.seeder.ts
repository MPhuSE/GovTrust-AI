import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { MVP_PROCEDURES } from './mvp-procedures';

@Injectable()
export class MvpProcedureSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(MvpProcedureSeeder.name);

  constructor(
    @InjectModel(Procedure.name) private readonly procedureModel: Model<ProcedureDocument>,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get<string>('SEED_MVP_PROCEDURES', 'true') === 'false') return;

    for (const procedure of MVP_PROCEDURES) {
      await this.procedureModel.updateOne(
        { code: procedure.code },
        { $set: procedure },
        { upsert: true },
      );
    }

    // Vô hiệu hóa các thủ tục không còn trong registry (vd thủ tục đất đai đã loại bỏ).
    const activeCodes = MVP_PROCEDURES.map(procedure => procedure.code);
    const { modifiedCount } = await this.procedureModel.updateMany(
      { code: { $nin: activeCodes }, isActive: { $ne: false } },
      { $set: { isActive: false } },
    );
    if (modifiedCount) {
      this.logger.log(`Đã vô hiệu hóa ${modifiedCount} thủ tục lỗi thời`);
    }
    this.logger.log(`Đã đồng bộ ${MVP_PROCEDURES.length} thủ tục MVP`);
  }
}
