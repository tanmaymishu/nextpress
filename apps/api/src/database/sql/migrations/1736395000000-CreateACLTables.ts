import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateACLTables1736395000000 implements MigrationInterface {
  name = 'CreateACLTables1736395000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create roles table
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'label',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create permissions table
    await queryRunner.createTable(
      new Table({
        name: 'permissions',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'label',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
    );

    // Create permission_role junction table
    await queryRunner.createTable(
      new Table({
        name: 'permission_role',
        columns: [
          {
            name: 'permission_id',
            type: 'integer',
          },
          {
            name: 'role_id',
            type: 'integer',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['permission_id'],
            referencedTableName: 'permissions',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['role_id'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['permission_id'],
          },
          {
            columnNames: ['role_id'],
          },
          {
            columnNames: ['permission_id', 'role_id'],
            isUnique: true,
          },
        ],
      }),
    );

    // Create role_user junction table
    await queryRunner.createTable(
      new Table({
        name: 'role_user',
        columns: [
          {
            name: 'role_id',
            type: 'integer',
          },
          {
            name: 'user_id',
            type: 'integer',
          },
        ],
        foreignKeys: [
          {
            columnNames: ['role_id'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['user_id'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [
          {
            columnNames: ['role_id'],
          },
          {
            columnNames: ['user_id'],
          },
          {
            columnNames: ['role_id', 'user_id'],
            isUnique: true,
          },
        ],
      }),
    );

    // Create some default roles
    await queryRunner.query(`
      INSERT INTO roles (name, label) VALUES
      ('admin', 'Administrator'),
      ('user', 'Regular User'),
      ('moderator', 'Moderator');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('role_user');
    await queryRunner.dropTable('permission_role');
    await queryRunner.dropTable('permissions');
    await queryRunner.dropTable('roles');
  }
}
