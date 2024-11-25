import {MigrationInterface, QueryRunner, Table, TableForeignKey} from "typeorm";

export class createRoleHasPermissionsTable1594809783047 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: 'role_has_permissions',
                columns: [
                    {
                        name: 'id',
                        type: 'int',
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: 'increment',
                    },
                    {
                        name: 'role_id',
                        type: 'int',
                        isNullable: true,
                    },
                    {
                        name: 'permission_id',
                        type: 'int',
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
            true,
        );
        await queryRunner.createForeignKey("role_has_permissions", new TableForeignKey({
            columnNames: ["role_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "role",
            onDelete: "CASCADE"
        }));
        await queryRunner.createForeignKey("role_has_permissions", new TableForeignKey({
            columnNames: ["permission_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "permission",
            onDelete: "CASCADE"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("role_has_permissions");

        const roleForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("role_id") !== -1);
        await queryRunner.dropForeignKey("role_has_permissions", roleForeignKey);

        const permissionForeignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("permission_id") !== -1);
        await queryRunner.dropForeignKey("role_has_permissions", permissionForeignKey);

        await queryRunner.dropTable('role_has_permissions', true);
    }

}
