from rest_framework import serializers
from .models import Client, Quotation, Enquiry, Project

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class QuotationSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(write_only=True, required=True)

    class Meta:
        model = Quotation
        fields = "__all__"
        extra_kwargs = {
            "client": {"read_only": True},  # only accept client_id
            "company_name": {"read_only": True},  # populated automatically
            "industry": {"read_only": True},
            "person_name": {"read_only": True},
            "contact": {"read_only": True},
            "email": {"read_only": True},
            "website": {"read_only": True},
            "address": {"read_only": True},
        }

    def create(self, validated_data):
        client_id = validated_data.pop("client_id")
        client = Client.objects.get(id=client_id)

        # Populate quotation snapshot fields from client
        validated_data.update({
            "client": client,
            "company_name": client.company_name,
            "industry": client.industry,
            "person_name": client.person_name,
            "contact": client.contact_number,
            "email": client.email,
            "website": client.website,
            "address": client.address,
        })

        return Quotation.objects.create(**validated_data)

    def update(self, instance, validated_data):
        client_id = validated_data.pop("client_id", None)
        if client_id:
            client = Client.objects.get(id=client_id)
            instance.client = client
            instance.company_name = client.company_name
            instance.industry = client.industry
            instance.person_name = client.person_name
            instance.contact = client.contact_number
            instance.email = client.email
            instance.website = client.website
            instance.address = client.address

        # Update other fields
        instance.description = validated_data.get("description", instance.description)
        instance.price = validated_data.get("price", instance.price)
        instance.services = validated_data.get("services", instance.services)
        instance.save()
        return instance



class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = "__all__"


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"
