"""T Clock — Billing views"""

from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

from .models import Bill
from .serializers import BillSerializer, GenerateBillSerializer
from orders.models import Order
from accounts.permissions import IsStaffOrAdmin, IsAdmin


class BillListView(generics.ListAPIView):
    serializer_class = BillSerializer
    permission_classes = [IsStaffOrAdmin]

    def get_queryset(self):
        qs = Bill.objects.select_related('order__table', 'created_by')
        is_paid = self.request.query_params.get('is_paid')
        if is_paid is not None:
            qs = qs.filter(is_paid=is_paid == 'true')
        return qs


class BillDetailView(generics.RetrieveAPIView):
    queryset = Bill.objects.all()
    serializer_class = BillSerializer
    permission_classes = [IsStaffOrAdmin]


class GenerateBillView(APIView):
    """POST /api/billing/generate/ — generate a bill for an order."""
    permission_classes = [IsStaffOrAdmin]

    def post(self, request):
        serializer = GenerateBillSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        data = serializer.validated_data
        try:
            order = Order.objects.get(id=data['order_id'])
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status == 'cancelled':
            return Response({'error': 'Cannot bill a cancelled order'}, status=400)

        if hasattr(order, 'bill'):
            return Response({'error': 'Bill already generated', 'bill_id': order.bill.id}, status=400)

        # Create the bill
        subtotal = order.subtotal
        tax_amount = (subtotal * data['tax_percent']) / 100
        total = subtotal + tax_amount - data['discount_amount']

        bill = Bill.objects.create(
            order=order,
            subtotal=subtotal,
            tax_percent=data['tax_percent'],
            tax_amount=tax_amount,
            discount_amount=data['discount_amount'],
            discount_reason=data['discount_reason'],
            total=total,
            payment_method=data['payment_method'],
            is_paid=True,
            paid_at=timezone.now(),
            created_by=request.user,
            notes=data['notes'],
        )

        # Mark order as billed
        order.status = 'billed'
        order.save()

        # Free up the table
        if order.table:
            other_active = order.table.orders.exclude(
                id=order.id
            ).exclude(status__in=['billed', 'cancelled']).exists()
            if not other_active:
                order.table.status = 'available'
                order.table.save()

        return Response(BillSerializer(bill).data, status=201)


class OrderBillView(APIView):
    """GET /api/billing/order/<order_id>/ — get bill for a specific order."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, order_id):
        try:
            bill = Bill.objects.get(order_id=order_id)
            return Response(BillSerializer(bill).data)
        except Bill.DoesNotExist:
            return Response({'bill': None})
