CREATE TABLE IF NOT EXISTS public.table_availability_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id BIGINT NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,
  table_location TEXT NOT NULL,
  reservation_id UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  reservation_time TIMESTAMP WITH TIME ZONE NOT NULL,
  occupied_from TIMESTAMP WITH TIME ZONE NOT NULL,
  available_after TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.table_availability_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view table availability schedules" 
  ON public.table_availability_schedules
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert table availability schedules" 
  ON public.table_availability_schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update table availability schedules" 
  ON public.table_availability_schedules
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete table availability schedules" 
  ON public.table_availability_schedules
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE INDEX idx_table_availability_schedules_restaurant_id ON public.table_availability_schedules(restaurant_id);
CREATE INDEX idx_table_availability_schedules_reservation_id ON public.table_availability_schedules(reservation_id);
CREATE INDEX idx_table_availability_schedules_table_id ON public.table_availability_schedules(table_id);
CREATE INDEX idx_table_availability_schedules_is_active ON public.table_availability_schedules(is_active);
CREATE INDEX idx_table_availability_schedules_occupied_from ON public.table_availability_schedules(occupied_from);
CREATE INDEX idx_table_availability_schedules_available_after ON public.table_availability_schedules(available_after); 