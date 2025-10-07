from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import viewsets, generics
from django.utils.timezone import now
from datetime import timedelta, date
from django.core.mail import EmailMessage
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from rest_framework.authtoken.models import Token
from .models import Updation
from .serializers import UpdationSerializer
from xhtml2pdf import pisa
from rest_framework import status

from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required

import json
from functools import wraps

from .models import Client, Quotation, Enquiry, Project, Updation
from .serializers import ClientSerializer, QuotationSerializer, EnquirySerializer, ProjectSerializer, UpdationSerializer

# ---------------------
# Login with Token
# ---------------------
@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        data = json.loads(request.body)
        username = data.get("username")
        password = data.get("password")

        user = authenticate(username=username, password=password)
        if user:
            token, created = Token.objects.get_or_create(user=user)
            return JsonResponse({"success": True, "token": token.key, "message": "Login successful"})
        else:
            return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)

    except Exception as e:
        return JsonResponse({"success": False, "message": str(e)}, status=400)


# ---------------------
# Profile update
# ---------------------
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user

    if request.method == "GET":
        return JsonResponse({"username": user.username})

    elif request.method == "PUT":
        try:
            data = request.data
            username = data.get("username")
            password = data.get("password")

            if username:
                user.username = username
            if password:
                user.set_password(password)
                update_session_auth_hash(request, user)

            user.save()
            return JsonResponse({"success": True, "message": "Profile updated successfully!"})
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)}, status=400)
# ===================
# Client Management
# ===================
def add_client(request):
    if request.method == "POST":
        Client.objects.create(
            company_name=request.POST.get("companyName"),
            industry=request.POST.get("industry"),
            person_name=request.POST.get("personName"),
            contact=request.POST.get("Contact"),
            email=request.POST.get("Email"),
            website=request.POST.get("Website"),
            address=request.POST.get("Address"),
            gst=request.POST.get("GST"),
            amc=request.POST.get("AMC"),
            amc_price=request.POST.get("AMCPrice"),
            domain=request.POST.get("Domain"),
            domain_charges=request.POST.get("DomainCharges"),
            server_details=request.POST.get("ServerDetails"),
            server_price=request.POST.get("ServerPrice"),
            maintenance_value=request.POST.get("MaintenanceValue"),
            comments=request.POST.get("Comments"),
        )
        return redirect("clients")
    return render(request, "addclient.html")


def clients_list(request):
    clients = Client.objects.all()
    return render(request, "clients.html", {"clients": clients})


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer


# ===================
# Quotation
# ===================
class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by("-id")
    serializer_class = QuotationSerializer

    def perform_create(self, serializer):
        """Auto-set quotation_date and generate quotation_number"""
        quotation_date = now().date()
        year = quotation_date.year
        next_year = year + 1
        financial_year = f"{str(year)[-2:]}-{str(next_year)[-2:]}"
        count = Quotation.objects.filter(
            quotation_number__contains=f"DT/Q/{financial_year}"
        ).count() + 1
        quotation_number = f"DT/Q/{financial_year}-{count:03d}"

        serializer.save(
            quotation_date=quotation_date,
            quotation_number=quotation_number
        )

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.core.mail import EmailMessage
from io import BytesIO
from xhtml2pdf import pisa
from .models import Quotation

@csrf_exempt
def send_quotation_mail(request, pk):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return JsonResponse({"error": "Quotation not found"}, status=404)

    try:
        service_name = quotation.description or "Requested Service"
        client_name = quotation.person_name or quotation.company_name or "Client"
        recipient_email = quotation.email

        # ------------------------
        # 1️⃣ Create HTML for PDF
        # ------------------------
        services_html = ""
        for service in quotation.services:
            service_type = service.get("type", "")
            content = service.get("content", "")
            services_html += f"<h3>{service_type.capitalize()}</h3>{content}<br/>"

        html_content = f"""
        <html>
        <head>
        <style>
        body {{ font-family: Arial, sans-serif; font-size: 12px; }}
        h1 {{ color: #333; }}
        h2 {{ color: #444; margin-bottom: 5px; }}
        h3 {{ color: #555; margin-bottom: 5px; }}
        table, th, td {{ border: 1px solid #333; border-collapse: collapse; padding: 5px; }}
        </style>
        </head>
        <body>
        <h1>Quotation for {service_name}</h1>
        <p><strong>Client:</strong> {client_name}</p>
        <p><strong>Company:</strong> {quotation.company_name}</p>
        <p><strong>Contact:</strong> {quotation.contact}</p>
        <p><strong>Email:</strong> {quotation.email}</p>
        <hr/>
        <h2>Services</h2>
        {services_html}
        </body>
        </html>
        """

        # ------------------------
        # 2️⃣ Generate PDF with xhtml2pdf
        # ------------------------
        pdf_file = BytesIO()
        pisa_status = pisa.CreatePDF(html_content, dest=pdf_file)
        if pisa_status.err:
            return JsonResponse({"error": "Failed to generate PDF"}, status=500)
        pdf_file.seek(0)

        # ------------------------
        # 3️⃣ Send Email with your template
        # ------------------------
        subject = f"📄 Quotation for {service_name} – As Discussed"
        body = f"""
Dear {client_name},

Greetings from Dhenu Technologies!

As discussed, please find attached the quotation for the required services based on your current needs and requirements. The proposal includes details of the scope of work, deliverables, and pricing for your review.

We are confident that our solution will help you achieve your goals efficiently and effectively.

If you have any questions or would like to proceed with the next steps, please feel free to contact us at 📞 +91 96636 88088‬.

Looking forward to your confirmation.

Best regards,
Sathya Shankara P K
Dhenu Technologies
📞 +91 96636 88088‬
📧 info@dhenutechnologies.com
🌐 https://dhenutechnologies.com
"""
        email = EmailMessage(
            subject=subject,
            body=body,
            from_email="info@dhenutechnologies.com",
            to=[recipient_email],
        )
        email.attach(f"Quotation_{quotation.id}.pdf", pdf_file.read(), "application/pdf")
        email.send(fail_silently=False)

        return JsonResponse({"success": True, "email": recipient_email})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ===================
