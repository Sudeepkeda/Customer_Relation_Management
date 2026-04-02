from rest_framework import serializers
from .models import Client, Quotation, Enquiry, Project, Updation, Todo
from datetime import date

class ClientSerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make create/update tolerant of partial/empty submissions.
        for field in self.fields.values():
            if getattr(field, "read_only", False):
                continue
            field.required = False
            if hasattr(field, "allow_null"):
                field.allow_null = True
            if isinstance(field, (serializers.CharField, serializers.EmailField, serializers.URLField)):
                field.allow_blank = True

    def validate(self, attrs):
        # Convert empty strings coming from the UI into null.
        for k, v in list(attrs.items()):
            if v == "":
                attrs[k] = None
        return attrs

    class Meta:
        model = Client
        fields = '__all__'

class QuotationSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    duplicate_of = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Quotation
        fields = "__all__"
        extra_kwargs = {
            "client": {"read_only": True},
            "company_name": {"read_only": True},
            "industry": {"read_only": True},
            "person_name": {"read_only": True},
            "contact": {"read_only": True},
            "email": {"read_only": True},
            "website": {"read_only": True},
            "address": {"read_only": True},
            "quotation_number": {"read_only": True},
        }

    def _generate_quotation_number(self):
        from datetime import date
        today = date.today()
        yy = today.year % 100  # 2025 -> 25

        # Financial year: Apr–Mar
        if today.month >= 4:
            start = yy
            end = (yy + 1) % 100
        else:
            start = (yy - 1) % 100
            end = yy

        fy_str = f"{start:02d}-{end:02d}"
        prefix = f"DT/Q/{fy_str}-"  # e.g. DT/Q/25-26-

        # Find max sequence for this FY
        queryset = Quotation.objects.filter(
            quotation_number__startswith=prefix
        ).values_list("quotation_number", flat=True)

        max_seq = 0
        for qno in queryset:
            if not qno:
                continue
            parts = qno.split("-")
            if not parts:
                continue
            seq_str = parts[-1]
            if seq_str.isdigit():
                max_seq = max(max_seq, int(seq_str))

        return f"{prefix}{max_seq + 1:03d}"

    def create(self, validated_data):
        duplicate_of_id = validated_data.pop("duplicate_of", None)
        client_id = validated_data.pop("client_id", None)
        client = Client.objects.filter(id=client_id).first() if client_id else None

        # Snapshot from client
        validated_data.update({
            "client": client,
            "company_name": client.company_name if client else (validated_data.get("company_name") or ""),
            "industry": client.industry if client else (validated_data.get("industry") or ""),
            "person_name": client.person_name if client else (validated_data.get("person_name") or ""),
            "contact": client.contact_number if client else (validated_data.get("contact") or ""),
            "email": client.email if client else (validated_data.get("email") or ""),
            "website": client.website if client else (validated_data.get("website") or ""),
            "address": client.address if client else (validated_data.get("address") or ""),
        })

        # -------------------------
        # DUPLICATE QUOTATION
        # -------------------------
        if duplicate_of_id:
            try:
                original = Quotation.objects.get(pk=duplicate_of_id)
            except Quotation.DoesNotExist:
                raise serializers.ValidationError(
                    {"duplicate_of": "Original quotation not found."}
                )

            base_no = original.quotation_number or ""

            # If original has no number for some reason, fall back to normal generation
            if not base_no:
                validated_data["quotation_number"] = self._generate_quotation_number()
            else:
                # Find the first free suffix: base/1, base/2, base/3, ...
                suffix = 1
                while True:
                    new_no = f"{base_no}/{suffix}"
                    if not Quotation.objects.filter(quotation_number=new_no).exists():
                        validated_data["quotation_number"] = new_no
                        break
                    suffix += 1

        # -------------------------
        # NORMAL NEW QUOTATION
        # -------------------------
        else:
            validated_data["quotation_number"] = self._generate_quotation_number()

        return Quotation.objects.create(**validated_data)

    def update(self, instance, validated_data):
        client_id = validated_data.pop("client_id", None)
        validated_data.pop("duplicate_of", None)  # ignore on update

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

        instance.description = validated_data.get("description", instance.description)
        instance.price = validated_data.get("price", instance.price)
        instance.services = validated_data.get("services", instance.services)

        instance.save()
        return instance



class EnquirySerializer(serializers.ModelSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if getattr(field, "read_only", False):
                continue
            field.required = False
            if hasattr(field, "allow_null"):
                field.allow_null = True
            if isinstance(field, (serializers.CharField, serializers.EmailField, serializers.URLField)):
                field.allow_blank = True

    def validate(self, attrs):
        for k, v in list(attrs.items()):
            if v == "":
                attrs[k] = None
        return attrs

    class Meta:
        model = Enquiry
        fields = "__all__"
        extra_kwargs = {
            # Server sets this; never accept client-provided date (avoids validation errors)
            "date": {"read_only": True},
        }


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = "__all__"


class UpdationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Updation
        fields = '__all__'


class TodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Todo
        fields = "__all__"

    def validate(self, attrs):
        status = attrs.get("status", getattr(self.instance, "status", None))
        task_date = attrs.get("task_date", getattr(self.instance, "task_date", None))
        postpone_to = attrs.get("postpone_to", getattr(self.instance, "postpone_to", None))
        start_time = attrs.get("start_time", getattr(self.instance, "start_time", None))
        end_time = attrs.get("end_time", getattr(self.instance, "end_time", None))

        if status != Todo.STATUS_POSTPONED and postpone_to:
            # keep data clean (UI can still set it accidentally)
            attrs["postpone_to"] = None

        if task_date and postpone_to and postpone_to < task_date:
            raise serializers.ValidationError({"postpone_to": "Postpone date cannot be before task date."})

        if start_time and end_time and end_time < start_time:
            raise serializers.ValidationError({"end_time": "End time cannot be before start time."})

        return attrs