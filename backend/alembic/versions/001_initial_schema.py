"""Initial PostgreSQL schema for STRUCTURA AI

Revision ID: 001_initial_schema
Revises: None
Create Date: 2026-11-01 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=50), nullable=False, server_default='inspector'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. infrastructure table
    op.create_table(
        'infrastructure',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('infrastructure_type', sa.String(length=50), nullable=False),
        sa.Column('location', sa.String(length=255), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=False),
        sa.Column('longitude', sa.Float(), nullable=False),
        sa.Column('construction_year', sa.Integer(), nullable=False),
        sa.Column('material_type', sa.String(length=100), nullable=False),
        sa.Column('inspection_date', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_infrastructure_id'), 'infrastructure', ['id'], unique=False)
    op.create_index(op.f('ix_infrastructure_name'), 'infrastructure', ['name'], unique=False)
    op.create_index(op.f('ix_infrastructure_infrastructure_type'), 'infrastructure', ['infrastructure_type'], unique=False)
    op.create_index(op.f('ix_infrastructure_latitude'), 'infrastructure', ['latitude'], unique=False)
    op.create_index(op.f('ix_infrastructure_longitude'), 'infrastructure', ['longitude'], unique=False)

    # 3. defects table
    op.create_table(
        'defects',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('infrastructure_id', sa.Integer(), nullable=False),
        sa.Column('defect_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('image_path', sa.String(length=500), nullable=False),
        sa.Column('processed_image_path', sa.String(length=500), nullable=True),
        sa.Column('bounding_box', sa.Text(), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['infrastructure_id'], ['infrastructure.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_defects_id'), 'defects', ['id'], unique=False)
    op.create_index(op.f('ix_defects_infrastructure_id'), 'defects', ['infrastructure_id'], unique=False)
    op.create_index(op.f('ix_defects_defect_type'), 'defects', ['defect_type'], unique=False)
    op.create_index(op.f('ix_defects_severity'), 'defects', ['severity'], unique=False)
    op.create_index(op.f('ix_defects_detected_at'), 'defects', ['detected_at'], unique=False)

    # 4. sensor_readings table
    op.create_table(
        'sensor_readings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('infrastructure_id', sa.Integer(), nullable=False),
        sa.Column('sensor_id', sa.String(length=50), nullable=False),
        sa.Column('vibration', sa.Float(), nullable=False),
        sa.Column('acceleration', sa.Float(), nullable=False),
        sa.Column('frequency', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False),
        sa.Column('is_anomaly', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('anomaly_score', sa.Float(), nullable=False, server_default='0.0'),
        sa.ForeignKeyConstraint(['infrastructure_id'], ['infrastructure.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_sensor_readings_id'), 'sensor_readings', ['id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_infrastructure_id'), 'sensor_readings', ['infrastructure_id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_sensor_id'), 'sensor_readings', ['sensor_id'], unique=False)
    op.create_index(op.f('ix_sensor_readings_timestamp'), 'sensor_readings', ['timestamp'], unique=False)
    op.create_index(op.f('ix_sensor_readings_is_anomaly'), 'sensor_readings', ['is_anomaly'], unique=False)

    # 5. predictions table
    op.create_table(
        'predictions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('infrastructure_id', sa.Integer(), nullable=False),
        sa.Column('component_id', sa.String(length=100), nullable=False, server_default='overall_structure'),
        sa.Column('predicted_rul', sa.Float(), nullable=False),
        sa.Column('risk_level', sa.String(length=20), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False),
        sa.Column('health_score', sa.Float(), nullable=False, server_default='100.0'),
        sa.Column('factors', sa.Text(), nullable=True),
        sa.Column('prediction_date', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['infrastructure_id'], ['infrastructure.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_predictions_id'), 'predictions', ['id'], unique=False)
    op.create_index(op.f('ix_predictions_infrastructure_id'), 'predictions', ['infrastructure_id'], unique=False)
    op.create_index(op.f('ix_predictions_prediction_date'), 'predictions', ['prediction_date'], unique=False)

    # 6. alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('infrastructure_id', sa.Integer(), nullable=False),
        sa.Column('alert_type', sa.String(length=50), nullable=False),
        sa.Column('severity', sa.String(length=20), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='ACTIVE'),
        sa.ForeignKeyConstraint(['infrastructure_id'], ['infrastructure.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_alerts_id'), 'alerts', ['id'], unique=False)
    op.create_index(op.f('ix_alerts_infrastructure_id'), 'alerts', ['infrastructure_id'], unique=False)
    op.create_index(op.f('ix_alerts_alert_type'), 'alerts', ['alert_type'], unique=False)
    op.create_index(op.f('ix_alerts_severity'), 'alerts', ['severity'], unique=False)
    op.create_index(op.f('ix_alerts_created_at'), 'alerts', ['created_at'], unique=False)
    op.create_index(op.f('ix_alerts_status'), 'alerts', ['status'], unique=False)


def downgrade() -> None:
    op.drop_table('alerts')
    op.drop_table('predictions')
    op.drop_table('sensor_readings')
    op.drop_table('defects')
    op.drop_table('infrastructure')
    op.drop_table('users')
