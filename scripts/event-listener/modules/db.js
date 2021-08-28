const { Model, DataTypes } = require('sequelize');

const CustomTypes = Object.freeze({
    ID: DataTypes.INTEGER(10),
    TIMESTAMP: DataTypes.BIGINT(20),
    TON_ADDRESS: DataTypes.STRING(66),
    TON_TX: DataTypes.STRING(64),
    FJSON: function(name, type = DataTypes.TEXT('long')) {
        return {
            type: type,
            get: function() {
                return JSON.parse(this.getDataValue(name));
            },
            set: function(value) {
                this.setDataValue(name, JSON.stringify(value));
            },
        }
    }
});

class PunkEvents extends Model {

    static get _modelAttributes() {
        return {
            id: {
                type: CustomTypes.ID,
                primaryKey: true,
                autoIncremet: true
            },
            eventBody: {
                type: DataTypes.JSON
            }
        };
    }

    static get _options() {
        return {
            timestamps: false,
            createdAt: false,
            updatedAt: false,
            freezeTableName: true
        };
    }

    static get _tableName() {
        return 'punk_events'
    }

    static async initializeDB(sequelize) {
        PunkEvents.init(this._modelAttributes, {...this._options, sequelize, modelName: 'PunkEvents' });
        await PunkEvents.sync();
    }

    static async addEventToDB(event) {
        await PunkEvents.create({
            eventBody: event
        });
    }
}

module.exports = {
    PunkEvents
};