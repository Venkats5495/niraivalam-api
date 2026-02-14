import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { MembersModule } from './modules/members/members.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { SeatsModule } from './modules/seats/seats.module';
import { SeatContributionsModule } from './modules/seat-contributions/seat-contributions.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { LedgerModule } from './modules/ledger/ledger.module';
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    MembersModule,
    CategoriesModule,
    TransactionsModule,
    SeatsModule,
    SeatContributionsModule,
    ExpensesModule,
    LedgerModule,
    ReportsModule,
    DashboardModule,
  ],
  providers: [
    // Global guards (applied to all routes unless overridden)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
