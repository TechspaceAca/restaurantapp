"""T Clock — Menu views"""

from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .models import Category, MenuItem
from .serializers import CategorySerializer, CategoryLightSerializer, MenuItemSerializer
from accounts.permissions import IsAdmin, IsAnyStaff


class CategoryListCreateView(generics.ListCreateAPIView):
    """GET — public (for customers too). POST — Admin only."""
    queryset = Category.objects.filter(is_active=True)

    def get_serializer_class(self):
        if self.request.query_params.get('light'):
            return CategoryLightSerializer
        return CategorySerializer

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdmin]


class MenuItemListCreateView(generics.ListCreateAPIView):
    serializer_class = MenuItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = MenuItem.objects.all()
        category = self.request.query_params.get('category')
        available = self.request.query_params.get('available')
        if category:
            qs = qs.filter(category_id=category)
        if available == 'true':
            qs = qs.filter(is_available=True)
        return qs

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]


class MenuItemDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsAdmin]


class ToggleItemAvailabilityView(generics.UpdateAPIView):
    """PATCH /api/menu/items/<id>/toggle/ — quickly toggle availability."""
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    permission_classes = [IsAdmin]

    def patch(self, request, *args, **kwargs):
        item = self.get_object()
        item.is_available = not item.is_available
        item.save()
        return Response({'id': item.id, 'is_available': item.is_available})
