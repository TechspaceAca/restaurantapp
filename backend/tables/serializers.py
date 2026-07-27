"""T Clock — Tables serializers"""

from rest_framework import serializers
from .models import DiningTable


class TableSerializer(serializers.ModelSerializer):
    qr_url = serializers.ReadOnlyField()
    active_order_id = serializers.SerializerMethodField()

    class Meta:
        model = DiningTable
        fields = [
            'id', 'number', 'name', 'capacity', 'status',
            'section', 'qr_token', 'qr_url', 'is_active', 'active_order_id',
        ]
        read_only_fields = ['qr_token', 'qr_url']

    def get_active_order_id(self, obj):
        # Return the active (non-billed) order ID for the table
        try:
            order = obj.orders.exclude(status__in=['billed', 'cancelled']).last()
            return order.id if order else None
        except Exception:
            return None
