from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils import timezone

from apps.workbench.models import Notebook, KernelSession, Run

from .executor import run_notebook_cell

from core.logger import logger

import json
import uuid6


def home(request):
    notebook = Notebook.objects.first()

    return render(request, "workbench/index.html", {"notebook": notebook})
    return render(request, "workbench/notebook.html", {"notebook": notebook})


# ==========================
# LOAD NOTEBOOK
# ==========================


def load_notebook(request):
    notebook_id = request.GET.get("notebook_id")
    notebook = Notebook.objects.get(pk=notebook_id)

    return JsonResponse(
        {
            "id": str(notebook.id),
            "cells": notebook.cells,
        }
    )


# ==========================
# SAVE NOTEBOOK
# ==========================


@require_POST
def save_notebook(request):
    data = json.loads(request.body or "{}")

    notebook_id = data.get("notebook_id")
    cells = data.get("cells", [])
    notebook = Notebook.objects.get(pk=notebook_id)
    notebook.cells = cells

    notebook.save(update_fields=["cells", "updated_at"])

    return JsonResponse({"status": "ok", "saved": len(cells)})


# ==========================
# ADD CELL
# ==========================


@require_POST
def add_cell(request):
    data = json.loads(request.body or "{}")
    cell_type = data.get("type", "code")

    cell = {
        "id": str(uuid6.uuid7()),
        "type": cell_type,
        "source": "",
        "output": {"stdout": "", "error": None},
        "execution_count": 0,
    }

    # IMPORTANT:
    # frontend inserts it
    # backend does NOT save

    return JsonResponse(cell)


# ==========================
# DELETE CELL
# ==========================


@require_POST
def delete_cell(request):

    data = json.loads(request.body or "{}")

    return JsonResponse({"status": "ok"})


# ==========================
# KERNEL
# ==========================


def get_or_create_kernel_session(notebook):

    session, created = KernelSession.objects.get_or_create(notebook=notebook)

    return session


# ==========================
# RUN CELL
# ==========================


@require_POST
def run_cell_view(request):
    data = json.loads(request.body or "{}")
    notebook_id = data.get("notebook_id")
    cell_id = data.get("cell_id")
    

    notebook = Notebook.objects.get(pk=notebook_id)

    # get source from persisted notebook
    cell = None

    for c in notebook.cells:
        if c["id"] == cell_id:
            cell = c
            break

    if cell is None:
        return JsonResponse({"error": "Cell not found"}, status=404)

    code = cell.get("source", "")
    logger.debug(f"Running cell {cell_id}")
    run = Run.objects.create(
        notebook=notebook, status=Run.Status.RUNNING, started_at=timezone.now()
    )
    kernel = get_or_create_kernel_session(notebook)

    try:
        result = run_notebook_cell(
            session_id=kernel.session_id, code=code, include_vars=False
        )
        kernel.session_id = result.get("session_id")
        kernel.last_activity = timezone.now()
        kernel.save()

        for c in notebook.cells:
            if c["id"] == cell_id:
                c["output"] = {
                    "stdout": result.get("output", ""),
                    "error": result.get("error"),
                }
                c["execution_count"] = c.get("execution_count", 0) + 1

        notebook.save(update_fields=["cells", "updated_at"])
        run.status = Run.Status.SUCCESS

        return JsonResponse(
            {
                "cell_id": cell_id,
                "output": result.get("output", ""),
                "error": result.get("error"),
            }
        )

    except Exception as e:
        run.status = Run.Status.FAILED
        run.error_message = str(e)
        return JsonResponse({"error": str(e)}, status=500)

    finally:
        run.finished_at = timezone.now()
        run.save()
