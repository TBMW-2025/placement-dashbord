-- Supabase Schema Setup for Placement Monitor Dashboard

-- 1. students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_name TEXT NOT NULL,
    enrollment_number TEXT UNIQUE NOT NULL,
    email TEXT,
    mobile TEXT,
    programme TEXT,
    higher_education BOOLEAN DEFAULT FALSE,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. companies
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name TEXT NOT NULL,
    role_offered TEXT,
    contact_person TEXT,
    contact_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. internships
CREATE TABLE IF NOT EXISTS public.internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT,
    duration TEXT,
    type_of_organization TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. placements
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    role TEXT,
    salary NUMERIC, -- LPA
    placement_date DATE,
    status TEXT CHECK (status IN ('Placed', 'Not Placed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. field_visits
CREATE TABLE IF NOT EXISTS public.field_visits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    location TEXT,
    organization TEXT,
    faculty_coordinator TEXT,
    visit_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and set Open policies for dev
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable Read" ON public.students FOR SELECT USING (true);
CREATE POLICY "Enable Insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Enable Delete" ON public.students FOR DELETE USING (true);

CREATE POLICY "Enable Read" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Enable Insert" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update" ON public.companies FOR UPDATE USING (true);
CREATE POLICY "Enable Delete" ON public.companies FOR DELETE USING (true);

CREATE POLICY "Enable Read" ON public.internships FOR SELECT USING (true);
CREATE POLICY "Enable Insert" ON public.internships FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update" ON public.internships FOR UPDATE USING (true);
CREATE POLICY "Enable Delete" ON public.internships FOR DELETE USING (true);

CREATE POLICY "Enable Read" ON public.placements FOR SELECT USING (true);
CREATE POLICY "Enable Insert" ON public.placements FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update" ON public.placements FOR UPDATE USING (true);
CREATE POLICY "Enable Delete" ON public.placements FOR DELETE USING (true);

CREATE POLICY "Enable Read" ON public.field_visits FOR SELECT USING (true);
CREATE POLICY "Enable Insert" ON public.field_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable Update" ON public.field_visits FOR UPDATE USING (true);
CREATE POLICY "Enable Delete" ON public.field_visits FOR DELETE USING (true);


-- 6. Storage Buckets configuration
-- (Run these statements after enabling Storage in the Supabase Dashboard, or they might fail if the bucket API isn't initialized yet).
INSERT INTO storage.buckets (id, name, public) 
VALUES ('resumes', 'resumes', true) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('excel_uploads', 'excel_uploads', true) 
ON CONFLICT (id) DO NOTHING;

-- Open policies for Storage during development
CREATE POLICY "Public Access Resumes" ON storage.objects FOR SELECT USING (bucket_id = 'resumes');
CREATE POLICY "Public Upload Resumes" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Public Access Excel" ON storage.objects FOR SELECT USING (bucket_id = 'excel_uploads');
CREATE POLICY "Public Upload Excel" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'excel_uploads');


-- Create simple users table extending auth.users is handled by Supabase Auth by default.
