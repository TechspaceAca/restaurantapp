"""T Clock — accounts app models"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomRole(models.Model):
    name = models.CharField(max_length=50, unique=True)
    base_access = models.CharField(
        max_length=20, 
        choices=[('staff', 'Staff / Cashier'), ('kitchen', 'Kitchen Cook')],
        default='staff'
    )

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_base_access_display()})"


class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'Admin / Owner'),
        ('staff', 'Staff / Cashier'),
        ('kitchen', 'Kitchen Cook'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='staff')
    custom_role = models.ForeignKey(CustomRole, null=True, blank=True, on_delete=models.SET_NULL)
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    class Meta:
        ordering = ['username']

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"


class RestaurantSettings(models.Model):
    name = models.CharField(max_length=100, default='T CLOCK RESTO CAFE')
    tagline = models.CharField(max_length=200, default='Time for Tea, Time for Taste', blank=True)
    address = models.TextField(default='Main Road, Calicut, Kerala')
    phone = models.CharField(max_length=20, default='+91 98765 43210')
    gstin = models.CharField(max_length=50, default='32ABCDE1234F1Z5', blank=True)
    footer = models.CharField(max_length=200, default='Thank you for visiting T Clock Resto Cafe! 🌴', blank=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "Restaurant Settings"
