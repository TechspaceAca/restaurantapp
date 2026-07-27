"""T Clock — Tables URLs"""

from django.urls import path
from . import views

urlpatterns = [
    path('', views.TableListCreateView.as_view(), name='table-list'),
    path('<int:pk>/', views.TableDetailView.as_view(), name='table-detail'),
    path('<int:pk>/status/', views.TableStatusUpdateView.as_view(), name='table-status'),
    path('qr/<uuid:qr_token>/', views.TableByQRView.as_view(), name='table-by-qr'),
]
