from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("crm_app", "0019_todo"),
    ]

    operations = [
        migrations.AlterField(
            model_name="client",
            name="company_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="enquiry",
            name="company_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="project_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="project",
            name="person_name",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="quotation",
            name="client",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name="quotations",
                to="crm_app.client",
            ),
        ),
        migrations.AlterField(
            model_name="todo",
            name="title",
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name="todo",
            name="task_date",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="updation",
            name="client_name",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name="updation",
            name="project_name",
            field=models.CharField(blank=True, max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name="updation",
            name="status",
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
