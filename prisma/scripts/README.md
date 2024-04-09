## Migration scripts

This folder is purely used for writing custom scripts when doing migrations where data needs to be created.

1. Write a script
2. Compile the script
   `tsc prisma/scripts/add-tests-table.ts`
3. Run the compiled script
   `node prisma/scripts/add-tests-table.js`

Note: This is not the cleanest way to do data migrations. We need to figure out a better way to write and run migrations.
Note: Do NOT commit the compiled `.js` code.