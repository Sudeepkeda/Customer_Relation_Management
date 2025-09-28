from django.urls import path, include
from rest_framework import routers
from .views import login_view, ClientViewSet, QuotationViewSet, EnquiryViewSet, ProjectViewSet  # ✅ Added
from . import views
from .views import send_renewal_email


# DRF router
router = routers.DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')
router.register(r'projects', ProjectViewSet, basename='project')  # ✅ Added



urlpatterns = [
    # API endpoints
    path('api/login/', login_view, name='login'),
    path('api/', include(router.urls)),
    path("api/send-renewal-email/", send_renewal_email),
    # Frontend views
    path("dashboard/", views.dashboard, name="dashboard"),
    path("clients/", views.clients, name="clients"),
    path("clients/add/", views.add_client, name="add_client"),
    path("projects/", views.projects, name="projects"),
    path("projects/add/", views.add_project, name="add_project"),
    path("quotation/", views.quotation, name="quotation"),
    path("quotation/add/", views.add_quotation, name="add_quotation"),
    path("enquiry/", views.enquiry, name="enquiry"),
    path("enquiry/add/", views.add_enquiry, name="add_enquiry"),
    path("expiry/", views.expiry, name="expiry"),
    path("api/send-renewal-mail/<int:pk>/", views.send_renewal_mail, name="send_renewal_mail"),
    path("api/send-quotation-mail/<int:pk>/", views.send_quotation_mail, name="send_quotation_mail"),

]
