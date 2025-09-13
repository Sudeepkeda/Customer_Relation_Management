from django.db import models
from django.utils import timezone


class Client(models.Model):
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100, blank=True, null=True)
    person_name = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gst = models.CharField(max_length=50, blank=True, null=True)
    amc = models.CharField(max_length=10, blank=True, null=True)  # Yes/No
    amc_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    domain_name = models.CharField(max_length=200, blank=True, null=True)
    domain_charges = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    server_details = models.TextField(blank=True, null=True)
    server_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    maintenance_value = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    comments = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.company_name


class Quotation(models.Model):
    quotation_number = models.CharField(max_length=50, unique=True, editable=False)
    quotation_date = models.DateField(auto_now_add=True)

    # Company Info
    company_name = models.CharField(max_length=200)
    industry = models.CharField(max_length=200, blank=True, null=True)
    person_name = models.CharField(max_length=200, blank=True, null=True)
    contact = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    website = models.URLField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    services = models.JSONField(blank=True, null=True)

    # Services
    service_type = models.CharField(
        max_length=50,
        choices=[
            ("about", "About Us"),
            ("tech", "Technical Details of Design Services"),
            ("scope", "Out of Scope"),
            ("pricing", "Pricing"),
        ],
        blank=True,
        null=True,
    )
    service_content = models.TextField(blank=True, null=True)  # CKEditor data

    # Optional plain price field (if you want numbers separate from text)
    price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Only set quotation_number when creating a new record
        if not self.quotation_number:
            year_now = timezone.now().year
            next_year = year_now + 1
            year_format = f"{str(year_now)[-2:]}-{str(next_year)[-2:]}"

            # Count existing quotations for current financial year
            count = Quotation.objects.filter(
                quotation_date__year=year_now
            ).count() + 1

            quotation_code = f"DT/Q/{year_format}-{count:03d}"
            self.quotation_number = quotation_code

        super().save(*args, **kwargs)

    def __str__(self):
        return self.quotation_number