"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter, select, options, }) {
        const doc = this.model.findOne(filter).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async find({ filter, options, select, }) {
        const doc = this.model.find(filter || {}).select(select || "");
        if (options?.populate) {
            doc.populate(options.populate);
        }
        if (options?.skip) {
            doc.skip(options.skip);
        }
        if (options?.limit) {
            doc.limit(options.limit);
        }
        if (options?.lean) {
            doc.lean(options.lean);
        }
        return await doc.exec();
    }
    async paginate({ filter = {}, options = {}, select, page = "all", size = 5, }) {
        let docsCount = undefined;
        let pages = undefined;
        if (page !== "all") {
            page = Math.floor(page < 1 ? 1 : page);
            options.limit = Math.floor(size < 1 || !size ? 5 : size);
            options.skip = (page - 1) * options.limit;
            docsCount = await this.model.countDocuments(filter);
            pages = Math.ceil(docsCount / options.limit);
        }
        const result = await this.find({ filter, select, options });
        return {
            docsCount,
            limit: options.limit,
            pages,
            currentPage: page,
            result
        };
    }
    async create({ data, options, }) {
        return this.model.create(data, options);
    }
    async findOneAndUpdate({ filter, update, options = { new: true }, }) {
        return this.model.findOneAndUpdate(filter, {
            ...update,
            $inc: { __v: 1 }
        }, options);
    }
    async findByIdAndUpdate({ id, update, options = { new: true } }) {
        return this.model.findByIdAndUpdate(id, { ...update, $inc: { _v: 1 } }, options);
    }
    async deleteOne({ filter, }) {
        return this.model.deleteOne(filter);
    }
    async deleteMany({ filter, }) {
        return this.model.deleteMany(filter);
    }
    async updateOne({ filter, update, options, }) {
        if (Array.isArray(update)) {
            update.push({
                $set: {
                    __v: { $add: ["$__v", 1] }
                }
            });
            return await this.model.updateOne(filter || {}, {
                update,
            }, options);
        }
        return await this.model.updateOne(filter || {}, {
            ...update,
            $inc: { __v: 1 }
        }, options);
    }
}
exports.DatabaseRepository = DatabaseRepository;
