-- JSW WorkFlow Pro Dashboard Analytical Queries & RPCs

-- 1. Department Performance RPC (For Admin Dashboard)
CREATE OR REPLACE FUNCTION get_department_performance()
RETURNS TABLE (
    name VARCHAR,
    planned BIGINT,
    completed BIGINT,
    issues BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.name,
        COUNT(t.id) as planned,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN t.priority IN ('HIGH', 'CRITICAL') AND t.status != 'COMPLETED' THEN 1 END) as issues
    FROM departments d
    LEFT JOIN tasks t ON d.id = t.department_id
    GROUP BY d.id, d.name;
END;
$$ LANGUAGE plpgsql;

-- 2. Team Performance RPC (For Employee Dashboard)
CREATE OR REPLACE FUNCTION get_team_performance(target_department_id UUID)
RETURNS TABLE (
    name VARCHAR,
    planned BIGINT,
    completed BIGINT,
    issues BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.full_name as name,
        COUNT(t.id) as planned,
        COUNT(CASE WHEN t.status = 'COMPLETED' THEN 1 END) as completed,
        COUNT(CASE WHEN t.priority IN ('HIGH', 'CRITICAL') AND t.status != 'COMPLETED' THEN 1 END) as issues
    FROM users u
    LEFT JOIN tasks t ON u.id = t.assignee_id
    WHERE u.department_id = target_department_id AND u.role = 'WORKER'
    GROUP BY u.id, u.full_name;
END;
$$ LANGUAGE plpgsql;
