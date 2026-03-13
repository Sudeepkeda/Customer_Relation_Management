import os
import sys

project_home = '/home/designbharat/public_html/crm.design-bharat.com'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()