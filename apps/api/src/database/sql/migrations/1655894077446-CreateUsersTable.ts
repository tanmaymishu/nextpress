import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1655894077446 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'first_name',
            type: 'varchar'
          },
          {
            name: 'last_name',
            type: 'varchar'
          },
          {
            name: 'email',
            type: 'text',
            isUnique: true,
          },
          {
            name: 'password',
            type: 'text'
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
