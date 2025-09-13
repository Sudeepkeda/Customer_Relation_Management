from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login
import json
from django.shortcuts import render,redirect
from .models import Client
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets
from .serializers import ClientSerializer


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