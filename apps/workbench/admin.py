from django.contrib import admin

from apps.workbench.models import Notebook, Run, Artifact, KernelSession


@admin.register(Notebook)
class NotebookAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in Notebook._meta.get_fields()
         if field.name not in ['run', 'cells']
    ]

@admin.register(Run)
class RunAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in Run._meta.get_fields()
        if field.name not in ['artifact', 'notebook']
    ]

@admin.register(Artifact)
class ArtifactAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in Artifact._meta.get_fields()
        if field.name not in ['run', 'dataset']
    ]


@admin.register(KernelSession)
class KernelSessionAdmin(admin.ModelAdmin):
    list_display = [
        field.name for field in KernelSession._meta.get_fields()
        # if field.name not in ['run', 'dataset']
    ]