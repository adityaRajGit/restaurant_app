import _ from "lodash";

class BaseHelper {
  constructor(model) {
    this.model = model;
  }

  async addObject(obj) {
    try {
      const objectModel = new this.model(obj);
      return await objectModel.save();
    } catch (error) {
      throw error;
    }
  }

  async getObjectById(filters) {
    try {
      const populatedQuery = filters.populatedQuery
        ? filters.populatedQuery
        : null;
      if (populatedQuery) {
        return await this.model
          .findById(filters.id)
          .select(!_.isEmpty(filters.selectFrom) ? filters.selectFrom : {})
          .populate(populatedQuery)
          .lean()
          .exec();
      } else {
        return await this.model
          .findById(filters.id)
          .select(!_.isEmpty(filters.selectFrom) ? filters.selectFrom : {})
          .lean()
          .exec();
      }
    } catch (error) {
      throw error;
    }
  }

  async getObjectByQuery(filters) {
    try {
      return await this.model
        .findOne(filters.query)
        .select(filters.selectFrom ? filters.selectFrom : "")
        .populate(filters.populatedQuery ? filters.populatedQuery : [])
        .lean()
        .exec();
    } catch (error) {
      throw error;
    }
  }

  async updateObject(objectId, updateObject) {
    try {
      const object = await this.model.findById(objectId);
      if (!object) {
        throw new Error("Not Found");
      }
      for (let prop in updateObject) {
        object[prop] = updateObject[prop];
      }
      return await object.save();
    } catch (error) {
      throw error;
    }
  }

  async updateObjectByQuery(query, updateObject) {
    try {
      const object = await this.model.findOne(query);
      if (!object) {
        throw new Error("Not Found");
      }
      for (let prop in updateObject) {
        object[prop] = updateObject[prop];
      }
      return await object.save();
    } catch (error) {
      throw error;
    }
  }

  async directUpdateObject(objectId, updateObject) {
    try {
      return await this.model.findOneAndUpdate({ _id: objectId }, updateObject);
    } catch (error) {
      throw error;
    }
  }

  async deleteObjectById(objectId) {
    try {
      let filters = { _id: objectId };
      return await this.model.findOneAndDelete(filters);
    } catch (error) {
      throw error;
    }
  }

  async deleteObjectByQuery(query) {
    try {
      let filters = query;
      return await this.model.findOneAndDelete(filters);
    } catch (error) {
      throw error;
    }
  }

  async insertMany(data) {
    try {
      return await this.model.insertMany(data);
    } catch (error) {
      throw error;
    }
  }

  async deleteManyByQuery(query) {
    try {
      return await this.model.deleteMany(query);
    } catch (error) {
      throw error;
    }
  }

  async bulkWrite(data) {
    try {
      return await this.model.bulkWrite(data);
    } catch (error) {
      throw error;
    }
  }

  async getAllObjects(filters) {
    try {
      const query = filters.query ? filters.query : {};

      const selectFrom = filters.selectFrom ? filters.selectFrom : {};
      const sortBy = filters.sortBy ? filters.sortBy : { _id: -1 };
      const pageNum = filters.pageNum ? filters.pageNum : 1;
      const pageSize = filters.pageSize ? filters.pageSize : 50;
      const skip = filters.skip ? filters.skip : (pageNum - 1) * pageSize;
      const populatedQuery = filters.populatedQuery
        ? filters.populatedQuery
        : null;
      if (populatedQuery) {
        return await this.model
          .find(query)
          .select(selectFrom)
          .sort(sortBy)
          .skip(skip)
          .limit(parseInt(pageSize))
          .populate(populatedQuery)
          .lean()
          .exec();
      } else {
        return await this.model
          .find(query)
          .select(selectFrom)
          .sort(sortBy)
          .skip(skip)
          .limit(parseInt(pageSize))
          .lean()
          .exec();
      }
    } catch (error) {
      throw error;
    }
  }

  async getAllObjectCount(filters) {
    try {
      const query = filters.query ? filters.query : {};
      return await this.model.countDocuments(query);
    } catch (error) {
      throw error;
    }
  }

  async updateOneAndUpdate(filters) {
    try {
      return await this.model.findOneAndUpdate(
        filters.query,
        filters.updateQuery,
        filters.options,
      );
    } catch (error) {
      throw error;
    }
  }

  async updateMany(filters, updateObject) {
    try {
      return await this.model.updateMany(filters.query, updateObject);
    } catch (error) {
      throw error;
    }
  }

  async aggregate(steps) {
    try {
      return await this.model.aggregate(steps).exec();
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

export default BaseHelper;
