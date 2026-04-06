"""AI Engine — LLM-based fault diagnosis and resource prediction."""

import json
import logging
import uuid
from datetime import datetime, timezone

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

DIAGNOSIS_PROMPT = """너는 IT 인프라 전문 엔지니어다.
다음 자산에서 장애가 발생했다:

[자산 정보]
{asset_info}

[최근 메트릭]
{recent_metrics}

[에러 로그]
{error_logs}

[활성 알람]
{active_alerts}

[과거 유사 사례]
{similar_cases}

다음을 분석하라:
1. 장애 원인 (가능성 높은 순서)
2. 각 원인의 근거
3. 즉시 조치 방법
4. 재발 방지 대책
5. 심각도 평가 (1-10)

JSON 형식으로 응답하라:
{{
  "causes": [
    {{
      "rank": 1,
      "cause": "원인 설명",
      "confidence": 0.85,
      "evidence": ["근거1", "근거2"],
      "immediate_action": "즉시 조치 방법",
      "prevention": "재발 방지 대책"
    }}
  ],
  "severity_score": 7,
  "summary": "요약"
}}
"""


class AIEngine:
    def __init__(self):
        self.provider = settings.ai_provider
        self.model = settings.ai_model

    async def _call_openai(self, prompt: str) -> str:
        import openai
        client = openai.AsyncOpenAI(api_key=settings.openai_api_key)
        response = await client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        return response.choices[0].message.content

    async def _call_anthropic(self, prompt: str) -> str:
        import anthropic
        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        response = await client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    async def diagnose(
        self,
        asset_info: dict,
        recent_metrics: list[dict],
        error_logs: list[str],
        active_alerts: list[dict],
        similar_cases: list[dict] | None = None,
    ) -> dict:
        prompt = DIAGNOSIS_PROMPT.format(
            asset_info=json.dumps(asset_info, ensure_ascii=False, indent=2),
            recent_metrics=json.dumps(recent_metrics[:20], ensure_ascii=False, indent=2),
            error_logs="\n".join(error_logs[:50]),
            active_alerts=json.dumps(active_alerts, ensure_ascii=False, indent=2),
            similar_cases=json.dumps(similar_cases or [], ensure_ascii=False, indent=2),
        )

        try:
            if self.provider == "anthropic":
                raw = await self._call_anthropic(prompt)
            else:
                raw = await self._call_openai(prompt)

            result = json.loads(raw)
            return {
                "diagnosis_id": str(uuid.uuid4()),
                "asset_id": asset_info.get("id", ""),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                **result,
            }
        except Exception as e:
            logger.error(f"AI diagnosis failed: {e}")
            return {
                "diagnosis_id": str(uuid.uuid4()),
                "asset_id": asset_info.get("id", ""),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "causes": [],
                "severity_score": 0,
                "summary": f"AI 진단 실패: {str(e)}",
            }

    async def predict_resource_exhaustion(self, metric_history: list[dict]) -> dict | None:
        """Linear regression to predict when a resource will hit 100%."""
        try:
            import numpy as np
            from sklearn.linear_model import LinearRegression

            if len(metric_history) < 10:
                return None

            times = np.array([i for i in range(len(metric_history))]).reshape(-1, 1)
            values = np.array([m["value"] for m in metric_history])

            model = LinearRegression()
            model.fit(times, values)

            if model.coef_[0] <= 0:
                return None  # Decreasing trend

            steps_to_100 = (100 - model.predict([[len(metric_history)]])[0]) / model.coef_[0]
            if steps_to_100 <= 0:
                return None

            interval_hours = 1  # Assuming hourly data points
            hours_remaining = steps_to_100 * interval_hours

            return {
                "current_value": float(values[-1]),
                "predicted_hours": float(hours_remaining),
                "days_remaining": float(hours_remaining / 24),
                "trend_slope": float(model.coef_[0]),
            }
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            return None
