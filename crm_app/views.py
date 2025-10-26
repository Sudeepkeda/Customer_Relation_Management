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
import json
import traceback

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
from django.conf import settings
import os
import base64
import traceback
from datetime import date
import json
@csrf_exempt
def send_quotation_mail(request, pk):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return JsonResponse({"error": "Quotation not found"}, status=404)

    try:
        client_name = quotation.person_name or quotation.company_name or "Client"
        company_name = quotation.company_name or "-"
        recipient_email = quotation.email
        quotation_date = date.today().strftime("%d-%m-%Y")

        # Parse Services Data
        services_data = quotation.services
        if isinstance(services_data, str):
            try:
                services_data = json.loads(services_data)
            except Exception:
                services_data = []
        elif not isinstance(services_data, list):
            services_data = []

        # Section builder
        def get_service_html(title, html):
            return f"""
        <div class="service-section">
            <h2 class="section-title">{title}</h2>
            <div class="section-content">{html}</div>
        </div>
        """

        section_map = {
            "about_us": "About Us",
            "about": "About Us",
            "technical": "Technical Details of Design Services",
            "tech": "Technical Details of Design Services",
            "scope": "Out of Scope",
            "pricing": "Pricing",
        }

        order = ["about", "about_us", "tech", "technical", "scope", "pricing"]

        services_to_show = []
        for s in services_data:
            if not isinstance(s, dict):
                continue
            s_type = s.get("type", "").lower().strip()
            if s_type in section_map:
                matching_key = next((k for k in order if k == s_type), None)
                if matching_key:
                    services_to_show.append((matching_key, s))

        services_to_show.sort(key=lambda x: order.index(x[0]))

        services_html = ""
        for _, s in services_to_show:
            s_type = s.get("type", "").lower().strip()
            s_title = section_map.get(s_type, s_type.title())
            s_content = s.get("content", "")
            services_html += get_service_html(s_title, s_content)

        # Handle Logo
        logo_html = """<div style="width:150px; height:60px; background:linear-gradient(135deg, #008DD2, #0056b3); display:table-cell; vertical-align:middle; text-align:center; border-radius:6px; border:2px solid #008DD2;"><span style="color:white; font-size:14px; font-weight:bold;">DHENU<br/>TECHNOLOGIES</span></div>"""
        
        logo_paths_to_try = [
            os.path.join(settings.BASE_DIR, "frontend", "static", "frontend", "images", "dhenu.png"),
            os.path.join(settings.BASE_DIR, "frontend", "static", "images", "dhenu.png"),
            os.path.join(settings.BASE_DIR, "static", "frontend", "images", "dhenu.png"),
            os.path.join(settings.BASE_DIR, "frontend", "images", "dhenu.png"),
        ]
        
        logo_loaded = False
        for logo_path in logo_paths_to_try:
            if os.path.exists(logo_path):
                try:
                    with open(logo_path, "rb") as image_file:
                        encoded_logo = base64.b64encode(image_file.read()).decode()
                        logo_html = f'<img src="data:image/png;base64,{encoded_logo}" style="max-width:150px; max-height:60px;" alt="Dhenu Technologies Logo" />'
                        print("✅ Logo loaded successfully from:", logo_path)
                        logo_loaded = True
                        break
                except Exception as e:
                    print(f"⚠️ Failed to encode logo from {logo_path}: {e}")
                    continue
        
        if not logo_loaded:
            print("⚠️ No logo file found, using placeholder")

        # Create reusable header HTML - Optimized for space
        header_html = f"""
<table width="100%" style="font-size:12px; line-height:1.1; border:none; margin:0; padding:0;">
  <tr>
    <td width="20%" align="left" style="border:none; padding:0; vertical-align:top;">
      {logo_html}
    </td>
    <td width="80%" align="right" style="border:none; padding:0; vertical-align:top;">
      <div style="font-size:13px; font-weight:bold; margin-bottom:1px;">
        <span style="color:#008DD2;">DHENU </span><span style="color:grey;">TECHNOLOGIES</span>
      </div>
      <div style="font-size:10px; color:grey; line-height:1.2;">
        Kamadhenu, #1069, GF, 10th Cross, 3rd Main,<br/>
        Nandanavana Layout West Sector, Bukkasagara,<br/>
        Jigani, Bengaluru – 560083
      </div>
    </td>
  </tr>
  <tr>
    <td colspan="2" align="center" style="font-size:10px; padding-top:1px; color:grey; border:none;">
      Mobile: 9663688088 / 9480181899 | Email: contact@dhenutechnologies.com | Web: www.dhenutechnologies.com
    </td>
  </tr>
</table>
<div style="border-top:1px solid #888; margin-top:2px;"></div>
"""

        # Create reusable footer HTML
        footer_html = """
<div style="border-top:1px solid #ccc; margin-bottom:2px;"></div>
<table width="100%" style="font-size:12px; color:gray; border:none; margin:0; padding:0;">
  <tr>
    <td align="center" style="border:none; padding-top:2px; line-height:1.3;">
      Domain Registration | Web Hosting Server | Website Designing and Development | 
      Visual Designing | Mobile Application Design | Branding | Packaging Designing | 
      Corporate Identity | Photography
    </td>
  </tr>
</table>
"""

        # Compose full HTML with proper header/footer using xhtml2pdf frame syntax
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page {{
    size: A4;
    margin: 3.2cm 1cm 2.5cm 1cm;
    
    @frame header {{
      -pdf-frame-content: headerContent;
      top: 0.5cm;
      margin-left: 1cm;
      margin-right: 1cm;
      height: 2.5cm;
      font-size: 12px;
    }}
    
    @frame footer {{
      -pdf-frame-content: footerContent;
      bottom: 0.5cm;
      margin-left: 1cm;
      margin-right: 1cm;
      height: 1.8cm;
    }}
  }}
  
  body {{
    font-family: Arial, sans-serif;
    font-size: 11px;
    line-height: 1.4;
    color: #222;
    margin: 0;
    padding: 0;
  }}
  
  h1, h2, h3 {{
    color: #333;
    margin: 5px 0;
    page-break-after: avoid;
  }}
  
  .section-title {{  
    page-break-after: avoid;
  }}
  
  table {{
    border-collapse: collapse;
    padding: 4px;
    page-break-inside: auto;
    width: 100%;
    table-layout: auto;
  }}
  
  th, td {{
    border: 1px solid #ccc;
    padding: 4px;
    word-wrap: break-word;
    page-break-inside: avoid;
  }}
  
  tr {{  
    page-break-inside: avoid;
  }}
  
  .company-box {{
    display: inline-block;
    border: 1px solid #000;
    padding: 10px 20px;
    text-align: center;
    font-size: 12px;
    color: #333;
    line-height: 1.3;
    border-radius: 4px;
    background-color: #fff;
  }}
  
  .notice {{
    margin-top: 60px;
    font-size: 14px;
    text-align: center;
  }}
  
  .service-section {{
    page-break-inside: auto;
    margin-top: 20px;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid #ccc;
  }}
  
  .section-content {{  
    page-break-inside: auto;
    word-wrap: break-word;
    white-space: normal;
  }}
  
  .service-section p {{  
    page-break-inside: auto;
    margin-bottom: 1em;
    word-wrap: break-word;
  }}
  
  .service-section table {{  
    page-break-inside: auto;
  }}
  
  .service-section div {{  
    page-break-inside: auto;
    word-wrap: break-word;
    margin-bottom: 1em;
  }}
  
  img {{
    max-width: 100%;
    height: auto;
    page-break-inside: avoid;
  }}
  
  .cover-page {{
    page-break-after: always;
  }}
