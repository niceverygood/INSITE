"""AI Engine — LLM-based fault diagnosis via OpenRouter."""

import json
import logging
import uuid
from datetime import datetime, timezone

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

DIAGNOSIS_PROMPT = """너는 IT 인프라 전문 엔지니어이자 장애 진단 전문가다.
다음 자산에서 장애/이상이 발생했다. 분석하라.

[자산 정보]
{asset_info}

[최근 메트릭 (최신순)]
{recent_metrics}

[에러 로그]
{error_logs}

[활성 알람]
{active_alerts}

[사용자 증상 설명]
{symptom}

다음을 분석하라:
1. 장애 원인 (가능성 높은 순서로 최대 3개)
2. 각 원인의 근거
3. 즉시 조치 방법
4. 재발 방지 대책
5. 심각도 평가 (1-10)

반드시 아래 JSON 형식으로만 응답하라 (다른 텍스트 없이 JSON만):
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
  "summary": "한 줄 요약"
}}
"""

CHAT_PROMPT = """너는 INSITE IT 인프라 모니터링 시스템의 AI 어시스턴트다.
사용자의 질문에 친절하고 전문적으로 답변하라.
인프라 운영, 모니터링, 장애 대응, 성능 최적화에 대해 도움을 줄 수 있다.

현재 인프라 상태:
{context}

사용자 질문: {question}

한국어로 답변하라. Markdown 포맷을 사용해도 된다."""


class AIEngine:
    def __init__(self):
        self.api_key = settings.openrouter_api_key
        self.model = settings.ai_model
        self.base_url = "https://openrouter.ai/api/v1"

    async def _call_llm(self, prompt: str, json_mode: bool = False) -> str:
        """Call LLM via OpenRouter API."""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://insite.vercel.app",
            "X-Title": "INSITE Infrastructure Monitor",
        }
        body = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 4096,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def diagnose(
        self,
        asset_info: dict,
        recent_metrics: list[dict],
        error_logs: list[str],
        active_alerts: list[dict],
        symptom: str = "",
    ) -> dict:
        prompt = DIAGNOSIS_PROMPT.format(
            asset_info=json.dumps(asset_info, ensure_ascii=False, indent=2),
            recent_metrics=json.dumps(recent_metrics[:20], ensure_ascii=False, indent=2),
            error_logs="\n".join(error_logs[:30]) if error_logs else "없음",
            active_alerts=json.dumps(active_alerts, ensure_ascii=False, indent=2) if active_alerts else "없음",
            symptom=symptom or "사용자 증상 미입력",
        )

        try:
            raw = await self._call_llm(prompt, json_mode=True)
            # Extract JSON from response (handle markdown code blocks)
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1]
                cleaned = cleaned.rsplit("```", 1)[0]
            result = json.loads(cleaned)
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

    async def chat(self, question: str, context: str = "") -> str:
        """General AI chat for infrastructure questions."""
        prompt = CHAT_PROMPT.format(
            context=context or "상태 정보 없음",
            question=question,
        )
        try:
            return await self._call_llm(prompt)
        except Exception as e:
            logger.error(f"AI chat failed: {e}")
            return f"AI 응답 실패: {str(e)}"
