# Prisma Migrations


## Adding a migration

To add a migration, run the following command:

1. Make changes to `schema.prisma` file.
2. Run the following command:
```sh
npx prisma migrate dev --name <migration-name>
```
where migration-name indicates what the migration does.
Try using the following format for the migration name: `<action>-<table-name>-<description>`.

For example, if you are adding a new column to the `tests` table, you can name the migration `add-tests-column-description`.

After running the command, you will see a new migration file in the `prisma/migrations` folder.


3. Commit the migration file to the repository.
  


## Applying a migration

To apply a migration, run the following command:

```sh
npx prisma migrate deploy
```
