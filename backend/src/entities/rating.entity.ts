import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'rating' })
export class Rating {
  @PrimaryGeneratedColumn({ name: 'rating_id' })
  ratingId: number;

  @Column({ name: 'trip_id', unique: true })
  tripId: number;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ type: 'smallint' })
  score: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', nullable: true })
  updatedAt: Date | null;
}
