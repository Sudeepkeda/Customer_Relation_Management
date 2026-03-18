from django.urls import path, include
from rest_framework import routers
from django.conf import settings
from django.conf.urls.static import static

from django.contrib import admin

from .views import (
    login_view, ClientViewSet, QuotationViewSet, EnquiryViewSet, ProjectViewSet,
    user_profile, UpdationViewSet, send_renewal_mail,ckeditor_upload,
)
from . import views
from django.shortcuts import redirect

# ------------------------
# DRF Routers (API Routes)
# ------------------------
router = routers.DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'quotations', QuotationViewSet, basename='quotation')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'updations', UpdationViewSet, basename='updation')
router.register(r'todos', views.TodoViewSet, basename='todo')

# ------------------------
# URL Patterns
# ------------------------
urlpatterns = [
    # API Endpoints
     path("admin/", admin.site.urls),
    path('api/login/', login_view, name='login'),
    path('api/user-profile/', user_profile, name='user_profile'),
    path('api/', include(router.urls)),
    path('api/send-renewal-email/', send_renewal_mail),
    path('api/send-renewal-mail/<int:pk>/', views.send_renewal_mail, name='send_renewal_mail'),
    path('api/send-quotation-mail/<int:pk>/', views.send_quotation_mail, name='send_quotation_mail'),
    path("api/download-quotation/<int:pk>/", views.download_quotation_pdf),
    path('api/ckeditor-upload/', ckeditor_upload, name='ckeditor_upload'),
    
    # Frontend Views
    path('', views.login_page, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('clients/', views.clients, name='clients'),
    path('clients/add/', views.add_client, name='add_client'),
    path('projects/', views.projects, name='projects'),
    path('projects/add/', views.add_project, name='add_project'),
    path('quotation/', views.quotation, name='quotation'),
    path('quotation/add/', views.add_quotation, name='add_quotation'),
    path('enquiry/', views.enquiry, name='enquiry'),
    path('enquiry/add/', views.add_enquiry, name='add_enquiry'),
    path('addenquiry/', lambda request: redirect('add_enquiry', permanent=True)),
    path('expiry/', views.expiry, name='expiry'),
    path('updation/', views.updation, name='updation'),
    path('updation/add/', views.add_updations, name='add_updation'),
    path('todo/', views.todo, name='todo'),
    path('todo/add/', views.add_todo, name='add_todo'),
    path('user-profile/', views.user_profile_view, name='user_profile_page'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
