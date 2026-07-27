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
            order = Order.objects.prefetch_related('items__menu_item').get(id=data['order_id'])
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=404)

        if order.status == 'cancelled':
            return Response({'error': 'Cannot bill a cancelled order'}, status=400)

        if hasattr(order, 'bill'):
            return Response({'error': 'Bill already generated', 'bill_id': order.bill.id}, status=400)

        # Compute totals
        subtotal = order.subtotal
        include_gst = data.get('include_gst', True)
        tax_percent = data['tax_percent'] if include_gst else 0
        tax_amount = (subtotal * tax_percent) / 100 if include_gst else 0
        discount = data['discount_amount']
        total = subtotal + tax_amount - discount

        bill = Bill.objects.create(
            order=order,
            subtotal=subtotal,
            include_gst=include_gst,
            tax_percent=tax_percent,
            tax_amount=tax_amount,
            discount_amount=discount,
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

        # Build WhatsApp receipt text
        whatsapp_text = _build_whatsapp_receipt(bill, order)

        response_data = BillSerializer(bill).data
        response_data['whatsapp_text'] = whatsapp_text
        return Response(response_data, status=201)


def _build_whatsapp_receipt(bill, order):
    """Build a WhatsApp-friendly receipt message for the customer."""
    lines = []
    lines.append("🌴 *T Clock POS — Receipt*")
    lines.append("━━━━━━━━━━━━━━━━━━━━")

    if order.table:
        lines.append(f"🪑 Table: *{order.table.name or order.table.number}*")
    lines.append(f"🧾 Bill No: *{bill.bill_number}*")
    lines.append(f"📅 Date: {bill.created_at.strftime('%d %b %Y, %I:%M %p')}")
    lines.append("")
    lines.append("*Order Items:*")
    lines.append("─────────────────────")

    for item in order.items.all():
        item_total = item.quantity * item.unit_price
        lines.append(f"  {item.quantity}× {item.menu_item.name}  ₹{int(item_total)}")
        if item.notes:
            lines.append(f"     _{item.notes}_")

    lines.append("─────────────────────")
    lines.append(f"Subtotal:   ₹{int(bill.subtotal)}")
    if bill.include_gst and bill.tax_amount > 0:
        lines.append(f"GST ({bill.tax_percent}%):  ₹{int(bill.tax_amount)}")
    else:
        lines.append("GST: Excluded (No GST charged)")

    if bill.discount_amount > 0:
        reason = f" ({bill.discount_reason})" if bill.discount_reason else ""
        lines.append(f"Discount{reason}: -₹{int(bill.discount_amount)}")

    lines.append("━━━━━━━━━━━━━━━━━━━━")
    lines.append(f"*TOTAL:  ₹{int(bill.total)}*")
    lines.append(f"💳 Payment: {bill.get_payment_method_display()}")
    lines.append("━━━━━━━━━━━━━━━━━━━━")
    lines.append("Thank you for visiting! 😊")
    lines.append("Visit us again at T Clock Resto Cafe 🌴")

    return "\n".join(lines)


class OrderBillView(APIView):
    """GET /api/billing/order/<order_id>/ — get bill for a specific order."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, order_id):
        try:
            bill = Bill.objects.get(order_id=order_id)
            return Response(BillSerializer(bill).data)
        except Bill.DoesNotExist:
            return Response({'bill': None})


class BillWhatsAppTextView(APIView):
    """GET /api/billing/<bill_id>/whatsapp/ — get WhatsApp receipt text for a generated bill."""
    permission_classes = [IsStaffOrAdmin]

    def get(self, request, pk):
        try:
            bill = Bill.objects.prefetch_related('order__items__menu_item').get(pk=pk)
        except Bill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=404)

        text = _build_whatsapp_receipt(bill, bill.order)
        return Response({
            'bill_number': bill.bill_number,
            'whatsapp_text': text,
            'customer_phone': bill.order.customer_phone or '',
            'total': str(bill.total),
        })
