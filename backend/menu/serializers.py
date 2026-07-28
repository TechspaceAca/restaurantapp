"""T Clock — Menu serializers"""

from rest_framework import serializers
from .models import Category, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = MenuItem
        fields = [
            'id', 'category', 'category_name', 'name', 'description',
            'price', 'half_price', 'quarter_price', 'image', 'is_veg',
            'is_available', 'is_featured', 'prep_time', 'calories', 'sort_order',
        ]


class CategorySerializer(serializers.ModelSerializer):
    items = MenuItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'description', 'is_active', 'sort_order', 'items', 'item_count']

    def get_item_count(self, obj):
        return obj.items.filter(is_available=True).count()


class CategoryLightSerializer(serializers.ModelSerializer):
    """Category without nested items — for dropdown lists."""
    class Meta:
        model = Category
        fields = ['id', 'name', 'icon', 'is_active', 'sort_order']
