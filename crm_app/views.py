# ==============================
# CRM APP - CLEANED & STABLE VIEWS
# ==============================

from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import authenticate, login, update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from django.core.mail import send_mail, EmailMessage
from django.utils.timezone import now
from django.conf import settings
from datetime import timedelta, date
from io import BytesIO
from functools import wraps
import os, json, base64, traceback
import re
import uuid
from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.authtoken.models import Token
from django.http import JsonResponse, HttpResponse, HttpResponseBadRequest
from django.http import FileResponse

from xhtml2pdf import pisa

from .models import Client, Quotation, Enquiry, Project, Updation, Todo
from .serializers import (
    ClientSerializer, QuotationSerializer, EnquirySerializer,
    ProjectSerializer, UpdationSerializer, TodoSerializer
)

# ---------------------
# Quotation PDF helper
# ---------------------
def _build_quotation_pdf(quotation):
    """
    Returns (pdf_bytes, filename).
    Reuses the same HTML->PDF generation used for emailing.
    """
    client_name = quotation.person_name or quotation.company_name or "Client"
    company_name = quotation.company_name or "-"
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
        "technical_details": "Technical Details of Design Services",
        "technicaldata": "Technical Details of Design Services",
        "out_of_scope": "Out of Scope",
        "outofscope": "Out of Scope",
    }

    order = [
        "about",
        "about_us",
        "about_us",
        "technical_details",
        "technicaldata",
        "tech",
        "technical",
        "out_of_scope",
        "outofscope",
        "scope",
        "pricing",
    ]

    services_to_show = []
    for s in services_data:
        if not isinstance(s, dict):
            continue
        s_type = (s.get("type", "") or "").lower().strip()
        if s_type in section_map:
            services_to_show.append((s_type, s))

    # stable sort by our preferred order
    def _order_index(t):
        try:
            return order.index(t)
        except ValueError:
            return 999

    services_to_show.sort(key=lambda x: _order_index(x[0]))

    def _normalize_pdf_html(html):
        """
        xhtml2pdf doesn't fully support CKEditor wrappers like <figure>.
        This also reduces extra spacing coming from default margins.
        """
        if not isinstance(html, str):
            return html

        # unwrap CKEditor "table" figures so tables render reliably
        # Example: <figure class="table"> <table>...</table> </figure>
        html = re.sub(
            r'<figure[^>]*class="[^"]*\btable\b[^"]*"[^>]*>\s*(<table[\s\S]*?</table>)\s*</figure>',
            r"\1",
            html,
            flags=re.IGNORECASE,
        )
        # Some editors wrap tables with plain <figure>...</figure>
        html = re.sub(
            r"<figure[^>]*>\s*(<table[\s\S]*?</table>)\s*</figure>",
            r"\1",
            html,
            flags=re.IGNORECASE,
        )

        # remove Word/Office tags if pasted
        html = html.replace("<o:p>", "").replace("</o:p>", "")

        # collapse repeated <br> that creates large gaps
        while "<br><br><br>" in html:
            html = html.replace("<br><br><br>", "<br><br>")
        while "<br/><br/><br/>" in html:
            html = html.replace("<br/><br/><br/>", "<br/><br/>")

        # Fix invalid CSS/HTML color values produced by editors (xhtml2pdf/reportlab is strict)
        # Example error: Invalid color value 'medium'
        #
        # Handle HTML attributes like: <font color="medium">, <table bgcolor="medium">, <td bordercolor="medium">
        html = re.sub(r'\b(color|bgcolor|bordercolor)\s*=\s*["\']\s*medium\s*["\']', r'\1="#000"', html, flags=re.IGNORECASE)
        # Handle style properties (including !important and missing semicolon edge cases)
        html = re.sub(
            r"(color|background-color|border-color)\s*:\s*medium\s*!important",
            r"\1:#000",
            html,
            flags=re.IGNORECASE,
        )
        html = re.sub(
            r"(color|background-color|border-color)\s*:\s*medium\b",
            r"\1:#000",
            html,
            flags=re.IGNORECASE,
        )

        return html

    services_html = ""
    for _, s in services_to_show:
        s_type = (s.get("type", "") or "").lower().strip()
        s_title = section_map.get(s_type, s_type.title())
        s_content = _normalize_pdf_html(s.get("content", ""))
        services_html += get_service_html(s_title, s_content)

    # ------------- LOGO (BIGGER) -------------
    logo_html = """
<div style="
    width:180px;
    height:90px;
    background:linear-gradient(135deg, #008DD2, #0056b3);
    display:table-cell;
    vertical-align:middle;
    text-align:center;
    border-radius:6px;
    border:2px solid #008DD2;
">
    <span style="color:white; font-size:14px; font-weight:bold; letter-spacing:1px;">
        DHENU<br/>TECHNOLOGIES
    </span>
</div>
"""

    logo_paths_to_try = [
        os.path.join(settings.BASE_DIR, "frontend", "static", "frontend", "images", "dhenu.png"),
        os.path.join(settings.BASE_DIR, "frontend", "static", "images", "dhenu.png"),
        os.path.join(settings.BASE_DIR, "static", "frontend", "images", "dhenu.png"),
        os.path.join(settings.BASE_DIR, "frontend", "images", "dhenu.png"),
    ]

    for logo_path in logo_paths_to_try:
        if os.path.exists(logo_path):
            try:
                with open(logo_path, "rb") as image_file:
                    encoded_logo = base64.b64encode(image_file.read()).decode()
                    logo_html = f'''
<img src="data:image/png;base64,{encoded_logo}"
     style="max-width:180px; max-height:90px;"
     alt="Dhenu Technologies Logo" />
'''
                    break
            except Exception:
                pass

    # ------------- HEADER (BIGGER FONTS) -------------
    header_html = f"""
<table width="100%" style="font-size:9px; line-height:1.1; border:none; margin:0; padding:0;">
  <tr>
    <td width="20%" align="left" style="border:none; padding:0; vertical-align:top;">
      {logo_html}
    </td>
    <td width="80%" align="right" style="border:none; padding:0; vertical-align:top;">
      <div style="font-size:13px; font-weight:bold; margin-bottom:1px;">
        <span style="color:#008DD2;">DHENU </span><span style="color:grey;">TECHNOLOGIES</span>
      </div>
      <div style="font-size:8.5px; color:grey; line-height:1.2;">
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

    # ------------- FOOTER -------------
    footer_html = """
