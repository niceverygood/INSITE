-- ============================================================
-- INSITE: 24시간 메트릭 히스토리 (5분 간격, 21개 자산)
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 기존 메트릭 삭제
DELETE FROM metrics;

-- 메트릭 생성 함수
CREATE OR REPLACE FUNCTION generate_metrics()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    asset RECORD;
    t TIMESTAMP;
    i INT;
    cpu_base FLOAT; mem_base FLOAT; disk_base FLOAT; net_in_base FLOAT; net_out_base FLOAT;
    cpu_val FLOAT; mem_val FLOAT; disk_val FLOAT;
    is_biz_hour BOOLEAN;
    hour_mult FLOAT;
BEGIN
    FOR asset IN SELECT id, name, status FROM assets LOOP
        -- Set base profiles per asset type
        CASE
            WHEN asset.name LIKE 'WEB-PRD%' THEN cpu_base:=35; mem_base:=55; disk_base:=42; net_in_base:=2500; net_out_base:=4200;
            WHEN asset.name LIKE 'API-PRD%' THEN cpu_base:=45; mem_base:=62; disk_base:=38; net_in_base:=1800; net_out_base:=3500;
            WHEN asset.name LIKE 'DB-PRD%' THEN cpu_base:=55; mem_base:=78; disk_base:=72; net_in_base:=3000; net_out_base:=5000;
            WHEN asset.name LIKE 'CACHE%' THEN cpu_base:=20; mem_base:=85; disk_base:=15; net_in_base:=4000; net_out_base:=6000;
            WHEN asset.name LIKE 'KAFKA%' THEN cpu_base:=40; mem_base:=68; disk_base:=55; net_in_base:=5000; net_out_base:=5500;
            WHEN asset.name LIKE 'ES%' THEN cpu_base:=50; mem_base:=75; disk_base:=65; net_in_base:=2000; net_out_base:=3000;
            WHEN asset.name LIKE 'CORE-SW%' THEN cpu_base:=30; mem_base:=40; disk_base:=20; net_in_base:=8000; net_out_base:=8500;
            WHEN asset.name LIKE 'DIST%' THEN cpu_base:=25; mem_base:=35; disk_base:=18; net_in_base:=4000; net_out_base:=4200;
            WHEN asset.name LIKE 'FW%' THEN cpu_base:=35; mem_base:=50; disk_base:=25; net_in_base:=6000; net_out_base:=5800;
            WHEN asset.name LIKE 'LB%' THEN cpu_base:=30; mem_base:=45; disk_base:=20; net_in_base:=7000; net_out_base:=7200;
            WHEN asset.name LIKE 'DEV%' THEN cpu_base:=20; mem_base:=40; disk_base:=35; net_in_base:=300; net_out_base:=500;
            WHEN asset.name LIKE 'K8S-MASTER%' THEN cpu_base:=25; mem_base:=55; disk_base:=30; net_in_base:=1200; net_out_base:=1500;
            WHEN asset.name LIKE 'K8S-WORKER%' THEN cpu_base:=55; mem_base:=70; disk_base:=45; net_in_base:=2000; net_out_base:=2500;
            ELSE cpu_base:=30; mem_base:=50; disk_base:=40; net_in_base:=1000; net_out_base:=1500;
        END CASE;

        -- Override for problem assets
        IF asset.name = 'WEB-PRD-03' THEN cpu_base:=82; mem_base:=88; END IF;
        IF asset.name = 'DB-PRD-03' THEN cpu_base:=95; mem_base:=96; disk_base:=93; END IF;
        IF asset.name = 'KAFKA-PRD-03' THEN cpu_base:=78; mem_base:=82; END IF;
        IF asset.name = 'DIST-SW-B2' THEN cpu_base:=75; net_in_base:=9500; END IF;

        -- Generate 288 data points (24h * 12 per hour)
        FOR i IN 0..287 LOOP
            t := NOW() - ((287 - i) * INTERVAL '5 minutes');

            -- Business hour multiplier (9am-6pm = higher usage)
            is_biz_hour := EXTRACT(HOUR FROM t) BETWEEN 9 AND 18;
            hour_mult := CASE WHEN is_biz_hour THEN 1.15 ELSE 0.85 END;

            -- K8S-WORKER-03: dead after 2 hours ago
            IF asset.name = 'K8S-WORKER-03' AND t > NOW() - INTERVAL '2 hours' THEN
                INSERT INTO metrics VALUES (t, asset.id, 'cpu_usage', 0, '%');
                INSERT INTO metrics VALUES (t, asset.id, 'memory_usage', 0, '%');
                INSERT INTO metrics VALUES (t, asset.id, 'disk_usage', 0, '%');
                INSERT INTO metrics VALUES (t, asset.id, 'network_in', 0, 'Kbps');
                INSERT INTO metrics VALUES (t, asset.id, 'network_out', 0, 'Kbps');
                CONTINUE;
            END IF;

            cpu_val := GREATEST(0, LEAST(100, cpu_base * hour_mult + (random() - 0.5) * 15));
            mem_val := GREATEST(0, LEAST(100, mem_base * hour_mult + (random() - 0.5) * 8));
            disk_val := GREATEST(0, LEAST(100, disk_base + (random() - 0.5) * 4));

            INSERT INTO metrics VALUES (t, asset.id, 'cpu_usage', ROUND(cpu_val::numeric, 1), '%');
            INSERT INTO metrics VALUES (t, asset.id, 'memory_usage', ROUND(mem_val::numeric, 1), '%');
            INSERT INTO metrics VALUES (t, asset.id, 'disk_usage', ROUND(disk_val::numeric, 1), '%');
            INSERT INTO metrics VALUES (t, asset.id, 'network_in', ROUND(GREATEST(0, net_in_base * hour_mult + (random() - 0.5) * net_in_base * 0.4)::numeric), 'Kbps');
            INSERT INTO metrics VALUES (t, asset.id, 'network_out', ROUND(GREATEST(0, net_out_base * hour_mult + (random() - 0.5) * net_out_base * 0.4)::numeric), 'Kbps');
        END LOOP;

        RAISE NOTICE 'Generated metrics for %', asset.name;
    END LOOP;
END;
$$;

-- 실행
SELECT generate_metrics();

-- 결과 확인
SELECT
    COUNT(*) AS total_metrics,
    COUNT(DISTINCT asset_id) AS assets_with_metrics,
    MIN(time) AS oldest,
    MAX(time) AS newest
FROM metrics;
