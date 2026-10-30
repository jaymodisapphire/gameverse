-- ==============================================================================
-- GAMEVERSE: CHIP REQUESTS RLS & REALTIME FIX
-- Purpose:
-- 1. Ensures any authenticated user can submit a chip request
-- 2. Ensures Admin can view all requests and approve/reject them
-- ==============================================================================

-- 1. Enable RLS
ALTER TABLE public.chip_requests ENABLE ROW LEVEL SECURITY;

-- 2. Insert Policy: Users can submit requests
DROP POLICY IF EXISTS "Users can submit chip requests" ON public.chip_requests;
CREATE POLICY "Users can submit chip requests"
    ON public.chip_requests FOR INSERT
    WITH CHECK (auth.uid() = requester_user_id OR auth.uid() IS NOT NULL);

-- 3. Select Policy: User reads own requests, Admin reads ALL requests
DROP POLICY IF EXISTS "Users can read own chip requests" ON public.chip_requests;
CREATE POLICY "Users can read own chip requests"
    ON public.chip_requests FOR SELECT
    USING (
        auth.uid() = requester_user_id 
        OR public.is_admin(auth.uid()) 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );

-- 4. Update Policy: Admins can approve / reject requests
DROP POLICY IF EXISTS "Admins can update chip requests" ON public.chip_requests;
CREATE POLICY "Admins can update chip requests"
    ON public.chip_requests FOR UPDATE
    USING (
        public.is_admin(auth.uid()) 
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR role = 'admin'))
    );
