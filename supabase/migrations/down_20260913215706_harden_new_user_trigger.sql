-- DOWN Migration: Reverse harden new user trigger

-- Re-grant EXECUTE on handle_new_user to PUBLIC
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;

-- Restore original handle_new_user function (without SECURITY DEFINER, without search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, display_name, email, preferred_language, is_system_admin, active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en'),
    FALSE,
    TRUE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
