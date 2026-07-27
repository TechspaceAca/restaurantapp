"""T Clock — Tables models"""

import uuid
from django.db import models


class DiningTable(models.Model):
    STATUS_CHOICES = [
        ('available', 'Available'),
        ('occupied', 'Occupied'),
        ('reserved', 'Reserved'),
        ('cleaning', 'Cleaning'),
    ]
    SECTION_CHOICES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('terrace', 'Terrace'),
        ('private', 'Private Room'),
    ]

    number = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=50)
    capacity = models.IntegerField(default=4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    section = models.CharField(max_length=20, choices=SECTION_CHOICES, default='indoor')
    qr_token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['number']

    def __str__(self):
        return f"Table {self.number} — {self.name} ({self.status})"

    @property
    def qr_url(self):
        return f"/order/{self.qr_token}/"
