from rest_framework import serializers
from .models import Client
from .models import Quotation


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = "__all__"
        read_only_fields = ("quotation_number", "quotation_date")  # cannot be edited