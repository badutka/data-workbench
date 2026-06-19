from django.apps import AppConfig


class DatahubConfig(AppConfig):
    name = 'apps.datahub'

    def ready(self):
        import apps.datahub.sources.dataset