"""
T Clock — Seed Script
Run: python backend/seed.py
Creates default admin, staff, kitchen users + sample menu and tables.
"""

import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tclock.settings')
django.setup()

from accounts.models import User
from menu.models import Category, MenuItem
from tables.models import DiningTable

print("🌴 Seeding T Clock database...")

# ── Users ─────────────────────────────────────────────────────────────────────
users = [
    {'username': 'admin', 'password': 'owner123', 'role': 'admin', 'first_name': 'Restaurant', 'last_name': 'Owner', 'is_staff': True, 'is_superuser': True},
    {'username': 'staff', 'password': 'staff123', 'role': 'staff', 'first_name': 'Rahul', 'last_name': 'Cashier'},
    {'username': 'kitchen', 'password': 'kitchen123', 'role': 'kitchen', 'first_name': 'Chef', 'last_name': 'Master'},
]

for u in users:
    if not User.objects.filter(username=u['username']).exists():
        User.objects.create_user(
            username=u['username'],
            password=u['password'],
            role=u['role'],
            first_name=u['first_name'],
            last_name=u['last_name'],
            is_staff=u.get('is_staff', False),
            is_superuser=u.get('is_superuser', False),
        )
        print(f"  ✓ User: {u['username']} / {u['password']} ({u['role']})")

# ── Categories & Menu Items ───────────────────────────────────────────────────
menu_data = [
    {
        'name': 'Starters', 'icon': '🥗', 'items': [
            {'name': 'Paneer Tikka', 'price': 280, 'is_veg': True, 'prep_time': 15, 'description': 'Grilled cottage cheese with spices'},
            {'name': 'Chicken Wings', 'price': 320, 'is_veg': False, 'prep_time': 20, 'description': 'Crispy wings with dipping sauce'},
            {'name': 'Veg Spring Rolls', 'price': 180, 'is_veg': True, 'prep_time': 12},
            {'name': 'Chilli Chicken (Dry)', 'price': 299, 'is_veg': False, 'prep_time': 18},
        ]
    },
    {
        'name': 'Main Course', 'icon': '🍛', 'items': [
            {'name': 'Butter Chicken', 'price': 380, 'is_veg': False, 'prep_time': 25, 'description': 'Creamy tomato-based chicken curry', 'is_featured': True},
            {'name': 'Dal Makhani', 'price': 280, 'is_veg': True, 'prep_time': 20, 'is_featured': True},
            {'name': 'Paneer Butter Masala', 'price': 320, 'is_veg': True, 'prep_time': 20},
            {'name': 'Mutton Rogan Josh', 'price': 450, 'is_veg': False, 'prep_time': 35},
            {'name': 'Kadai Chicken', 'price': 360, 'is_veg': False, 'prep_time': 25},
        ]
    },
    {
        'name': 'Biryani', 'icon': '🍚', 'items': [
            {'name': 'Chicken Biryani', 'price': 350, 'is_veg': False, 'prep_time': 30, 'is_featured': True},
            {'name': 'Veg Biryani', 'price': 280, 'is_veg': True, 'prep_time': 25},
            {'name': 'Mutton Biryani', 'price': 420, 'is_veg': False, 'prep_time': 40},
            {'name': 'Prawn Biryani', 'price': 480, 'is_veg': False, 'prep_time': 35},
        ]
    },
    {
        'name': 'Breads', 'icon': '🫓', 'items': [
            {'name': 'Butter Naan', 'price': 60, 'is_veg': True, 'prep_time': 8},
            {'name': 'Garlic Naan', 'price': 70, 'is_veg': True, 'prep_time': 8},
            {'name': 'Tandoori Roti', 'price': 45, 'is_veg': True, 'prep_time': 6},
            {'name': 'Laccha Paratha', 'price': 80, 'is_veg': True, 'prep_time': 10},
        ]
    },
    {
        'name': 'Beverages', 'icon': '🥤', 'items': [
            {'name': 'Mango Lassi', 'price': 120, 'is_veg': True, 'prep_time': 5, 'is_featured': True},
            {'name': 'Masala Chai', 'price': 60, 'is_veg': True, 'prep_time': 5},
            {'name': 'Fresh Lime Soda', 'price': 80, 'is_veg': True, 'prep_time': 3},
            {'name': 'Cold Coffee', 'price': 140, 'is_veg': True, 'prep_time': 5},
            {'name': 'Watermelon Juice', 'price': 100, 'is_veg': True, 'prep_time': 5},
        ]
    },
    {
        'name': 'Desserts', 'icon': '🍮', 'items': [
            {'name': 'Gulab Jamun', 'price': 100, 'is_veg': True, 'prep_time': 5},
            {'name': 'Kulfi', 'price': 120, 'is_veg': True, 'prep_time': 3},
            {'name': 'Rasgulla', 'price': 90, 'is_veg': True, 'prep_time': 5},
        ]
    },
]

