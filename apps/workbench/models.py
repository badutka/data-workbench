from django.db import models
import uuid6

class Notebook(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False
    )

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # path to .py marimo file
    file_path = models.CharField(max_length=500)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class NotebookCell(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False
    )

    class Type(models.TextChoices):
        CODE = "code"
        MARKDOWN = "markdown"

    notebook = models.ForeignKey(
        Notebook,
        on_delete=models.CASCADE,
        related_name="cells"
    )

    position = models.PositiveIntegerField()

    cell_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.CODE
    )

    source = models.TextField(blank=True)

    output = models.JSONField(default=dict, blank=True)

    execution_count = models.IntegerField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["position"]


class Run(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False
    )

    class Status(models.TextChoices):
        PENDING = "pending"
        RUNNING = "running"
        SUCCESS = "success"
        FAILED = "failed"

    notebook = models.ForeignKey(Notebook, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )

    started_at = models.DateTimeField(null=True, blank=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    # optional debugging
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Run {self.id} ({self.status})"
    

class Artifact(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False
    )

    class Type(models.TextChoices):
        TABLE = "table"
        FILE = "file"
        MODEL = "model"

    run = models.ForeignKey(Run, on_delete=models.CASCADE)

    type = models.CharField(max_length=20, choices=Type.choices)

    # IMPORTANT: pointer to warehouse object
    table_name = models.CharField(max_length=255)

    # optional: schema info for debugging/UX
    schema_json = models.JSONField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def warehouse_sql(self):
        return f"SELECT * FROM {self.table_name}"
    

class KernelSession(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active"
        STOPPED = "stopped"
        FAILED = "failed"

    id = models.UUIDField(
        primary_key=True,
        default=uuid6.uuid7,
        editable=False
    )

    notebook = models.OneToOneField(
        Notebook,
        on_delete=models.CASCADE,
        related_name="kernel_session"
    )

    # temporary pointer to current executor session
    # later this becomes docker container/kernel id
    session_id = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    last_activity = models.DateTimeField(
        null=True,
        blank=True
    )

    def __str__(self):
        return f"Kernel {self.notebook.name}"