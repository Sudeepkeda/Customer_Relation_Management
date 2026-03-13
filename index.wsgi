#!/home/designbharat/public_html/crm.design-bharat.com/venv/bin/python3
"""
WSGI config for cPanel deployment (without Passenger).

This file exposes the WSGI callable as a module-level variable named ``application``.
Touch restart.txt file to force reload.
"""

import os
import sys

# Check for restart trigger (mod_wsgi will reload if this file changes)
restart_file = '/home/designbharat/public_html/crm.design-bharat.com/restart.txt'
if os.path.exists(restart_file):
    # Touch the file to update timestamp for mod_wsgi reload detection
    os.utime(restart_file, None)

# Add project directory to Python path
project_home = '/home/designbharat/public_html/crm.design-bharat.com'
venv_path = os.path.join(project_home, 'venv')

if project_home not in sys.path:
    sys.path.insert(0, project_home)
    sys.path.insert(0, os.path.join(project_home, 'crm_backend'))

# Activate virtual environment
activate_this = os.path.join(venv_path, 'bin', 'activate_this.py')
if os.path.exists(activate_this):
    with open(activate_this) as f:
        exec(f.read(), {'__file__': activate_this})

# Set environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'crm_backend.settings')

# Load Django WSGI application
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()


