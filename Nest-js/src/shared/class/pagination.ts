import { SelectQueryBuilder, getConnection, In } from "typeorm";
import { _ } from "underscore";

export class RelatuionQueryOption {
    relations: string[]
}
export class PaginationResponse<T>{
    meta: {
        from: number;
        to: number;
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    }
    data: T[]
}

export class Pagination<T> {
    data: T[];
    meta: {
        from: number;
        to: number;
        total: number;
        per_page: number;
        current_page: number;
        last_page: number;
    };

    private query: SelectQueryBuilder<T>

    constructor(query: SelectQueryBuilder<T>, private type?: any) {
        this.query = query;
    }

    async paginate(per_page: number = 10, current_page: number = 0, option?: RelatuionQueryOption, totalCount?: number): Promise<PaginationResponse<T>> {
        this.meta = {
            from: 0,
            to: 10,
            total: 0,
            per_page: 10,
            current_page: 0,
            last_page: 0,
        }

        if (totalCount) {
            this.meta.total = totalCount;

        } else {
            this.meta.total = await this.query.getCount();

        }

        this.meta.per_page = isNaN(per_page) ? 10 : per_page;
        this.meta.current_page = Math.max(current_page, 0);

        // if (this.meta.current_page >= 1) {
        //     this.meta.current_page = this.meta.current_page - 1;
        // }
        const offset = (this.meta.current_page * this.meta.per_page) || 0;


        this.meta.from = offset;
        this.meta.to = this.meta.from + this.meta.per_page;
        this.query.skip(offset);
        this.query.take(this.meta.per_page); //skip and take instead of offset and limit

        //this.query.select(`\`${this.query.alias}\`._id`);
        this.data = await this.query.getMany();

        this.meta.last_page = Math.ceil(this.meta.total / this.meta.per_page) - 1;

        return { meta: this.meta, data: this.data };
    }

    async paginateQuiz(per_page: number = 10, current_page: number = 0, option?: RelatuionQueryOption, request?: any): Promise<PaginationResponse<T>> {
        this.meta = {
            from: 0,
            to: 10,
            total: 0,
            per_page: 10,
            current_page: 0,
            last_page: 0,
        }
        console.log(request, 'option');

        this.meta.total = await this.query.getCount();

        this.meta.per_page = isNaN(per_page) ? 10 : per_page;
        this.meta.current_page = Math.max(current_page, 0);
        this.query.limit(this.meta.per_page);

        const offset = (this.meta.current_page * this.meta.per_page) || 0;
        this.meta.from = offset;
        this.meta.to = this.meta.from + this.meta.per_page;
        this.query.offset(offset);

        //this.query.select(`\`${this.query.alias}\`._id`);
        this.data = await this.query.getMany();

        if (option && option.relations) {
            const ids = _.pluck(this.data, 'id');

            if (ids.length > 0) {
                const connection = getConnection();
                console.log(option, 'this.type');

                const queryRepository = connection.getRepository<T>(this.type);
                //let data = await queryRepository.find({ where: { 'id': In(ids) }, ...option });
                let data;
                if (request.filter && request.filter != '') {
                    const query = await queryRepository.createQueryBuilder('quiz')
                    query.leftJoinAndSelect("quiz.quiz_header", "quiz_header")
                    query.leftJoinAndSelect("quiz_header.header", "header")
                    query.where("quiz.id IN (" + ids + ")")
                    if (request.filter && request.filter != '') {
                        //query.andWhere(`quiz.question LIKE :f`, { f: `%${request.filter}%` })
                        query.orWhere(`header.name LIKE :f`, { f: `%${request.filter}%` })
                    }
                    console.log(query, 'query');

                    data = query.getMany();
                } else {
                    data = await queryRepository.createQueryBuilder('quiz')
                        .leftJoinAndSelect("quiz.quiz_header", "quiz_header")
                        .leftJoinAndSelect("quiz_header.header", "header")
                        .where("quiz.id IN (" + ids + ")")
                        .getMany();
                }

                data = _.indexBy(data, 'id');
                this.data = _.map(this.data, (item) => {
                    for (let index = 0; index < option.relations.length; index++) {
                        const element = option.relations[index];
                        if (data[item.id]) {
                            item[element] = data[item.id][element];
                        }
                    }
                    return item;
                })
            }
        }

        this.meta.last_page = Math.ceil(this.meta.total / this.meta.per_page) - 1;

        return { meta: this.meta, data: this.data };
    }

}
