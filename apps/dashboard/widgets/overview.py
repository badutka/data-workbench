# dashboard/widgets/overview.py

from apps.dashboard.registry import register_widget
from apps.dashboard.widgets.base import BaseWidgetLogic
from apps.dashboard.widgets.schemas import OverviewConfig


@register_widget("overview", label='Overview')
class OverviewWidgetLogic(BaseWidgetLogic):
    TEMPLATE = "dashboard/widgets/widget_overview_partial.html"
    CONFIG_SCHEMA = OverviewConfig

    def update_data(self, config, state, filters=None):
        return {
            "metrics": [1, 2, 3],
            "compare": [1, 2, 3]
        }