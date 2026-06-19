# dashboard/services.py

from core.logger import logger

def build_filters(widgets):
    filters = []

    for widget in widgets:
        if widget.widget_type != "filter":
            continue

        executor = widget.get_executor()

        config = executor.get_config()
        state = executor.get_state()

        if hasattr(executor, "to_filter"):
            filters.append(executor.to_filter(config, state))

    return filters

class DashboardService:

    def __init__(self, dashboard):
        self.dashboard = dashboard

    def execute(self):
        widgets = list(self.dashboard.widgets.all())

        logger.warn(f"Loaded {len(widgets)} widgets for dashboard {self.dashboard.slug}")

        # -----------------------------
        # BUILD FILTERS FROM DB STATE
        # -----------------------------
        filter_widgets = [w for w in widgets if w.widget_type == "filter"]
        active_filters = build_filters(filter_widgets)

        logger.warn(f"Built {len(active_filters)} active filters")

        # -----------------------------
        # EXECUTE ALL WIDGETS
        # -----------------------------
        for widget in widgets:
            executor = widget.get_executor()
            definition = widget.get_definition()

            logger.warn(f"Executing widget {widget.id} ({widget.widget_type}:{widget.subtype})")

            widget.widget_data = executor.run(filters=active_filters)
            widget.ui_schema = definition.ui_schema
            widget.template = definition.template

            logger.info(f"{widget.widget_data = }")
            logger.info(f"{widget.ui_schema = }")

        return widgets