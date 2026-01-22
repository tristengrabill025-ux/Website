// Updated requireAdmin middleware

const getRoleFromUser = (user) => {
    const { user_metadata, app_metadata, raw_user_meta_data, raw_app_meta_data } = user;
    // Check for admin flags in metadata locations
    const isAdmin = 
        user_metadata?.admin || 
        app_metadata?.admin || 
        raw_user_meta_data?.admin || 
        raw_app_meta_data?.admin;
    return isAdmin ? 'admin' : 'user';
};

const requireAdmin = (req, res, next) => {
    const user = req.user;
    const role = getRoleFromUser(user);
    if (role === 'admin') {
        next(); // User is an admin, continue to the next middleware
    } else {
        res.status(403).send('Access denied: Admins only.'); // Forbidden
    }
};

module.exports = { requireAdmin };