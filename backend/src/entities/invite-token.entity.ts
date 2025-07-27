import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('invite_tokens')
@Index(['token'], { unique: true })
@Index(['createdBy'])
@Index(['expiresAt'])
@Index(['isActive'])
export class InviteToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  token: string;

  @Column({ name: 'created_by', type: 'uuid' })
  createdBy: string;

  @Column({ name: 'expires_at', type: 'timestamp' })
  expiresAt: Date;

  @Column({ name: 'max_uses', type: 'int', default: 1 })
  maxUses: number;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount: number;

  @Column({ name: 'last_used_at', type: 'timestamp', nullable: true })
  lastUsedAt: Date | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Virtual properties for convenience
  get isExpired(): boolean {
    return this.expiresAt < new Date();
  }

  get isExhausted(): boolean {
    return this.usedCount >= this.maxUses;
  }

  get isValid(): boolean {
    return this.isActive && !this.isExpired && !this.isExhausted;
  }

  get remainingUses(): number {
    return Math.max(0, this.maxUses - this.usedCount);
  }
}
