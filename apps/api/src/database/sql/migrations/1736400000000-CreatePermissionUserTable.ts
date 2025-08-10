import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreatePermissionUserTable1736400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'permission_user',
        columns: [
          {
            name: 'permission_id',
            type: 'integer',
            isPrimary: true
          },
          {
            name: 'user_id',
            type: 'integer',
            isPrimary: true
          }
        ],
        foreignKeys: [
          {
            name: 'FK_permission_user_permission',
            columnNames: ['permission_id'],
            referencedTableName: 'permissions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          },
          {
            name: 'FK_permission_user_user',
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE'
          }
        ]
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('permission_user');
  }
}