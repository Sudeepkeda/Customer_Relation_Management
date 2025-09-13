from django.db import models

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
