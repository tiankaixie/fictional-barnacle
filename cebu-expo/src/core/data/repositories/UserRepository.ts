/**
 * Input: WatermelonDB database instance, User model
 * Output: User CRUD operations
 * Pos: Data access layer for user management
 * If this file is updated, you must update this header and the parent folder's README.md.
 */

import { Q } from '@nozbe/watermelondb';
import database from '../database';
import User from '../models/User';

class UserRepository {
  private db = database;

  /**
   * Get the current local user (assumes single user)
   */
  async getCurrentUser(): Promise<User | null> {
    const users = await this.db.get<User>('users').query().fetch();
    return users.length > 0 ? users[0] : null;
  }

  /**
   * Create a new local user
   */
  async createUser(data?: {
    appleId?: string;
    email?: string;
    displayName?: string;
  }): Promise<User> {
    return await this.db.write(async () => {
      const user = await this.db.get<User>('users').create((newUser) => {
        newUser.appleId = data?.appleId;
        newUser.email = data?.email;
        newUser.displayName = data?.displayName;
      });
      console.log('[UserRepository] Created new user:', user.id);
      return user;
    });
  }

  /**
   * Get or create local user (convenience method)
   */
  async getOrCreateLocalUser(): Promise<User> {
    const existing = await this.getCurrentUser();
    if (existing) {
      return existing;
    }

    return await this.createUser({
      displayName: 'Local User',
    });
  }

  /**
   * Update user profile
   */
  async updateUser(
    user: User,
    data: {
      appleId?: string;
      email?: string;
      displayName?: string;
    }
  ): Promise<User> {
    return await this.db.write(async () => {
      await user.update((updatedUser) => {
        if (data.appleId !== undefined) updatedUser.appleId = data.appleId;
        if (data.email !== undefined) updatedUser.email = data.email;
        if (data.displayName !== undefined)
          updatedUser.displayName = data.displayName;
      });
      return user;
    });
  }
}

export default new UserRepository();
