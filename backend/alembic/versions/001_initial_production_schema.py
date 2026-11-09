"""Initial production database schema for PulseRoute

Revision ID: 001_init_schema
Revises: 
Create Date: 2026-11-09 01:45:00.000000

Includes:
- healthcare_facilities
- ambulances
- emergency_reports
- emergency_status_history
- ambulance_assignments
- users
- refresh_tokens
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_init_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. healthcare_facilities
    op.create_table(
        'healthcare_facilities',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('object_id', sa.Integer(), nullable=True),
        sa.Column('facility_name', sa.String(length=255), nullable=False),
        sa.Column('facility_type', sa.String(length=100), nullable=False),
        sa.Column('nin_id', sa.String(length=50), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True, server_default='Telangana'),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('mandal', sa.String(length=100), nullable=True),
        sa.Column('municipality', sa.String(length=100), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('pincode', sa.String(length=20), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('department', sa.String(length=100), nullable=True),
        sa.Column('services', sa.String(length=255), nullable=True),
        sa.Column('total_icu_beds', sa.Integer(), nullable=False, server_default='20'),
        sa.Column('available_icu_beds', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('total_general_beds', sa.Integer(), nullable=False, server_default='100'),
        sa.Column('available_general_beds', sa.Integer(), nullable=False, server_default='25'),
        sa.Column('emergency_phone', sa.String(length=50), nullable=True, server_default='040-24600121'),
        sa.Column('trauma_level', sa.String(length=100), nullable=False, server_default='Level 2 Trauma Center'),
        sa.Column('has_cath_lab', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('has_ct_scan', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_healthcare_facilities_district'), 'healthcare_facilities', ['district'], unique=False)
    op.create_index(op.f('ix_healthcare_facilities_facility_name'), 'healthcare_facilities', ['facility_name'], unique=False)
    op.create_index(op.f('ix_healthcare_facilities_facility_type'), 'healthcare_facilities', ['facility_type'], unique=False)
    op.create_index(op.f('ix_healthcare_facilities_object_id'), 'healthcare_facilities', ['object_id'], unique=False)

    # 2. ambulances
    op.create_table(
        'ambulances',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('ambulance_id', sa.String(length=50), nullable=False),
        sa.Column('vehicle_number', sa.String(length=50), nullable=False),
        sa.Column('type', sa.String(length=20), server_default='BLS', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='AVAILABLE', nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('driver_name', sa.String(length=150), nullable=True),
        sa.Column('driver_contact', sa.String(length=50), nullable=True),
        sa.Column('base_station', sa.String(length=200), nullable=True),
        sa.Column('fuel_oxygen_level', sa.String(length=50), server_default='95%', nullable=False),
        sa.Column('equipment', sa.String(length=500), nullable=True),
        sa.Column('speed_kmh', sa.Float(), server_default='0.0', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('vehicle_number')
    )
    op.create_index(op.f('ix_ambulances_ambulance_id'), 'ambulances', ['ambulance_id'], unique=True)

    # 3. emergency_reports
    op.create_table(
        'emergency_reports',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('incident_code', sa.String(length=50), nullable=False),
        sa.Column('patient_name', sa.String(length=150), nullable=False),
        sa.Column('contact_phone', sa.String(length=50), nullable=False),
        sa.Column('patient_age', sa.Integer(), nullable=True),
        sa.Column('gender', sa.String(length=20), nullable=True),
        sa.Column('emergency_type', sa.String(length=50), server_default='GENERAL', nullable=False),
        sa.Column('severity', sa.String(length=50), server_default='CRITICAL', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='REPORTED', nullable=False),
        sa.Column('consciousness', sa.String(length=50), nullable=True),
        sa.Column('breathing', sa.String(length=50), nullable=True),
        sa.Column('incident_address', sa.Text(), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('symptoms', sa.Text(), nullable=True),
        sa.Column('caller_name', sa.String(length=150), nullable=True),
        sa.Column('creator_id', sa.String(length=100), nullable=True),
        sa.Column('destination_facility_id', sa.Integer(), nullable=True),
        sa.Column('reported_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('resolved_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['destination_facility_id'], ['healthcare_facilities.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_emergency_reports_creator_id'), 'emergency_reports', ['creator_id'], unique=False)
    op.create_index(op.f('ix_emergency_reports_incident_code'), 'emergency_reports', ['incident_code'], unique=True)

    # 4. emergency_status_history
    op.create_table(
        'emergency_status_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('emergency_id', sa.Integer(), nullable=False),
        sa.Column('from_status', sa.String(length=50), nullable=True),
        sa.Column('to_status', sa.String(length=50), nullable=False),
        sa.Column('changed_by', sa.String(length=100), server_default='SYSTEM', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('changed_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['emergency_id'], ['emergency_reports.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_emergency_status_history_emergency_id'), 'emergency_status_history', ['emergency_id'], unique=False)

    # 5. ambulance_assignments
    op.create_table(
        'ambulance_assignments',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('emergency_id', sa.Integer(), nullable=False),
        sa.Column('ambulance_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(length=50), server_default='DISPATCHED', nullable=False),
        sa.Column('estimated_eta_minutes', sa.Integer(), server_default='5', nullable=False),
        sa.Column('assigned_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['ambulance_id'], ['ambulances.id'], ),
        sa.ForeignKeyConstraint(['emergency_id'], ['emergency_reports.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ambulance_assignments_ambulance_id'), 'ambulance_assignments', ['ambulance_id'], unique=False)
    op.create_index(op.f('ix_ambulance_assignments_emergency_id'), 'ambulance_assignments', ['emergency_id'], unique=False)

    # 6. users
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('role', sa.String(length=50), server_default='PATIENT', nullable=False),
        sa.Column('status', sa.String(length=50), server_default='ACTIVE', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_user_id'), 'users', ['user_id'], unique=True)

    # 7. refresh_tokens
    op.create_table(
        'refresh_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('token_hash', sa.String(length=64), nullable=False),
        sa.Column('user_id', sa.String(length=100), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('revoked', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('revoked_at', sa.DateTime(), nullable=True),
        sa.Column('replaced_by', sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_refresh_tokens_token_hash'), 'refresh_tokens', ['token_hash'], unique=True)
    op.create_index(op.f('ix_refresh_tokens_user_id'), 'refresh_tokens', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_refresh_tokens_user_id'), table_name='refresh_tokens')
    op.drop_index(op.f('ix_refresh_tokens_token_hash'), table_name='refresh_tokens')
    op.drop_table('refresh_tokens')

    op.drop_index(op.f('ix_users_user_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.drop_index(op.f('ix_ambulance_assignments_emergency_id'), table_name='ambulance_assignments')
    op.drop_index(op.f('ix_ambulance_assignments_ambulance_id'), table_name='ambulance_assignments')
    op.drop_table('ambulance_assignments')

    op.drop_index(op.f('ix_emergency_status_history_emergency_id'), table_name='emergency_status_history')
    op.drop_table('emergency_status_history')

    op.drop_index(op.f('ix_emergency_reports_incident_code'), table_name='emergency_reports')
    op.drop_index(op.f('ix_emergency_reports_creator_id'), table_name='emergency_reports')
    op.drop_table('emergency_reports')

    op.drop_index(op.f('ix_ambulances_ambulance_id'), table_name='ambulances')
    op.drop_table('ambulances')

    op.drop_index(op.f('ix_healthcare_facilities_object_id'), table_name='healthcare_facilities')
    op.drop_index(op.f('ix_healthcare_facilities_facility_type'), table_name='healthcare_facilities')
    op.drop_index(op.f('ix_healthcare_facilities_facility_name'), table_name='healthcare_facilities')
    op.drop_index(op.f('ix_healthcare_facilities_district'), table_name='healthcare_facilities')
    op.drop_table('healthcare_facilities')

