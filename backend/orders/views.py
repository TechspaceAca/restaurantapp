"""T Clock — Orders views"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer, OrderItemSerializer
from accounts.permissions import IsAdmin, IsStaffOrAdmin, IsAnyStaff


class OrderListCreateView(generics.ListCreateAPIView):
    """GET — list orders. POST — create new order (staff or customer QR)."""

    def get_queryset(self):
        qs = Order.objects.select_related('table', 'created_by').prefetch_related('items__menu_item')
        status_filter = self.request.query_params.get('status')
        table = self.request.query_params.get('table')
        order_type = self.request.query_params.get('order_type')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if table:
            qs = qs.filter(table_id=table)
        if order_type:
            qs = qs.filter(order_type=order_type)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]   # Customers via QR can also post
        return [IsAnyStaff()]


class OrderDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Order.objects.select_related('table').prefetch_related('items__menu_item')
    serializer_class = OrderSerializer
    permission_classes = [IsAnyStaff]


class UpdateOrderStatusView(APIView):
    """PATCH /api/orders/<id>/status/ — move order through workflow."""
    permission_classes = [IsAnyStaff]

    VALID_TRANSITIONS = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['preparing', 'cancelled'],
        'preparing': ['ready', 'cancelled'],
        'ready': ['served'],
        'served': ['billed'],
        'billed': [],
        'cancelled': [],
    }

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        new_status = request.data.get('status')
        if new_status not in self.VALID_TRANSITIONS.get(order.status, []):
            return Response({
                'error': f"Cannot move from '{order.status}' to '{new_status}'",
                'allowed': self.VALID_TRANSITIONS.get(order.status, [])
            }, status=400)

        order.status = new_status
        order.save()

        # Free up the table when order is billed or cancelled
        if new_status in ['billed', 'cancelled'] and order.table:
            # Check if table has other active orders
            other_active = order.table.orders.exclude(
                id=order.id
            ).exclude(status__in=['billed', 'cancelled']).exists()
            if not other_active:
                order.table.status = 'available'
                order.table.save()

        return Response(OrderSerializer(order).data)


class AddItemsToOrderView(APIView):
    """POST /api/orders/<id>/add-items/ — add more items to existing order."""
    permission_classes = [IsAnyStaff]

    def post(self, request, pk):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status in ['billed', 'cancelled']:
            return Response({'error': 'Cannot add items to a closed order'}, status=400)

        items_data = request.data.get('items', [])
        for item_data in items_data:
            from menu.models import MenuItem
            try:
                menu_item = MenuItem.objects.get(id=item_data['menu_item'])
                existing = order.items.filter(menu_item=menu_item).first()
                if existing:
                    existing.quantity += item_data.get('quantity', 1)
                    existing.save()
                else:
                    OrderItem.objects.create(
                        order=order,
                        menu_item=menu_item,
                        quantity=item_data.get('quantity', 1),
                        unit_price=menu_item.price,
                        notes=item_data.get('notes', ''),
                    )
            except MenuItem.DoesNotExist:
                pass

        return Response(OrderSerializer(order).data)


class ActiveTableOrderView(APIView):
    """GET /api/orders/table/<table_id>/active/ — get active order for table."""
    permission_classes = [IsAnyStaff]

    def get(self, request, table_id):
        order = Order.objects.filter(
            table_id=table_id
        ).exclude(status__in=['billed', 'cancelled']).last()
        if not order:
            return Response({'order': None})
        return Response(OrderSerializer(order).data)
