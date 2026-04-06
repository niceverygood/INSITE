"""Report Engine — generates daily/weekly/monthly reports in PDF and Excel."""

import logging
import os
from datetime import datetime, timezone

from jinja2 import Environment, BaseLoader

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

REPORT_HTML_TEMPLATE = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>INSITE {{ report_type }} Report</title>
<style>
  body { font-family: 'Noto Sans KR', sans-serif; margin: 40px; color: #333; }
  h1 { color: #1a56db; border-bottom: 2px solid #1a56db; padding-bottom: 10px; }
  h2 { color: #374151; margin-top: 30px; }
  table { border-collapse: collapse; width: 100%; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background-color: #1a56db; color: white; }
  tr:nth-child(even) { background-color: #f9fafb; }
  .metric-card { display: inline-block; background: #f3f4f6; border-radius: 8px; padding: 15px 25px; margin: 5px; }
  .metric-value { font-size: 24px; font-weight: bold; color: #1a56db; }
  .metric-label { font-size: 12px; color: #6b7280; }
  .status-normal { color: #10b981; }
  .status-warning { color: #f59e0b; }
  .status-down { color: #ef4444; }
</style>
</head>
<body>
<h1>INSITE {{ report_type }} 리포트</h1>
<p>기간: {{ from_date }} ~ {{ to_date }}</p>
<p>생성일시: {{ generated_at }}</p>

<h2>인프라 현황</h2>
<div>
  <div class="metric-card">
    <div class="metric-value">{{ summary.total_assets }}</div>
    <div class="metric-label">전체 자산</div>
  </div>
  <div class="metric-card">
    <div class="metric-value status-normal">{{ summary.normal_count }}</div>
    <div class="metric-label">정상</div>
  </div>
  <div class="metric-card">
    <div class="metric-value status-warning">{{ summary.warning_count }}</div>
    <div class="metric-label">관리필요</div>
  </div>
  <div class="metric-card">
    <div class="metric-value status-down">{{ summary.down_count }}</div>
    <div class="metric-label">다운</div>
  </div>
</div>

<h2>알람 통계</h2>
<table>
<tr><th>심각도</th><th>건수</th></tr>
{% for item in alert_stats %}
<tr><td>{{ item.severity }}</td><td>{{ item.count }}</td></tr>
{% endfor %}
</table>

<h2>리소스 사용률 (평균)</h2>
<table>
<tr><th>메트릭</th><th>평균</th><th>최대</th></tr>
{% for item in resource_stats %}
<tr><td>{{ item.name }}</td><td>{{ item.avg }}%</td><td>{{ item.max }}%</td></tr>
{% endfor %}
</table>

<h2>주요 장애 이벤트</h2>
<table>
<tr><th>시각</th><th>자산</th><th>심각도</th><th>제목</th></tr>
{% for event in events %}
<tr><td>{{ event.time }}</td><td>{{ event.asset }}</td><td>{{ event.severity }}</td><td>{{ event.title }}</td></tr>
{% endfor %}
</table>
</body>
</html>"""


class ReportEngine:
    def __init__(self):
        self.env = Environment(loader=BaseLoader())
        os.makedirs(settings.report_output_dir, exist_ok=True)

    def generate_html(self, data: dict) -> str:
        template = self.env.from_string(REPORT_HTML_TEMPLATE)
        return template.render(**data)

    def generate_pdf(self, data: dict, filename: str) -> str:
        html = self.generate_html(data)
        filepath = os.path.join(settings.report_output_dir, filename)
        try:
            from weasyprint import HTML
            HTML(string=html).write_pdf(filepath)
            logger.info(f"PDF report generated: {filepath}")
        except Exception as e:
            logger.error(f"PDF generation failed: {e}")
            # Fallback: save HTML
            filepath = filepath.replace(".pdf", ".html")
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(html)
        return filepath

    def generate_excel(self, data: dict, filename: str) -> str:
        filepath = os.path.join(settings.report_output_dir, filename)
        try:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.title = "Summary"

            ws.append(["INSITE Report", data.get("report_type", ""), data.get("generated_at", "")])
            ws.append([])
            ws.append(["Total Assets", data["summary"]["total_assets"]])
            ws.append(["Normal", data["summary"]["normal_count"]])
            ws.append(["Warning", data["summary"]["warning_count"]])
            ws.append(["Down", data["summary"]["down_count"]])

            ws2 = wb.create_sheet("Alerts")
            ws2.append(["Severity", "Count"])
            for item in data.get("alert_stats", []):
                ws2.append([item["severity"], item["count"]])

            wb.save(filepath)
            logger.info(f"Excel report generated: {filepath}")
        except Exception as e:
            logger.error(f"Excel generation failed: {e}")
        return filepath
