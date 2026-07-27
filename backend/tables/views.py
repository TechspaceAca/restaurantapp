"""T Clock — Tables views"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from .models import DiningTable
from .serializers import TableSerializer
from accounts.permissions import IsAdmin, IsStaffOrAdmin, IsAnyStaff


class TableListCreateView(generics.ListCreateAPIView):
    serializer_class = TableSerializer

    def get_queryset(self):
        qs = DiningTable.objects.filter(is_active=True)
        section = self.request.query_params.get('section')
        status_filter = self.request.query_params.get('status')
        if section:
            qs = qs.filter(section=section)
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAdmin()]
        return [IsAnyStaff()]


class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = DiningTable.objects.all()
    serializer_class = TableSerializer

    def get_permissions(self):
        if self.request.method in ['DELETE', 'PUT']:
            return [IsAdmin()]
        return [IsStaffOrAdmin()]


class TableByQRView(APIView):
    """GET /api/tables/qr/<token>/ — Customer QR lookup (public)."""
    permission_classes = [AllowAny]

    def get(self, request, qr_token):
        try:
            table = DiningTable.objects.get(qr_token=qr_token, is_active=True)
            serializer = TableSerializer(table)
            return Response(serializer.data)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Table not found'}, status=status.HTTP_404_NOT_FOUND)


class TableStatusUpdateView(APIView):
    """PATCH /api/tables/<id>/status/ — quickly update table status."""
    permission_classes = [IsStaffOrAdmin]

    def patch(self, request, pk):
        try:
            table = DiningTable.objects.get(pk=pk)
            new_status = request.data.get('status')
            if new_status not in dict(DiningTable.STATUS_CHOICES):
                return Response({'error': 'Invalid status'}, status=400)
            table.status = new_status
            table.save()
            return Response(TableSerializer(table).data)
        except DiningTable.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
