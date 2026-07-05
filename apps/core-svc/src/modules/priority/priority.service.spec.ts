import { Model } from 'mongoose';
import { Session, SessionDocument, SessionStatus } from '../../database/schemas/session.schema';
import { Procedure, ProcedureDocument } from '../../database/schemas/procedure.schema';
import { PriorityService } from './priority.service';

/**
 * Mock chuỗi query Mongoose: find().populate().populate().sort() → resolve mảng.
 * populate trả this để chain, sort là terminal → resolve sessions.
 */
function makeSessionModel(sessions: unknown[]) {
  const query = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(sessions),
  };
  return {
    query,
    model: { find: jest.fn().mockReturnValue(query) },
  };
}

const PROC = {
  name: 'Đăng ký khai sinh',
  priorityConfig: { baseUrgency: 'MEDIUM', slaDays: 5 },
} as unknown as ProcedureDocument;

function session(overrides: Partial<any> = {}) {
  return {
    _id: 'sess-' + Math.random().toString(36).slice(2, 8),
    status: SessionStatus.CONFIRMED,
    createdAt: new Date('2026-07-01T00:00:00Z'),
    procedureId: PROC,
    userId: { fullName: 'Nguyễn Văn A' },
    aiResult: { score: { score: 90 } },
    ...overrides,
  };
}

describe('PriorityService.getQueue', () => {
  function setup(sessions: unknown[]) {
    const { model } = makeSessionModel(sessions);
    const service = new PriorityService(
      model as unknown as Model<SessionDocument>,
      {} as unknown as Model<ProcedureDocument>,
    );
    return { service };
  }

  it('bỏ qua session có procedureId mồ côi (populate → null) thay vì sập cả queue', async () => {
    const { service } = setup([
      session({ procedureId: null }),          // procedure đã bị xóa
      session({ aiResult: { score: { score: 90 } } }),
    ]);

    const queue = await service.getQueue();

    // Chỉ còn 1 hồ sơ hợp lệ, không ném TypeError vì procedure null.
    expect(queue).toHaveLength(1);
    expect(queue[0].procedureName).toBe('Đăng ký khai sinh');
  });

  it('điểm thấp (<60) → xếp nhóm A (ưu tiên soi tay)', async () => {
    const { service } = setup([session({ aiResult: { score: { score: 40 } } })]);
    const queue = await service.getQueue();
    expect(queue[0].priority).toBe('A');
    expect(queue[0].reason).toBe('Điểm thấp');
  });

  it('lỗi CRITICAL → nhóm A kèm lý do "Lỗi nghiêm trọng"', async () => {
    const { service } = setup([
      session({ aiResult: { score: { score: 95, breakdown: [{ severity: 'CRITICAL' }] } } }),
    ]);
    const queue = await service.getQueue();
    expect(queue[0].priority).toBe('A');
    expect(queue[0].reason).toBe('Lỗi nghiêm trọng');
  });

  it('sắp xếp A trước C', async () => {
    const { service } = setup([
      session({ aiResult: { score: { score: 90 } } }), // điểm cao → không phải A vì lý do điểm
      session({ aiResult: { score: { score: 30 } } }), // điểm thấp → A
    ]);
    const queue = await service.getQueue();
    // Bất kể thứ tự đầu vào, nhóm A phải đứng trước.
    expect(queue[0].priority).toBe('A');
    expect(order(queue)).toEqual([...queue].map((q) => q.priority).sort(cmpLevel));
  });

  it('mảng rỗng → queue rỗng, không lỗi', async () => {
    const { service } = setup([]);
    await expect(service.getQueue()).resolves.toEqual([]);
  });
});

function order(queue: Array<{ priority: string }>) {
  return queue.map((q) => q.priority);
}
function cmpLevel(a: string, b: string) {
  return ['A', 'B', 'C', 'D'].indexOf(a) - ['A', 'B', 'C', 'D'].indexOf(b);
}
