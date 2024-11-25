import { Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Country } from "./country.entity";
import { Post } from "./post.entity";
import { Spot } from "./spot.entity";
import { User } from "./user.entity";

@Entity('itinerary_invites')
export class ItineraryInvites {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    invite_user_id: number;

    @Column()
    post_id: number;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    @DeleteDateColumn()
    public deleted_at: Date;

    @OneToOne(type => Post)
    @JoinColumn({ name: "post_id", referencedColumnName: 'id' })
    post: Post;



    @OneToOne(type => User)
    @JoinColumn({ name: "user_id" })
    users: User;

    @OneToOne(type => User)
    @JoinColumn({ name: "invite_user_id" })
    inviteuser: User;

    // @OneToMan(type => User)
    // @JoinColumn({ name: "user_id", referencedColumnName: 'id' })
    // user: User[];


}
