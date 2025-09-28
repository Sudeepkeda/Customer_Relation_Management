from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
import json
from django.shortcuts import render,redirect
from .models import Client
from django.core.mail import send_mail
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
from rest_framework import viewsets
from rest_framework import generics
from .serializers import ClientSerializer
from .models import Quotation
from .serializers import QuotationSerializer
from django.utils.timezone import now
from .serializers import EnquirySerializer
from .models import Enquiry
from .models import Project
from .serializers import ProjectSerializer

@csrf_exempt
def login_view(request):
    if request.method == "OPTIONS":
        return JsonResponse({"message": "OK"}, status=200)

    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                return JsonResponse({"success": True, "message": "Login successful"})
            else:
                return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=400)

    return JsonResponse({"error": "Only POST allowed"}, status=405)



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


class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by("-id")
    serializer_class = QuotationSerializer


    def perform_create(self, serializer):
        """Auto-set quotation_date and generate quotation_number"""

        # Auto quotation date
        quotation_date = now().date()

        # Financial year (e.g., 2025-26)
        year = quotation_date.year
        next_year = year + 1
        financial_year = f"{str(year)[-2:]}-{str(next_year)[-2:]}"

        # Count existing quotations for this financial year
        count = Quotation.objects.filter(
            quotation_number__contains=f"DT/Q/{financial_year}"
        ).count() + 1

        quotation_number = f"DT/Q/{financial_year}-{count:03d}"

        serializer.save(
            quotation_date=quotation_date,
            quotation_number=quotation_number
        )


def add_project(request):
    return render(request, "addproject.html")


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
        return redirect("enquiry")  # redirect to enquiry list page

    return render(request, "addenquiry.html")


class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-id")  # newest first
    serializer_class = ProjectSerializer



@api_view(["POST"])
def send_renewal_email(request):
    to_email = request.data.get("to")
    subject = request.data.get("subject")
    body = request.data.get("body")

    try:
        send_mail(
            subject,
            body,
            "info@dhenutechnologies.com",  # From email
            [to_email],
            fail_silently=False,
        )
        return Response({"message": "Email sent successfully"})
    except Exception as e:
        return Response({"error": str(e)}, status=500)
    



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
        service = data.get("service", "Service")

        # Pick correct expiry date
        expiry_date = "-"
        if "Domain" in service and client.domain_end_date:
            expiry_date = client.domain_end_date.strftime("%d/%m/%Y")
        elif "Server" in service and client.server_end_date:
            expiry_date = client.server_end_date.strftime("%d/%m/%Y")
        elif "Maintenance" in service and client.maintenance_end_date:
            expiry_date = client.maintenance_end_date.strftime("%d/%m/%Y")

        subject = f"⚠ Renewal Reminder: Your {service} Will Expire in 30 Days"
        body = f"""
Dear {client.company_name or "Client"},

We hope this message finds you well.

This is a friendly reminder that your {service} associated with Dhenu Technologies is set to expire in 30 days.

To ensure uninterrupted access and avoid any downtime or loss of services, we recommend renewing it before the expiry date.

📅 Expiry Date: {expiry_date}
🔁 Service: {service}

Please get in touch with us at 📞 +91 96636 88088 to proceed with the renewal or if you have any questions regarding your plan.

Thank you for choosing Dhenu Technologies. We look forward to continuing to serve you.

Best regards,
Sathya Shankara P K  
Dhenu Technologies  
📞 +91 96636 88088  
📧 info@dhenutechnologies.com  
🌐 https://dhenutechnologies.com
"""

        send_mail(
            subject,
            body,
            "info@dhenutechnologies.com",  # from email
            [client.email],  # to email
            fail_silently=False,
        )

        return JsonResponse({"success": True, "message": f"Email sent to {client.email}"})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
def send_quotation_mail(request, pk):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return JsonResponse({"error": "Quotation not found"}, status=404)

    try:
        subject = f"📄 Quotation for {quotation.description or 'Requested Service'} – As Discussed"
        body = f"""
Dear {quotation.person_name or quotation.company_name},

Greetings from Dhenu Technologies!

As discussed, please find attached the quotation for the required services based on your current needs and requirements. The proposal includes details of the scope of work, deliverables, and pricing for your review.

We are confident that our solution will help you achieve your goals efficiently and effectively.

If you have any questions or would like to proceed with the next steps, please feel free to contact us at 📞 +91 96636 88088.

Looking forward to your confirmation.

Best regards,
Sathya Shankara P K  
Dhenu Technologies  
📞 +91 96636 88088  
📧 info@dhenutechnologies.com  
🌐 https://dhenutechnologies.com
"""

        send_mail(
            subject,
            body,
            "info@dhenutechnologies.com",  # From email
            [quotation.email],             # To email
            fail_silently=False,
        )

        return JsonResponse({"success": True, "email": quotation.email})
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
    
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