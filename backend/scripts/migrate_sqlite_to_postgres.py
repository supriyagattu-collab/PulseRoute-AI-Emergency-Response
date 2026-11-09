
import argparse
import logging
import os
import sqlite3
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import (
    create_engine,
    text,
    MetaData,
    Boolean,
    DateTime,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(message)s"
)
logger = logging.getLogger("pulseroute.migration")

TABLE_MIGRATION_ORDER = [
    "healthcare_facilities",
    "ambulances",
    "users",
    "emergency_reports",
    "emergency_status_history",
    "ambulance_assignments",
    "refresh_tokens",
]


def migrate_data(sqlite_path, pg_url, dry_run=False):

    sqlite_path = Path(sqlite_path)

    if not sqlite_path.is_file():
        raise FileNotFoundError(
            f"SQLite database not found: {sqlite_path}"
        )

    if not pg_url:
        raise ValueError(
            "DATABASE_URL is missing. Configure PostgreSQL first."
        )

    logger.info("Source SQLite: %s", sqlite_path.resolve())
    logger.info("Target PostgreSQL: pulseroute_dev")

    sqlite_conn = sqlite3.connect(str(sqlite_path))
    sqlite_conn.row_factory = sqlite3.Row

    pg_engine = None

    try:
        integrity = sqlite_conn.execute(
            "PRAGMA integrity_check"
        ).fetchone()[0]

        if integrity != "ok":
            raise RuntimeError(
                f"SQLite integrity check failed: {integrity}"
            )

        logger.info("SQLite integrity check passed.")

        source_counts = {}

        for table_name in TABLE_MIGRATION_ORDER:
            count = sqlite_conn.execute(
                f'SELECT COUNT(*) FROM "{table_name}"'
            ).fetchone()[0]

            source_counts[table_name] = count

        total_source = sum(source_counts.values())

        logger.info("Total SQLite records: %d", total_source)

        pg_engine = create_engine(pg_url, pool_pre_ping=True)

        metadata = MetaData()
        metadata.reflect(bind=pg_engine, schema="public")

        with pg_engine.connect() as connection:
            database_name = connection.execute(
                text("SELECT current_database()")
            ).scalar()

            logger.info(
                "Connected PostgreSQL database: %s",
                database_name
            )

            if database_name != "pulseroute_dev":
                raise RuntimeError(
                    "Wrong target database. Expected pulseroute_dev."
                )

        # Verify all required PostgreSQL tables.
        for table_name in TABLE_MIGRATION_ORDER:
            if f"public.{table_name}" not in metadata.tables:
                raise RuntimeError(
                    f"PostgreSQL table missing: {table_name}. "
                    "Run alembic upgrade head first."
                )

        # Check target tables before migration.
        target_counts = {}

        with pg_engine.connect() as connection:
            for table_name in TABLE_MIGRATION_ORDER:
                count = connection.execute(
                    text(
                        f'SELECT COUNT(*) FROM public."{table_name}"'
                    )
                ).scalar_one()

                target_counts[table_name] = count

        print("\nPRE-MIGRATION CHECK")
        print("-" * 55)

        for table_name in TABLE_MIGRATION_ORDER:
            print(
                f"{table_name:<30} "
                f"SQLite: {source_counts[table_name]:<5} "
                f"PostgreSQL: {target_counts[table_name]}"
            )

        if dry_run:
            print("\nDRY RUN PASSED.")
            print("No records were inserted.")
            return

        if any(count != 0 for count in target_counts.values()):
            raise RuntimeError(
                "Migration stopped: PostgreSQL target tables "
                "are not empty. No records were inserted."
            )

        # Perform migration inside one transaction.
        with pg_engine.begin() as pg_conn:

            for table_name in TABLE_MIGRATION_ORDER:

                source_count = source_counts[table_name]

                logger.info(
                    "Migrating %s (%d records)...",
                    table_name,
                    source_count
                )

                if source_count == 0:
                    continue

                target_table = metadata.tables[
                    f"public.{table_name}"
                ]

                rows = sqlite_conn.execute(
                    f'SELECT * FROM "{table_name}"'
                ).fetchall()

                row_dicts = []

                for row in rows:
                    source_row = dict(row)
                    converted_row = {}

                    for column in target_table.columns:

                        column_name = column.name

                        if column_name not in source_row:
                            continue

                        value = source_row[column_name]

                        # Fix invalid placeholder in destination facility reference.
                        if column_name == "destination_facility_id" and value == 0:
                            value = None

                        if value is not None:

                            if isinstance(column.type, Boolean):
                                value = bool(value)

                            elif isinstance(column.type, DateTime):
                                if isinstance(value, str):
                                    value = datetime.fromisoformat(value)

                        converted_row[column_name] = value

                    row_dicts.append(converted_row)

                pg_conn.execute(
                    target_table.insert(),
                    row_dicts
                )

                # Verify each table inside the transaction.
                pg_count = pg_conn.execute(
                    text(
                        f'SELECT COUNT(*) FROM public."{table_name}"'
                    )
                ).scalar_one()

                if pg_count != source_count:
                    raise RuntimeError(
                        f"Count mismatch in {table_name}: "
                        f"SQLite={source_count}, PostgreSQL={pg_count}"
                    )

                # Reset SERIAL sequence when one exists.
                if "id" in target_table.columns:

                    max_id = pg_conn.execute(
                        text(
                            f'SELECT MAX(id) FROM public."{table_name}"'
                        )
                    ).scalar_one()

                    if max_id is not None:
                        sequence_name = pg_conn.execute(
                            text(
                                "SELECT pg_get_serial_sequence("
                                ":table_name, 'id')"
                            ),
                            {
                                "table_name": f'public."{table_name}"'
                            }
                        ).scalar_one()

                        if sequence_name:
                            pg_conn.execute(
                                text(
                                    "SELECT setval("
                                    "CAST(:sequence_name AS regclass), "
                                    ":max_id, true)"
                                ),
                                {
                                    "sequence_name": sequence_name,
                                    "max_id": max_id,
                                }
                            )

                logger.info(
                    "%s verified: %d records",
                    table_name,
                    pg_count
                )

        # Final verification after commit.
        print("\nFINAL MIGRATION VERIFICATION")
        print("=" * 65)
        print(
            f"{'TABLE':<30} {'SQLITE':<10} "
            f"{'POSTGRES':<10} STATUS"
        )
        print("-" * 65)

        total_postgres = 0

        with pg_engine.connect() as connection:
            for table_name in TABLE_MIGRATION_ORDER:

                pg_count = connection.execute(
                    text(
                        f'SELECT COUNT(*) FROM public."{table_name}"'
                    )
                ).scalar_one()

                sqlite_count = source_counts[table_name]
                total_postgres += pg_count

                status = (
                    "MATCH"
                    if pg_count == sqlite_count
                    else "MISMATCH"
                )

                print(
                    f"{table_name:<30} "
                    f"{sqlite_count:<10} "
                    f"{pg_count:<10} {status}"
                )

                if status != "MATCH":
                    raise RuntimeError(
                        f"Final verification failed for {table_name}"
                    )

        print("=" * 65)
        print(f"Total SQLite records:     {total_source}")
        print(f"Total PostgreSQL records: {total_postgres}")

        if total_source != total_postgres:
            raise RuntimeError("Total record count mismatch.")

        print("\nMIGRATION AND VERIFICATION COMPLETED.")

    finally:
        sqlite_conn.close()

        if pg_engine is not None:
            pg_engine.dispose()


if __name__ == "__main__":

    parser = argparse.ArgumentParser(
        description="PulseRoute SQLite to PostgreSQL migration"
    )

    default_sqlite = (
        Path(__file__).resolve().parents[1] / "pulseroute.db"
    )

    parser.add_argument(
        "--sqlite-path",
        default=str(default_sqlite),
        help="Path to SQLite database"
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Check migration without inserting records"
    )

    args = parser.parse_args()

    try:
        database_url = os.getenv("DATABASE_URL")

        migrate_data(
            args.sqlite_path,
            database_url,
            dry_run=args.dry_run
        )

    except Exception as exc:
        logger.exception("MIGRATION FAILED: %s", exc)
        sys.exit(1)
