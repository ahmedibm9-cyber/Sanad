-- DOWN Migration: Reverse harden permission function

-- Restore check_user_permission without account.active check
CREATE OR REPLACE FUNCTION public.check_user_permission(
  p_user_id UUID,
  p_company_id UUID,
  p_permission_key TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_base_role TEXT;
  v_membership_id UUID;
  v_allowed BOOLEAN;
BEGIN
  SELECT is_system_admin INTO v_is_admin
  FROM users WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN TRUE;
  END IF;

  SELECT id, base_role INTO v_membership_id, v_base_role
  FROM company_memberships
  WHERE user_id = p_user_id
    AND company_id = p_company_id
    AND active = TRUE;

  IF v_membership_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF v_base_role = 'admin' THEN
    RETURN TRUE;
  END IF;

  SELECT allowed INTO v_allowed
  FROM membership_permissions
  WHERE membership_id = v_membership_id
    AND permission_key = p_permission_key;

  IF v_base_role = 'viewer' THEN
    IF p_permission_key IN ('projects.view', 'tasks.view', 'documents.view',
                            'customers.view', 'materials.view', 'reports.view',
                            'factory.view') THEN
      RETURN TRUE;
    END IF;
    IF p_permission_key = 'files.download' THEN
      RETURN COALESCE(v_allowed, FALSE);
    END IF;
    RETURN FALSE;
  END IF;

  RETURN COALESCE(v_allowed, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
