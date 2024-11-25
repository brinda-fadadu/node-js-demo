import { Entity, PrimaryGeneratedColumn, CreateDateColumn, OneToMany, UpdateDateColumn, DeleteDateColumn, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Spot } from "./spot.entity";
import { PostImage } from "./postImage.entity";
import { PostLike } from "./postLike.entity";
import { PostComment } from "./postComment.entity";
import { PostTag } from "./postTag.entity";
import { User } from "./user.entity";
import { Category } from "./category.entity";
import { PostCategory } from "./postCategory.entity";
import { PostSpot } from "./postSpot.entity";
import { ItineraryInvites } from "./itineraryInvites.entity";
import { UserFavouriteItinerary } from "./userfavouriteitinerary.entity";
import { UserNotification } from './user_notification.entity';
import { Report } from './report.entity';




@Entity('post')
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    user_id: number;

    @Column()
    spot_id: number;

    @Column()
    title: string;

    @Column()
    description: string;

    @Column()
    latitude: string;

    @Column()
    longitude: string;

    @Column()
    is_public: number;

    @Column()
    itinerary_date: Date;

    @DeleteDateColumn()
    public deleted_at: Date;

    @CreateDateColumn()
    public created_at: Date;

    @UpdateDateColumn()
    public updated_at: Date;

    @Column()
    is_planeed: string;

    @Column()
    category_id: number;

    @Column()
    address: string;

    @Column()
    deeplink: string;

    @OneToOne(type => Spot)
    @JoinColumn({ name: "spot_id" })
    spot: Spot;

    @OneToOne(type => Category)
    @JoinColumn({ name: "category_id" })
    category: Category;


    @OneToMany(type => PostImage, postImage => postImage.post)
    postImage: PostImage[];

    @OneToMany(type => ItineraryInvites, itineraryInvites => itineraryInvites.post)
    itineraryInvites: ItineraryInvites[];

    @OneToOne(type => PostLike, postLike => postLike.post)
    postLike: PostLike[];


    @OneToMany(type => PostLike, postLike => postLike.post)
    postLikes: PostLike[];

    @OneToMany(type => PostComment, postComment => postComment.post)
    postComment: PostComment[];

    @OneToMany(type => PostCategory, postCategory => postCategory.post)
    postCategory: PostCategory[];

    @OneToOne(type => UserFavouriteItinerary, userFavouriteItinerary => userFavouriteItinerary.post)
    userFavouriteItinerary: UserFavouriteItinerary;

    @OneToMany(type => PostTag, postTag => postTag.post)
    postTag: PostTag[];

    @OneToMany(type => PostSpot, postSpot => postSpot.post)
    postSpot: PostSpot[];

    @OneToOne(type => UserNotification, userNotification => userNotification.post)
    postNotificationId: UserNotification;

    @OneToOne(type => Report, report => report.post)
    postInfo: Report;


    @ManyToOne(type => User, (user) => user.post)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    type: string;


}
