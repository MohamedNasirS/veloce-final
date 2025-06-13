import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user/user.entity';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_pg_username',
      password: 'your_pg_password',
      database: 'your_database_name',
      entities: [User],
      synchronize: true, // use only in dev
    }),
    TypeOrmModule.forFeature([User]),
    AuthModule,
  ],
})
export class AppModule {}
