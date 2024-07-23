#!/bin/bash

PRISMA_MIGRATIONS_TABLE="_prisma_migrations"

# Extract DB_HOST and DB_PORT from POSTGRES_HOST
DB_HOST=$(echo $POSTGRES_HOST | cut -d':' -f1)
DB_PORT=$(echo $POSTGRES_HOST | cut -d':' -f2)

# Default to port 5432 if DB_PORT is not set
if [ -z "$DB_PORT" ]; then
  DB_PORT=5432
fi

# Export PGPASSWORD so psql can use it
export PGPASSWORD=$POSTGRES_PASSWORD

# Check if the _prisma_migrations table exists
TABLE_EXISTS=$(psql -U $POSTGRES_USER -h $DB_HOST -d $POSTGRES_DATABASE -p $DB_PORT -t -c "SELECT to_regclass('$PRISMA_MIGRATIONS_TABLE');")



# Function to rename the _prisma_migrations table
rename_migrations_table() {
    echo "Renaming $PRISMA_MIGRATIONS_TABLE table to ${PRISMA_MIGRATIONS_TABLE}_old..."
    psql -U $POSTGRES_USER -h $DB_HOST -d $POSTGRES_DATABASE -p $DB_PORT -c "ALTER TABLE $PRISMA_MIGRATIONS_TABLE RENAME TO ${PRISMA_MIGRATIONS_TABLE}_old;"
}

# Function to resolve initial migration
resolve_init_migration() {
    echo "Resolving initial migration..."
    npx prisma migrate resolve --applied 0_init
}

# Function to apply migrations
apply_migrations() {
    echo "Applying migrations..."
    npx prisma migrate deploy
}

# Main logic
if [ "$TABLE_EXISTS" == " " ]; then
    echo "The $PRISMA_MIGRATIONS_TABLE table does not exist. Proceeding to apply migrations."
    resolve_init_migration
else
    echo "The $PRISMA_MIGRATIONS_TABLE table exists. Proceeding to apply migrations."
    # Check if the 0_init migration exists
    INIT_MIGRATION=$(psql -U $POSTGRES_USER -h $DB_HOST -d $POSTGRES_DATABASE -p $DB_PORT -t -c "SELECT migration_name FROM $PRISMA_MIGRATIONS_TABLE WHERE migration_name = '0_init';")
    if [ -z "$INIT_MIGRATION" ]; then
        echo "The 0_init migration was not found. Truncating the _prisma_migrations table and applying migrations."
        rename_migrations_table
        resolve_init_migration
    else
        echo "The 0_init migration was found. Proceeding to apply migrations."
        apply_migrations
    fi
fi

echo "Migration reset process completed."
npm run dev
