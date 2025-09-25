from django.db import models
from django.utils import timezone


class Client(models.Model):
    company_name = models.CharField(max_length=255)
    industry = models.CharField(max_length=255, blank=True, null=True)
    person_name = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gst = models.CharField(max_length=50, blank=True, null=True)
    amc = models.CharField(max_length=10, blank=True, null=True)
    amc_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    domain_name = models.CharField(max_length=255, blank=True, null=True)
    domain_charges = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    domain_start_date = models.DateField(blank=True, null=True)
    domain_end_date = models.DateField(blank=True, null=True)
    server_details = models.TextField(blank=True, null=True)
    server_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    server_start_date = models.DateField(blank=True, null=True)
    server_end_date = models.DateField(blank=True, null=True)
    maintenance_value = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    maintenance_start_date = models.DateField(blank=True, null=True)
    maintenance_end_date = models.DateField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    PRIORITY_CHOICES = [
        ("High", "High"),
        ("Medium", "Medium"),
        ("Low", "Low"),
    ]
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, blank=True, null=True)
   
    STATUS_CHOICES = [
        ("Inprogress", "In Progress"),
        ("Notstarted", "Not Yet Started"),
        ("Completed", "Completed"),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Notstarted")


    def __str__(self):
        return self.company_name


class Quotation(models.Model):
    quotation_number = models.CharField(max_length=50, unique=True, editable=False)
    quotation_date = models.DateField(auto_now_add=True)

    # ✅ Enforce that every quotation must belong to a client
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=False, blank=False, related_name="quotations")

    # ✅ Snapshot fields (copied from Client at creation time)
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=200, blank=True, null=True)
    person_name = models.CharField(max_length=200, blank=True, null=True)
    contact = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)

    description = models.TextField(blank=True, null=True)
    services = models.JSONField(blank=True, null=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.quotation_number:
            year_now = timezone.now().year
            next_year = year_now + 1
            year_format = f"{str(year_now)[-2:]}-{str(next_year)[-2:]}"
            count = Quotation.objects.filter(
                quotation_date__year=year_now
            ).count() + 1
            self.quotation_number = f"DT/Q/{year_format}-{count:03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.quotation_number

    
class Enquiry(models.Model):
    company_name = models.CharField(max_length=255)
    person_name = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=[
            ("Inprogress", "In Progress"),
            ("Notstarted", "Not Yet Started"),
            ("Completed", "Completed"),
        ],
        default="Notstarted",
    )
    comments = models.TextField(blank=True, null=True)

    # Auto add date
    date = models.DateField(auto_now_add=True)

    def __str__(self):
        return self.company_name



class Project(models.Model):
    project_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    server_name = models.CharField(max_length=255, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    person_name = models.CharField(max_length=255)  # ✅ store free-text or existing
    status = models.CharField(max_length=50, choices=[("Not Started","Not Started"),("In Progress","In Progress"),("Completed","Completed")], default="Not Started")

