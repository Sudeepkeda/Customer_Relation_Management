from django.db import migrations, models


def forwards_migrate_enquiry_status(apps, schema_editor):
    Enquiry = apps.get_model("crm_app", "Enquiry")
    for e in Enquiry.objects.all():
        s = (e.status or "").strip()
        if s == "Notstarted":
            e.status = "NotYet"
        elif s == "Inprogress":
            e.status = "Connected"
        elif s not in ("NotYet", "Connected", "Completed"):
            e.status = "NotYet"
        e.save(update_fields=["status"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("crm_app", "0020_relax_required_fields_across_modules"),
    ]

    operations = [
        migrations.AddField(
            model_name="enquiry",
            name="remark",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.RunPython(forwards_migrate_enquiry_status, noop_reverse),
        migrations.AlterField(
            model_name="enquiry",
            name="status",
            field=models.CharField(
                choices=[
                    ("NotYet", "Not-Yet"),
                    ("Connected", "Connected"),
                    ("Completed", "Completed"),
                ],
                default="NotYet",
                max_length=20,
            ),
        ),
    ]