for i, cat_data in enumerate(menu_data):
    cat, created = Category.objects.get_or_create(
        name=cat_data['name'],
        defaults={'icon': cat_data['icon'], 'sort_order': i}
    )
    if created:
        print(f"  ✓ Category: {cat_data['icon']} {cat_data['name']}")

    for j, item_data in enumerate(cat_data['items']):
        item, icreated = MenuItem.objects.get_or_create(
            name=item_data['name'],
            category=cat,
            defaults={
                'price': item_data['price'],
                'half_price': item_data.get('half_price', round(item_data['price'] * 0.6)),
                'quarter_price': item_data.get('quarter_price', round(item_data['price'] * 0.35)),
                'is_veg': item_data.get('is_veg', True),
                'prep_time': item_data.get('prep_time', 15),
                'description': item_data.get('description', ''),
                'is_featured': item_data.get('is_featured', False),
                'sort_order': j,
            }
        )
        if icreated:
            print(f"    + {item.name} ₹{item.price}")

# ── Tables ─────────────────────────────────────────────────────────────────────
tables_data = [
    {'number': 'T1', 'name': 'Table 1', 'capacity': 2, 'section': 'indoor'},
    {'number': 'T2', 'name': 'Table 2', 'capacity': 4, 'section': 'indoor'},
    {'number': 'T3', 'name': 'Table 3', 'capacity': 4, 'section': 'indoor'},
    {'number': 'T4', 'name': 'Table 4', 'capacity': 6, 'section': 'indoor'},
    {'number': 'T5', 'name': 'Table 5', 'capacity': 6, 'section': 'indoor'},
    {'number': 'T6', 'name': 'Table 6', 'capacity': 2, 'section': 'outdoor'},
    {'number': 'T7', 'name': 'Table 7', 'capacity': 4, 'section': 'outdoor'},
    {'number': 'T8', 'name': 'Terrace A', 'capacity': 8, 'section': 'terrace'},
    {'number': 'T9', 'name': 'Terrace B', 'capacity': 8, 'section': 'terrace'},
    {'number': 'P1', 'name': 'Private Room', 'capacity': 12, 'section': 'private'},
]

for t in tables_data:
    table, created = DiningTable.objects.get_or_create(
        number=t['number'],
        defaults={
            'name': t['name'],
            'capacity': t['capacity'],
            'section': t['section'],
        }
    )
    if created:
        print(f"  ✓ Table: {t['name']} ({t['section']}) — QR: /order/{table.qr_token}/")

print("\n✅ Seed complete!")
print("\n📋 Login credentials:")
print("  Admin   → username: admin    | password: owner123")
print("  Staff   → username: staff    | password: staff123")
print("  Kitchen → username: kitchen  | password: kitchen123")
print("\n🚀 Run backend: python backend/manage.py runserver")
print("🚀 Run frontend: cd frontend && npm run dev")
