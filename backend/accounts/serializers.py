"""T Clock — accounts app serializers"""

from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=validated_data.get('role', 'staff'),
            phone=validated_data.get('phone', ''),
        )
        return user


class CustomTokenSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer that includes user role and name in the token response."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'name': self.user.get_full_name() or self.user.username,
            'role': self.user.role,
            'email': self.user.email,
        }
        return data


class RestaurantSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = __import__('accounts.models', fromlist=['RestaurantSettings']).RestaurantSettings
        fields = ['name', 'tagline', 'address', 'phone', 'gstin', 'footer']