# Enquiry
# ===================
class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all().order_by("-date")
    serializer_class = EnquirySerializer


def add_enquiry(request):
    if request.method == "POST":
        Enquiry.objects.create(
            name=request.POST.get("name"),
            email=request.POST.get("email"),
            phone=request.POST.get("phone"),
            message=request.POST.get("message"),
        )
        return redirect("enquiry")
    return render(request, "addenquiry.html")


# ===================
# Project
# ===================
class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-id")
    serializer_class = ProjectSerializer


def add_project(request):
    return render(request, "addproject.html")


# ===================
# Renewal Emails
# ===================
@csrf_exempt
def send_renewal_mail(request, pk):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        client = Client.objects.get(pk=pk)
    except Client.DoesNotExist:
        return JsonResponse({"error": "Client not found"}, status=404)

    try:
        data = json.loads(request.body.decode("utf-8"))
        today = date.today()
        threshold = today + timedelta(days=30)

        # Collect expiring services
        service_info = []
        if client.domain_end_date and client.domain_end_date <= threshold:
            service_info.append(("Domain", client.domain_end_date))
        if client.server_end_date and client.server_end_date <= threshold:
            service_info.append(("Server", client.server_end_date))
        if client.maintenance_end_date and client.maintenance_end_date <= threshold:
            service_info.append(("Maintenance", client.maintenance_end_date))

        if not service_info:
            return JsonResponse({"success": False, "message": "No services expiring within 30 days"})

        # Subject line
        service_names = " and ".join([s[0] for s in service_info])
        subject = f"⚠ Renewal Reminder: Your {service_names} Will Expire in 30 Days"

        # Body content
        service_lines = "\n".join(
            [f"📅 Expiry Date: {d.strftime('%d/%m/%Y')}\n🔁 Service: {s}" for s, d in service_info]
        )

        body = f"""
Dear {client.company_name or 'Client'},

We hope this message finds you well.

This is a friendly reminder that your {service_names} associated with {client.company_name or 'your company'} is set to expire in 30 days.

To ensure uninterrupted access and avoid any downtime or loss of services, we recommend renewing it before the expiry date.

{service_lines}

Please get in touch with us at 📞 +91 96636 88088 to proceed with the renewal or if you have any questions regarding your plan.

Thank you for choosing {client.company_name or 'your company'}. We look forward to continuing to serve you.

Best regards,  
Sathya Shankara P K  
Dhenu Technologies  
📞 +91 96636 88088  
📧 info@dhenutechnologies.com  
🌐 https://dhenutechnologies.com
"""

        send_mail(subject, body, "info@dhenutechnologies.com", [client.email], fail_silently=False)
        return JsonResponse({"success": True, "message": f"Email sent to {client.email}"})

    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


class UpdationViewSet(viewsets.ModelViewSet):
    queryset = Updation.objects.all().order_by('-id')
    serializer_class = UpdationSerializer

@api_view(['GET', 'POST'])
def updations_api(request):
    if request.method == 'GET':
        updations = Updation.objects.all().order_by('-created_at')
        serializer = UpdationSerializer(updations, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = UpdationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def updation_detail(request, pk):
    try:
        updation = Updation.objects.get(pk=pk)
    except Updation.DoesNotExist:
        return Response({'error': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = UpdationSerializer(updation)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = UpdationSerializer(updation, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        updation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

# ===================
# Dashboard Views
# ===================
def dashboard(request):
    return render(request, "dashboard.html")

def clients(request):
    return render(request, "Clients.html")

def projects(request):
    return render(request, "Projects.html")

def quotation(request):
    return render(request, "quotation.html")

def add_quotation(request):
    return render(request, "addquotation.html")

def enquiry(request):
    return render(request, "enquiry.html")

def expiry(request):
    return render(request, "expiry.html")

def updation(request):
    return render(request, "updation.html")
