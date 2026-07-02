import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../database/schemas/job.schema';
import { Session, SessionDocument } from '../database/schemas/session.schema';

@WebSocketGateway({
  namespace: '/pipeline',
  cors: { origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000' },
})
export class PipelineEventsGateway {
  @WebSocketServer()
  private server!: Server;

  constructor(
    @InjectModel(Session.name) private readonly sessions: Model<SessionDocument>,
    @InjectModel(Job.name) private readonly jobs: Model<JobDocument>,
  ) {}

  @SubscribeMessage('subscribe.session')
  async subscribeSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId?: string },
  ) {
    if (!body?.sessionId || !Types.ObjectId.isValid(body.sessionId)) return { error: 'sessionId không hợp lệ' };
    await client.join(`session:${body.sessionId}`);
    const session = await this.sessions.findById(body.sessionId).select('status pipeline').lean();
    if (session) client.emit('pipeline.status', { sessionId: body.sessionId, ...session });
    return { subscribed: true, sessionId: body.sessionId };
  }

  @SubscribeMessage('subscribe.job')
  async subscribeJob(@ConnectedSocket() client: Socket, @MessageBody() body: { jobId?: string }) {
    if (!body?.jobId || !Types.ObjectId.isValid(body.jobId)) return { error: 'jobId không hợp lệ' };
    await client.join(`job:${body.jobId}`);
    const job = await this.jobs.findById(body.jobId).select('-payload').lean();
    if (job) client.emit('job.status', job);
    return { subscribed: true, jobId: body.jobId };
  }

  publishSession(sessionId: string, step: string, status: string) {
    if (!this.server) return;
    this.server.to(`session:${sessionId}`).emit('pipeline.status', { sessionId, step, status });
  }

  publishJob(jobId: string, state: string, result?: Record<string, unknown>) {
    if (!this.server) return;
    this.server.to(`job:${jobId}`).emit('job.status', { jobId, state, ...(result ? { result } : {}) });
  }
}
