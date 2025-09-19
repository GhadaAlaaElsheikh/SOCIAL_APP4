"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const database_repository_1 = require("./database.repository");
const error_response_1 = require("../../utils/response/error.response");
class UserRepository extends database_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options, }) {
        const [user] = await this.create({ data, options }) || [];
        if (!user) {
            throw new error_response_1.BadRequest("fail to create thi suser");
        }
        return user;
    }
    async findByEmail(email) {
        return this.model.findOne({ email }).exec();
    }
    async updateUser(id, update) {
        return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    async updatePassword(id, hashedPassword) {
        return this.model
            .findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
            .exec();
    }
}
exports.UserRepository = UserRepository;
