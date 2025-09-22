from rest_framework import serializers
from .models import Client
from .models import Quotation
from .models import Enquiry
from .models import Project

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ("quotation_number", "quotation_date")  


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = "__all__"

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"