<div style="border-top:1px solid #ccc; margin-bottom:2px;"></div>
<table width="100%" style="border:none; margin:0; padding:0;">
  <tr>
    <td align="center" style="font-size:12px; color:gray; border:none; padding-top:2px; line-height:1.3;">
      Domain Registration | Web Hosting Server | Website Designing and Development | 
      Visual Designing | Mobile Application Design | Branding | Packaging Designing | 
      Corporate Identity | Photography
    </td>
  </tr>
</table>
"""

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
      height: 3.0cm;
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
    line-height: 1.35;
    color: #222;
    margin: 0;
    padding: 0;
  }}

  /* Reduce extra spacing that appears after each point/paragraph */
  p {{
    margin: 0 0 6px 0;
  }}
  ul, ol {{
    margin: 0 0 6px 0;
    padding-left: 18px;
  }}
  li {{
    margin: 0;
    padding: 0;
  }}
  figure {{
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
    padding: 0;
    page-break-inside: auto;
    width: 100%;
    table-layout: auto;
  }}
  
  th, td {{
    border: 1px solid #ccc;
    padding: 6px;
    word-wrap: break-word;
    page-break-inside: avoid;
    vertical-align: top;
  }}
  
  tr {{
    page-break-inside: avoid;
  }}
  
  .company-box {{
    display: inline-block;
    border: 1px solid #000;
    padding: 14px 28px;
    text-align: center;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    border-radius: 4px;
    background-color: #fff;
  }}
  
  .notice {{
    margin-top: 50px;
    font-size: 14px;
    text-align: center;
    line-height: 1.7;
  }}
  
  .service-section {{
    page-break-inside: auto;
    margin-top: 20px;
    margin-bottom: 20px;
    padding-bottom: 10px;
  }}
  
  .section-content {{
    page-break-inside: auto;
    word-wrap: break-word;
    white-space: normal;
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

<div id="headerContent">
{header_html}
</div>

<div id="footerContent">
{footer_html}
</div>

<div class="cover-page" style="text-align:center; margin-top:15px;">
  <h1 style="font-size:24px; margin-bottom:10px;">Proposal for</h1>
  <h2 style="font-size:22px; margin-top:0; margin-bottom:12px;">
    {quotation.description or 'Requested Service'}
  </h2>
  <p style="font-size:18px; margin-top:0; margin-bottom:30px;">
    Directorate of Fisheries Government of Karnataka (KFDC)
  </p>
  <div style="font-size:16px; line-height:1.7; margin-bottom:35px;">
    <p><b>Client:</b> {client_name}</p>
    <p><b>Company:</b> {company_name}</p>
    <p><b>Date:</b> {quotation_date}</p>
  </div>
  <div style="margin-top:10px; margin-bottom:40px;">
    <div class="company-box">
      <b style="color:#008DD2; font-size:18px;">Dhenu</b>
      <b style="color:#000; font-size:18px;"> Technologies</b><br/>
      <span style="color:grey;">
        Kamadhenu, #1069, Ground Floor,<br/>
        10th Cross, 3rd Main, Nandanavana Layout,<br/>
        West Sector, Bukkasagara, Jigani,<br/>
        Bengaluru - 560083<br/><br/>
        Contact: +91 9663688088 / +91 9480181899
      </span>
    </div>
  </div>
  <div class="notice" style="width:80%; margin:0 auto;">
    <h3 style="font-size:18px; margin-bottom:12px;">NOTICE</h3>
    <p>
      This document contains proprietary information, which is protected by ownership.
    </p>
    <p>
      No part of this document may be photocopied, reproduced or translated into another
      programming language without prior written consent of DHENU TECHNOLOGIES.
    </p>
    <p>
      Dissemination of the information and/or concepts contained herein to parties other
      than employees and clients is prohibited without the written consent of
      DHENU TECHNOLOGIES.
    </p>
    <p style="margin-top:18px;">
      Copyright © {date.today().year} by DHENU TECHNOLOGIES, all rights reserved.
    </p>
  </div>
</div>

{services_html}

</body>
</html>
"""

    pdf_file = BytesIO()
    pisa_status = pisa.CreatePDF(BytesIO(html_content.encode("UTF-8")), dest=pdf_file)
    if pisa_status.err:
        raise Exception("Failed to generate PDF")
    pdf_file.seek(0)

    filename = "Quotation.pdf"
    return (pdf_file.read(), filename)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def download_quotation_pdf(request, pk):
    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return JsonResponse({"error": "Quotation not found"}, status=404)

    try:
        pdf_bytes, filename = _build_quotation_pdf(quotation)
        return FileResponse(
            BytesIO(pdf_bytes),
            as_attachment=True,
            filename=filename,
            content_type="application/pdf",
        )
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

