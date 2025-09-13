from django.urls import path, include
from rest_framework import routers
from .views import login_view, ClientViewSet
from . import views

# DRF router
router = routers.DefaultRouter()
router.register(r'clients', ClientViewSet)

urlpatterns = [
    # API
    path('api/login/', login_view, name='login'),
    path('api/', include(router.urls)),   # <--- add this line

    # Frontend views
    path("dashboard/", views.dashboard, name="dashboard"),
    path("clients/", views.clients, name="clients"),
    path("clients/add/", views.add_client, name="add_client"),
    path("projects/", views.projects, name="projects"),
    path("quotation/", views.quotation, name="quotation"),
    path("quotation/add/", views.add_quotation, name="add_quotation"),
    path("enquiry/", views.enquiry, name="enquiry"),
    path("expiry/", views.expiry, name="expiry"),
]
