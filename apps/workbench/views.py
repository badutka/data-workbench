from django.shortcuts import render

from django.conf import settings
from django.utils import timezone
from django.http import HttpResponse
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db import connection, connections

from apps.workbench.models import Notebook, NotebookCell, Run, KernelSession
from apps.workbench.services.executor import run_notebook
from apps.datahub.services.promotion import promote_to_dataset
from apps.datahub.models import Dataset
from .executor import run_notebook_cell
from core.logger import logger

import sqlite3
import pandas as pd
import json


def home(request):
    notebook = Notebook.objects.first()
    ks = KernelSession.objects.first().session_id
    print(ks)
    return render(request, "workbench/index.html", {"notebook": notebook})


@require_POST
def save_notebook(request):

    data = json.loads(request.body or "{}")

    cells = data.get("cells", [])

    for item in cells:

        cell = NotebookCell.objects.get(pk=item["id"])

        cell.source = item.get("source", "")

        cell.save(update_fields=["source", "updated_at"])

    return JsonResponse({"status": "ok", "saved": len(cells)})


def load_notebook(request):

    nb_id = request.GET.get("notebook_id")

    notebook = Notebook.objects.get(pk=nb_id)

    cells = notebook.cells.all()

    return JsonResponse(
        {
            "id": str(notebook.id),
            "cells": [
                {
                    "id": str(cell.id),
                    "position": cell.position,
                    "type": cell.cell_type,
                    "source": cell.source,
                    "output": cell.output,
                    "execution_count": cell.execution_count,
                }
                for cell in cells
            ],
        }
    )


def get_or_create_kernel_session(notebook):

    session, created = KernelSession.objects.get_or_create(notebook=notebook)

    return session


@require_POST
def update_cell(request):

    data = json.loads(request.body or "{}")

    cell_id = data.get("cell_id")
    source = data.get("source", "")

    cell = NotebookCell.objects.get(pk=cell_id)

    cell.source = source
    cell.save(update_fields=["source", "updated_at"])

    return JsonResponse({"status": "ok", "cell_id": str(cell.id)})


@require_POST
def add_cell(request):

    data = json.loads(request.body or "{}")

    nb_id = data.get("notebook_id")

    notebook = Notebook.objects.get(pk=nb_id)

    cell_type = data.get("type", NotebookCell.Type.CODE)

    position = notebook.cells.count()

    cell = NotebookCell.objects.create(
        notebook=notebook,
        position=position,
        cell_type=cell_type,
    )

    return JsonResponse(
        {
            "id": cell.id,
            "position": cell.position,
            "type": cell.cell_type,
            "source": cell.source,
            "output": cell.output,
        }
    )


@require_POST
def delete_cell(request):
    data = json.loads(request.body or "{}")
    cell_id = data.get("cell_id")
    cell = NotebookCell.objects.get(pk=cell_id)
    cell.delete()

    return JsonResponse({"status": "ok"})


@require_POST
def run_cell_view(request):

    data = json.loads(request.body or "{}")

    nb_id = data.get("notebook_id")
    cell_id = data.get("cell_id")
    code = data.get("code", "")

    notebook = Notebook.objects.get(pk=nb_id)

    cell = NotebookCell.objects.get(pk=cell_id)

    logger.debug(f"Running cell {cell_id}")

    kernel = get_or_create_kernel_session(notebook)

    result = run_notebook_cell(
        session_id=kernel.session_id, code=code, include_vars=False
    )

    kernel.session_id = result.get("session_id")

    kernel.last_activity = timezone.now()

    kernel.save()

    cell.output = {"stdout": result.get("output", ""), "error": result.get("error")}

    cell.execution_count = (cell.execution_count or 0) + 1

    cell.save()

    return JsonResponse(
        {
            "cell_id": str(cell.id),
            "output": result.get("output", ""),
            "error": result.get("error"),
            "session_id": kernel.session_id,
        }
    )
