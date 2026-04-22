"""push subscriptions

Revision ID: a1b2c3d4e5f6
Revises: 64c22acd1290
Create Date: 2026-04-20 21:40:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '64c22acd1290'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'push_subscriptions',
        sa.Column('id', sa.String(length=26), nullable=False),
        sa.Column('order_id', sa.String(length=26), nullable=False),
        sa.Column('endpoint', sa.Text(), nullable=False),
        sa.Column('p256dh', sa.String(length=255), nullable=False),
        sa.Column('auth', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('order_id', 'endpoint', name='uq_push_subscription_order_endpoint'),
    )
    op.create_index(
        op.f('ix_push_subscriptions_order_id'),
        'push_subscriptions',
        ['order_id'],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f('ix_push_subscriptions_order_id'), table_name='push_subscriptions')
    op.drop_table('push_subscriptions')