</style>
</head>

<body>

<!-- Header content (appears on every page) -->
<div id="headerContent">
{header_html}
</div>

<!-- Footer content (appears on every page) -->
<div id="footerContent">
{footer_html}
</div>

<!-- COVER PAGE -->
<div class="cover-page" style="text-align:center; margin-top:20px;">
  <h1 style="font-size:14px;">Proposal for<br/>{quotation.description or 'Requested Service'}</h1>
  <h3 style="margin-top:25px; font-size:14px;">Client: {client_name}</h3>
  <p style="font-size:13px;"><b>Company:</b> {company_name}</p>
  <p style="font-size:13px;"><b>Date:</b> {quotation_date}</p>

  <div style="margin-top:25px;">
    <div class="company-box">
      <b style="color:#008DD2;">Dhenu</b><b style="color:#000;"> Technologies</b><br/>
      <span style="color:grey;">
        Kamadhenu, #1069, Ground Floor,<br/>
        10th Cross, 3rd Main, Nandanavana Layout,<br/>
        West Sector, Bukkasagara, Jigani,<br/>
        Bengaluru - 560083<br/>
        Contact: +91 9663688088 / +91 9480181899
      </span>
    </div>
  </div>

  <div class="notice">
    <h3 style="font-size:16px; margin-top:48px;">NOTICE</h3>
    <p>
      This document contains proprietary information, which is protected by ownership.<br/>
      No part of this document may be photocopied, reproduced or translated into another
      programming language without prior written consent of DHENU TECHNOLOGIES.
    </p>
    <p>
      Dissemination of the information and/or concepts contained herein to parties other
      than employees and clients is prohibited without the written consent of
      DHENU TECHNOLOGIES.
    </p>
    <p>
      Copyright © {date.today().year} by DHENU TECHNOLOGIES, all rights reserved.
    </p>
  </div>
</div>

<!-- SERVICES CONTENT -->
{services_html}

</body>
</html>
"""

        # Generate PDF
        pdf_file = BytesIO()
        html_bytes = BytesIO(html_content.encode("UTF-8"))
        pisa_status = pisa.CreatePDF(html_bytes, dest=pdf_file)
        if pisa_status.err:
            print("❌ PDF generation error:", pisa_status.err)
            return JsonResponse({"error": "Failed to generate PDF"}, status=500)
        pdf_file.seek(0)

        # Send Email
        subject = f"Proposal for {quotation.description or 'Requested Service'}"
        body = f"""
Dear {client_name},

Please find attached the detailed proposal for your requested project.

We appreciate your interest in Dhenu Technologies and look forward to working with you.

Best regards,  
Sathya Shankara P K  
Dhenu Technologies  
📞 +91 96636 88088  
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
        print("\n=== SEND QUOTATION MAIL ERROR ===")
        traceback.print_exc()
        print("=== END ERROR ===\n")
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
