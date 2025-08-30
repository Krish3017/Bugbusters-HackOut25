// Admin Configuration
export const ADMIN_CONFIG = {
  // Secret key required for admin signup
  // Change this to your preferred secret key
  SECRET_KEY: 'TIDE_GUARD_2024',
  
  // Admin role name
  ROLE: 'authority',
  
  // Points awarded for verified reports
  POINTS_FOR_VERIFICATION: 10,
  
  // Points awarded for participation
  POINTS_FOR_PARTICIPATION: 2
};

// Function to validate admin secret key
export const validateAdminSecretKey = (secretKey: string): boolean => {
  return secretKey === ADMIN_CONFIG.SECRET_KEY;
};
