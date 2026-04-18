const db = require('../config/database');

// @desc    Get all services
// @route   GET /api/services
// @access  Public
exports.getServices = async (req, res) => {
  try {
    const { category, search, page = 1 } = req.query;
    // Cap limit at 50 per page to prevent database overload
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const safePage = Math.max(parseInt(page) || 1, 1);
    const offset = (safePage - 1) * limit;

    let query = `
      SELECT s.*, u.full_name as provider_name, u.avatar_url as provider_avatar, u.reputation_score as rating
      FROM services s
      JOIN users u ON s.user_id = u.id
      WHERE s.status = 'active'
    `;
    const params = [];

    if (category) {
      query += ' AND s.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (s.title LIKE ? OR s.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

        query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [services] = await db.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM services WHERE status = "active"';
    const countParams = [];
    
    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const [countResult] = await db.query(countQuery, countParams);

    res.json({
      success: true,
      services,
            pagination: {
        page: safePage,
        limit,
        total: countResult[0].total
      }
    });

  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getService = async (req, res) => {
  try {
    const [services] = await db.query(
      `SELECT s.*, u.full_name as provider_name, u.avatar_url as provider_avatar, u.reputation_score as rating, u.email as provider_email
       FROM services s
       JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Increment views
    await db.query('UPDATE services SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      service: services[0]
    });

  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Create service
// @route   POST /api/services
// @access  Private
exports.createService = async (req, res) => {
  try {
            const { title, description, category, skill_required, credits_cost, duration_minutes, location } = req.body;

    if (!title || !description || !category || !credits_cost) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Trim and sanitize text inputs
    const cleanTitle = title.trim();
    const cleanDescription = description.trim();
    const cleanCategory = category.trim();
    const cleanSkillRequired = skill_required ? skill_required.trim() : null;
    const cleanLocation = location ? location.trim() : null;

    // Validate trimmed fields are not empty
    if (!cleanTitle || !cleanDescription || !cleanCategory) {
      return res.status(400).json({ message: 'Title, description and category cannot be empty or whitespace' });
    }

    // Enforce max length on text fields
    if (cleanTitle.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }
    if (cleanDescription.length > 2000) {
      return res.status(400).json({ message: 'Description must be 2000 characters or less' });
    }

    // Validate credits_cost is a positive number
    const parsedCredits = Number(credits_cost);
    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      return res.status(400).json({ message: 'Credits cost must be a positive number' });
    }

    // Validate duration_minutes if provided
    let parsedDuration = null;
    if (duration_minutes !== undefined && duration_minutes !== null) {
      parsedDuration = Number(duration_minutes);
      if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
        return res.status(400).json({ message: 'Duration must be a positive number in minutes' });
      }
    }

    const [result] = await db.query(
      `INSERT INTO services (user_id, title, description, category, skill_required, credits_cost, duration_minutes, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, cleanTitle, cleanDescription, cleanCategory, cleanSkillRequired, parsedCredits, parsedDuration, cleanLocation]
    );

    const [services] = await db.query('SELECT * FROM services WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service: services[0]
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
exports.updateService = async (req, res) => {
  try {
    // Check if service exists and belongs to user
    const [services] = await db.query('SELECT * FROM services WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

            const { title, description, category, skill_required, credits_cost, duration_minutes, location, status } = req.body;

    // Trim and sanitize text inputs
    const cleanTitle = title ? title.trim() : services[0].title;
    const cleanDescription = description ? description.trim() : services[0].description;
    const cleanCategory = category ? category.trim() : services[0].category;
    const cleanSkillRequired = skill_required ? skill_required.trim() : services[0].skill_required;
    const cleanLocation = location ? location.trim() : services[0].location;

    // Validate trimmed fields are not empty
    if (!cleanTitle || !cleanDescription || !cleanCategory) {
      return res.status(400).json({ message: 'Title, description and category cannot be empty or whitespace' });
    }

    // Enforce max length on text fields
    if (cleanTitle.length > 100) {
      return res.status(400).json({ message: 'Title must be 100 characters or less' });
    }
    if (cleanDescription.length > 2000) {
      return res.status(400).json({ message: 'Description must be 2000 characters or less' });
    }

    // Validate credits_cost if provided
    const parsedCredits = credits_cost ? Number(credits_cost) : services[0].credits_cost;
    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      return res.status(400).json({ message: 'Credits cost must be a positive number' });
    }

    // Validate duration_minutes if provided
    const parsedDuration = duration_minutes ? Number(duration_minutes) : services[0].duration_minutes;
    if (parsedDuration !== null && (!Number.isFinite(parsedDuration) || parsedDuration <= 0)) {
      return res.status(400).json({ message: 'Duration must be a positive number in minutes' });
    }

    // Validate status if provided
    const validStatuses = ['active', 'inactive', 'completed'];
    const cleanStatus = status || 'active';
    if (!validStatuses.includes(cleanStatus)) {
      return res.status(400).json({ message: 'Invalid service status' });
    }

    await db.query(
      `UPDATE services SET title = ?, description = ?, category = ?, skill_required = ?, 
       credits_cost = ?, duration_minutes = ?, location = ?, status = ?
       WHERE id = ?`,
      [cleanTitle, cleanDescription, cleanCategory, cleanSkillRequired, parsedCredits, parsedDuration, cleanLocation, cleanStatus, req.params.id]
    );

    const [updatedService] = await db.query('SELECT * FROM services WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Service updated successfully',
      service: updatedService[0]
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
exports.deleteService = async (req, res) => {
  try {
    const [services] = await db.query('SELECT * FROM services WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);

    if (services.length === 0) {
      return res.status(404).json({ message: 'Service not found or unauthorized' });
    }

    await db.query('DELETE FROM services WHERE id = ?', [req.params.id]);

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user's services
// @route   GET /api/services/user/:userId
// @access  Public
exports.getUserServices = async (req, res) => {
  try {
    const [services] = await db.query(
      'SELECT * FROM services WHERE user_id = ? ORDER BY created_at DESC',
      [req.params.userId]
    );

    res.json({
      success: true,
      services
    });

  } catch (error) {
    console.error('Get user services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
