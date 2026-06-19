from django.apps import AppConfig
import importlib
import pkgutil


class DashboardConfig(AppConfig):
    name = 'apps.dashboard'

    def ready(self):
        """
        Optionally do this instead (explicit registry hook):

        # widgets/__init__.py
        from core.registry import auto_discover_widgets
        auto_discover_widgets()

        """
        import apps.dashboard.widgets

        package = apps.dashboard.widgets

        for _, module_name, _ in pkgutil.iter_modules(package.__path__):
            importlib.import_module(f"{package.__name__}.{module_name}")