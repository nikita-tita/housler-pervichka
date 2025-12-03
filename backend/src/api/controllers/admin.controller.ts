import { Request, Response } from 'express';
import { AdminService } from '../../services/admin.service';
import type { UserRole } from '../../services/auth.service';
import { logger } from '../../utils/logger';

const adminService = new AdminService();

// === Users ===

export async function getUsers(req: Request, res: Response) {
  try {
    const {
      search,
      role,
      is_active,
      agency_id,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      search: search as string | undefined,
      role: role as UserRole | undefined,
      is_active: is_active === 'true' ? true : is_active === 'false' ? false : undefined,
      agency_id: agency_id ? parseInt(agency_id as string, 10) : undefined
    };

    const result = await adminService.getUsers(
      filters,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    logger.info('Admin fetched users list', {
      adminId: req.user?.id,
      filters,
      count: result.users.length
    });

    res.json({
      success: true,
      data: result.users,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      }
    });
  } catch (error) {
    logger.error('Failed to get users', { error });
    res.status(500).json({ success: false, error: 'Failed to get users' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    // ID уже провалидирован и преобразован в число через validateParams
    const userId = req.params.id as unknown as number;

    const user = await adminService.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Failed to get user', { error });
    res.status(500).json({ success: false, error: 'Failed to get user' });
  }
}

export async function updateUserRole(req: Request, res: Response) {
  try {
    // ID и role уже провалидированы через validateParams и validateBody
    const userId = req.params.id as unknown as number;
    const { role } = req.body;

    // Нельзя менять роль самому себе
    if (req.user?.id === userId) {
      return res.status(400).json({ success: false, error: 'Cannot change own role' });
    }

    const user = await adminService.updateUserRole(userId, role);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info('Admin updated user role', {
      adminId: req.user?.id,
      userId,
      newRole: role
    });

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Failed to update user role', { error });
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
}

export async function toggleUserActive(req: Request, res: Response) {
  try {
    // Провалидировано через validateParams и validateBody
    const userId = req.params.id as unknown as number;
    const { is_active } = req.body;

    // Нельзя деактивировать самого себя
    if (req.user?.id === userId) {
      return res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
    }

    const user = await adminService.toggleUserActive(userId, is_active);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info('Admin toggled user active status', {
      adminId: req.user?.id,
      userId,
      isActive: is_active
    });

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Failed to toggle user active', { error });
    res.status(500).json({ success: false, error: 'Failed to toggle user active' });
  }
}

export async function setUserAgency(req: Request, res: Response) {
  try {
    // Провалидировано через validateParams и validateBody
    const userId = req.params.id as unknown as number;
    const { agency_id } = req.body;

    const user = await adminService.setUserAgency(userId, agency_id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info('Admin set user agency', {
      adminId: req.user?.id,
      userId,
      agencyId: agency_id
    });

    res.json({ success: true, data: user });
  } catch (error) {
    logger.error('Failed to set user agency', { error });
    res.status(500).json({ success: false, error: 'Failed to set user agency' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    // Провалидировано через validateBody (createUserSchema)
    const { email, name, phone, role, agency_id } = req.body;

    const user = await adminService.createUser({
      email,
      name,
      phone,
      role,
      agency_id
    });

    logger.info('Admin created user', {
      adminId: req.user?.id,
      newUserId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({ success: true, data: user });
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err.code === '23505') {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }
    logger.error('Failed to create user', { error });
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    // Провалидировано через validateParams
    const userId = req.params.id as unknown as number;

    // Нельзя удалить самого себя
    if (req.user?.id === userId) {
      return res.status(400).json({ success: false, error: 'Cannot delete yourself' });
    }

    const deleted = await adminService.deleteUser(userId);

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    logger.info('Admin deleted user', {
      adminId: req.user?.id,
      deletedUserId: userId
    });

    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    logger.error('Failed to delete user', { error });
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
}

// === Agencies ===

export async function getAgencies(req: Request, res: Response) {
  try {
    const {
      search,
      registration_status,
      limit = '50',
      offset = '0'
    } = req.query;

    const filters = {
      search: search as string | undefined,
      registration_status: registration_status as string | undefined
    };

    const result = await adminService.getAgencies(
      filters,
      parseInt(limit as string, 10),
      parseInt(offset as string, 10)
    );

    res.json({
      success: true,
      data: result.agencies,
      pagination: {
        total: result.total,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10)
      }
    });
  } catch (error) {
    logger.error('Failed to get agencies', { error });
    res.status(500).json({ success: false, error: 'Failed to get agencies' });
  }
}

export async function getAgencyById(req: Request, res: Response) {
  try {
    // Провалидировано через validateParams
    const agencyId = req.params.id as unknown as number;

    const agency = await adminService.getAgencyById(agencyId);

    if (!agency) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }

    res.json({ success: true, data: agency });
  } catch (error) {
    logger.error('Failed to get agency', { error });
    res.status(500).json({ success: false, error: 'Failed to get agency' });
  }
}

export async function updateAgencyStatus(req: Request, res: Response) {
  try {
    // Провалидировано через validateParams и validateBody
    const agencyId = req.params.id as unknown as number;
    const { status } = req.body;

    const agency = await adminService.updateAgencyStatus(agencyId, status);

    if (!agency) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }

    logger.info('Admin updated agency status', {
      adminId: req.user?.id,
      agencyId,
      newStatus: status
    });

    res.json({ success: true, data: agency });
  } catch (error) {
    logger.error('Failed to update agency status', { error });
    res.status(500).json({ success: false, error: 'Failed to update agency status' });
  }
}

// === Stats ===

export async function getPlatformStats(req: Request, res: Response) {
  try {
    const stats = await adminService.getPlatformStats();

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Failed to get platform stats', { error });
    res.status(500).json({ success: false, error: 'Failed to get platform stats' });
  }
}
