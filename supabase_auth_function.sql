-- ============================================================
-- Supabase SQL Editor에서 실행: 로그인 RPC 함수
-- bcrypt 비밀번호 검증을 위한 pgcrypto 확장 + 로그인 함수
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 로그인 함수: username/password 검증 후 유저 정보 반환
CREATE OR REPLACE FUNCTION public.authenticate(
    p_username TEXT,
    p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_valid BOOLEAN;
BEGIN
    -- Find user
    SELECT id, username, email, role, hashed_password, is_active
    INTO v_user
    FROM public.users
    WHERE username = p_username;

    IF v_user IS NULL THEN
        RETURN json_build_object('error', 'Invalid credentials');
    END IF;

    IF NOT v_user.is_active THEN
        RETURN json_build_object('error', 'User inactive');
    END IF;

    -- Verify bcrypt password
    v_valid := v_user.hashed_password = crypt(p_password, v_user.hashed_password);

    IF NOT v_valid THEN
        RETURN json_build_object('error', 'Invalid credentials');
    END IF;

    -- Update last_login
    UPDATE public.users SET last_login = NOW() WHERE id = v_user.id;

    -- Return user info
    RETURN json_build_object(
        'id', v_user.id,
        'username', v_user.username,
        'email', v_user.email,
        'role', v_user.role
    );
END;
$$;

-- 대시보드 요약 함수
CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INT;
    v_normal INT;
    v_warning INT;
    v_down INT;
    v_active_alerts INT;
    v_critical_alerts INT;
    v_warning_alerts INT;
BEGIN
    SELECT COUNT(*) INTO v_total FROM public.assets;
    SELECT COUNT(*) INTO v_normal FROM public.assets WHERE status = 'normal';
    SELECT COUNT(*) INTO v_warning FROM public.assets WHERE status = 'warning';
    SELECT COUNT(*) INTO v_down FROM public.assets WHERE status = 'down';
    SELECT COUNT(*) INTO v_active_alerts FROM public.alerts WHERE status = 'firing';
    SELECT COUNT(*) INTO v_critical_alerts FROM public.alerts WHERE status = 'firing' AND severity = 'critical';
    SELECT COUNT(*) INTO v_warning_alerts FROM public.alerts WHERE status = 'firing' AND severity = 'warning';

    RETURN json_build_object(
        'total_assets', v_total,
        'normal_count', v_normal,
        'warning_count', v_warning,
        'down_count', v_down,
        'active_alerts', v_active_alerts,
        'critical_alerts', v_critical_alerts,
        'warning_alerts', v_warning_alerts
    );
END;
$$;

SELECT 'Auth and dashboard functions created!' AS result;
