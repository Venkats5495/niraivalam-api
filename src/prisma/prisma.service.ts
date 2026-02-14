import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
        { emit: 'stdout', level: 'error' },
      ],
    });

    // ─── Soft Delete Middleware ─────────────────────────
    // Intercept delete operations and convert to soft deletes
    this.$use(async (params: Prisma.MiddlewareParams, next) => {
      const softDeleteModels = [
        'User',
        'Member',
        'Category',
        'Transaction',
        'Seat',
        'SeatContribution',
        'Expense',
      ];

      if (softDeleteModels.includes(params.model || '')) {
        // Intercept delete -> soft delete
        if (params.action === 'delete') {
          params.action = 'update';
          params.args['data'] = { deletedAt: new Date() };
        }

        if (params.action === 'deleteMany') {
          params.action = 'updateMany';
          if (params.args.data !== undefined) {
            params.args.data['deletedAt'] = new Date();
          } else {
            params.args['data'] = { deletedAt: new Date() };
          }
        }

        // Filter soft-deleted records on find operations
        if (params.action === 'findUnique' || params.action === 'findFirst') {
          params.action = 'findFirst';
          if (params.args.where) {
            params.args.where['deletedAt'] = null;
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }

        if (params.action === 'findMany') {
          if (params.args.where) {
            if (params.args.where['deletedAt'] === undefined) {
              params.args.where['deletedAt'] = null;
            }
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }

        if (params.action === 'count') {
          if (params.args.where) {
            if (params.args.where['deletedAt'] === undefined) {
              params.args.where['deletedAt'] = null;
            }
          } else {
            params.args['where'] = { deletedAt: null };
          }
        }
      }

      return next(params);
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
