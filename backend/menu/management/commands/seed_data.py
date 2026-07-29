from django.core.management.base import BaseCommand
from accounts.models import User
from menu.models import Category, MenuItem
from tables.models import DiningTable

class Command(BaseCommand):
    help = 'Seeds PostgreSQL database with default admin user, menu categories, dishes, and dining tables'

    def handle(self, *args, **options):
        # 1. Admin user
        admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'role': 'admin',
                'first_name': 'Admin',
                'last_name': 'Manager',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin.set_password('admin123')
            admin.save()
            self.stdout.write(self.style.SUCCESS('Created default admin user: admin / admin123'))

        # 2. Staff user
        staff, s_created = User.objects.get_or_create(
            username='staff',
            defaults={
                'role': 'staff',
                'first_name': 'Cashier',
                'last_name': 'Staff',
                'is_staff': True,
            }
        )
        if s_created:
            staff.set_password('staff123')
            staff.save()
            self.stdout.write(self.style.SUCCESS('Created default staff user: staff / staff123'))

        # 3. Dining Tables
        for i in range(1, 11):
            DiningTable.objects.get_or_create(
                number=f"T{i}",
                defaults={'name': f"Table {i}", 'capacity': 4, 'status': 'available'}
            )

        # 4. Categories & Menu Items
        cats = [
            ('Starters', '🥗', 1),
            ('Main Course', '🍛', 2),
            ('Beverages', '🥤', 3),
            ('Desserts', '🍨', 4),
        ]
        for name, icon, order in cats:
            cat_obj, _ = Category.objects.get_or_create(
                name=name,
                defaults={'icon': icon, 'sort_order': order}
            )

        starters = Category.objects.filter(name='Starters').first()
        if starters:
            MenuItem.objects.get_or_create(
                name='Paneer Tikka',
                defaults={
                    'category': starters,
                    'price': 280,
                    'half_price': 170,
                    'quarter_price': 100,
                    'is_veg': True,
                    'description': 'Grilled cottage cheese cubes marinated in spiced yogurt.',
                    'is_available': True,
                }
            )
            MenuItem.objects.get_or_create(
                name='Chilli Chicken (Dry)',
                defaults={
                    'category': starters,
                    'price': 299,
                    'half_price': 180,
                    'quarter_price': 110,
                    'is_veg': False,
                    'description': 'Crispy chicken tossed in fiery Indo-Chinese garlic sauce.',
                    'is_available': True,
                }
            )

        self.stdout.write(self.style.SUCCESS('PostgreSQL Database seeded successfully!'))
