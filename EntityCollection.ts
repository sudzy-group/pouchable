/**
 * Base class for entity collection methods
 * constructing, destructing and querying
 */
import * as PouchDB from 'pouchdb';
import _ from 'lodash';

import { IdGenerator } from './IdGenerator';
import { DateIdGenerator } from './DateIdGenerator';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
export class EntityCollection {

    /**
     * @var the type of the collection (like 'posts', 'customers', etc.)
     */
    protected _type : string;

    /**
     * @var the db connection
     */
    protected _db: PouchDB;

    /**
     * Generates id for the entity
     */
     protected _idGenerator: IdGenerator;

    constructor(type: string, db: PouchDB, idGenerator?: IdGenerator) {
        if (!type || !db) {
            throw new TypeError("Missing type or db");
        }
        this._type = type + '/';
        this._db = db;
        this._idGenerator = idGenerator ? idGenerator : new DateIdGenerator()
    }

    insert(doc, decorators? : any[], searchKeys? : any[]) {
        return new Promise((resolved, rejected) => {
            let id = this._idGenerator.get();
            doc._id = this._type + id;

            this._db.put(doc).then(() => {
                if (!decorators && !searchKeys) {
                    // new Entity
                    return resolved(doc);
                }
                let ps = [];
                for (let decorator of decorators) {
                    if (!decorator.type) {
                        throw new Error("Unable to decorate with empty type.");
                    }
                    decorator._id = doc._id + '/' + decorator.type;
                    ps.push(this._db.put(decorator));
                }
                for (let searchKey of searchKeys) {
                    var searchKeyDoc = {
                        _id: this._type + searchKey + '/' + id;
                    }
                    ps.push(this._db.put(searchKeyDoc));
                }
                return Promise.all(ps);
            }).then(() => {
                // entity
                return resolved();
            }).catch(rejected);
        })
    }






}
