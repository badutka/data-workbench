import subprocess
import sys
import uuid
import traceback
import tempfile
import os


# in-memory "sessions" (MVP kernel state placeholder)
SESSIONS = {}


def _get_session(session_id):
    if session_id is None or session_id not in SESSIONS:
        session_id = str(uuid.uuid4())

        SESSIONS[session_id] = {
            "globals": {},   # shared variables live here
        }

    return session_id, SESSIONS[session_id]


def run_notebook_cell(session_id, code, include_vars=False):
    session_id, session = _get_session(session_id)

    globals_dict = session["globals"]

    stdout_buffer = []
    error = None

    try:
        # capture print output manually
        import io
        import sys

        old_stdout = sys.stdout
        sys.stdout = io.StringIO()

        # EXECUTE IN SHARED GLOBAL SCOPE
        exec(code, globals_dict)

        output = sys.stdout.getvalue()

        sys.stdout = old_stdout

    except Exception:
        sys.stdout = old_stdout
        output = ""
        error = traceback.format_exc()

    return {
        "session_id": session_id,
        "output": output,
        "error": error
    }