# ---------------------
# Login + Profile
# ---------------------

def login_page(request):
    return render(request, "login.html")


@csrf_exempt
def login_view(request):
    """Authenticate user and return token."""
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        body = request.body
        if not body:
            return JsonResponse({"error": "Request body is empty"}, status=400)
        data = json.loads(body)
    except json.JSONDecodeError as e:
        return JsonResponse({"error": "Invalid JSON: " + str(e)}, status=400)

    username = data.get("username") or ""
    password = data.get("password") or ""
    username = username.strip() if isinstance(username, str) else ""

    if not username or not password:
        return JsonResponse({"error": "Username and password are required"}, status=400)

    try:
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return JsonResponse({
                "success": True,
                "token": token.key,
                "message": "Login successful"
            })
        return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


@api_view(['GET', 'PUT'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def user_profile(request):
    """View or update user profile."""
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


# ---------------------
# CLIENT MANAGEMENT
# ---------------------

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by("-id")
    serializer_class = ClientSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]



@login_required(login_url='/')
def clients(request):
    return render(request, "clients.html")
    
@login_required(login_url='/')
def add_client(request):
     return render(request, "addclient.html")

# ---------------------
# QUOTATION MANAGEMENT
# ---------------------

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all().order_by("-id")
    serializer_class = QuotationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    
    
@csrf_exempt
def ckeditor_upload(request):
    if request.method != "POST":
        return HttpResponseBadRequest("Only POST allowed")

    upload = request.FILES.get("upload")
    if not upload:
        return HttpResponseBadRequest("No file provided")

    try:
        # Ensure MEDIA_ROOT exists and is writable
        upload_dir = os.path.join(settings.MEDIA_ROOT, "ckeditor")
        os.makedirs(upload_dir, exist_ok=True)

        # Generate unique file name
        ext = os.path.splitext(upload.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        filepath = os.path.join(upload_dir, filename)

        # Save file
        with open(filepath, "wb+") as f:
            for chunk in upload.chunks():
                f.write(chunk)

        # Build absolute URL
        url = settings.MEDIA_URL.rstrip("/") + "/ckeditor/" + filename
        url = request.build_absolute_uri(url)

        # 1) Classic Image dialog → Upload tab
        if "CKEditorFuncNum" in request.GET:
            func_num = request.GET.get("CKEditorFuncNum")
            # Must return JS that calls CKEDITOR.tools.callFunction
            return HttpResponse(
                f"<script>window.parent.CKEDITOR.tools.callFunction({func_num}, '{url}', '');</script>"
            )

        # 2) Drag & drop / paste / uploadimage plugin
        # IMPORTANT SHAPE:
        # { "uploaded": 1, "fileName": "...", "url": "..." }
        return JsonResponse(
            {
                "uploaded": 1,
                "fileName": filename,
                "url": url,
            }
        )

    except Exception as e:
        # If something breaks, return CKEditor-friendly error
        print("CKEDITOR UPLOAD ERROR:", e)  # check this in your server log
        return JsonResponse(
            {
                "uploaded": 0,
                "error": {"message": f"Upload failed: {str(e)}"},
            },
            status=500,
        )

    
@csrf_exempt
def send_quotation_mail(request, pk):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST allowed"}, status=405)

    try:
        quotation = Quotation.objects.get(pk=pk)
    except Quotation.DoesNotExist:
        return JsonResponse({"error": "Quotation not found"}, status=404)

    try:
        recipient_email = (quotation.email or "").strip()
        if not recipient_email:
            return JsonResponse({"error": "Quotation email is missing"}, status=400)
        client_name = quotation.person_name or quotation.company_name or "Client"

        pdf_bytes, filename = _build_quotation_pdf(quotation)

        # Send Email
        subject = f"Quotation for {quotation.description or 'Requested Service'} As Discussed"
        body = f"""
Dear {client_name},

Greetings from Dhenu Technologies!

As discussed, please find attached the quotation for the required services based on your current needs and requirements. The proposal includes details of the scope of work, deliverables, and pricing for your review.

We are confident that our solution will help you achieve your goals efficiently and effectively.

If you have any questions or would like to proceed with the next steps, please feel free to contact us at 📞 ‪+91 96636 88088‬.

Looking forward to your confirmation.

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
            from_email=getattr(settings, "DEFAULT_FROM_EMAIL", None) or getattr(settings, "EMAIL_HOST_USER", None) or "no-reply@example.com",
            to=[recipient_email],
        )
        email.attach(filename or "Quotation.pdf", pdf_bytes, "application/pdf")
        email.send(fail_silently=False)

        return JsonResponse({"success": True, "email": recipient_email})

    except Exception as e:
        print("\n=== SEND QUOTATION MAIL ERROR ===")
        traceback.print_exc()
        print("=== END ERROR ===\n")
        return JsonResponse({"error": str(e)}, status=500)



@login_required(login_url='/')
def quotation(request):
    return render(request, "quotation.html")


@login_required(login_url='/')
def add_quotation(request):
    return render(request, "addquotation.html")


# ---------------------
# ENQUIRY MANAGEMENT
# ---------------------

class EnquiryViewSet(viewsets.ModelViewSet):
    queryset = Enquiry.objects.all().order_by("-date")
    serializer_class = EnquirySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

@csrf_exempt
def add_enquiry(request):
    if request.method == "POST":
        try:
            Enquiry.objects.create(
                company_name=request.POST.get("company_name"),
                person_name=request.POST.get("person_name"),
                contact_number=request.POST.get("contact_number"),
                email=request.POST.get("email"),
                website=request.POST.get("website"),
                comments=request.POST.get("comments"),
                status="Notstarted",  # default
            )
            return JsonResponse({"success": True, "message": "Enquiry saved successfully!"})
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return render(request, "addenquiry.html")
    
    
@login_required(login_url='/')
def enquiry(request):
    return render(request, "enquiry.html")


# ---------------------
# PROJECT MANAGEMENT
# ---------------------

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().order_by("-id")
    serializer_class = ProjectSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


@login_required(login_url='/')
def projects(request):
    return render(request, "projects.html")

@login_required(login_url='/')
def add_project(request):
    return render(request, "addproject.html")




# ---------------------
# UPDATION MANAGEMENT
# ---------------------

class UpdationViewSet(viewsets.ModelViewSet):
    """Token-authenticated API for Updations"""
    queryset = Updation.objects.all().order_by('-created_at')
    serializer_class = UpdationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


# ---------------------
# TODO / TASKS
# ---------------------

class TodoViewSet(viewsets.ModelViewSet):
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]


@login_required(login_url='/')
def updation(request):
    """List page"""
    return render(request, "updation.html")


@login_required(login_url='/')
def add_updations(request):
    """Add/Edit page"""
    return render(request, "addupdation.html")


@login_required(login_url='/')
def todo(request):
    return render(request, "todo.html")


@login_required(login_url='/')
def add_todo(request):
    return render(request, "addtodo.html")

# ---------------------
# RENEWAL EMAIL REMINDER
# ---------------------

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

This is a friendly reminder that your {service_names} associated with Dhenu Technologies will be  expire in 30 days.

To ensure uninterrupted access and avoid any downtime or loss of services, we recommend renewing it before the expiry date.

{service_lines}

Please get in touch with us at 📞 +91 96636 88088 to proceed with the renewal or if you have any questions regarding your plan.

Thank you for choosing Dhenu Technologies. We look forward to continuing to serve you.

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


# ---------------------
# DASHBOARD VIEWS
# ---------------------

@login_required(login_url='/')
def dashboard(request):
    return render(request, "dashboard.html")


@login_required(login_url='/')
def expiry(request):
    return render(request, "expiry.html")


@login_required(login_url='/')
def user_profile_view(request):
    return render(request, "profile.html")
