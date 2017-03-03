/**
 * Base class for entity collection methods
 * constructing, destructing and querying
 */
import * as PouchDB from 'pouchdb';
import _ from 'lodash';

/**
 * Gneral usage of all collections
 * Intended to be used as singleton per type
 */
export class EntityCollection {

    static start = 1000;

    /**
     * @var the type of the collection (like 'posts', 'customers', etc.)
     */
    protected _type : string;

    /**
     * @var the db connection
     */
    protected _db: PouchDB;

    constructor(type: string, db: PouchDB) {
        if (!type || !db) {
            throw new TypeError("Missing type or db");
        }
        this._type = type + '/';
        this._db = db;
    }

    isExists(id) {
        return this._db.get(this._type + id);
    }

    insert(doc, decorators? : any[]) {

    }

    _insertDocument(doc) {

        this._db.allDocs(

        ).then().catch();

        return this._db.put({

        })

    }



}
