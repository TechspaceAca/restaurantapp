"""T Clock — Orders serializers"""

from rest_framework import serializers
from .models import Order, OrderItem
from menu.serializers import MenuItemSerializer


class OrderItemSerializer(serializers.ModelSerializer):
    menu_item_name = serializers.CharField(source='menu_item.name', read_only=True)
    menu_item_image = serializers.ImageField(source='menu_item.image', read_only=True)
    is_veg = serializers.BooleanField(source='menu_item.is_veg', read_only=True)
    subtotal = serializers.ReadOnlyField()

    class Meta:
        model = OrderItem
        fields = [
            'id', 'menu_item', 'menu_item_name', 'menu_item_image',
            'is_veg', 'quantity', 'unit_price', 'subtotal', 'notes', 'status',
        ]


class OrderItemCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['menu_item', 'quantity', 'notes']

    def validate_menu_item(self, item):
        if not item.is_available:
            raise serializers.ValidationError(f"'{item.name}' is currently not available.")
        return item


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    subtotal = serializers.ReadOnlyField()
    table_number = serializers.CharField(source='table.number', read_only=True, allow_null=True)
    table_name = serializers.CharField(source='table.name', read_only=True, allow_null=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)

    class Meta:
        model = Order
        fields = [
            'id', 'table', 'table_number', 'table_name',
            'order_type', 'status', 'customer_name', 'customer_phone',
            'notes', 'items', 'subtotal', 'created_by', 'created_by_name',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemCreateSerializer(many=True)

    class Meta:
        model = Order
        fields = ['table', 'order_type', 'customer_name', 'customer_phone', 'notes', 'items']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(
            **validated_data,
            status='pending',
            created_by=self.context['request'].user if self.context['request'].user.is_authenticated else None
        )
        for item_data in items_data:
            menu_item = item_data['menu_item']
            OrderItem.objects.create(
                order=order,
                menu_item=menu_item,
                quantity=item_data['quantity'],
                unit_price=menu_item.price,
                notes=item_data.get('notes', ''),
            )
        # Mark table as occupied if dine_in
        if order.table and order.order_type == 'dine_in':
            order.table.status = 'occupied'
            order.table.save()
        return order
