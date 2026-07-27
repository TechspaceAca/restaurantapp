from django.contrib import admin
from .models import Category, MenuItem

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'icon', 'is_active', 'sort_order']
    list_editable = ['is_active', 'sort_order']

@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'is_veg', 'is_available', 'is_featured']
    list_filter = ['category', 'is_veg', 'is_available']
    list_editable = ['price', 'is_available']
    search_fields = ['name']
