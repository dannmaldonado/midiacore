-- Add automatic profile creation on user signup
-- Trigger: When a new user is created in auth.users, create a profile record

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, company_id)
  VALUES (
    NEW.id,
    NEW.email,
    'viewer',  -- Default role
    (SELECT id FROM public.companies LIMIT 1)  -- Assign to first company (or NULL if none)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
