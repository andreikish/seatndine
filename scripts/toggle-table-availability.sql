CREATE OR REPLACE FUNCTION toggle_table_availability(
  p_restaurant_id TEXT,
  p_table_location TEXT,
  p_table_id TEXT,
  p_is_available BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tables JSONB;
  v_table_index INTEGER;
  v_found BOOLEAN := FALSE;
BEGIN
  SELECT tables INTO v_tables
  FROM restaurants
  WHERE id::TEXT = p_restaurant_id::TEXT;
  
  IF p_table_location NOT IN ('interior', 'exterior') THEN
    RAISE EXCEPTION 'Locația mesei trebuie să fie "interior" sau "exterior"';
  END IF;
  
  IF v_tables->p_table_location IS NULL OR jsonb_array_length(v_tables->p_table_location) = 0 THEN
    RETURN FALSE;
  END IF;
  
  FOR i IN 0..jsonb_array_length(v_tables->p_table_location) - 1 LOOP
    IF v_tables->p_table_location->i->>'id' = p_table_id::TEXT THEN
      v_tables := jsonb_set(
        v_tables,
        ARRAY[p_table_location, i::text, 'isAvailable'],
        to_jsonb(p_is_available)
      );
      v_found := TRUE;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_found THEN
    UPDATE restaurants
    SET tables = v_tables
    WHERE id::TEXT = p_restaurant_id::TEXT;
  END IF;
  
  RETURN v_found;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION toggle_table_availability TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_table_availability TO anon;
GRANT EXECUTE ON FUNCTION toggle_table_availability TO service_role;
