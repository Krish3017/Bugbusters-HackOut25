-- Function to award points to a user
CREATE OR REPLACE FUNCTION award_points(user_id UUID, points_to_add INTEGER)
RETURNS VOID AS $$
BEGIN
  -- Update the user's points in the profiles table
  UPDATE profiles 
  SET points = COALESCE(points, 0) + points_to_add,
      updated_at = NOW()
  WHERE id = user_id;
  
  -- Log the points award (optional - you can create a points_log table if needed)
  -- INSERT INTO points_log (user_id, points_awarded, reason, created_at) 
  -- VALUES (user_id, points_to_add, 'Report verified', NOW());
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
