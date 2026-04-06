# INSITE — IT Infrastructure Integrated Monitoring System

IT 인프라(네트워크, 서버, 시스템)를 단일 대시보드에서 실시간 모니터링하고, AI 기반 장애 예측 및 조치 가이드를 제공하는 통합관제 플랫폼.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy, Alembic |
| Frontend | React 18, TypeScript, Tailwind CSS, Recharts, Zustand |
| Database | PostgreSQL 16, TimescaleDB (time-series) |
| Cache | Redis 7 |
| Message Queue | Apache Kafka |
| Search | Elasticsearch 8 |
| Monitoring | Prometheus, Grafana |
| AI | OpenAI / Anthropic API |
| Infrastructure | Docker Compose / Kubernetes |

## Quick Start

```bash
# 1. Copy env
cp .env.example .env

# 2. Start all services
docker compose up -d

# 3. Run migrations
docker compose exec backend alembic upgrade head

# 4. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000/docs
# Grafana: http://localhost:3001
# Kibana: http://localhost:5601
```

## Development

```bash
# Backend
cd backend && pip install -e ".[dev]"
uvicorn app.main:app --reload

# Frontend
cd frontend && npm install && npm run dev
```

## Project Structure

```
insite/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── collector/        # Data collection agent
├── infra/            # Infrastructure configs
└── docker-compose.yml
```
