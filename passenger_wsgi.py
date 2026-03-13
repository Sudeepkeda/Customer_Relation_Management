import os
import sys

# Activate virtualenv
INTERP = "/home/designbharat/public_html/crm.design-bharat.com/venv/bin/python"
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Add project path
project_home = "/home/designbharat/public_html/crm.design-bharat.com"
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Django settings
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "crm_backend.settings")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()